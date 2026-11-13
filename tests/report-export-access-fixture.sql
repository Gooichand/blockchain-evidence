-- TEST ONLY: run after analyst-inventory-fixture.sql in a disposable database.
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name text;
CREATE TABLE custody_log(id int primary key,case_id int,evidence_id int,action text);
CREATE TABLE case_notes(id int primary key,case_id int,evidence_id int,note_group text,is_deleted boolean,content text);
CREATE TABLE case_checklists(case_id int,items jsonb,updated_at timestamptz);
INSERT INTO evidence(id,name,case_id) VALUES(11,'UNASSIGNED_SECRET',1);
INSERT INTO analysis_tasks(id,evidence_id,case_id,analyst_id,analyst_wallet) VALUES(1700,11,1,2,'other');
INSERT INTO custody_log VALUES(1,1,1,'ASSIGNED_EVENT'),(2,1,11,'UNASSIGNED_EVENT'),(3,1,null,'CASE_EVENT');
INSERT INTO case_notes VALUES(1,1,1,'assigned',false,'ASSIGNED_NOTE'),(2,1,11,'secret',false,'UNASSIGNED_NOTE'),(3,1,null,'case',false,'CASE_NOTE');
INSERT INTO case_checklists VALUES(1,'[{"label":"CASE_CHECKLIST"}]',now());
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
