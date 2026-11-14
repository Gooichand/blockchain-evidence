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
