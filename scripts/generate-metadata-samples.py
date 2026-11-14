#!/usr/bin/env python3
"""Generate deterministic synthetic image metadata fixtures.

Every file is synthetic demo data generated locally: no real camera, person or
location. Run from the repo root: python3 scripts/generate-metadata-samples.py
"""
import io
import json
import os
import struct

import piexif
from PIL import Image, ImageCms

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "public", "samples", "metadata")

XMP_GUID = "44DD45A9D3E247E1B2F7E6D3C4B5A697"

XMP_BASE = (
    '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>'
    '<x:xmpmeta xmlns:x="adobe:ns:meta/">'
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
    '<rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" '
    'xmlns:xmp="http://ns.adobe.com/xap/1.0/" '
    'xmlns:xmpNote="http://ns.adobe.com/xmp/note/" '
    'xmp:CreatorTool="generate-metadata-samples.py" '
    'xmpNote:HasExtendedXMP="' + XMP_GUID + '">'
    "<dc:title><rdf:Alt><rdf:li xml:lang=\"x-default\">"
    "Synthetic base XMP title</rdf:li></rdf:Alt></dc:title>"
    "</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end=\"w\"?>"
)

XMP_EXTENDED = (
    '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>'
    '<x:xmpmeta xmlns:x="adobe:ns:meta/">'
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
    '<rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/">'
    "<dc:description><rdf:Alt><rdf:li xml:lang=\"x-default\">"
    "Synthetic extended XMP description stored in a second APP1 segment"
    "</rdf:li></rdf:Alt></dc:description>"
    "</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end=\"w\"?>"
)


def app(marker, payload):
    return b"\xff" + bytes([marker]) + struct.pack(">H", len(payload) + 2) + payload


def base_jpeg():
    img = Image.new("RGB", (16, 16))
    img.putdata([(x * 16, y * 16, (x + y) * 8) for y in range(16) for x in range(16)])
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=90)
    return buf.getvalue()


def exif_dict():
    return {
        "0th": {
            piexif.ImageIFD.Make: b"DGC Synthetic",
            piexif.ImageIFD.Model: b"ExtendedSegments Demo",
            piexif.ImageIFD.Software: b"generate-metadata-samples.py",
            piexif.ImageIFD.DateTime: b"2026:11:14 12:00:00",
        },
        "Exif": {
            piexif.ExifIFD.DateTimeOriginal: b"2026:11:14 12:00:00",
            piexif.ExifIFD.UserComment: b"ASCII\x00\x00\x00DGC synthetic extended-segment fixture",
            piexif.ExifIFD.MakerNote: b"DGC-SYNTHETIC-MAKERNOTE: vendor-specific demo bytes, not a real camera",
        },
        "GPS": {
            piexif.GPSIFD.GPSLatitudeRef: b"N",
            piexif.GPSIFD.GPSLatitude: ((20, 1), (0, 1), (0, 1)),
            piexif.GPSIFD.GPSLongitudeRef: b"E",
            piexif.GPSIFD.GPSLongitude: ((74, 1), (0, 1), (0, 1)),
        },
        "1st": {},
        "thumbnail": None,
    }


def icc_profile():
    return ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()


def iptc_segment():
    iim = b"\x1c\x02\x05" + struct.pack(">H", 26) + b"Synthetic IPTC object name"
    caption = b"Synthetic IPTC caption for the extended-segment fixture"
    iim += b"\x1c\x02\x78" + struct.pack(">H", len(caption)) + caption
    return (
        b"Photoshop 3.0\x00"
        + b"8BIM"
        + struct.pack(">H", 0x0404)
        + b"\x00\x00"
        + struct.pack(">I", len(iim))
        + iim
        + (b"\x00" if len(iim) % 2 else b"")
    )


def xmp_extended_segment():
    payload = XMP_EXTENDED.encode()
    return (
        b"http://ns.adobe.com/xmp/extension/\x00"
        + XMP_GUID.encode()
        + struct.pack(">I", len(payload))
        + struct.pack(">I", 0)
        + payload
    )


def splice_jpeg(segments):
    data = base_jpeg()
    assert data[:2] == b"\xff\xd8"
    pos = 2
    while data[pos] == 0xFF and 0xE0 <= data[pos + 1] <= 0xEF:
        size = struct.unpack(">H", data[pos + 2 : pos + 4])[0]
        pos += 2 + size
    head, tail = data[:pos], data[pos:]
    return head + b"".join(segments) + tail


def write_extended_jpeg():
    segments = [
        app(0xE1, piexif.dump(exif_dict())),
        app(0xE1, b"http://ns.adobe.com/xap/1.0/\x00" + XMP_BASE.encode()),
        app(0xE1, xmp_extended_segment()),
        app(0xE2, b"ICC_PROFILE\x00\x01\x01" + icc_profile()),
        app(0xED, iptc_segment()),
    ]
    path = os.path.join(OUT, "extended-segments.jpg")
    with open(path, "wb") as f:
        f.write(splice_jpeg(segments))
    return path


def write_truncated_icc_jpeg():
    profile = icc_profile()
    # Declares chunk 1 of 2 but the second chunk never arrives.
    bad = app(0xE2, b"ICC_PROFILE\x00\x01\x02" + profile[: len(profile) // 2])
    path = os.path.join(OUT, "truncated-icc.jpg")
    with open(path, "wb") as f:
        f.write(splice_jpeg([app(0xE1, piexif.dump(exif_dict())), bad]))
    return path


def write_png():
    img = Image.new("RGB", (16, 16))
    img.putdata([(255 - x * 16, y * 16, 128) for y in range(16) for x in range(16)])
    info = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB"))
    from PIL import PngImagePlugin

    meta = PngImagePlugin.PngInfo()
    meta.add_itxt("XML:com.adobe.xmp", XMP_BASE.replace(
        'xmpNote:HasExtendedXMP="' + XMP_GUID + '"', ""))
    path = os.path.join(OUT, "extended-segments.png")
    img.save(path, "PNG", exif=piexif.dump(exif_dict()), icc_profile=info.tobytes(), pnginfo=meta)
    return path


def main():
    os.makedirs(OUT, exist_ok=True)
    paths = [write_extended_jpeg(), write_truncated_icc_jpeg(), write_png()]
    manifest_path = os.path.join(OUT, "manifest.json")
    manifest = {"files": {}}
    if os.path.exists(manifest_path):
        with open(manifest_path) as f:
            manifest = json.load(f)
    notes = {
        "extended-segments.jpg": "Synthetic JPEG with EXIF (Make/Model/GPS/UserComment/MakerNote), base + extended XMP across two APP1 segments, sRGB ICC in APP2, IPTC IIM in APP13.",
        "truncated-icc.jpg": "Negative: APP2 declares ICC chunk 1 of 2; the second chunk never arrives. The parser must report ICC honestly, never invent a profile.",
        "extended-segments.png": "Synthetic PNG with eXIf chunk, iCCP sRGB profile and iTXt XMP.",
    }
    for path in paths:
        name = os.path.basename(path)
        manifest["files"][name] = {
            "bytes": os.path.getsize(path),
            "origin": "Generated deterministically by scripts/generate-metadata-samples.py",
            "note": notes[name],
        }
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")
    for path in paths:
        print(os.path.relpath(path, ROOT))


if __name__ == "__main__":
    main()
