const test = require('node:test');
const assert = require('node:assert');
const { compileTSX, validateCompiledJS } = require('../services/aiGen');

test('Should fail compiled validation for empty or invalid JS', () => {
  const result = validateCompiledJS("");
  assert.strictEqual(result.isValid, false);
  assert.match(result.error, /Compiled JS is empty/);
});

test('Should compile and successfully validate a standard component', () => {
  const tsx = `
    import React from 'react';
    export const GeneratedScene = () => <div>Hello</div>;
    export default GeneratedScene;
  `;
  const compiled = compileTSX(tsx);
  const result = validateCompiledJS(compiled);
  assert.strictEqual(result.isValid, true);
});
