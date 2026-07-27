const test = require('node:test');
const assert = require('node:assert');

test('Sanity check for Node test runner', () => {
  assert.strictEqual(1 + 1, 2);
});
