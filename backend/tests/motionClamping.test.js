const test = require('node:test');
const assert = require('node:assert');
const { clampMotionParameters } = require('../services/astValidator');

test('Should clamp out-of-bounds spring config values to safe defaults', () => {
  const tsx = `
    import React from 'react';
    import { spring } from 'remotion';
    
    export const TestComponent = () => {
      const val = spring({ frame: 0, fps: 30, config: { damping: 500, stiffness: 900 } });
      return <div>{val}</div>;
    };
  `;
  const repaired = clampMotionParameters(tsx);
  
  // Damping should be clamped to 14, stiffness to 55
  assert.match(repaired, /damping:\s*14/);
  assert.match(repaired, /stiffness:\s*55/);
});

test('Should keep in-bounds spring config values unchanged', () => {
  const tsx = `
    import React from 'react';
    import { spring } from 'remotion';
    
    export const TestComponent = () => {
      const val = spring({ frame: 0, fps: 30, config: { damping: 15, stiffness: 60 } });
      return <div>{val}</div>;
    };
  `;
  const repaired = clampMotionParameters(tsx);
  assert.match(repaired, /damping:\s*15/);
  assert.match(repaired, /stiffness:\s*60/);
});

test('Should clamp out-of-bounds fontSize values to 12px / 12', () => {
  const tsx = `
    import React from 'react';
    
    export const TestComponent = () => {
      return (
        <div style={{ display: 'flex' }}>
          <span style={{ fontSize: 9 }}>Short text</span>
          <p style={{ fontSize: '10px' }}>Another text</p>
          <h1 style={{ fontSize: 48 }}>Valid heading</h1>
        </div>
      );
    };
  `;
  const repaired = clampMotionParameters(tsx);
  assert.match(repaired, /fontSize:\s*12/);
  assert.match(repaired, /fontSize:\s*["']12px["']/);
  assert.match(repaired, /fontSize:\s*48/);
});

