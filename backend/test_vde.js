const assert = require('assert');
const path = require('path');
const fs = require('fs');
const vde = require('./services/vde');

// Initialize subdirs to ensure directories are created before testing
vde.initializeVDESubdirs();

console.log('=== RUNNING VDE COMPILER TESTS ===');

function testSingleInheritance() {
  console.log('- Test: Single Inheritance (apple extends minimal)');
  const appleStyle = vde.getStyle('apple', []);
  assert.strictEqual(appleStyle.tokens.colors.background, '#000000', 'Apple background must be #000000');
  assert.strictEqual(appleStyle.tokens.fonts.title, 'SF Pro, Inter', 'Apple must override font');
  assert.strictEqual(appleStyle.dna.philosophy.oneIdeaPerScene, true, 'Apple must inherit philosophy from minimal');
  console.log('  => PASS');
}

function testTraitApplication() {
  console.log('- Test: Trait Application (dark_theme + vertical_video)');
  const compiled = vde.getStyle('minimal', ['dark_theme', 'vertical_video']);
  assert.strictEqual(compiled.tokens.colors.background, '#08080c', 'dark_theme must override background');
  assert.strictEqual(compiled.tokens.spacing.padding, '20px', 'vertical_video must override spacing.padding');
  assert.ok(compiled.grammar.constraints.includes('Maximum of 2 side-by-side elements are allowed due to limited horizontal width.'), 'vertical_video grammar constraints must be merged');
  console.log('  => PASS');
}

function testPermissionsCheck() {
  console.log('- Test: Permissions Check (Locking property from override)');
  // Thêm file cấu hình mock style có _permissions
  const mockStyleDir = path.join(__dirname, 'styles', 'mock_locked');
  if (!fs.existsSync(mockStyleDir)) fs.mkdirSync(mockStyleDir);
  
  fs.writeFileSync(path.join(mockStyleDir, 'extends.txt'), 'minimal');
  fs.writeFileSync(path.join(mockStyleDir, 'tokens.json'), JSON.stringify({
    colors: { background: "#ff0000" },
    _permissions: {
      "tokens.colors.background": { canModify: false }
    }
  }));

  try {
    const compiled = vde.getStyle('mock_locked', ['dark_theme']);
    assert.strictEqual(compiled.tokens.colors.background, '#ff0000', 'Locked background must NOT be modified by trait');
    console.log('  => PASS');
  } finally {
    // Cleanup mock style
    if (fs.existsSync(path.join(mockStyleDir, 'extends.txt'))) fs.unlinkSync(path.join(mockStyleDir, 'extends.txt'));
    if (fs.existsSync(path.join(mockStyleDir, 'tokens.json'))) fs.unlinkSync(path.join(mockStyleDir, 'tokens.json'));
    fs.rmdirSync(mockStyleDir);
  }
}

function testStylePromptOptimization() {
  console.log('- Test: Prompt Optimization (Strips CSS details)');
  const prompt = vde.getStylePrompt('apple', ['vertical_video']);
  assert.ok(prompt.includes('STYLE IDENTITY: "apple"'), 'Should show compiled style identity');
  assert.ok(prompt.includes('Active Traits: vertical_video'), 'Should show active traits');
  assert.ok(!prompt.includes('spacing'), 'Should NOT include CSS spacing details in prompt guidelines');
  assert.ok(!prompt.includes('cardBg'), 'Should NOT include CSS color parameters in prompt guidelines');
  console.log('  => PASS');
}

function testNewBuiltinStyles() {
  console.log('- Test: New VDE Styles (claude & light)');
  const claudeStyle = vde.getStyle('claude', []);
  assert.strictEqual(claudeStyle.tokens.colors.background, '#FBF9F4', 'Claude background must be #FBF9F4');
  assert.strictEqual(claudeStyle.tokens.colors.accent, '#d96b43', 'Claude accent must be clay orange');
  
  const lightStyle = vde.getStyle('light', []);
  assert.strictEqual(lightStyle.tokens.colors.background, '#ffffff', 'Light background must be #ffffff');
  assert.strictEqual(lightStyle.tokens.colors.accent, '#2563eb', 'Light accent must be royal blue');
  console.log('  => PASS');
}

function testRikkeiStyle() {
  console.log('- Test: Rikkei Academy Style (rikkei)');
  const rikkeiStyle = vde.getStyle('rikkei', []);
  assert.strictEqual(rikkeiStyle.tokens.colors.background, '#ffffff', 'Rikkei background must be #ffffff');
  assert.strictEqual(rikkeiStyle.tokens.colors.accent, '#A8232A', 'Rikkei accent must be #A8232A');
  assert.strictEqual(rikkeiStyle.tokens.fonts.title, 'Be Vietnam Pro', 'Rikkei title font must be Be Vietnam Pro');
  console.log('  => PASS');
}

function testAIHubGridStyle() {
  console.log('- Test: AI Hub Grid Style (ai_hub_grid)');
  const aiHubStyle = vde.getStyle('ai_hub_grid', []);
  assert.strictEqual(aiHubStyle.tokens.colors.background, '#030712', 'AI Hub Grid background must be #030712');
  assert.strictEqual(aiHubStyle.tokens.colors.accent, '#3b82f6', 'AI Hub Grid accent must be #3b82f6');
  assert.strictEqual(aiHubStyle.tokens.fonts.title, 'Be Vietnam Pro, sans-serif', 'AI Hub Grid title font must be Be Vietnam Pro');
  console.log('  => PASS');
}

try {
  testSingleInheritance();
  testTraitApplication();
  testPermissionsCheck();
  testStylePromptOptimization();
  testNewBuiltinStyles();
  testRikkeiStyle();
  testAIHubGridStyle();
  console.log('=== ALL TESTS PASSED SUCCESSFULLY ===');
} catch (error) {
  console.error('=== TEST FAILURE ===');
  console.error(error);
  process.exit(1);
}
