/* Read-only desktop video inspection. No authenticity or completeness verdict. */
(function (root) {
  'use strict';
  const guides = {
    'vid-metadata': [
      'Video Metadata Viewer',
      'Reads container, codec, duration, dimensions, track details and available embedded tags through local MediaInfo WASM. Supports MP4/MOV, AVI, MKV and WebM when recognized by the parser without requiring browser playback support. Select a file and run. Editable metadata is not origin, authenticity or all-frame integrity proof.',
    ],
    'frame-extract': [
      'Video Frame Extraction',
      'Extracts an exact decoded MP4/H.264 sample with WebCodecs, not approximate video-element seeking. Enter a zero-based presentation frame index, or leave it blank and enter seconds to select the sample covering that movie time. Reports sample number, presentation index, original track timestamp, edit-list adjustment and actual decoded timestamp; exports a full-resolution PNG. One video track, one sample description and a single rate-1 media edit (optional leading empty edit), 50 MiB, 10 minutes and at most 2000 dependent samples per request. Unsupported codecs, encrypted/fragmented structures, unusual edits, rotated/non-square-pixel tracks, duplicate timestamps and decode failures are rejected. Pixel color conversion is browser-dependent; PNG is a decoded image, not original compressed bytes or authenticity proof.',
    ],
    'vid-timeline': [
      'All-Frame Visual Timeline',
      'Measures every supported MP4/H264 video frame at32x18 resolution, marks abrupt RGB/histogram changes and near-black/low-change intervals, and shows exact160px thumbnails at detected visual-segment starts. JSON lists time/frame bounds for all detected segments and candidates. MP4/H264 only, one track,1-2000samples,50MiB,10minutes;45-second local worker. At most100 combined key/change thumbnails; all frame measurements remain in JSON. Every audio track with a browser-supported codec (for example AAC) is fully decoded and counted; unsupported audio codecs are reported NOT VALIDATED and damaged supported streams fail the analysis. Simple edit timestamp shifts applied, including raw pre-roll. This is a deterministic visual-change timeline, not semantic event understanding, edit/authenticity proof or a guarantee to catch every meaningful event. Similar-looking changes, motion/exposure, scaling and decoder concealment affect results. No trained model or upload.',
    ],
    keyframe: [
      'All-Frame GOP and Keyframe Analysis',
      'Decodes every supported MP4/H264 video sample in a local45-second worker, groups decode samples into GOPs and measures all frames at32x18 RGB resolution. Shows keyframe thumbnails, GOP sample/byte counts and deterministic timing, visual-change, near-black and low-change candidates. Unusual GOP counts differ by more than50%/two samples from the median, excluding the final partial group. Visual changes need RGB difference and histogram distance at least0.22; near-black needs98% dark pixels for0.5seconds, low-change needs at most0.001RGB difference for1second. These are measurements, not scene changes or editing proof; motion, exposure and normal encoding can trigger them. MP4/H264 only,1-2000samples,50MiB,10minutes, one video track, simple edits. Audio/other streams are not validated. Every raw track sample including pre-roll measured; timestamp shift is applied. Every browser-supported audio stream (for example AAC) is fully decoded and counted; unsupported audio codecs are reported NOT VALIDATED and damaged supported streams fail the analysis. No model or network.',
    ],
    'video-inspector': [
      'MP4 Structure Inspector',
      'Checks top-level MP4 box boundaries, reads track/sample metadata and, for files inside the supported profile (one MP4/H264 video track, 1-2000 samples, 50 MiB, 10 minutes, simple edits), decodes every video sample and every browser-supported audio stream sample (for example AAC) exactly once. Damaged supported streams fail the analysis; unsupported audio codecs are reported NOT VALIDATED; files outside the profile get structure checks only with an explicit NOT RUN note. Decoder concealment may hide damaged content. Passing checks does not prove the file is complete, safe or authentic.',
    ],
  };
  function boxList(buffer) {
    const v = new DataView(buffer),
      out = [];
    let p = 0;
    while (p < buffer.byteLength) {
      if (p + 8 > buffer.byteLength) throw new Error('Truncated MP4 box header.');
      let size = v.getUint32(p),
        header = 8;
      const type = String.fromCharCode(...new Uint8Array(buffer, p + 4, 4));
      if (size === 1) {
        if (p + 16 > buffer.byteLength) throw new Error('Truncated extended box header.');
        size = Number(v.getBigUint64(p + 8));
        header = 16;
      }
      if (size === 0) size = buffer.byteLength - p;
      if (!Number.isSafeInteger(size) || size < header || p + size > buffer.byteLength)
        throw new Error('Invalid or truncated MP4 box length.');
      out.push({ type, offset: p, size });
      p += size;
      if (out.length > 10000) throw new Error('Too many MP4 boxes.');
    }
    return out;
  }
  function parseMP4(bytes) {
    if (!root.MP4Box) throw new Error('MP4 parser unavailable.');
    return new Promise((resolve, reject) => {
      const parser = root.MP4Box.createFile();
      let settled = false;
      parser.onError = () => {
        settled = true;
        reject(new Error('MP4 parser rejected this file.'));
      };
      parser.onReady = (info) => {
        settled = true;
        const tracks = info.tracks.map((t) => ({
          id: t.id,
          type: t.type,
          codec: t.codec,
          durationSeconds: t.duration / t.timescale,
          sampleCount: t.nb_samples,
          width: t.video?.width,
          height: t.video?.height,
        }));
        const sync = [];
        for (const t of info.videoTracks) {
          const samples = parser.getTrackSamplesInfo(t.id) || [];
          for (let i = 0; i < samples.length; i++)
            if (samples[i].is_sync)
              sync.push({
                trackId: t.id,
                sample: i + 1,
                timeSeconds: samples[i].cts / samples[i].timescale,
              });
        }
        resolve({ tracks, syncSamples: sync.slice(0, 1000), syncSampleCount: sync.length });
      };
      try {
        bytes.fileStart = 0;
        parser.appendBuffer(bytes);
        parser.flush();
        if (!settled) reject(new Error('No MP4 movie metadata found.'));
      } catch (_) {
        reject(new Error('Unable to parse MP4 sample data.'));
      }
    });
  }
  function framePlan(info, track, samples, time, frameIndex) {
    if (!samples.length || info.videoTracks.length !== 1)
      throw Error('Exactly one nonempty video track required.');
    if (!track.codec.startsWith('avc1.'))
      throw Error('Exact extraction currently supports MP4 H.264/avc1 only.');
    let shift = 0,
      displayStart = 0,
      displayEnd = info.duration / info.timescale,
      edits = track.edits || [];
    if (edits.length) {
      const media = edits.filter((e) => e.media_time >= 0),
        empty = edits.filter((e) => e.media_time === -1);
      if (
        media.length !== 1 ||
        empty.length > 1 ||
        edits.length > 2 ||
        (empty.length && edits[0].media_time !== -1) ||
        edits.some((e) => e.media_rate_integer !== 1 || e.media_rate_fraction !== 0)
      )
        throw Error(
          'Unsupported MP4 edit list: need one rate-1 media edit and optional leading empty edit.',
        );
      displayStart = (empty[0]?.segment_duration || 0) / info.timescale;
      displayEnd = displayStart + media[0].segment_duration / info.timescale;
      shift = displayStart - media[0].media_time / track.timescale;
    }
    const ordered = samples
      .map((s, i) => ({ sample: s, decodeIndex: i, seconds: s.cts / s.timescale + shift }))
      .filter((x) => x.seconds >= displayStart - 0.000001 && x.seconds < displayEnd - 0.000001)
      .sort((a, b) => a.seconds - b.seconds);
    if (!ordered.length || ordered.some((x, i) => i && x.sample.cts === ordered[i - 1].sample.cts))
      throw Error('Empty or ambiguous duplicate presentation timestamps.');
    let target;
    if (frameIndex !== null && frameIndex !== undefined) {
      if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex >= ordered.length)
        throw Error('Frame index is outside the presentation sequence.');
      target = ordered[frameIndex];
    } else {
      if (!Number.isFinite(time) || time < 0 || time >= info.duration / info.timescale)
        throw Error('Enter a time within the movie duration.');
      target = ordered.find(
        (x) =>
          time >= x.seconds - 0.000001 &&
          time < x.seconds + x.sample.duration / x.sample.timescale - 0.000001,
      );
      if (!target)
        throw Error('Requested movie time has no displayed sample (possibly an empty edit).');
    }
    let start = target.decodeIndex;
    while (start > 0 && !samples[start].is_sync) start--;
    if (!samples[start].is_sync) throw Error('No preceding sync sample.');
    if (samples.length - start > 2000)
      throw Error('Exact extraction dependency window exceeds 2000 samples.');
    return {
      target,
      start,
      presentationIndex: ordered.indexOf(target),
      totalFrames: ordered.length,
      shift,
    };
  }
  async function exactFrame(file, time, frameIndex = null) {
    if (!root.VideoDecoder || !root.EncodedVideoChunk || !root.MP4Box)
      throw Error('Exact frame extraction requires WebCodecs and MP4 parser on HTTPS/localhost.');
    const bytes = await file.arrayBuffer(),
      parser = root.MP4Box.createFile();
    boxList(bytes);
    let info;
    parser.onReady = (x) => {
      info = x;
    };
    parser.onError = () => {
      throw Error('MP4 parser rejected sample data.');
    };
    bytes.fileStart = 0;
    parser.appendBuffer(bytes);
    parser.flush();
    if (!info || info.isFragmented) throw Error('Nonfragmented MP4 movie required.');
    const track = info.videoTracks[0];
    if (!track || info.duration / info.timescale > 600)
      throw Error('One video track and maximum 10-minute duration required.');
    const identity = [65536, 0, 0, 0, 65536, 0, 0, 0, 1073741824];
    if (track.matrix && Array.from(track.matrix).some((x, i) => x !== identity[i]))
      throw Error('Rotated or transformed tracks are unsupported for exact extraction.');
    const samples = parser.getTrackSamplesInfo(track.id),
      plan = framePlan(info, track, samples, time, frameIndex);
    const entry = parser.getTrackById(track.id).mdia.minf.stbl.stsd.entries;
    if (entry[0]?.pasp && entry[0].pasp.hSpacing !== entry[0].pasp.vSpacing)
      throw Error('Non-square pixel aspect ratio is unsupported.');
    if (entry.length !== 1 || !entry[0].avcC || entry[0].sinf)
      throw Error('Single unencrypted AVC description required.');
    if (track.video.width * track.video.height > 16777216)
      throw Error('Maximum decoded frame: 16 megapixels.');
    const avc = entry[0].avcC;
    const config = {
      codec: track.codec,
      codedWidth: track.video.width,
      codedHeight: track.video.height,
      description: bytes.slice(avc.start + 8, avc.start + avc.size),
      hardwareAcceleration: 'prefer-software',
    };
    if (!(await root.VideoDecoder.isConfigSupported(config)).supported)
      throw Error('Browser does not support this exact AVC decoder configuration.');
    const stamp = Math.round((plan.target.sample.cts / track.timescale) * 1e6);
    let canvas = null,
      actualTimestamp = null,
      decoderError = null,
      timer;
    const decoder = new root.VideoDecoder({
      output(frame) {
        try {
          if (frame.timestamp === stamp) {
            if (canvas) throw Error('Ambiguous repeated decoded timestamp.');
            canvas = document.createElement('canvas');
            canvas.width = frame.displayWidth;
            canvas.height = frame.displayHeight;
            canvas.getContext('2d').drawImage(frame, 0, 0);
            actualTimestamp = frame.timestamp;
          }
        } catch (e) {
          decoderError = e;
        } finally {
          frame.close();
        }
      },
      error(e) {
        decoderError = e;
      },
    });
    try {
      decoder.configure(config);
      await Promise.race([
        (async () => {
          for (let i = plan.start; i < samples.length; i++) {
            const sample = samples[i];
            if (
              sample.description_index !== 0 ||
              sample.offset < 0 ||
              sample.offset + sample.size > bytes.byteLength
            )
              throw Error('Truncated sample or changed description.');
            if (decoderError) throw decoderError;
            decoder.decode(
              new root.EncodedVideoChunk({
                type: sample.is_sync ? 'key' : 'delta',
                timestamp: Math.round((sample.cts / track.timescale) * 1e6),
                duration: Math.round((sample.duration / track.timescale) * 1e6),
                data: new Uint8Array(bytes, sample.offset, sample.size),
              }),
            );
            if (decoder.decodeQueueSize > 16)
              await new Promise((resolve) =>
                decoder.addEventListener('dequeue', resolve, { once: true }),
              );
          }
          await decoder.flush();
        })(),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(Error('Exact decoding timed out.')), 20000);
        }),
      ]);
      if (decoderError) throw decoderError;
      if (!canvas || actualTimestamp !== stamp)
        throw Error('Selected frame was not decoded at the exact sample timestamp.');
      return {
        summary: {
          file: file.name,
          durationSeconds: info.duration / info.timescale,
          width: canvas.width,
          height: canvas.height,
          extraction: 'EXACT DECODED SAMPLE',
          codec: track.codec,
          presentationFrameIndex: plan.presentationIndex,
          presentationFrameCount: plan.totalFrames,
          sampleNumber: plan.target.decodeIndex + 1,
          sampleCTS: plan.target.sample.cts,
          trackTimescale: track.timescale,
          editShiftSeconds: plan.shift,
          presentationSeconds: plan.target.seconds,
          decodedTimestampMicroseconds: actualTimestamp,
          decodeStatus: 'Selected exact sample decoded; not a whole-file authenticity check.',
          limit:
            'MP4/H.264 WebCodecs only; one video track/description, simple rate-1 edits. Browser color conversion may vary.',
        },
        frames: [
          {
            requestedSeconds: time,
            browserTimeSeconds: plan.target.seconds,
            presentationFrameIndex: plan.presentationIndex,
            exact: true,
            canvas,
          },
        ],
      };
    } finally {
      clearTimeout(timer);
      if (decoder.state !== 'closed') decoder.close();
    }
  }
  async function allFrameMeasurements(file, mode = 'keyframe', options = {}) {
    if (!root.Worker) throw Error('Video worker unavailable.');
    const result = await new Promise((resolve, reject) => {
      const worker = new root.Worker('/video-measurements-worker.js'),
        timer = setTimeout(() => {
          worker.terminate();
          reject(Error('All-frame analysis exceeded45-second limit.'));
        }, 45000);
      const finish = () => {
        clearTimeout(timer);
        worker.terminate();
      };
      worker.onmessage = ({ data }) => {
        finish();
        if (data.ok) resolve(data.result);
        else {
          const e = Error(data.error);
          e.outOfProfile = !!data.outOfProfile;
          reject(e);
        }
      };
      worker.onerror = () => {
        finish();
        reject(Error('All-frame worker failed.'));
      };
      worker.postMessage({ file, thumbnails: options.thumbnails });
    });
    const thumbnails = result.thumbnails;
    delete result.thumbnails;
    const frames = [];
    for (const thumbnail of thumbnails.filter(
      (t) => mode !== 'vid-timeline' || t.kind === 'VISUAL_SEGMENT_START',
    )) {
      const image = await createImageBitmap(thumbnail.blob),
        canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext('2d').drawImage(image, 0, 0);
      image.close();
      frames.push({
        requestedSeconds: thumbnail.seconds,
        browserTimeSeconds: thumbnail.seconds,
        sampleNumber: thumbnail.sampleNumber,
        kind: thumbnail.kind,
        presentationFrameIndex: result.frames.find((f) => f.sampleNumber === thumbnail.sampleNumber)
          .presentationIndex,
        exact: true,
        canvas,
      });
    }
    return {
      summary: {
        file: file.name,
        ...result,
        limit:
          'MP4/H264, one video track,1-2000frames,50MiB,10minutes. Every video sample decoded once. Every audio track with a browser-supported codec (for example AAC) is fully decoded and counted; unsupported audio codecs are reported NOT VALIDATED, and damaged supported streams fail the analysis. All track samples including edit pre-roll measured with simple edit timestamp shift. Decoder concealment may hide damaged content. No semantic/event/authenticity verdict.',
      },
      frames,
    };
  }
  function wait(video, event, action) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => done(new Error('Video decode/seek timed out.')), 12000);
      const ok = () => done(),
        bad = () => done(new Error('Browser cannot decode this video.'));
      function done(error) {
        clearTimeout(timer);
        video.removeEventListener(event, ok);
        video.removeEventListener('error', bad);
        error ? reject(error) : resolve();
      }
      video.addEventListener(event, ok, { once: true });
      video.addEventListener('error', bad, { once: true });
      action();
    });
  }
  async function analyze(id, file, time = 1, frameIndex = null) {
    if (!file) throw new Error('Select a video or use Try example.');
    if (file.size > 50 * 1024 * 1024) throw new Error('Video limit: 50 MiB.');
    if (id === 'frame-extract') return exactFrame(file, time, frameIndex);
    if (id === 'keyframe' || id === 'vid-timeline') return allFrameMeasurements(file, id);
    if (id === 'vid-metadata') {
      if (!root.MediaMetadata) throw Error('Local media metadata engine unavailable.');
      return {
        summary: { file: file.name, ...(await root.MediaMetadata.inspect(file, 'video')) },
        frames: [],
      };
    }
    const video = document.createElement('video'),
      url = URL.createObjectURL(file);
    video.muted = true;
    video.preload = 'auto';
    try {
      await wait(video, 'loadeddata', () => {
        video.src = url;
        video.load();
      });
      if (!Number.isFinite(video.duration) || video.duration <= 0)
        throw new Error('Finite video duration required.');
      if (video.duration > 600) throw new Error('Video limit: 10 minutes.');
      const result = {
        summary: {
          file: file.name,
          durationSeconds: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          decodeStatus: 'Browser decoded initial frame only; not all frames validated.',
        },
        frames: [],
      };
      const mp4 = /\.(mp4|mov|m4v)$/i.test(file.name);
      if (mp4) {
        const bytes = await file.arrayBuffer();
        result.summary.topLevelBoxes = boxList(bytes);
        const parsed = await parseMP4(bytes);
        Object.assign(result.summary, parsed);
      }
      if (['keyframe', 'video-inspector'].includes(id) && !mp4)
        throw new Error('This tool supports MP4/MOV containers only.');
      if (id === 'video-inspector') {
        try {
          const validation = await allFrameMeasurements(file, id, { thumbnails: false });
          result.summary.streamValidation = validation.summary;
        } catch (e) {
          if (!e.outOfProfile) throw e;
          result.summary.streamValidation = {
            validation: 'NOT RUN',
            reason:
              'This file is outside the supported all-stream validation profile: ' +
              String(e.message || e),
          };
        }
      }
      const capture = async (seconds) => {
        const target = Math.max(0, Math.min(seconds, video.duration - 0.001));
        if (Math.abs(video.currentTime - target) > 0.0001)
          await wait(video, 'seeked', () => {
            video.currentTime = target;
          });
        const scale = Math.min(1, 640 / video.videoWidth),
          c = document.createElement('canvas');
        c.width = Math.round(video.videoWidth * scale);
        c.height = Math.round(video.videoHeight * scale);
        c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
        return { requestedSeconds: seconds, browserTimeSeconds: video.currentTime, canvas: c };
      };
      if (id === 'frame-extract') {
        if (!Number.isFinite(time) || time < 0 || time >= video.duration)
          throw new Error('Enter a time from 0 up to, but not including, the clip duration.');
        result.frames.push(await capture(time));
      } else if (id === 'vid-timeline') {
        for (let i = 0; i < 6; i++) result.frames.push(await capture((i * video.duration) / 6));
        result.summary.limit = 'Six sampled moments, not an exhaustive timeline or event detector.';
      } else if (id === 'keyframe')
        result.summary.limit =
          'Sync flags and raw track composition timestamps; movie edit-list offsets are not applied. Not scene-change or tampering detection.';
      else if (id !== 'vid-metadata' && id !== 'video-inspector')
        throw new Error('Unsupported video tool.');
      if (id === 'keyframe')
        result.summary = {
          syncSamples: result.summary.syncSamples,
          syncSampleCount: result.summary.syncSampleCount,
          ...result.summary,
        };
      return result;
    } finally {
      video.pause();
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
    }
  }
  function ready(id) {
    if (id === 'vid-metadata') return !!root.MediaMetadata;
    if (id === 'keyframe' || id === 'vid-timeline')
      return !!(root.Worker && root.VideoDecoder && root.OffscreenCanvas);
    if (id === 'frame-extract')
      return !!(root.VideoDecoder && root.EncodedVideoChunk && root.MP4Box);
    try {
      return !!(
        document.createElement('video').canPlayType('video/mp4') &&
        document.createElement('canvas').getContext('2d') &&
        root.MP4Box
      );
    } catch (_) {
      return false;
    }
  }
  function n(tag, text, attrs = {}) {
    const x = document.createElement(tag);
    if (text !== undefined) x.textContent = text;
    for (const [k, v] of Object.entries(attrs)) x.setAttribute(k, v);
    return x;
  }
  function mount(ws, tool, getFile) {
    const [title, guide] = guides[tool.id],
      dot = document.querySelector('[data-tool="' + tool.id + '"] .fl-dot');
    if (dot) {
      dot.className = 'fl-dot ' + (ready(tool.id) ? 'available' : 'beta');
      dot.title = ready(tool.id)
        ? 'Browser decode capability and MP4 parser available; individual files can still fail'
        : 'Required browser decoder/parser unavailable';
    }
    ws.appendChild(n('h2', title));
    ws.appendChild(
      n('p', guide, {
        class: 'fl-tool-guide',
        style:
          'padding:16px;border:1px solid #ddd;border-radius:10px;background:#f8fafc;line-height:1.6;',
      }),
    );
    ws.appendChild(
      n(
        'p',
        tool.id === 'vid-metadata'
          ? 'Local metadata parser, maximum 50 MiB and 25 seconds processing. Tested on MP4/MOV, AVI, MKV and WebM synthetic samples. No playback codec required.'
          : 'Local processing only. Maximum 50 MiB / 10 minutes. Frame tools depend on browser playback codecs; tested on MP4 H.264.',
      ),
    );
    const time = n('input', undefined, {
      type: 'number',
      min: '0',
      step: '0.1',
      value: '1',
      'aria-label': 'Frame time in seconds',
    });
    const frameIndexInput = n('input', undefined, {
      type: 'number',
      min: '0',
      step: '1',
      'aria-label': 'Exact frame index',
      placeholder: 'blank = use seconds',
    });
    if (tool.id === 'frame-extract') {
      ws.appendChild(n('label', 'Frame time in seconds: '));
      ws.appendChild(time);
      ws.appendChild(n('label', ' Or exact presentation frame index (zero-based): '));
      ws.appendChild(frameIndexInput);
    }
    const run = n('button', 'Analyze selected video', {
        type: 'button',
        class: 'fl-btn fl-btn-primary',
      }),
      demo = n('button', '\u25b6 Try example', {
        type: 'button',
        class: 'fl-btn fl-btn-ghost',
        'aria-label': 'Try video example',
      }),
      out = n('section', undefined, { role: 'status', style: 'margin-top:20px;' });
    ws.appendChild(run);
    ws.appendChild(demo);
    ws.appendChild(out);
    const execute = async (example) => {
      run.disabled = demo.disabled = true;
      out.replaceChildren(n('p', 'Processing locally...'));
      try {
        let file = getFile();
        if (example) {
          const r = await fetch('/samples/video/demo.mp4');
          if (!r.ok) throw new Error('Video example unavailable.');
          file = new File([await r.arrayBuffer()], 'Demo - demo.mp4', { type: 'video/mp4' });
        }
        const result = await analyze(
          tool.id,
          file,
          Number(time.value),
          tool.id === 'frame-extract' && frameIndexInput.value !== ''
            ? Number(frameIndexInput.value)
            : null,
        );
        if (!ws.contains(out)) return;
        out.replaceChildren();
        if (example)
          out.appendChild(
            n('strong', 'DEMO SAMPLE - real decoded/parser output. Your evidence is unchanged.'),
          );
        if (result.summary.events) {
          out.appendChild(n('h3', 'Measured timeline candidates'));
          out.appendChild(
            n(
              'p',
              result.summary.events.length
                ? result.summary.events
                    .map(
                      (e) =>
                        (e.seconds ?? e.startSeconds).toFixed(3) +
                        's: ' +
                        e.kind +
                        (e.endSeconds !== undefined
                          ? ' until ' + e.endSeconds.toFixed(3) + 's'
                          : ''),
                    )
                    .join(' | ')
                : 'No configured visual/timing candidates detected. This does not prove that no event or edit occurred.',
            ),
          );
        }
        for (const frame of result.frames) {
          out.appendChild(
            n(
              'h3',
              frame.exact
                ? 'Exact presentation frame ' +
                    frame.presentationFrameIndex +
                    ' at ' +
                    frame.browserTimeSeconds.toFixed(6) +
                    ' s'
                : 'Requested ' +
                    frame.requestedSeconds.toFixed(3) +
                    ' s; browser position ' +
                    frame.browserTimeSeconds.toFixed(3) +
                    ' s',
            ),
          );
          frame.canvas.style.maxWidth = '100%';
          out.appendChild(frame.canvas);
          const save = n('button', 'Download PNG', {
            type: 'button',
            class: 'fl-btn fl-btn-ghost',
          });
          save.addEventListener('click', () =>
            frame.canvas.toBlob((blob) => {
              if (!blob) return;
              const url = URL.createObjectURL(blob),
                a = n('a', undefined, {
                  href: url,
                  download: 'frame-' + frame.browserTimeSeconds.toFixed(3) + '.png',
                });
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }),
          );
          out.appendChild(save);
        }
        out.appendChild(
          n('pre', JSON.stringify(result.summary, null, 2), {
            style:
              'padding:16px;background:#f8fafc;white-space:pre-wrap;overflow-wrap:anywhere;max-height:600px;overflow:auto;',
          }),
        );
      } catch (e) {
        if (ws.contains(out))
          out.replaceChildren(n('p', e.message || 'Video analysis failed.', { role: 'alert' }));
      } finally {
        run.disabled = demo.disabled = false;
      }
    };
    run.addEventListener('click', () => execute(false));
    demo.addEventListener('click', () => execute(true));
  }
  const api = {
    mount,
    analyze,
    ready,
    boxList,
    framePlan,
    exactFrame,
    allFrameMeasurements,
    guides,
  };
  root.VideoForensics = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
