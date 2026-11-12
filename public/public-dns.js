/* Explicit public DNS/RDAP lookup UI. The evidence vault is not read or uploaded. */
(function(root){
 'use strict';
 const guide='Enter a public domain for A, AAAA, MX, NS, TXT, SOA and CAA DNS records plus public registry registration data (RDAP, the successor to WHOIS). Enter a public IPv4/IPv6 address for reverse PTR. Click Run to disclose only that query to the server resolver and the IANA-listed registry RDAP provider. No uploads, scans, private registration data, DNSSEC validation or ownership verdict. RDAP uses the exact domain you type, not a guessed parent domain. Provider redaction, missing records and errors are explicit. Private/special-use inputs are disabled. 5 requests/minute; about 12 seconds maximum. The example is a real public lookup, not a fixture.';
 async function analyze(value){
  const r=await fetch('/api/network/dns?query='+encodeURIComponent(value),{credentials:'same-origin',headers:root.apiClient?.getAuthHeaders?.()||{},cache:'no-store',signal:AbortSignal.timeout(15000)});
  const result=await r.json();if(!r.ok)throw Error(result.error||'Lookup unavailable.');return result;
 }
 function mount(ws){
  const n=(tag,text,attrs={})=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
  const input=n('input',undefined,{type:'text','aria-label':'Public DNS domain or IP',placeholder:'example.com or 8.8.8.8',maxlength:'253',style:'width:100%;box-sizing:border-box;'});
  const run=n('button','Run public lookup',{class:'fl-btn fl-btn-primary',type:'button'}),demo=n('button','▶ Try live example',{class:'fl-btn fl-btn-ghost',type:'button','aria-label':'Try live DNS example'}),out=n('section',undefined,{role:'status',style:'margin-top:20px;'});
  ws.append(n('h2','Public DNS / Registration Lookup'),n('p',guide,{class:'fl-tool-guide',style:'padding:16px;line-height:1.6;background:#f8fafc;border:1px solid #ddd;border-radius:10px;'}),input,run,demo,out);
  async function execute(example){run.disabled=demo.disabled=true;out.replaceChildren(n('p','Reading public DNS and registration services...'));try{
   const result=await analyze(example?'example.com':input.value);
   if(!ws.contains(out))return;out.replaceChildren();if(example)out.append(n('strong','LIVE EXAMPLE - example.com public lookup. Your typed query and evidence remain unchanged.'));
   out.append(n('p',result.registration ? ('Registration: '+result.registration.state+' | '+(result.registration.source||'No HTTPS RDAP endpoint')+' | DNS A: '+result.records.A.state+' | Checked '+result.checkedAt) : ('PTR: '+result.reverse.state+' | Checked '+result.checkedAt)));
   out.append(n('pre',JSON.stringify(result,null,2),{style:'white-space:pre-wrap;overflow-wrap:anywhere;max-height:650px;overflow:auto;padding:16px;background:#f8fafc;'}));
  }catch(e){if(ws.contains(out))out.replaceChildren(n('p',e.message,{role:'alert'}));}finally{run.disabled=demo.disabled=false;}}
  run.onclick=()=>execute(false);demo.onclick=()=>execute(true);
 }
 const api={guide,analyze,mount};root.PublicDNS=api;if(typeof module==='object')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
