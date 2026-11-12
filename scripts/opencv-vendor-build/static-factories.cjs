/* Build-only static factory extraction for CSP. Runs pinned library on synthetic pixels. */
const fs=require('fs'),path=require('path'),os=require('os');
const file=path.resolve(__dirname,'../../public/vendor/opencv.js');
const Original=global.Function,records=new Map();
function RecordingFunction(...args){records.set(JSON.stringify(args),args);return Original(...args);}
RecordingFunction.prototype=Original.prototype;Object.setPrototypeOf(RecordingFunction,Original);global.Function=RecordingFunction;
const cv=require(file);
cv.onRuntimeInitialized=()=>{
 try{
  const pixels=new Uint8Array(256*256*4);let seed=1;for(let i=0;i<pixels.length;i+=4){seed=(seed*1664525+1013904223)>>>0;pixels[i]=pixels[i+1]=pixels[i+2]=(seed>>>24);pixels[i+3]=255;}
  for(let y=0;y<70;y++)for(let x=0;x<70;x++)for(let c=0;c<4;c++)pixels[((y+150)*256+x+150)*4+c]=pixels[((y+35)*256+x+35)*4+c];
  require('../../public/copy-move-features').find(cv,pixels,256,256);
  const a=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,0,50,50,50,50,0]),b=cv.matFromArray(4,1,cv.CV_32FC2,[60,60,60,110,110,110,110,60]),mask=new cv.Mat(),h=cv.findHomography(a,b,cv.RANSAC,3,mask);[a,b,mask,h].forEach(v=>v.delete());
  global.Function=Original;
  const entries=[...records].map(([key,args])=>{const body=args.at(-1),params=args.slice(0,-1);return JSON.stringify(key)+':function('+params.join(',')+'){'+body+'\n}';});
  let source=fs.readFileSync(file,'utf8').replaceAll('new_(Function,','new_(globalThis.CVStaticFunction,');
  const header='/* DGC build-time static Emscripten invoker factories. No runtime string execution. Unsupported new bindings fail closed; regenerate rather than add unsafe-eval. */\n(function(){const factories={'+entries.join(',\n')+'};globalThis.CVStaticFunction=function(){const key=JSON.stringify(Array.from(arguments)),factory=factories[key];if(!factory)throw Error("Unsupported static OpenCV binding");return factory;};})();\n';
  if(source.includes('new_(Function,'))throw Error('Unpatched invoker remains.');
  fs.writeFileSync(file,header+source);console.log('Static CSP factories',records.size,'bytes',header.length);process.exit(0);
 }catch(e){global.Function=Original;console.error('Static binding build failed:',e.message);process.exit(1);}
};
