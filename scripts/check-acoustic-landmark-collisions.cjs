/* Optional deterministic collision stress check; not a real-world accuracy benchmark. */
const fs=require('fs');const assert=require('node:assert/strict');
const {fingerprint,compare}=require('../public/acoustic-landmarks');
function synthetic(seed){let state=seed;const random=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};const out=new Float32Array(8000*12);for(let n=0;n<40;n++){const f=180+Math.floor(random()*1800),g=200+Math.floor(random()*1600),a=random()*6,b=random()*6;for(let j=0;j<2400;j++){const t=j/8000,e=Math.sin(Math.PI*j/2400)**2;out[n*2400+j]=.3*e*(Math.sin(2*Math.PI*f*t+a)+.6*Math.sin(2*Math.PI*g*t+b)+.3*Math.sin(2*Math.PI*f*2*t))+.006*(random()-.5);}}return out;}
const original=fingerprint(synthetic(123),8000),results=[];
for(let seed=200;seed<220;seed++){const r=compare(original,fingerprint(synthetic(seed),8000));assert.equal(r.candidateMatch,false,'Synthetic collision seed'+seed);results.push({seed,result:r});}
const result={scope:'20 deterministic unrelated synthetic sequences. No natural-recording accuracy claim.',results};
if(process.env.RESULT_PATH)fs.writeFileSync(process.env.RESULT_PATH,JSON.stringify(result,null,2));
console.log('PASS20 unrelated synthetic landmark negatives. Not a broad accuracy benchmark.');
