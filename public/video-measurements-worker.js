/* Decode every supported video sample locally. No seeking approximation or network. */
'use strict';
importScripts('/vendor/mp4box-0.5.4.min.js', '/video-measurements.js');
const outOfProfile = (m) => {
  const e = Error(m);
  e.outOfProfile = true;
  return e;
};
self.onmessage = async ({ data }) => {
  let decoder;
  try {
    if (!(data.file instanceof Blob) || data.file.size > 50 * 1024 * 1024)
      throw outOfProfile('Video limit50MiB.');
    if (!self.VideoDecoder || !self.OffscreenCanvas)
      throw outOfProfile('WebCodecs and OffscreenCanvas required.');
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
      throw outOfProfile('One nonfragmented MP4 video track, maximum10minutes required.');
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
      throw outOfProfile(
        'Require1-2000 MP4/H264 samples, first sample sync, one unencrypted AVC description.',
      );
    if (track.video.width * track.video.height > 16777216) throw outOfProfile('16MP decoded frame limit.');
    if (entry[0].pasp && entry[0].pasp.hSpacing !== entry[0].pasp.vSpacing)
      throw outOfProfile('Non-square pixels unsupported.');
    const identity = [65536, 0, 0, 0, 65536, 0, 0, 0, 1073741824];
    if (track.matrix && Array.from(track.matrix).some((x, i) => x !== identity[i]))
      throw outOfProfile('Rotated/transformed display matrix unsupported.');
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
        throw outOfProfile('Only one rate1 edit and optional leading empty edit supported.');
      shift =
        (empty[0]?.segment_duration || 0) / info.timescale - media[0].media_time / track.timescale;
    }
    // Validate every AVCC length-delimited NAL before decoder concealment can hide a broken length.
    const lengthSize = (entry[0].avcC.lengthSizeMinusOne ?? 3) + 1;
    if (![1, 2, 4].includes(lengthSize)) throw outOfProfile('Unsupported AVC NAL length field.');
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
      throw outOfProfile('Browser AVC configuration unsupported.');
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
          if (data.thumbnails !== false && (row.s.is_sync || visualChange) && thumbs.length < 100) {
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
    // Validate every supported audio stream sample-by-sample. A damaged supported
    // stream fails the whole analysis; an unsupported codec is reported, not passed.
    const audioStreams = [];
    for (const atrack of info.audioTracks || []) {
      const asamples = parser.getTrackSamplesInfo(atrack.id) || [],
        aentries = parser.getTrackById(atrack.id).mdia.minf.stbl.stsd.entries,
        stream = {
          trackId: atrack.id,
          codec: atrack.codec,
          durationSeconds: atrack.duration / atrack.timescale,
          sampleCount: asamples.length,
        };
      if (!asamples.length || asamples.length > 40000)
        throw outOfProfile('Audio track must have1-40000 samples.');
      const astamps = new Set(),
        aranges = [];
      for (const s of asamples) {
        const stamp = Math.round((s.cts / atrack.timescale) * 1e6);
        if (
          astamps.has(stamp) ||
          s.size <= 0 ||
          s.offset < 0 ||
          s.offset + s.size > bytes.byteLength
        )
          throw Error('Duplicate timestamp or truncated audio sample.');
        astamps.add(stamp);
        aranges.push([s.offset, s.offset + s.size]);
      }
      aranges.sort((a, b) => a[0] - b[0]);
      if (aranges.some((r, i) => i && r[0] < aranges[i - 1][1]))
        throw Error('Overlapping audio sample byte ranges.');
      const aconfig = { codec: atrack.codec };
      // WebCodecs wants the DecSpecificInfo (AudioSpecificConfig), not the whole esds box,
      // and Chrome requires explicit sampleRate/numberOfChannels: parse them from the ASC
      // (the sample entry can disagree with the actual stream).
      if (atrack.codec.startsWith('mp4a.')) {
        const esd = aentries[0] && aentries[0].esds && aentries[0].esds.esd,
          dcd = esd && (esd.descs || []).find((d) => d.tag === 4),
          dsi = dcd && (dcd.descs || []).find((d) => d.tag === 5),
          asc = dsi && dsi.data && Uint8Array.from(dsi.data);
        if (asc && asc.length >= 2) {
          aconfig.description = asc.buffer;
          const RATES = [
              96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000,
              7350,
            ],
            bits = asc.reduce((a, b) => a + b.toString(2).padStart(8, '0'), ''),
            objectType = parseInt(bits.slice(0, 5), 2);
          let freqIndex = parseInt(bits.slice(5, 9), 2),
            rate = RATES[freqIndex] || 0;
          if (freqIndex === 15) rate = parseInt(bits.slice(9, 33), 2);
          const chanConfig = parseInt(bits.slice(9 + (freqIndex === 15 ? 24 : 0), 13 + (freqIndex === 15 ? 24 : 0)), 2);
          if (!rate) throw outOfProfile('Unparseable AAC AudioSpecificConfig.');
          aconfig.sampleRate = rate;
          aconfig.numberOfChannels =
            chanConfig || (atrack.audio && atrack.audio.channel_count) || 0;
          if (bits.slice(16).includes('01010110111') && objectType === 2)
            aconfig.codec = 'mp4a.40.5';
          if (!aconfig.numberOfChannels) throw outOfProfile('AAC channel layout unsupported.');
        } else {
          aconfig.sampleRate = atrack.audio && atrack.audio.sample_rate;
          aconfig.numberOfChannels = atrack.audio && atrack.audio.channel_count;
        }
      } else {
        aconfig.sampleRate = atrack.audio && atrack.audio.sample_rate;
        aconfig.numberOfChannels = atrack.audio && atrack.audio.channel_count;
      }
      if (!self.AudioDecoder || !(await AudioDecoder.isConfigSupported(aconfig)).supported) {
        audioStreams.push({
          ...stream,
          validation: 'NOT VALIDATED',
          reason: 'Browser does not support this audio codec; this stream was not decoded.',
        });
        continue;
      }
      let aerror,
        decodedFrames = 0,
        actualRate = 0,
        actualChannels = 0;
      const aseen = new Set(),
        adecoder = new AudioDecoder({
          output(frame) {
            if (aseen.has(frame.timestamp)) aerror = Error('Duplicate decoded audio timestamp.');
            aseen.add(frame.timestamp);
            decodedFrames += frame.numberOfFrames;
            actualRate = frame.sampleRate;
            actualChannels = frame.numberOfChannels;
            frame.close();
          },
          error(e) {
            aerror = e;
          },
        });
      try {
        adecoder.configure(aconfig);
        for (const s of asamples) {
          if (aerror) throw aerror;
          adecoder.decode(
            new EncodedAudioChunk({
              type: 'key',
              timestamp: Math.round((s.cts / atrack.timescale) * 1e6),
              duration: Math.round((s.duration / atrack.timescale) * 1e6),
              data: new Uint8Array(bytes, s.offset, s.size),
            }),
          );
          if (adecoder.decodeQueueSize > 32)
            await new Promise((resolve) =>
              adecoder.addEventListener('dequeue', resolve, { once: true }),
            );
        }
        await adecoder.flush();
        if (aerror) throw aerror;
        if (aseen.size !== asamples.length)
          throw Error('Not every audio sample decoded exactly once.');
        audioStreams.push({
          ...stream,
          validation: 'DECODED_ALL',
          sampleRate: actualRate,
          channels: actualChannels,
          decodedSampleFrames: decodedFrames,
        });
      } finally {
        if (adecoder.state !== 'closed') adecoder.close();
      }
    }
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
        audioStreams,
        ignoredOtherTrackCount: info.tracks.length - 1 - audioStreams.length,
        thumbnails,
      },
    });
  } catch (e) {
    self.postMessage({
      ok: false,
      error: e.message || 'All-frame video analysis failed.',
      outOfProfile: !!e.outOfProfile,
    });
  } finally {
    if (decoder && decoder.state !== 'closed') decoder.close();
  }
};
