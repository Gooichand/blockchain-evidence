const fs = require('fs');
const vm = require('vm');
const path = require('path');
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/forensic-lab.js'), 'utf8'), { window });
const tools = window.ForensicLab.catalog.find(category => category.id === 'hash').tools;
test('all five hash tools have short usage guides with purpose, steps and limits', () => {
  expect(tools).toHaveLength(5);
  for (const tool of tools) {
    expect(typeof tool.guide).toBe('string');
    expect(tool.guide.startsWith('This tool')).toBe(true);
    expect(tool.guide.split(/[.!?]+/).filter(text => text.trim())).toHaveLength(3);
    expect(tool.guide).toMatch(/click/i);
    expect(tool.guide).toMatch(/does not|do not|cannot|not prove|not be used/);
  }
});
test('other catalog entries stay unchanged without guides', () => {
  for (const category of window.ForensicLab.catalog.filter(category => category.id !== 'hash')) {
    expect(category.tools.every(tool => tool.guide === undefined)).toBe(true);
  }
});
test('guides describe exact inputs and distinguish verification outcomes', () => {
  const guide = id => tools.find(tool => tool.id === id).guide;
  expect(guide('hash-compare')).toContain('same algorithm');
  expect(guide('integrity-check')).toContain('64-character');
  expect(guide('multi-hash')).toContain('MD5');
  expect(guide('blockchain-verify')).toMatch(/ANCHORED.*NOT FOUND.*unavailable/);
  expect(guide('blockchain-verify')).toContain('read-only');
});
