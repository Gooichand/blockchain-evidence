// Local PostgREST integration harness; requires disposable fixture database.
// Set BE_TEST_POSTGREST_URL to a localhost service with the inventory fixture.
const assert = require('node:assert/strict');
const Module = require('node:module');
const { createClient } = require('@supabase/supabase-js');
const url = process.env.BE_TEST_POSTGREST_URL;
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url || '')) throw Error('Local test service only');
// Supabase client normally adds /rest/v1. Local fixture routes that same path.
const client = createClient('http://127.0.0.1:55440', 'local-test-placeholder', {
  global: {
    fetch: (u, o) => {
      const headers = new Headers(o.headers);
      headers.delete('authorization');
      return fetch(String(u).replace('http://127.0.0.1:55440/rest/v1', url), { ...o, headers });
    },
  },
});
const load = Module._load;
Module._load = function (name, parent, ...args) {
  if (parent?.filename.endsWith('/controllers/reportController.js') || parent?.filename.endsWith('/lib/analystExportScope.js')) {
    if (name === '../lib/audit') return {logAudit:async()=>{}};
    if (name === '../middleware/caseAccess') return {canAccessCase:()=>{throw Error('Unexpected shared case access')},canAccessEvidence:()=>{throw Error('Unexpected shared evidence access')}};
    if (name === '../config') return { supabase: client };
    if (
      name === '../services/blockchain/blockchainService' ||
      name === '../services/integratedEvidenceService'
    )
      return {};
  }
  return load.call(this, name, parent, ...args);
};

const fs = require('node:fs');
const { PDFDocument, PDFName, PDFDict, PDFRawStream, decodePDFRawStream } = require('pdf-lib');
const R = require('../controllers/reportController');
async function call(handler,id,user={id:1,email:'a',role:'forensic_analyst'}) {
  const res={statusCode:200,status(n){this.statusCode=n;return this;},json(x){this.body=x;return this;},
    setHeader(){},send(x){this.bytes=x;return this;}};
  await R[handler]({params:{id:String(id)},user},res);
  return res;
}
async function snapshot(res) {
  assert.equal(res.statusCode,200,JSON.stringify(res.body));
  const doc=await PDFDocument.load(res.bytes);
  for(const [,obj] of doc.context.enumerateIndirectObjects()) {
    if(obj instanceof PDFDict && obj.get(PDFName.of('Type'))?.toString()==='/Filespec') {
      const ef=doc.context.lookup(obj.get(PDFName.of('EF')),PDFDict);
      const stream=doc.context.lookup(ef.get(PDFName.of('F')),PDFRawStream);
      return JSON.parse(Buffer.from(decodePDFRawStream(stream).decode()).toString('utf8'));
    }
  }
  throw Error('Missing snapshot');
}
(async()=>{
  const assigned=await call('getCaseReportPdf',1);
  const p=await snapshot(assigned);
  assert.deepEqual(p.evidence.map(e=>e.id),[1,2,3,4,5,6]);
  assert.deepEqual(p.custody.map(c=>c.action),['ASSIGNED_EVENT']);
  assert.deepEqual(p.notes.map(n=>n.content),['ASSIGNED_NOTE']);
  assert.equal(p.checklist,null);
  assert(!JSON.stringify(p).includes('UNASSIGNED'));
  assert(!JSON.stringify(p).includes('CASE_NOTE'));
  //1500duplicate tasks still produce one parent. Email fallback reaches the
  // same assignment scope even when the numeric analyst id differs.
  const fallback=await snapshot(await call('getCaseReportPdf',1,{id:999,email:'a',role:'forensic_analyst'}));
  assert.deepEqual(fallback.evidence.map(e=>e.id),[1,2,3,4,5,6]);
  assert.equal((await call('getCaseReportPdf',3)).statusCode,403);
  assert.equal((await call('getEvidenceReportPdf',11)).statusCode,403);
  assert.deepEqual((await snapshot(await call('getEvidenceReportPdf',1))).evidence.map(e=>e.id),[1]);
  if(process.env.BE_TEST_PDF_PATH) fs.writeFileSync(process.env.BE_TEST_PDF_PATH,assigned.bytes);
  console.log('PASS: real PostgREST assignment-only case/evidence exports; duplicate tasks, email fallback, cross-analyst denial, unassigned child/notes/custody omission, checklist omission, exact snapshot attachment.');
})().catch(e=>{console.error(e);process.exit(1);});
