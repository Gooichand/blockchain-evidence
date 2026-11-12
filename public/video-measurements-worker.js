/* Decode every supported video sample locally. No seeking approximation or network. */
'use strict';
importScripts('/vendor/mp4box-0.5.4.min.js', '/video-measurements.js');
self.onmessage = async ({ data }) => {
  let decoder;
  try {
    if (!(data.file instanceof Blob) || data.file.size > 50 * 1024 * 1024)
      throw Error('Video limit50MiB.');
    if (!self.VideoDecoder || !self.OffscreenCanvas)
      throw Error('WebCodecs and OffscreenCanvas required.');
    const bytes = await data.file.arrayBuffer(),
      parser = MP4Box.createFile();
    let info, parseError;
    parser.onReady = (i) => (info = i);
    parser.onError = () => (parseError = true);
    bytes.fileStart = 0;
    parser.appendBuffer(bytes);
    parser.flush();
    if (
      parseError ||
      !info ||
      info.isFragmented ||
      info.videoTracks.length !== 1 ||
      info.duration / info.timescale > 600
    )
      throw Error('One nonfragmented MP4 video track, maximum10minutes required.');
    const track = info.videoTracks[0],
      samples = parser.getTrackSamplesInfo(track.id) || [],
      entry = parser.getTrackById(track.id).mdia.minf.stbl.stsd.entries;
    if (
      !samples.length ||
      samples.length > 2000 ||
      !samples[0].is_sync ||
      !track.codec.startsWith('avc1.') ||
      entry.length !== 1 ||
      !entry[0].avcC ||
      entry[0].sinf
    )
      throw Error(
        'Require1-2000 MP4/H264 samples, first sample sync, one unencrypted AVC description.',
      );
    if (track.video.width * track.video.height > 16777216) throw Error('16MP decoded frame limit.');
    if (entry[0].pasp && entry[0].pasp.hSpacing !== entry[0].pasp.vSpacing)
      throw Error('Non-square pixels unsupported.');
    const identity = [65536, 0, 0, 0, 65536, 0, 0, 0, 1073741824];
    if (track.matrix && Array.from(track.matrix).some((x, i) => x !== identity[i]))
      throw Error('Rotated/transformed display matrix unsupported.');
    let shift = 0;
    const edits = track.edits || [];
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
        throw Error('Only one rate1 edit and optional leading empty edit supported.');
      shift =
        (empty[0]?.segment_duration || 0) / info.timescale - media[0].media_time / track.timescale;
    }
    // Validate every AVCC length-delimited NAL before decoder concealment can hide a broken length.
    const lengthSize = (entry[0].avcC.lengthSizeMinusOne ?? 3) + 1;
    if (![1, 2, 4].includes(lengthSize)) throw Error('Unsupported AVC NAL length field.');
    for (const sample of samples) {
      if (sample.offset < 0 || sample.offset + sample.size > bytes.byteLength)
        throw Error('Truncated sample.');
      const view = new Uint8Array(bytes, sample.offset, sample.size);
      let offset = 0;
      while (offset < view.length) {
        if (offset + lengthSize > view.length) throw Error('Truncated NAL length.');
        let size = 0;
        for (let j = 0; j < lengthSize; j++) size = size * 256 + view[offset++];
        if (!size || offset + size > view.length) throw Error('Invalid/truncated AVC NAL.');
        if (view[offset] & 128) throw Error('Invalid forbidden AVC NAL bit.');
        offset += size;
      }
    }
    const stamps = new Map();
    const ranges = [];
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i],
        stamp = Math.round((s.cts / track.timescale) * 1e6);
      if (
        stamps.has(stamp) ||
        s.size <= 0 ||
        s.duration <= 0 ||
        s.offset < 0 ||
        s.offset + s.size > bytes.byteLength ||
        s.description_index !== 0
      )
        throw Error('Duplicate timestamp, truncated sample or changed description.');
      stamps.set(stamp, { s, index: i });
      ranges.push([s.offset, s.offset + s.size]);
    }
    ranges.sort((a, b) => a[0] - b[0]);
    if (ranges.some((r, i) => i && r[0] < ranges[i - 1][1]))
      throw Error('Overlapping video sample byte ranges.');
    const avc = entry[0].avcC,
      config = {
        codec: track.codec,
        codedWidth: track.video.width,
        codedHeight: track.video.height,
        description: bytes.slice(avc.start + 8, avc.start + avc.size),
        hardwareAcceleration: 'prefer-software',
      };
    if (!(await VideoDecoder.isConfigSupported(config)).supported)
      throw Error('Browser AVC configuration unsupported.');
    const canvas = new OffscreenCanvas(32, 18),
      ctx = canvas.getContext('2d', { willReadFrequently: true }),
      frames = [],
      seen = new Set(),
      thumbs = [];
    let error, previousMeasure;
    decoder = new VideoDecoder({
      output(frame) {
        try {
          const row = stamps.get(frame.timestamp);
          if (!row || seen.has(frame.timestamp))
            throw Error('Unexpected/duplicate decoded frame timestamp.');
          seen.add(frame.timestamp);
          ctx.drawImage(frame, 0, 0, 32, 18);
          const measure = VideoMeasurements.pixels(ctx.getImageData(0, 0, 32, 18).data);
          frames.push({
            seconds: row.s.cts / track.timescale,
            duration: row.s.duration / track.timescale,
            sampleNumber: row.index + 1,
            isSync: row.s.is_sync,
            measure,
          });
          const delta = previousMeasure
            ? VideoMeasurements.difference(measure, previousMeasure)
            : null;
          const visualChange =
            !previousMeasure ||
            (delta.meanAbsoluteRGBDifference >= 0.22 && delta.histogramDistance >= 0.22);
          previousMeasure = measure;
          // Bounded sync/abrupt-change thumbnails; no full-resolution retention.
          if ((row.s.is_sync || visualChange) && thumbs.length < 100) {
            const scale = Math.min(1, 160 / Math.max(frame.displayWidth, frame.displayHeight)),
              c = new OffscreenCanvas(
                Math.max(1, Math.round(frame.displayWidth * scale)),
                Math.max(1, Math.round(frame.displayHeight * scale)),
              );
            c.getContext('2d').drawImage(frame, 0, 0, c.width, c.height);
            thumbs.push({
              kind: visualChange ? 'VISUAL_SEGMENT_START' : 'SYNC_SAMPLE',
              sampleNumber: row.index + 1,
              seconds: row.s.cts / track.timescale + shift,
              canvas: c,
            });
          }
        } catch (e) {
          error = e;
        } finally {
          frame.close();
        }
      },
      error(e) {
        error = e;
      },
    });
    decoder.configure(config);
    for (const s of samples) {
      if (error) throw error;
      decoder.decode(
        new EncodedVideoChunk({
          type: s.is_sync ? 'key' : 'delta',
          timestamp: Math.round((s.cts / track.timescale) * 1e6),
          duration: Math.round((s.duration / track.timescale) * 1e6),
          data: new Uint8Array(bytes, s.offset, s.size),
        }),
      );
      if (decoder.decodeQueueSize > 16)
        await new Promise((resolve) =>
          decoder.addEventListener('dequeue', resolve, { once: true }),
        );
    }
    await decoder.flush();
    if (error) throw error;
    if (seen.size !== samples.length) throw Error('Not every sample decoded exactly once.');
    const result = VideoMeasurements.analyze(frames, samples, shift),
      thumbnails = [];
    for (const t of thumbs)
      thumbnails.push({
        kind: t.kind,
        sampleNumber: t.sampleNumber,
        seconds: t.seconds,
        blob: await t.canvas.convertToBlob({ type: 'image/png' }),
      });
    self.postMessage({
      ok: true,
      result: {
        ...result,
        codec: track.codec,
        durationSeconds: info.duration / info.timescale,
        width: track.video.width,
        height: track.video.height,
        editShiftSeconds: shift,
        ignoredNonVideoTrackCount: info.tracks.length - 1,
        thumbnails,
      },
    });
  } catch (e) {
    self.postMessage({ ok: false, error: e.message || 'All-frame video analysis failed.' });
  } finally {
    if (decoder && decoder.state !== 'closed') decoder.close();
  }
};
