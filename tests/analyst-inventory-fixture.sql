ALTER TABLE cases ADD COLUMN case_number text,ADD COLUMN title text,ADD COLUMN status text,ADD COLUMN created_date timestamptz,ADD COLUMN priority_level int,ADD COLUMN jurisdiction text;
ALTER TABLE evidence ADD COLUMN name text,ADD COLUMN file_type text,ADD COLUMN hash text,ADD COLUMN ipfs_cid text,ADD COLUMN blockchain_tx_hash text,ADD COLUMN blockchain_verified boolean,ADD COLUMN timestamp timestamptz,ADD COLUMN case_id int REFERENCES cases(id),ADD COLUMN file_size int,ADD COLUMN description text;
TRUNCATE analysis_reports,analysis_tasks,evidence,cases RESTART IDENTITY CASCADE;
INSERT INTO cases(id,case_number,title,created_date) SELECT i,'DEMO-'||i,'Case '||i,'2026-11-12T10:00:00Z' FROM generate_series(1,4) i;
INSERT INTO evidence(id,name,file_type,timestamp,case_id) SELECT i,'File '||i,'text/plain','2026-11-12T10:00:00Z',CASE WHEN i<=6 THEN 1 ELSE 2 END FROM generate_series(1,9) i;
INSERT INTO evidence(id,name,file_type,timestamp,case_id) VALUES(10,'Other analyst secret','text/plain',now(),3);
INSERT INTO analysis_tasks(id,evidence_id,case_id,analyst_id,analyst_wallet,status,assigned_at) SELECT i,i,CASE WHEN i<=6 THEN 1 ELSE 2 END,1,'a','pending','2026-11-12T10:00:00Z' FROM generate_series(1,9) i;
INSERT INTO analysis_tasks(id,evidence_id,case_id,analyst_id,analyst_wallet,status,assigned_at) VALUES(20,10,3,2,'other','pending',now()),(21,9,2,1,'a','completed','2026-11-12T11:00:00Z'),(22,9,2,1,'a','in_progress','2026-11-12T11:00:00Z');
-- Large duplicate assignment set must neither duplicate parents nor truncate IDs.
INSERT INTO analysis_tasks(id,evidence_id,case_id,analyst_id,analyst_wallet,status,assigned_at) SELECT 100+i,1,1,1,'a','pending','2026-11-11T10:00:00Z' FROM generate_series(1,1500) i;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
