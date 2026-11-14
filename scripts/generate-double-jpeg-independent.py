"""Independent photographic JPEG lattice fixtures from the ELA demo photo, not from the synthetic seeded texture used by generate-double-jpeg-samples.py."""
from PIL import Image
from pathlib import Path
import io, json, hashlib
p = Path('public/samples/image/double-jpeg-independent')
p.mkdir(parents=True, exist_ok=True)
src = Image.open('public/samples/image/original.jpg').convert('RGB')
for q in [50, 95]:
    src.save(p / f'photo-single-{q}.jpg', quality=q, subsampling=0)
for q1, q2 in [(50, 95), (65, 95)]:
    b = io.BytesIO()
    src.save(b, format='JPEG', quality=q1, subsampling=0)
    r = Image.open(io.BytesIO(b.getvalue()))
    r.save(p / f'photo-double-{q1}-{q2}.jpg', quality=q2, subsampling=0)
(p / 'manifest.json').write_text(json.dumps({
    'source': 'public/samples/image/original.jpg (ELA demo photo); independent of the synthetic seeded texture behind public/samples/image/double-jpeg.',
    'negativeExpected': ['photo-single-50.jpg', 'photo-single-95.jpg'],
    'documentedMisses': {
        'files': ['photo-double-50-95.jpg', 'photo-double-65-95.jpg'],
        'reason': 'Genuine doubles, but this small smooth photo leaves only 3 of 12 examined frequencies above the sample/histogram eligibility floors, below the 8-frequency breadth required for a broad-enrichment candidate. Recorded as a miss, not as single compression.',
    },
    'sha256': {f.name: hashlib.sha256(f.read_bytes()).hexdigest() for f in p.glob('*.jpg')},
}, indent=2) + '\n')
(p / 'README.md').write_text('Independent photographic JPEG examples generated with Pillow from the ELA demo photo by scripts/generate-double-jpeg-independent.py. Apache-2.0 with repository. Broad lattice enrichment candidates are not proof of re-encoding, editing or authenticity.\n')
print('independent fixtures written:', sorted(f.name for f in p.glob('*.jpg')))
