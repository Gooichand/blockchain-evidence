const { summarize, inspect } = require('../public/media-metadata');
test('media summary preserves original sample rate, tracks and metadata limits', () => {
  const r = summarize(
    {
      creatingLibrary: { version: 'fixture' },
      media: {
        track: [
          { '@type': 'General', Format: 'FLAC', Duration: '2.0', Title: 'Synthetic' },
          { '@type': 'Audio', Format: 'FLAC', SamplingRate: '16000', Channels: 1 },
        ],
      },
    },
    'audio',
  );
  expect(r).toMatchObject({
    format: 'FLAC',
    durationSeconds: 2,
    originalSampleRate: 16000,
    channels: 1,
    codec: 'FLAC',
  });
  expect(r.tracks[0].Title).toBe('Synthetic');
  expect(r.limit).toContain('Embedded/container claims');
  expect(() => summarize({ media: { track: [] } }, 'audio')).toThrow('No audio');
  expect(() => summarize({}, 'video')).toThrow('Invalid');
});
test('oversized empty and wrong-kind media fail before any worker', async () => {
  await expect(inspect({ size: 0 }, 'audio')).rejects.toThrow();
  await expect(inspect({ size: 51 * 1024 * 1024 }, 'video')).rejects.toThrow();
  await expect(inspect({ size: 1 }, 'unknown')).rejects.toThrow();
});
test('media worker errors terminate and return no fabricated tracks', async () => {
  let worker;
  global.Worker = class {
    constructor() {
      worker = this;
      this.terminate = jest.fn();
    }
    postMessage() {
      queueMicrotask(() => this.onmessage({ data: { ok: false, error: 'Invalid media bytes' } }));
    }
  };
  await expect(inspect(new Blob(['bytes']), 'audio')).rejects.toThrow('Invalid media');
  expect(worker.terminate).toHaveBeenCalledTimes(1);
  delete global.Worker;
});
