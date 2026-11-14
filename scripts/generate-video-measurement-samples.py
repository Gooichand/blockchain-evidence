"""Original all-frame event/GOP fixtures and independent ffprobe references."""
from pathlib import Path
import subprocess,json,hashlib
out=Path(__file__).resolve().parents[1]/'public/samples/video/measurement';out.mkdir(parents=True,exist_ok=True)
inputs=[]
for color in ['red','black','blue','green']:
 inputs+=['-f','lavfi','-i',f'color=c={color}:s=160x96:r=10:d=1']
cmd=['ffmpeg','-y','-hide_banner','-loglevel','error']+inputs+['-filter_complex','[0:v][1:v][2:v][3:v]concat=n=4:v=1:a=0[v]','-map','[v]','-c:v','libx264','-g','20','-keyint_min','1','-bf','3','-sc_threshold','0','-force_key_frames','0,1,1.3,3','-pix_fmt','yuv420p',str(out/'cuts-gops.mp4')]
subprocess.run(cmd,check=True)
ref=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=key_frame,best_effort_timestamp_time,pict_type','-of','json',str(out/'cuts-gops.mp4')]))
(out/'ffprobe-frames.json').write_text(json.dumps(ref,indent=2)+'\n')
# Corrupted compressed samples retain a parseable MP4; decoder must not claim success.
blob=bytearray((out/'cuts-gops.mp4').read_bytes());packets=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_packets','-show_entries','packet=pos,size','-of','json',str(out/'cuts-gops.mp4')]))['packets'];pos=int(packets[3]['pos']);blob[pos:pos+4]=b'\xff'*4;(out/'corrupted-sample.mp4').write_bytes(blob)
(out/'manifest.json').write_text(json.dumps({'source':'Original FFmpeg color sources, no personal footage.','expectedFrames':40,'expectedColorChangesSeconds':[1,2,3],'nearBlackSeconds':[1,2],'sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in out.glob('*.mp4')}},indent=2)+'\n')
(out/'README.md').write_text('Original synthetic red/black/blue/green 1second scenes,10fps, forced irregular GOP boundaries, H264 Bframes. FFprobe frame reference generated independently. The damaged sample is a negative and must not establish complete decoding. Reproduce with scripts/generate-video-measurement-samples.py. Apache-2.0 with this repository. Not an authenticity benchmark.\n')

# November14 audio-stream fixtures (all-stream validation): video+AAC, truncated,
# corrupted audio payload and browser-unsupported AC-3. Independent ffprobe reference.
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error',
 '-f','lavfi','-i','color=c=orange:s=160x96:r=10:d=2','-f','lavfi','-i','sine=frequency=440:duration=2',
 '-c:v','libx264','-g','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','64k','-movflags','+faststart',str(out/'audio-aac.mp4')],check=True)
blob=(out/'audio-aac.mp4').read_bytes()
apacks=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0','-show_entries','packet=pos,size','-of','json',str(out/'audio-aac.mp4')]))['packets']
aref=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0','-show_entries','stream=codec_name,sample_rate,channels','-of','json',str(out/'audio-aac.mp4')]))
ainfo={'codec':aref['streams'][0]['codec_name'],'sampleRate':int(aref['streams'][0]['sample_rate']),'channels':aref['streams'][0]['channels'],'audioPacketCount':len(apacks)}
last=apacks[-1];(out/'truncated-audio.mp4').write_bytes(blob[:int(last['pos'])+int(last['size'])//2])
blob2=bytearray(blob);p5=apacks[4];blob2[int(p5['pos']):int(p5['pos'])+6]=b'\xff'*6
(out/'corrupted-audio.mp4').write_bytes(blob2)
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error',
 '-f','lavfi','-i','color=c=teal:s=160x96:r=10:d=2','-f','lavfi','-i','sine=frequency=440:duration=2',
 '-c:v','libx264','-pix_fmt','yuv420p','-c:a','ac3','-strict','-2',str(out/'audio-ac3.mp4')],check=True)
m=json.loads((out/'manifest.json').read_text())
m['audioFixtures']={'audio-aac.mp4':ainfo,'truncated-audio.mp4':'final audio sample byte range exceeds file size; must fail closed','corrupted-audio.mp4':'6 bytes flipped inside 5th audio packet; must not be claimed as fully decoded','audio-ac3.mp4':'AC-3 track: browser-unsupported codec; must report NOT VALIDATED while video still decodes'}
m['sha256'].update({p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in out.glob('audio-*.mp4')})
m['sha256']['truncated-audio.mp4']=hashlib.sha256((out/'truncated-audio.mp4').read_bytes()).hexdigest()
(out/'manifest.json').write_text(json.dumps(m,indent=2)+'\n')
