/* Classical ORB correspondences + geometric RANSAC. No model or authenticity verdict. */
(function (root) {
  'use strict';
  function find(cv, pixels, width, height) {
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 32 ||
      height < 32 ||
      width * height > 1024 * 1024 ||
      pixels.length !== width * height * 4
    )
      throw Error('Clone input must be32px or larger and at most1M analysis pixels.');
    const owned = [];
    const own = (x) => {
      owned.push(x);
      return x;
    };
    try {
      const rgba = own(cv.matFromArray(height, width, cv.CV_8UC4, pixels)),
        gray = own(new cv.Mat());
      cv.cvtColor(rgba, gray, cv.COLOR_RGBA2GRAY);
      const detector = own(new cv.ORB()),
        keypoints = own(new cv.KeyPointVector()),
        descriptors = own(new cv.Mat()),
        empty = own(new cv.Mat());
      detector.setMaxFeatures(1200);
      detector.setFastThreshold(12);
      detector.detectAndCompute(gray, empty, keypoints, descriptors);
      const points = Array.from({ length: keypoints.size() }, (_, i) => {
        const k = keypoints.get(i);
        return { x: k.pt.x, y: k.pt.y };
      });
      const base = {
        method: 'ORB-Hamming-ratio-and-homography-RANSAC',
        keypointCount: points.length,
        analysisWidth: width,
        analysisHeight: height,
        models: [],
        note: 'Candidate repeated visual features, not proof of copy-move or authenticity. Natural repeated textures may match. Textureless/small/heavily altered copies can be missed. Classical ORB only; no trained model or network processing.',
      };
      if (points.length < 16) return { ...base, state: 'INSUFFICIENT_FEATURES' };
      const mask = own(cv.Mat.ones(points.length, points.length, cv.CV_8UC1)),
        minDistance = Math.max(32, Math.hypot(width, height) * 0.06);
      for (let i = 0; i < points.length; i++)
        for (let j = 0; j < points.length; j++)
          if (Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y) < minDistance)
            mask.data[i * points.length + j] = 0;
      const matcher = own(new cv.BFMatcher(cv.NORM_HAMMING, false)),
        matches = own(new cv.DMatchVectorVector());
      matcher.knnMatch(descriptors, descriptors, matches, 2, mask, false);
      let pairs = [];
      const seen = new Set();
      for (let i = 0; i < matches.size(); i++) {
        const row = matches.get(i);
        try {
          if (row.size() < 2) continue;
          const a = row.get(0),
            b = row.get(1);
          if (a.distance > 55 || a.distance >= 0.78 * b.distance) continue;
          let p = points[a.queryIdx],
            q = points[a.trainIdx];
          if (p.x > q.x || (p.x === q.x && p.y > q.y)) [p, q] = [q, p];
          const signature = [p.x, p.y, q.x, q.y].map((x) => Math.round(x / 3)).join(':');
          if (seen.has(signature)) continue;
          seen.add(signature);
          pairs.push({ source: p, target: q, hammingDistance: a.distance });
        } finally {
          row.delete();
        }
      }
      base.ratioCandidateCount = pairs.length;
      base.minimumSpatialSeparationPixels = minDistance;
      function bounds(points) {
        return {
          left: Math.min(...points.map((p) => p.x)),
          top: Math.min(...points.map((p) => p.y)),
          right: Math.max(...points.map((p) => p.x)),
          bottom: Math.max(...points.map((p) => p.y)),
        };
      }
      for (let group = 0; group < 3 && pairs.length >= 8; group++) {
        const source = cv.matFromArray(
            pairs.length,
            1,
            cv.CV_32FC2,
            pairs.flatMap((p) => [p.source.x, p.source.y]),
          ),
          target = cv.matFromArray(
            pairs.length,
            1,
            cv.CV_32FC2,
            pairs.flatMap((p) => [p.target.x, p.target.y]),
          ),
          inliers = new cv.Mat();
        let matrix;
        try {
          matrix = cv.findHomography(source, target, cv.RANSAC, 3, inliers);
          if (matrix.empty()) break;
          const selected = pairs.filter((_, i) => inliers.data[i]);
          if (selected.length < 8) break;
          const first = bounds(selected.map((p) => p.source)),
            second = bounds(selected.map((p) => p.target));
          const coefficients = Array.from(matrix.data64F);
          if (coefficients.length !== 9 || coefficients.some((x) => !Number.isFinite(x))) break;
          if ([first, second].some((b) => b.right - b.left < 24 || b.bottom - b.top < 24)) break;
          base.models.push({
            inlierCount: selected.length,
            sourceBounds: first,
            targetBounds: second,
            homography: coefficients,
            pairs: selected.slice(0, 100),
          });
          pairs = pairs.filter((_, i) => !inliers.data[i]);
        } finally {
          source.delete();
          target.delete();
          inliers.delete();
          if (matrix) matrix.delete();
        }
      }
      return {
        ...base,
        state: base.models.length ? 'CANDIDATE_REPEATED_REGIONS' : 'NO_SUPPORTED_GEOMETRIC_MATCH',
      };
    } finally {
      for (let i = owned.length - 1; i >= 0; i--) owned[i].delete();
    }
  }
  const api = { find };
  root.CopyMoveFeatures = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
