# Exact frame fixtures

Original FFmpeg testsrc2 synthetic images encoded with libx264, B-frames and explicit BT.709 metadata. CFR expected PNGs represent presentation indices 0, 5 and 23. VFR reference is index 18. Reproduce with scripts/generate-exact-video-samples.py. Chrome WebCodecs is checked against these independent FFmpeg decodes; RGB conversion differences remain possible, not byte-identical forensic color reproduction. No personal footage.
