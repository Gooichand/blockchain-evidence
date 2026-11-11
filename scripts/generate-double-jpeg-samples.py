"""Original deterministic JPEG lattice fixtures, not a photographic accuracy benchmark."""
from PIL import Image,ImageDraw,ImageFilter
from pathlib import Path
import numpy as np,io,json,hashlib
p=Path('public/samples/image/double-jpeg');p.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(1729);a=rng.integers(0,256,(512,640,3),dtype=np.uint8);im=Image.fromarray(a).filter(ImageFilter.GaussianBlur(.5));d=ImageDraw.Draw(im)
for i in range(100):
 x,y=map(int,[rng.integers(0,600),rng.integers(0,480)]);d.ellipse((x,y,x+20,y+20),fill=tuple(map(int,rng.integers(0,256,3))))
for q in [50,65,75,85,95]:im.save(p/f'single-{q}.jpg',quality=q,subsampling=0)
for q1,q2 in [(50,95),(65,95),(75,95),(85,95),(95,50),(75,75)]:
 b=io.BytesIO();im.save(b,format='JPEG',quality=q1,subsampling=0);r=Image.open(io.BytesIO(b.getvalue()));r.save(p/f'double-{q1}-{q2}.jpg',quality=q2,subsampling=0)
# Progressive support and shifted-grid non-guarantee are tested explicitly.
im.save(p/'single-progressive95.jpg',quality=95,subsampling=0,progressive=True)
r=Image.open(p/'single-85.jpg');r.crop((3,3,637,509)).save(p/'shifted-double85-95.jpg',quality=95,subsampling=0)
Image.new('RGB',(640,512),(120,120,120)).save(p/'flat95.jpg',quality=95)
(p/'manifest.json').write_text(json.dumps({'source':'Original synthetic random texture/shapes; not a real-photo accuracy benchmark.','seed':1729,'positiveExpected':['double-75-95.jpg','double-85-95.jpg'],'knownMisses':['double-50-95.jpg','double-65-95.jpg','double-95-50.jpg','double-75-75.jpg','shifted-double85-95.jpg'],'sha256':{f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in p.glob('*.jpg')}},indent=2)+'\n')
(p/'README.md').write_text('Original synthetic JPEG examples generated with Pillow by scripts/generate-double-jpeg-samples.py. Apache-2.0 with repository. Some genuine double-encoded fixtures do not trigger this narrow aligned-lattice method; those misses are recorded, not treated as single compression. No claim of prior exact quality identification or authenticity.\n')
