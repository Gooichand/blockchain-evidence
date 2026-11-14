const C = require('../public/concealed-text');
const O = {
  save: 1,
  restore: 2,
  setTextRenderingMode: 3,
  setFillRGBColor: 4,
  setFillGray: 5,
  setGState: 6,
  showText: 7,
  showSpacedText: 8,
};
const text = (s) => [[...s].map((unicode) => ({ unicode }))];
test('graphics state tracks fill/opacity/rendering mode and restore without dropping text', () => {
  const list = {
    fnArray: [4, 1, 6, 3, 7, 2, 7],
    argsArray: [[255, 255, 255], [], [[['ca', 0]]], [3], text('hidden'), [], text('restored')],
  };
  const r = C.operators(list, O);
  expect(r).toHaveLength(2);
  expect(r[0]).toMatchObject({ alpha: 0, mode: 3 });
  expect(r[1]).toMatchObject({ alpha: 1, mode: 0, fill: [255, 255, 255] });
});
function image(dark) {
  return {
    width: 100,
    height: 100,
    data: Uint8ClampedArray.from({ length: 40000 }, (_, i) => (i % 4 === 3 ? 255 : dark ? 0 : 255)),
  };
}
const viewport = { transform: [1, 0, 0, -1, 0, 100] },
  item = { str: 'text', width: 30, height: 10, transform: [10, 0, 0, 10, 20, 50] };
test('white text needs actual rendered white background, not merely white fill', () => {
  const op = { text: 'text', mode: 0, fill: [255, 255, 255], alpha: 1 };
  expect(
    C.classify([op], { items: [item] }, image(false), viewport).candidates[0].signals,
  ).toContain('WHITE_TEXT_ON_RENDERED_WHITE_REGION');
  expect(C.classify([op], { items: [item] }, image(true), viewport).candidates).toHaveLength(0);
});
test('invisible and alpha signals do not need guessed bounds; unmatched mappings disclosed', () => {
  const op = { text: 'notmapped', mode: 3, fill: [255, 255, 255], alpha: 0 };
  const r = C.classify([op], { items: [] }, image(false), viewport);
  expect(r.candidates[0].signals).toContain('INVISIBLE_TEXT_RENDERING_MODE');
  expect(r.unmatchedPotentialSignals).toHaveLength(1);
  expect(r.candidates[0].renderedBounds).toBeNull();
});
test('off-page text, skew and empty region bounds are handled', () => {
  const off = { ...item, transform: [10, 0, 0, 10, 20, -40] };
  const r = C.classify(
    [{ text: 'text', mode: 0, fill: [0, 0, 0], alpha: 1 }],
    { items: [off] },
    image(false),
    viewport,
  );
  expect(r.candidates[0].signals).toContain('OUTSIDE_RENDERED_PAGE');
  expect(C.region(image(false), { left: -20, right: -10, top: 0, bottom: 10 })).toBeNull();
});

test('nested opacity/render-mode state restores without contaminating visible text', () => {
  const r = C.operators(
    {
      fnArray: [1, 6, 1, 3, 7, 2, 7, 2, 7],
      argsArray: [
        [],
        [[['ca', 0]]],
        [],
        [3],
        text('inner'),
        [],
        text('outer'),
        [],
        text('visible'),
      ],
    },
    O,
  );
  expect(r.map((x) => [x.text, x.alpha, x.mode])).toEqual([
    ['inner', 0, 3],
    ['outer', 0, 0],
    ['visible', 1, 0],
  ]);
});
test('large operator list is rejected before output, not treated as clean', () => {
  expect(() => C.operators({ fnArray: Array(200001).fill(7), argsArray: [] }, O)).toThrow(
    'operator limit',
  );
});
test('visible black text on white background is a negative, not suspicious merely because region is white', () => {
  const r = C.classify(
    [{ text: 'text', mode: 0, fill: [0, 0, 0], alpha: 1 }],
    { items: [item] },
    image(false),
    viewport,
  );
  expect(r.candidates).toHaveLength(0);
});

const O2 = {
  ...O,
  transform: 12,
  constructPath: 91,
  clip: 29,
  eoClip: 30,
  endPath: 28,
  fill: 22,
  eoFill: 23,
  fillStroke: 24,
  eoFillStroke: 25,
};
test('clip correlation flags text whose box center lies outside the clip rect', () => {
  const ops = {
    fnArray: [91, 29, 7],
    argsArray: [
      [[19], [10, 10, 20, 20]],
      null,
      text('clipped away'),
    ],
  };
  const v = { transform: [1, 0, 0, 1, 0, 0] };
  const out = C.operators(ops, O2, v);
  expect(out[0].clips).toHaveLength(1);
  const r = C.classify(
    out,
    { items: [{ str: 'clipped away', width: 30, height: 10, transform: [10, 0, 0, 10, 200, 50] }] },
    image(false),
    v,
  );
  expect(r.candidates[0].signals).toContain('CLIPPED_OUTSIDE_CLIP_REGION');
});
test('a later opaque fill covering the text box flags overpaint; earlier paint does not', () => {
  const v = { transform: [1, 0, 0, 1, 0, 0] };
  const ops = {
    fnArray: [7, 91, 22],
    argsArray: [text('covered'), [[19], [15, 45, 40, 15]], null],
  };
  const out = C.operators(ops, O2, v);
  expect(out.paintEvents).toHaveLength(1);
  const r = C.classify(
    out,
    { items: [{ str: 'covered', width: 30, height: 10, transform: [10, 0, 0, 10, 20, 50] }] },
    image(false),
    v,
  );
  expect(r.candidates[0].signals).toContain('OVERPAINTED_BY_LATER_FILL');
  const earlier = {
    fnArray: [91, 22, 7],
    argsArray: [[[19], [15, 45, 40, 15]], null, text('covered')],
  };
  const r2 = C.classify(
    C.operators(earlier, O2, v),
    { items: [{ str: 'covered', width: 30, height: 10, transform: [10, 0, 0, 10, 20, 50] }] },
    image(false),
    v,
  );
  expect(r2.candidates).toHaveLength(0);
});
test('glyph runs without unicode mapping are disclosed, never claimed visible or hidden', () => {
  const ops = { fnArray: [7], argsArray: [[[ {unicode:null}, {unicode:null} ]]] };
  const out = C.operators(ops, O2, { transform: [1, 0, 0, 1, 0, 0] });
  expect(out[0].unmappedGlyphs).toBe(2);
  const r = C.classify(out, { items: [] }, image(false), { transform: [1, 0, 0, 1, 0, 0] });
  expect(r.candidates).toHaveLength(0);
  expect(r.unmappedTextOperators).toHaveLength(1);
  expect(r.unmappedTextOperators[0].reason).toContain('no printable Unicode mapping');
});
