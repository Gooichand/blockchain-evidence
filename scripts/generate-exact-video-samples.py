"""Original synthetic AVC/B-frame and variable-frame-rate decoder fixtures."""
from pathlib import Path
import subprocess
out=Path('public/samples/video/exact');out.mkdir(parents=True,exist_ok=True)
def ff(args):subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error']+args,check=True)
common=['-c:v','libx264','-g','12','-bf','3','-pix_fmt','yuv420p','-color_primaries','bt709','-colorspace','bt709','-color_trc','bt709']
ff(['-f','lavfi','-i','testsrc2=size=160x96:rate=12:duration=2']+common+[str(out/'b-frames.mp4')])
ff(['-i',str(out/'b-frames.mp4'),'-vf',r'select=eq(n\,0)+eq(n\,5)+eq(n\,23)','-vsync','0',str(out/'expected-%d.png')])
ff(['-f','lavfi','-i','testsrc2=size=160x96:rate=12:duration=2','-vf',r'setpts=if(lt(N\,12)\,N/(12*TB)\,(N-12)/(6*TB)+1/TB)','-vsync','0']+common+[str(out/'vfr.mp4')])
ff(['-i',str(out/'vfr.mp4'),'-vf',r'select=eq(n\,18)','-vsync','0',str(out/'vfr-expected.png')])
(out/'README.md').write_text('# Exact frame fixtures\n\nOriginal FFmpeg testsrc2 synthetic images encoded with libx264, B-frames and explicit BT.709 metadata. CFR expected PNGs represent presentation indices 0, 5 and 23. VFR reference is index 18. Reproduce with scripts/generate-exact-video-samples.py. Chrome WebCodecs is checked against these independent FFmpeg decodes; RGB conversion differences remain possible, not byte-identical forensic color reproduction. No personal footage.\n')
