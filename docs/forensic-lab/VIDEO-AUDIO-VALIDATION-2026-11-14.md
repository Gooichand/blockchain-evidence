# Video all-stream validation, November 14

Branch: review/video-audio-validation-20261114, on merged main `43da534`. Local only; no production deployment, upload or network access.

## What changed

- The all-frame video worker now validates every audio track, not just the video track. Each audio sample's byte range and timestamp uniqueness is checked; overlapping ranges, truncation and duplicate timestamps fail closed. Every sample of every browser-supported codec (AAC verified; MP3/Opus use the same WebCodecs path) is decoded exactly once and decoded frame counts are reported. A damaged supported stream fails the whole analysis.
- Audio codec configuration comes from the actual DecSpecificInfo (AudioSpecificConfig) in the esds box, including HE-AAC (SBR) object-type mapping - the MP4 sample entry can disagree with the real stream (our own fixture does: sample entry says stereo, stream is mono). Reported sample rate/channels come from the decoded frames, not metadata.
- A browser-unsupported audio codec (AC-3 fixture) is reported NOT VALIDATED with an explicit reason while video results are still returned. This is a bounded capability, not a hidden pass.
- Video Inspector now runs this all-stream validation for files inside the documented profile and fails closed on damage; files outside the profile keep structure-only results with an explicit NOT RUN note and reason. Profile rejections are marked outOfProfile by the worker so damage is never mislabeled as unsupported.
- Keyframe/GOP and Visual Timeline tools inherit the same audio validation and their guides say so.

## Fixtures (original, generated, Apache-2.0 with this repository)

- audio-aac.mp4: 2s video + 44.1kHz mono AAC (88 packets), faststart. Independent ffprobe reference in the manifest.
- truncated-audio.mp4: final audio sample range exceeds file size; must fail closed ("truncated audio sample").
- corrupted-audio.mp4: 6 bytes flipped inside the 5th audio packet; must fail closed (decoder rejects).
- audio-ac3.mp4: AC-3 audio; must report NOT VALIDATED while video decodes.

Generator logic appended to scripts/generate-video-measurement-samples.py; hashes in the manifest.

## Results (real Chrome worker, desktop runner)

- AAC: DECODED_ALL, 88/88 samples decoded exactly once (= independent ffprobe packet count), 90,112 decoded sample frames, 44.1kHz mono read from decoded frames.
- AC-3: NOT VALIDATED, explicit reason; video track still decoded (20/20 frames).
- Truncated and corrupted audio: both rejected; neither claimed as validated.
- 43 non-Network Jest suites / 371 tests pass. 44 real desktop example workflows plus extended matrices pass. git diff --check clean.

## What this does not claim

Decoder concealment can still hide damaged compressed content (same caveat as video). Only browser-supported codecs are validated; unsupported streams are always labeled NOT VALIDATED. No semantic/event/authenticity verdict, no all-container support (MP4/MOV H264 profile only), no network or model use. Strict credit covers the Video Inspector promise for the documented profile.
