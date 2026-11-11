const fs = require('fs');
const { fftPower, features, cosine, wavInfo, guides } = require('../public/audio-forensics');
test('FFT peak follows the actual input sinusoid', () => {
  const s = Float32Array.from({ length: 512 }, (_, i) => Math.sin((2 * Math.PI * 32 * i) / 512));
  const p = fftPower(s);
  expect(p.indexOf(Math.max(...p))).toBe(32);
});
test('spectral comparison distinguishes separate tones but does not claim identity', () => {
  const a = features(
      Float32Array.from({ length: 4096 }, (_, i) => Math.sin((2 * Math.PI * 16 * i) / 512)),
    ),
    b = features(
      Float32Array.from({ length: 4096 }, (_, i) => Math.sin((2 * Math.PI * 80 * i) / 512)),
    );
  expect(cosine(a, a)).toBeCloseTo(1);
  expect(cosine(a, b)).toBeLessThan(0.01);
  expect(cosine(new Array(32).fill(0), a)).toBeNull();
  expect(guides.fingerprint[1]).toContain('NOT a unique fingerprint');
});
test('WAV fixture reports true original PCM properties', () => {
  const b = fs.readFileSync('public/samples/audio/tones.wav');
  expect(wavInfo(b.buffer.slice(b.byteOffset, b.byteOffset + b.length))).toEqual({
    formatCode: 1,
    channels: 1,
    sampleRate: 16000,
    bitsPerSample: 16,
  });
});

test('WAV parser refuses truncated and undersized chunks', () => {
  const original = fs.readFileSync('public/samples/audio/tones.wav');
  const array = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.length);
  const broken = Buffer.from(original);
  broken.writeUInt32LE(0xffffffff, 16);
  expect(() => wavInfo(array(broken))).toThrow('Truncated');
  const short = Buffer.from(original);
  short.writeUInt32LE(8, 16);
  expect(() => wavInfo(array(short))).toThrow('Invalid WAV');
  expect(wavInfo(new ArrayBuffer(8))).toBeNull();
});

test('waveform zoom selects actual samples and measures the chosen interval', () => {
  const { waveformWindow } = require('../public/audio-forensics');
  const s = Float32Array.from([0, 0.5, -1, 0.25]);
  const w = waveformWindow(s, 4, 0.25, 0.75);
  expect(Array.from(w.samples)).toEqual([0.5, -1]);
  expect(w).toMatchObject({ firstSample: 1, endSampleExclusive: 3, sampleCount: 2, peak: 1 });
  expect(w.rms).toBeCloseTo(Math.sqrt(0.625));
  for (const [a, b] of [
    [-1, 1],
    [1, 1],
    [0, 2],
    [NaN, 1],
  ])
    expect(() => waveformWindow(s, 4, a, b)).toThrow();
});
