const { ready, reasons } = require('../public/ai-readiness');
test('all four AI tools disclose unavailable dependencies rather than fabricated outputs', () => {
  expect(ready()).toBe(false);
  expect(Object.keys(reasons)).toHaveLength(4);
  for (const reason of Object.values(reasons)) expect(reason).toContain('No ');
});
