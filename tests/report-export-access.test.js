jest.mock('../config', () => ({ supabase: { from: jest.fn() } }));
jest.mock('../middleware/caseAccess', () => ({ canAccessCase: jest.fn(), canAccessEvidence: jest.fn() }));
jest.mock('../lib/audit', () => ({ logAudit: jest.fn() }));
jest.mock('../services/blockchain/blockchainService', () => ({ getExplorerUrl: () => '' }));
const { supabase } = require('../config');
const access = require('../middleware/caseAccess');
const { getCaseReportPdf, getEvidenceReportPdf } = require('../controllers/reportController');
const { assignmentFilter } = require('../lib/analystExportScope');
const { PDFDocument, PDFName, PDFDict, PDFRawStream, decodePDFRawStream } = require('pdf-lib');
const analyst = {id:7,email:'analyst@example.invalid',role:'forensic_analyst'};
let queries, results;
function response() {
  return {status:jest.fn().mockReturnThis(),json:jest.fn().mockReturnThis(),setHeader:jest.fn(),send:jest.fn()};
}
beforeEach(() => {
  jest.clearAllMocks();
  queries=[];
  results = {
    analysis_tasks:{data:[{id:1}]},
    cases:{data:{id:1,case_number:'TEST-1',title:'Synthetic scope'}},
    evidence:{data:[{id:10,case_id:1,name:'Assigned evidence',analysis_tasks:[{id:1}]}],count:1},
    custody_log:{data:[{id:1,evidence_id:10,action:'ASSIGNED_EVENT'},{id:2,evidence_id:20,action:'HIDDEN_EVENT'},{id:3,action:'CASE_EVENT'}]},
    case_notes:{data:[{id:1,note_group:'a',evidence_id:10,content:'ASSIGNED_NOTE'},{id:2,note_group:'b',evidence_id:20,content:'HIDDEN_NOTE'},{id:3,note_group:'c',content:'CASE_NOTE'}]},
    case_checklists:{data:[{items:[{key:'hidden',label:'HIDDEN_CHECKLIST'}]}]},
    users:{data:{full_name:'Synthetic Analyst'}},
  };
  supabase.from.mockImplementation(table=>{
    const q={table, calls:[]}; queries.push(q);
    for(const method of ['select','or','eq','order','limit']) q[method]=(...args)=>{q.calls.push([method,...args]);return q;};
    q.single=q.maybeSingle=()=>Promise.resolve(results[table]);
    q.then=(yes,no)=>Promise.resolve(results[table]).then(yes,no);
    return q;
  });
  access.canAccessCase.mockResolvedValue(true);access.canAccessEvidence.mockResolvedValue(true);
});
async function payload(res) {
  expect(res.send).toHaveBeenCalledTimes(1);
  const doc=await PDFDocument.load(res.send.mock.calls[0][0]);
  for(const [,obj] of doc.context.enumerateIndirectObjects()) {
    if(obj instanceof PDFDict && obj.get(PDFName.of('Type'))?.toString()==='/Filespec') {
      const ef=doc.context.lookup(obj.get(PDFName.of('EF')),PDFDict);
      const stream=doc.context.lookup(ef.get(PDFName.of('F')),PDFRawStream);
      return JSON.parse(Buffer.from(decodePDFRawStream(stream).decode()).toString('utf8'));
    }
  }
  throw new Error('No snapshot');
}
test('Analyst case PDF excludes unassigned evidence relations, case-wide notes and checklist',async()=>{
  const res=response();await getCaseReportPdf({params:{id:'1'},user:analyst},res);
  const p=await payload(res);
  expect(p.scope).toContain('assigned-evidence-only');
  expect(p.evidence.map(e=>e.id)).toEqual([10]);
  expect(p.custody.map(c=>c.action)).toEqual(['ASSIGNED_EVENT']);
  expect(p.notes.map(n=>n.content)).toEqual(['ASSIGNED_NOTE']);expect(p.checklist).toBeNull();
  expect(JSON.stringify(p)).not.toMatch(/HIDDEN_|CASE_NOTE|CASE_EVENT|analysis_tasks/);
  expect(access.canAccessCase).not.toHaveBeenCalled();
  const query=queries.find(q=>q.table==='evidence');
  expect(query.calls).toContainEqual(['select','*,analysis_tasks!inner(id)',{count:'exact'}]);
  expect(query.calls).toContainEqual(['or',assignmentFilter(analyst),{referencedTable:'analysis_tasks'}]);
  expect(queries.find(q=>q.table==='analysis_tasks').calls).toContainEqual(['eq','case_id',1]);
  expect(queries.some(q=>q.table==='case_checklists')).toBe(false);
});
test.each(['case','evidence'])('unassigned Analyst %s denied before private rows or PDF loads',async(type)=>{
  results.analysis_tasks={data:[]};const res=response();
  await (type==='case'?getCaseReportPdf:getEvidenceReportPdf)({params:{id:'1'},user:analyst},res);
  expect(res.status).toHaveBeenCalledWith(403);expect(res.send).not.toHaveBeenCalled();
  expect(queries.map(q=>q.table)).toEqual(['analysis_tasks']);
});
test.each(['case','evidence'])('assignment lookup failure fails closed for %s',async(type)=>{
  results.analysis_tasks={error:new Error('database unavailable')};const res=response();
  const log=jest.spyOn(console,'error').mockImplementation(()=>{});
  await (type==='case'?getCaseReportPdf:getEvidenceReportPdf)({params:{id:'1'},user:analyst},res);
  expect(res.status).toHaveBeenCalledWith(500);expect(res.send).not.toHaveBeenCalled();log.mockRestore();
});
test('truncated assigned evidence response cannot masquerade as complete PDF',async()=>{
  results.evidence.count=1001;const res=response();const log=jest.spyOn(console,'error').mockImplementation(()=>{});
  await getCaseReportPdf({params:{id:'1'},user:analyst},res);
  expect(res.status).toHaveBeenCalledWith(500);expect(res.send).not.toHaveBeenCalled();log.mockRestore();
});
test('assigned Analyst evidence PDF works and scopes task check to requested evidence',async()=>{
  results.evidence={data:{id:10,case_id:1,name:'Assigned'}};
  results.custody_log={data:[]};results.case_notes={data:[]};
  const res=response();await getEvidenceReportPdf({params:{id:'10'},user:analyst},res);
  expect((await payload(res)).evidence.map(e=>e.id)).toEqual([10]);
  expect(queries.find(q=>q.table==='analysis_tasks').calls).toContainEqual(['eq','evidence_id',10]);
  expect(access.canAccessEvidence).not.toHaveBeenCalled();
});
test('non-Analyst case path retains shared authorization, full relations and checklist',async()=>{
  const res=response();await getCaseReportPdf({params:{id:'1'},user:{...analyst,role:'auditor'}},res);
  const p=await payload(res);expect(p.custody).toHaveLength(3);expect(p.notes).toHaveLength(3);expect(p.checklist).toHaveLength(1);
  expect(access.canAccessCase).toHaveBeenCalledWith(expect.objectContaining({role:'auditor'}),1);
  expect(queries.some(q=>q.table==='analysis_tasks')).toBe(false);
});
test('non-Analyst evidence denial still uses shared helper',async()=>{
  results.evidence={data:{id:10,case_id:1}};access.canAccessEvidence.mockResolvedValue(false);
  const res=response();await getEvidenceReportPdf({params:{id:'10'},user:{...analyst,role:'investigator'}},res);
  expect(res.status).toHaveBeenCalledWith(403);expect(queries.some(q=>q.table==='analysis_tasks')).toBe(false);
});
test.each(['0','1suffix','-1','2147483648','1.2'])('invalid PDF id %s rejected without query',async id=>{
  for(const controller of [getCaseReportPdf,getEvidenceReportPdf]) {
    const res=response();await controller({params:{id},user:analyst},res);expect(res.status).toHaveBeenCalledWith(400);
  }
  expect(queries).toHaveLength(0);
});
test('identity filters support ID, email fallback and wallet, without null matching',()=>{
  expect(assignmentFilter(analyst)).toBe('analyst_id.eq.7,analyst_wallet.eq."analyst@example.invalid"');
  expect(assignmentFilter({...analyst,wallet_address:'0xabc'})).toContain('analyst_wallet.eq."0xabc"');
  expect(assignmentFilter({id:7})).toBe('analyst_id.eq.7');
  expect(()=>assignmentFilter({})).toThrow('identity missing');
  expect(assignmentFilter({email:'a",b'})).toBe('analyst_wallet.eq."a\\",b"');
});
