/* Reproducible pin + small CSP-safe binding patch. No unsafe-eval added. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const base=__dirname,pack=path.join(base,'node_modules/@techstark/opencv-js');
let source=fs.readFileSync(path.join(pack,'dist/opencv.js'),'utf8');
const originalHash=crypto.createHash('sha256').update(source).digest('hex');
if(originalHash!=='bd0c3e6448043de04f6a64a12cb7b759f78c3ab8f7c35c9f2e0f71c88bb17103')throw Error('Unexpected upstream bytes; review before patching.');
const a=source.indexOf('function createNamedFunction(name,body)'),b=source.indexOf('function extendError(',a);
if(a<0||b<a)throw Error('Named binding boundary changed.');
source=source.slice(0,a)+'function createNamedFunction(name,body){name=makeLegalFunctionName(name);var fn=function(){"use strict";return body.apply(this,arguments)};Object.defineProperty(fn,"name",{value:name,configurable:true});return fn}'+source.slice(b);
const c=source.indexOf('function makeDynCaller(dynCall)'),d=source.indexOf('var fp;',c);
if(c<0||d<c||source[d-1]!=='}')throw Error('Dynamic caller boundary changed.');
source=source.slice(0,c)+'function makeDynCaller(dynCall){var name="dynCall_"+signature+"_"+rawFunction;var fn=function(){var args=[rawFunction];for(var i=1;i<signature.length;i++)args.push(arguments[i-1]);return dynCall.apply(undefined,args)};Object.defineProperty(fn,"name",{value:name,configurable:true});Object.defineProperty(fn,"length",{value:signature.length-1,configurable:true});return fn}'+source.slice(d);
if(/new Function|\beval\(/.test(source))throw Error('Unexpected dynamic code remains.');
source='/* MODIFIED DGC: two Emscripten binding factories rewritten as ordinary closures; function names/arity retained. No generated-string execution. See scripts/opencv-vendor-build/bundle.cjs and notices. */\n'+source;
const target=path.resolve(base,'../../public/vendor/opencv.js');fs.writeFileSync(target,source);
const intro='@techstark/opencv-js4.12.0-release.1 / OpenCV4.12.0.\nPackage: https://github.com/TechStark/opencv-js\nOfficial source named by package: https://docs.opencv.org/4.12.0/opencv.js\nMODIFIED: createNamedFunction and makeDynCaller now use plain closures, preserving names and dynCall arity, instead of new Function. Remaining invoker factories are generated at build time into a static table; unknown bindings fail closed. No CSP unsafe-eval permission added.\nBuild reports zlib1.3.1, protobuf3.19.1 and Flatbuffers23.5.9. Their OpenCV4.12.0 license texts follow. Emscripten license included; exact compiler revision not independently identified. No trained models shipped or used by this tool.\n';
const parts=[intro,fs.readFileSync(path.join(pack,'LICENSE'),'utf8')];for(const filename of fs.readdirSync(path.join(base,'licenses')).sort())parts.push('\n===== '+filename+' =====\n'+fs.readFileSync(path.join(base,'licenses',filename),'utf8'));
fs.writeFileSync(path.resolve(base,'../../public/vendor/opencv-THIRD-PARTY-NOTICES.txt'),parts.join('\n'));
require('child_process').execFileSync(process.execPath,[path.join(base,'static-factories.cjs')],{stdio:'inherit'});
console.log('CSP-safe OpenCV SHA-256',crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex'));

