"""Disposable PostgreSQL multi-session regression. Never point at production.
Requires psycopg2. Set BE_TEST_PG_DSN explicitly to a local disposable database.
Schema and lifecycle migration must already be loaded. This resets test rows.
"""
import os, threading, time
import psycopg2

dsn=os.environ['BE_TEST_PG_DSN']
if not ('/tmp/' in dsn or '127.0.0.1' in dsn or 'localhost' in dsn):
    raise RuntimeError('Local disposable database only')
def conn():return psycopg2.connect(dsn)
def execute(c,sql,args=()):
    with c.cursor() as q:q.execute(sql,args);return q.fetchone()[0] if q.description else None

def call(c,task,op='save',rev=0,submit=False,text='one'):
    return execute(c,"SELECT public.analyst_report_transition(%s,%s,1,'a',%s,'findings',%s,%s,%s,50,null,'medium',null,'canonical-json-v2')",(op,task,text,'a'*64,submit,rev))
admin=conn();admin.autocommit=True
execute(admin,'TRUNCATE analysis_reports,analysis_tasks,evidence,users,cases RESTART IDENTITY CASCADE')
execute(admin,"INSERT INTO users VALUES(1),(2);INSERT INTO evidence VALUES(1);INSERT INTO cases VALUES(1)")

def task(n):execute(admin,"INSERT INTO analysis_tasks(id,evidence_id,analyst_id,analyst_wallet) VALUES(%s,1,1,'a')",(n,))
def contention(n,first,second,expected):
    a=conn();b=conn();observed=[];ready=threading.Event()
    try:
        winner=first(a)
        def waiting():
            ready.set()
            try:observed.append(second(b));b.commit()
            except BaseException as e:observed.append(e);b.rollback()
        th=threading.Thread(target=waiting);th.start();ready.wait(2)
        # Prove the other backend actually waited on a database lock before release.
        blocked=False
        for _ in range(100):
            blocked=execute(admin,"SELECT coalesce(wait_event_type='Lock',false) FROM pg_stat_activity WHERE pid=%s",(b.get_backend_pid(),))
            if blocked:break
            time.sleep(.01)
        assert blocked,'Second independent database backend never observed waiting on lock'
        a.commit();th.join(5);assert not th.is_alive(),'Blocked query did not finish'
        assert len(observed)==1 and not isinstance(observed[0],BaseException),observed
        assert observed[0]['code']==expected,observed
        return winner,observed[0]
    finally:a.close();b.close()

# New creation race: exactly one row, stale loser.
task(1);w,l=contention(1,lambda c:call(c,1),lambda c:call(c,1), 'STALE_REVISION')
assert execute(admin,'SELECT count(*) FROM analysis_reports WHERE task_id=1')==1
# Existing draft saves: same revision, one winner.
w,l=contention(1,lambda c:call(c,1,rev=1,text='updated'),lambda c:call(c,1,rev=1,text='loser'),'STALE_REVISION')
assert execute(admin,'SELECT result_summary FROM analysis_reports WHERE task_id=1')=='updated'
# Submit wins against a draft; no completed-task regression.
w,l=contention(1,lambda c:call(c,1,rev=2,submit=True,text='final'),lambda c:call(c,1,rev=2,text='late'),'FINALIZED')
assert execute(admin,'SELECT status FROM analysis_tasks WHERE id=1')=='completed'
# Identical concurrent finalization retry acknowledges, never finalizes again.
task(2);w,l=contention(2,lambda c:call(c,2,submit=True),lambda c:call(c,2,submit=True),'OK')
assert w['did_submit'] is True and l['did_submit'] is False
# Submission serializes restart and progress, each independently.
for n,op in [(3,'start'),(4,'progress')]:
    task(n);contention(n,lambda c,n=n:call(c,n,submit=True),lambda c,n=n,op=op:call(c,n,op=op),'FINALIZED')
    assert execute(admin,'SELECT status FROM analysis_tasks WHERE id=%s',(n,))=='completed'
# Real second-write failure rolls back the inserted report.
task(5)
execute(admin,"CREATE FUNCTION fail_task_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.id=5 THEN RAISE EXCEPTION 'test rollback'; END IF; RETURN NEW; END $$;CREATE TRIGGER fail_task BEFORE UPDATE ON analysis_tasks FOR EACH ROW EXECUTE FUNCTION fail_task_update()")
c=conn()
try:
    try:call(c,5);raise AssertionError('Expected failure')
    except psycopg2.Error:c.rollback()
finally:c.close()
assert execute(admin,'SELECT count(*) FROM analysis_reports WHERE task_id=5')==0
execute(admin,'DROP TRIGGER fail_task ON analysis_tasks;DROP FUNCTION fail_task_update()')
print('PASS: six independently connected lock-contention cases plus actual second-write rollback; no duplicate report or completed-task regression.')
admin.close()
