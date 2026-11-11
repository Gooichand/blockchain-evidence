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
      'Seeks to a requested time and draws the browser-decoded frame. Select a video, enter seconds and run or try the example. Seeking can land near the requested timestamp and is not a frame-exact forensic extraction.',
    ],
    'vid-timeline': [
      'Sampled Video Timeline',
      'Decodes up to six evenly spaced thumbnails across the clip. Select a video and run to inspect the sampled moments. This is a sparse visual timeline, not event detection, and it can miss content between samples.',
    ],
    keyframe: [
      'MP4 Sync-Sample Analysis',
      'Reads MP4 sample flags and lists sync samples with track composition timestamps. Select an MP4 and run or try the example. Sync samples are container/codec access points, not scene changes or proof of manipulation, and edit-list offsets are not applied.',
    ],
    'video-inspector': [
      'MP4 Structure Inspector',
      'Checks top-level MP4 box boundaries and reads track/sample metadata. Select an MP4 and inspect its structure and decode status. Passing structural checks does not validate every frame or prove the file is complete, safe or authentic.',
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
  async function analyze(id, file, time = 1) {
    if (!file) throw new Error('Select a video or use Try example.');
    if (file.size > 50 * 1024 * 1024) throw new Error('Video limit: 50 MiB.');
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
    if (tool.id === 'frame-extract') {
      ws.appendChild(n('label', 'Frame time in seconds: '));
      ws.appendChild(time);
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
        const result = await analyze(tool.id, file, Number(time.value));
        if (!ws.contains(out)) return;
        out.replaceChildren();
        if (example)
          out.appendChild(
            n('strong', 'DEMO SAMPLE - real decoded/parser output. Your evidence is unchanged.'),
          );
        for (const frame of result.frames) {
          out.appendChild(
            n(
              'h3',
              'Requested ' +
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
  const api = { mount, analyze, ready, boxList, guides };
  root.VideoForensics = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
