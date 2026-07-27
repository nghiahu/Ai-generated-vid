const test = require('node:test');
const assert = require('node:assert');
const { validateTSXCode } = require('../services/astValidator');

test('Should reject code with missing GeneratedScene export', () => {
  const code = `import React from 'react'; export const MyComp = () => null;`;
  const result = validateTSXCode(code);
  assert.strictEqual(result.isValid, false);
  assert.match(result.error, /Missing default export or GeneratedScene/);
});

test('Should reject code importing forbidden packages', () => {
  const code = `import React from 'react'; import fs from 'fs'; export default function GeneratedScene() { return null; }`;
  const result = validateTSXCode(code);
  assert.strictEqual(result.isValid, false);
  assert.match(result.error, /Forbidden import: fs/);
});

test('Should reject code using security-risk features like eval', () => {
  const code = `import React from 'react'; export default function GeneratedScene() { eval('1+1'); return null; }`;
  const result = validateTSXCode(code);
  assert.strictEqual(result.isValid, false);
  assert.match(result.error, /Forbidden security statement: eval/);
});

test('Should reject negative Sequence starts in Remotion', () => {
  const code = `
    import React from 'react';
    import { Sequence } from 'remotion';
    export default function GeneratedScene() {
      return <Sequence from={-10} durationInFrames={30}><div>Test</div></Sequence>;
    }
  `;
  const result = validateTSXCode(code);
  assert.strictEqual(result.isValid, false);
  assert.match(result.error, /Sequence "from" frame must be non-negative/);
});
