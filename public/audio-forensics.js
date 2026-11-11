/* Local bounded audio measurements. No identity or tampering verdict. */
(function (root) {
  'use strict';
  const guides = {
    waveform: [
      'Audio Waveform',
      'Draws minimum/maximum sample amplitude per display column. Select a clip and run, then set Start and End seconds and Apply zoom to inspect a time window within the first 30 seconds. Reset restores the overview. The selected window reports sample bounds, RMS and peak. Peaks show amplitude, not edits or speaker identity; sub-pixel events can be hidden.',
    ],
    spectrogram: [
      'Audio Spectrogram',
      'Draws a Hann-window 512-point FFT spectrogram of the first 30 seconds, downmixed to mono. Horizontal is time, vertical is frequency (0 to Nyquist), brightness is relative decibels. Select audio and run. This is a sampled visualization, not an authenticity or speech verdict.',
    ],
    'aud-metadata': [
      'Audio Container and Recording Metadata',
      'Reads original codec/container, duration, sample rate, channels, bitrate and available embedded recording tags through local MediaInfo WASM. Supports WAV, MP3, FLAC, M4A and OGG when recognized by the parser, without relying on browser playback codecs. Metadata is editable and may be absent; no recording-device identity or full history is verified.',
    ],
    fingerprint: [
      'Acoustic Landmark Fingerprint Comparison',
      'Computes time-ordered spectral peaks, hashes pairs and votes for a consistent offset between two recordings. Select a clip in the Evidence Vault and a second file, then run. The first 30 seconds are downmixed and reduced to 8kHz; simple tones/silence/short clips are inconclusive. A candidate match needs at least 20 aligned anchors, 12% anchor coverage, two seconds span and no competing repeated alignment. Tested on original gain/noise/MP3/AAC/trim fixtures, not a broad natural-recording accuracy benchmark. This is NOT a unique fingerprint, speaker/identity, copyright, database or tamper verdict. Speed/pitch changes and heavy noise can fail. All processing stays local in a 25-second worker.',
    ],
  };
  function fftPower(input) {
    const N = 512,
      re = new Float64Array(N),
      im = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      let j = 0,
        k = i;
      for (let b = 0; b < 9; b++) {
        j = (j << 1) | (k & 1);
        k >>= 1;
      }
      re[j] = (input[i] || 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
    }
    for (let size = 2; size <= N; size *= 2)
      for (let base = 0; base < N; base += size)
        for (let k = 0; k < size / 2; k++) {
          const a = (-2 * Math.PI * k) / size,
            c = Math.cos(a),
            s = Math.sin(a),
            j = base + k,
            l = j + size / 2,
            x = re[l] * c - im[l] * s,
            y = re[l] * s + im[l] * c;
          re[l] = re[j] - x;
          im[l] = im[j] - y;
          re[j] += x;
          im[j] += y;
        }
    return Array.from({ length: N / 2 }, (_, i) => (re[i] * re[i] + im[i] * im[i]) / (N * N));
  }
  function features(samples) {
    const count = Math.min(160, Math.max(1, Math.floor(samples.length / 512))),
      avg = new Float64Array(32);
    for (let i = 0; i < count; i++) {
      const start = Math.floor((i * Math.max(0, samples.length - 512)) / Math.max(1, count - 1)),
        p = fftPower(samples.subarray(start, start + 512));
      for (let j = 0; j < 256; j++) avg[Math.floor(j / 8)] += p[j] / count;
    }
    return Array.from(avg);
  }
  function cosine(a, b) {
    const dot = a.reduce((s, x, i) => s + x * b[i], 0),
      aa = a.reduce((s, x) => s + x * x, 0),
      bb = b.reduce((s, x) => s + x * x, 0);
    return aa && bb ? Math.max(0, Math.min(1, dot / Math.sqrt(aa * bb))) : null;
  }
  function wavInfo(buffer) {
    const v = new DataView(buffer);
    const str = (p) => String.fromCharCode(...new Uint8Array(buffer, p, 4));
    if (buffer.byteLength < 12 || str(0) !== 'RIFF' || str(8) !== 'WAVE') return null;
    let p = 12;
    while (p + 8 <= buffer.byteLength) {
      const size = v.getUint32(p + 4, true);
      if (p + 8 + size > buffer.byteLength) throw new Error('Truncated WAV chunk.');
      if (str(p) === 'fmt ') {
        if (size < 16) throw new Error('Invalid WAV format chunk.');
        return {
          formatCode: v.getUint16(p + 8, true),
          channels: v.getUint16(p + 10, true),
          sampleRate: v.getUint32(p + 12, true),
          bitsPerSample: v.getUint16(p + 22, true),
        };
      }
      p += 8 + size + (size % 2);
    }
    return null;
  }
  async function decode(file) {
    if (!file) throw new Error('Select an audio file or use Try example.');
    if (file.size > 25 * 1024 * 1024) throw new Error('Audio limit: 25 MiB.');
    const C = root.AudioContext || root.webkitAudioContext;
    if (!C) throw new Error('Web Audio decoder unavailable.');
    const ctx = new C();
    try {
      const bytes = await file.arrayBuffer(),
        buffer = await ctx.decodeAudioData(bytes.slice(0));
      if (buffer.duration > 300) throw new Error('Audio limit: 5 minutes.');
      if (buffer.length * buffer.numberOfChannels > 30000000)
        throw new Error('Decoded audio exceeds 30 million samples.');
      const length = Math.min(buffer.length, Math.floor(buffer.sampleRate * 30)),
        mono = new Float32Array(length);
      let sum = 0,
        peak = 0;
      for (let c = 0; c < buffer.numberOfChannels; c++) {
        const channel = buffer.getChannelData(c);
        for (let i = 0; i < channel.length; i++) {
          sum += channel[i] * channel[i];
          peak = Math.max(peak, Math.abs(channel[i]));
          if (i < length) mono[i] += channel[i] / buffer.numberOfChannels;
        }
      }
      return {
        mono,
        summary: {
          file: file.name,
          durationSeconds: buffer.duration,
          decodedSampleRate: buffer.sampleRate,
          channels: buffer.numberOfChannels,
          samplesPerChannel: buffer.length,
          rms: Math.sqrt(sum / (buffer.length * buffer.numberOfChannels)),
          peak,
          wav: wavInfo(bytes),
          analysisSeconds: length / buffer.sampleRate,
        },
      };
    } finally {
      await ctx.close();
    }
  }
  async function analyze(id, file, second) {
    if (id === 'aud-metadata') {
      if (!file || file.size > 25 * 1024 * 1024) throw Error('Select audio up to25 MiB.');
      if (!root.MediaMetadata) throw Error('Local media metadata engine unavailable.');
      const summary = await root.MediaMetadata.inspect(file, 'audio');
      summary.file = file.name;
      summary.wav = /\.wav$/i.test(file.name) ? wavInfo(await file.arrayBuffer()) : null;
      return { summary };
    }
    const a = await decode(file);
    if (id === 'fingerprint') {
      const b = await decode(second);
      if (!root.Worker) throw Error('Fingerprint worker unavailable.');
      const result = await new Promise((resolve, reject) => {
        const worker = new root.Worker('/acoustic-landmarks-worker.js');
        const timer = setTimeout(() => {
          worker.terminate();
          reject(Error('Fingerprint exceeded25-second limit.'));
        }, 25000);
        const finish = () => {
          clearTimeout(timer);
          worker.terminate();
        };
        worker.onmessage = ({ data }) => {
          finish();
          data.ok ? resolve(data.result) : reject(Error(data.error));
        };
        worker.onerror = () => {
          finish();
          reject(Error('Fingerprint worker failed.'));
        };
        worker.postMessage(
          {
            first: a.mono.buffer,
            firstRate: a.summary.decodedSampleRate,
            second: b.mono.buffer,
            secondRate: b.summary.decodedSampleRate,
          },
          [a.mono.buffer, b.mono.buffer],
        );
      });
      return { summary: { ...result, firstAudio: a.summary, secondAudio: b.summary } };
    }
    if (!guides[id]) throw new Error('Unknown audio tool.');
    return a;
  }
  function ready(id) {
    if (id === 'aud-metadata') return !!root.MediaMetadata;
    if (id === 'fingerprint' && !root.Worker) return false;
    return !!(root.AudioContext || root.webkitAudioContext);
  }
  function node(tag, text, attrs = {}) {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  }
  function waveformWindow(samples, sampleRate, start, end) {
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < 0 ||
      end <= start ||
      end > samples.length / sampleRate + 1e-9
    )
      throw Error('Choose Start < End within the analyzed duration.');
    const first = Math.floor(start * sampleRate),
      last = Math.min(samples.length, Math.ceil(end * sampleRate));
    if (last <= first) throw Error('Window must include at least one sample.');
    const selected = samples.subarray(first, last);
    let sum = 0,
      peak = 0;
    for (const x of selected) {
      sum += x * x;
      peak = Math.max(peak, Math.abs(x));
    }
    return {
      samples: selected,
      firstSample: first,
      endSampleExclusive: last,
      startSeconds: first / sampleRate,
      endSeconds: last / sampleRate,
      sampleCount: last - first,
      rms: Math.sqrt(sum / selected.length),
      peak,
    };
  }
  function draw(id, result) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 280;
    const ctx = canvas.getContext('2d'),
      s = result.mono;
    ctx.fillStyle = '#101d30';
    ctx.fillRect(0, 0, 800, 280);
    if (id === 'waveform') {
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      for (let x = 0; x < 800; x++) {
        const start = Math.floor((x * s.length) / 800),
          end = Math.max(start + 1, Math.floor(((x + 1) * s.length) / 800));
        let lo = 1,
          hi = -1;
        for (let i = start; i < end; i++) {
          lo = Math.min(lo, s[i] || 0);
          hi = Math.max(hi, s[i] || 0);
        }
        ctx.moveTo(x, 140 - lo * 130);
        ctx.lineTo(x, 140 - hi * 130);
      }
      ctx.stroke();
    } else {
      const cols = 200;
      for (let x = 0; x < cols; x++) {
        const start = Math.floor((x * Math.max(0, s.length - 512)) / (cols - 1)),
          p = fftPower(s.subarray(start, start + 512));
        for (let y = 0; y < 256; y++) {
          const db = 10 * Math.log10(Math.max(1e-12, p[y])),
            v = Math.max(0, Math.min(255, ((db + 90) * 255) / 75));
          ctx.fillStyle =
            'rgb(' + Math.round(v) + ',' + Math.round(v * 0.65) + ',' + Math.round(v * 0.2) + ')';
          ctx.fillRect(x * 4, 280 - ((y + 1) * 280) / 256, 4, 2);
        }
      }
    }
    canvas.setAttribute('role', 'img');
    canvas.setAttribute(
      'aria-label',
      id === 'waveform'
        ? 'Audio amplitude waveform for selected time window'
        : 'Audio frequency spectrogram',
    );
    canvas.style.maxWidth = '100%';
    return canvas;
  }
  function mount(ws, tool, getFile) {
    const [title, guide] = guides[tool.id];
    ws.appendChild(node('h2', title));
    ws.appendChild(
      node('p', guide, {
        class: 'fl-tool-guide',
        style:
          'padding:16px;background:#f8fafc;line-height:1.6;border:1px solid #ddd;border-radius:10px;',
      }),
    );
    ws.appendChild(
      node(
        'p',
        tool.id === 'aud-metadata'
          ? 'Local metadata parser, up to 25 MiB and 25 seconds processing. No browser playback codec is required; unsupported or malformed files can fail.'
          : 'Local only. 25 MiB / 5 minutes / 30 million decoded samples. Waveform, spectrum and comparison use at most the first 30 seconds. Codec support depends on your desktop browser.',
      ),
    );
    let second;
    const out = node('section', undefined, { role: 'status', style: 'margin-top:20px;' });
    if (tool.id === 'fingerprint') {
      const input = node('input', undefined, {
        type: 'file',
        accept: 'audio/*',
        'aria-label': 'Second audio file',
      });
      input.onchange = () => {
        second = input.files[0];
        out.replaceChildren(node('p', 'Second file changed; run again.'));
      };
      ws.appendChild(input);
    }
    const run = node('button', 'Analyze selected audio', {
        class: 'fl-btn fl-btn-primary',
        type: 'button',
      }),
      demo = node('button', '▶ Try example', {
        class: 'fl-btn fl-btn-ghost',
        type: 'button',
        'aria-label': 'Try audio example',
      });
    ws.append(run, demo, out);
    async function execute(example) {
      run.disabled = demo.disabled = true;
      out.replaceChildren(node('p', 'Decoding and measuring locally...'));
      try {
        let file = getFile(),
          other = second;
        if (example) {
          const r = await fetch(
            tool.id === 'fingerprint'
              ? '/samples/audio/landmarks/original.wav'
              : '/samples/audio/tones.wav',
          );
          if (!r.ok) throw new Error('Example missing.');
          file = new File(
            [await r.arrayBuffer()],
            tool.id === 'fingerprint' ? 'Demo - original synthetic.wav' : 'Demo - tones.wav',
            { type: 'audio/wav' },
          );
          if (tool.id === 'fingerprint') {
            const secondResponse = await fetch('/samples/audio/landmarks/trimmed.mp3');
            if (!secondResponse.ok) throw Error('Example missing.');
            other = new File(
              [await secondResponse.arrayBuffer()],
              'Original synthetic trimmed MP3',
              { type: 'audio/mpeg' },
            );
          } else other = file;
        }
        const result = await analyze(tool.id, file, other);
        if (!ws.contains(out)) return;
        out.replaceChildren();
        if (example)
          out.appendChild(
            node(
              'strong',
              tool.id === 'fingerprint'
                ? 'DEMO SAMPLE - original synthetic multi-tone recording compared with a trimmed, quieter MP3. Candidate acoustic alignment only; your evidence and second-file choice are unchanged.'
                : 'DEMO SAMPLE - original 440 Hz then 880 Hz tones. Your evidence is unchanged.',
            ),
          );
        if (['waveform', 'spectrogram'].includes(tool.id)) {
          if (tool.id === 'waveform') {
            const controls = node('div', undefined, {
                style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0;',
              }),
              plot = node('div'),
              stats = node('p', undefined, { role: 'status' });
            const start = node('input', undefined, {
                type: 'number',
                min: '0',
                max: String(result.summary.analysisSeconds),
                step: '0.001',
                value: '0',
                'aria-label': 'Waveform start seconds',
                style: 'width:100px;',
              }),
              end = node('input', undefined, {
                type: 'number',
                min: '0',
                max: String(result.summary.analysisSeconds),
                step: '0.001',
                value: String(result.summary.analysisSeconds),
                'aria-label': 'Waveform end seconds',
                style: 'width:100px;',
              }),
              apply = node('button', 'Apply zoom', {
                type: 'button',
                class: 'fl-btn fl-btn-ghost',
              }),
              reset = node('button', 'Reset overview', {
                type: 'button',
                class: 'fl-btn fl-btn-ghost',
              });
            controls.append(
              node('span', 'Start (s)'),
              start,
              node('span', 'End (s)'),
              end,
              apply,
              reset,
            );
            out.append(controls, plot, stats);
            function zoom() {
              try {
                const w = waveformWindow(
                  result.mono,
                  result.summary.decodedSampleRate,
                  Number(start.value),
                  Number(end.value),
                );
                plot.replaceChildren(draw('waveform', { mono: w.samples }));
                stats.textContent =
                  'Window ' +
                  w.startSeconds.toFixed(6) +
                  ' to ' +
                  w.endSeconds.toFixed(6) +
                  ' s | samples [' +
                  w.firstSample +
                  ', ' +
                  w.endSampleExclusive +
                  ') | ' +
                  w.sampleCount +
                  ' samples | RMS ' +
                  w.rms.toFixed(6) +
                  ' | peak ' +
                  w.peak.toFixed(6);
                stats.removeAttribute('role');
              } catch (e) {
                stats.textContent = e.message;
                stats.setAttribute('role', 'alert');
              }
            }
            apply.onclick = zoom;
            reset.onclick = () => {
              start.value = '0';
              end.value = String(result.summary.analysisSeconds);
              zoom();
            };
            zoom();
          } else out.appendChild(draw(tool.id, result));
          out.appendChild(
            node(
              'p',
              tool.id === 'spectrogram'
                ? 'Time: 0 to ' +
                    result.summary.analysisSeconds.toFixed(2) +
                    ' s, left to right. Frequency: 0 Hz bottom to ' +
                    result.summary.decodedSampleRate / 2 +
                    ' Hz top. Relative power scale: -90 to -15 dB.'
                : 'Available analysis interval: 0 to ' +
                    result.summary.analysisSeconds.toFixed(2) +
                    ' s; vertical amplitude -1 to +1.',
            ),
          );
        }
        out.appendChild(
          node('pre', JSON.stringify(result.summary, null, 2), {
            style:
              'padding:16px;background:#f8fafc;white-space:pre-wrap;overflow-wrap:anywhere;max-height:650px;overflow:auto;',
          }),
        );
      } catch (e) {
        if (ws.contains(out))
          out.replaceChildren(node('p', e.message || 'Audio decode failed.', { role: 'alert' }));
      } finally {
        run.disabled = demo.disabled = false;
      }
    }
    run.onclick = () => execute(false);
    demo.onclick = () => execute(true);
  }
  const api = {
    analyze,
    mount,
    ready,
    fftPower,
    features,
    cosine,
    wavInfo,
    waveformWindow,
    guides,
  };
  root.AudioForensics = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
