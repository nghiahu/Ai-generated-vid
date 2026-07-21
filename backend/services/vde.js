const fs = require('fs');
const path = require('path');
// Path to master theme config in my-video src
const MASTER_THEMES_PATH = path.join(__dirname, '../../my-video/src/styles/vde_themes.json');

let BUILTIN_STYLES = {};
try {
  if (fs.existsSync(MASTER_THEMES_PATH)) {
    BUILTIN_STYLES = JSON.parse(fs.readFileSync(MASTER_THEMES_PATH, 'utf8'));
    console.log('[VDE] Loaded master themes configuration from my-video styles successfully.');
  } else {
    console.warn('[VDE] Master themes file not found at:', MASTER_THEMES_PATH);
  }
} catch (err) {
  console.error('[VDE] Error reading master themes file:', err);
}

const STYLES_DIR = path.join(__dirname, '../styles');

// Helper to deep merge VDE style configurations (basic fallback)
function deepMerge(target, source) {
  const output = { ...target };
  if (target && source && typeof target === 'object' && typeof source === 'object') {
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

// Load a specific component config from filesystem or fallback to built-in
function loadStyleComponent(styleId, componentName) {
  const filePath = path.join(STYLES_DIR, styleId, `${componentName}.json`);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`[VDE] Error parsing VDE file ${filePath}:`, e.message);
    }
  }
  
  // Fallback to built-in
  if (BUILTIN_STYLES[styleId] && BUILTIN_STYLES[styleId][componentName]) {
    return BUILTIN_STYLES[styleId][componentName];
  }
  
  return null;
}

// Load a specific trait config from filesystem
function loadTraitComponent(traitId, componentName) {
  const filePath = path.join(__dirname, '../traits', traitId, `${componentName}.json`);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`[VDE] Error parsing VDE trait file ${filePath}:`, e.message);
    }
  }
  return null;
}

// Check if style configuration exists
function styleExists(styleId) {
  const dirPath = path.join(STYLES_DIR, styleId);
  return fs.existsSync(dirPath) || !!BUILTIN_STYLES[styleId];
}

// Load style inherits/extends property
function getStyleExtends(styleId) {
  // Check local folders
  const extendsFilePath = path.join(STYLES_DIR, styleId, 'extends.txt');
  if (fs.existsSync(extendsFilePath)) {
    return fs.readFileSync(extendsFilePath, 'utf8').trim();
  }
  
  // Try loading DNA file to check for extends field
  const dnaFile = path.join(STYLES_DIR, styleId, 'dna.json');
  if (fs.existsSync(dnaFile)) {
    try {
      const dnaData = JSON.parse(fs.readFileSync(dnaFile, 'utf8'));
      if (dnaData.extends) return dnaData.extends;
    } catch (e) {}
  }
  
  // Fallback to built-in
  if (BUILTIN_STYLES[styleId] && BUILTIN_STYLES[styleId].extends) {
    return BUILTIN_STYLES[styleId].extends;
  }
  
  return null;
}

// Merge source into target with check on accumulated permission locks
function mergeWithPermissions(target, source, permissions = {}, pathPrefix = '') {
  const output = { ...target };
  if (target && source && typeof target === 'object' && typeof source === 'object') {
    Object.keys(source).forEach(key => {
      const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key;
      // If this specific path is locked, we retain target's value and do not merge
      if (permissions[currentPath] && permissions[currentPath].canModify === false) {
        return;
      }
      
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeWithPermissions(target[key], source[key], permissions, currentPath);
        }
      } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
        // Merge arrays without duplicates
        output[key] = Array.from(new Set([...target[key], ...source[key]]));
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

// Accumulate all _permissions properties recursively up the style inheritance tree
function extractPermissions(styleId, accumulated = {}) {
  const baseStyleId = getStyleExtends(styleId);
  if (baseStyleId && styleExists(baseStyleId)) {
    extractPermissions(baseStyleId, accumulated);
  }
  
  const tokensData = loadStyleComponent(styleId, 'tokens');
  if (tokensData && tokensData._permissions) {
    Object.assign(accumulated, tokensData._permissions);
  }
  
  const components = ['dna', 'grammar', 'motion', 'storytelling', 'assets', 'validator'];
  components.forEach(comp => {
    const compData = loadStyleComponent(styleId, comp);
    if (compData && compData._permissions) {
      Object.assign(accumulated, compData._permissions);
    }
  });
  
  return accumulated;
}

// Fully load and resolve VDE style with inheritance and trait composition
function getStyle(styleId, traits = []) {
  let resolvedStyle = {};
  
  // Determine normalized style key matching available styles
  let targetStyleId = styleId.toLowerCase();
  // Handle complex Unsplash style queries mapping back to main VDE keys
  if (!styleExists(targetStyleId)) targetStyleId = "rikkei"; // Default fallback

  // Load inheritance base if specified
  const baseStyleId = getStyleExtends(targetStyleId);
  if (baseStyleId && styleExists(baseStyleId)) {
    resolvedStyle = getStyle(baseStyleId, []);
  }

  // Load local VDE components
  const components = ['dna', 'grammar', 'tokens', 'motion', 'storytelling', 'assets', 'validator'];
  const localStyle = {};
  
  components.forEach(comp => {
    const compData = loadStyleComponent(targetStyleId, comp);
    if (compData) {
      localStyle[comp] = compData;
    }
  });

  // Merge current style into resolved base style
  let compiledStyle = deepMerge(resolvedStyle, localStyle);

  // Extract accumulated permissions
  const permissions = extractPermissions(targetStyleId);

  // Apply traits (Layered Merger)
  if (traits && Array.isArray(traits)) {
    traits.forEach(traitId => {
      components.forEach(comp => {
        const traitCompData = loadTraitComponent(traitId, comp);
        if (traitCompData) {
          if (!compiledStyle[comp]) {
            compiledStyle[comp] = {};
          }
          compiledStyle[comp] = mergeWithPermissions(
            compiledStyle[comp],
            traitCompData,
            permissions,
            comp
          );
        }
      });
    });
  }

  // Inject compilation metadata
  compiledStyle.styleId = targetStyleId;
  compiledStyle.meta = {
    compiledAt: new Date().toISOString(),
    inheritanceChain: baseStyleId ? [baseStyleId, targetStyleId] : [targetStyleId],
    appliedTraits: traits
  };

  return compiledStyle;
}

// Initialize directory structure with default templates if empty
function initializeVDESubdirs() {
  if (!fs.existsSync(STYLES_DIR)) {
    fs.mkdirSync(STYLES_DIR, { recursive: true });
  }
  
  Object.keys(BUILTIN_STYLES).forEach(styleId => {
    const stylePath = path.join(STYLES_DIR, styleId);
    if (!fs.existsSync(stylePath)) {
      fs.mkdirSync(stylePath, { recursive: true });
    }
    
    // Always write/overwrite with master configs to keep everything in sync
    const styleConfig = BUILTIN_STYLES[styleId];
    if (styleConfig.extends) {
      fs.writeFileSync(path.join(stylePath, 'extends.txt'), styleConfig.extends);
    } else if (fs.existsSync(path.join(stylePath, 'extends.txt'))) {
      try {
        fs.unlinkSync(path.join(stylePath, 'extends.txt'));
      } catch (e) {}
    }

    Object.keys(styleConfig).forEach(compName => {
      if (compName !== 'extends' && compName !== 'name' && compName !== 'description') {
        fs.writeFileSync(
          path.join(stylePath, `${compName}.json`), 
          JSON.stringify(styleConfig[compName], null, 2)
        );
      }
    });
    console.log(`[VDE] Synchronized filesystem style configs for "${styleId}"`);
  });
}

// Generate the visual design prompt rules for Gemini API (Pruning technical CSS parameters)
function getStylePrompt(styleId, traits = []) {
  const style = getStyle(styleId, traits);
  
  // Extract high-level conceptual rules and constraints
  const optimizedDNA = {
    tone: style.dna?.tone,
    description: style.dna?.description,
    philosophy: style.dna?.philosophy
  };
  
  const optimizedGrammar = {
    constraints: style.grammar?.constraints || []
  };

  const optimizedMotion = {
    energy: style.motion?.energy || "low",
    style: style.motion?.style || [],
    avoid: style.motion?.avoid || []
  };

  return `
- STYLE IDENTITY: "${style.styleId}" (Inheritance: ${style.meta?.inheritanceChain.join(' -> ')}, Active Traits: ${traits.join(', ') || 'none'})
- VISUAL PHILOSOPHY & TONE:
  * Tone: ${optimizedDNA.tone || "clean, minimal"}
  * Description: ${optimizedDNA.description || ""}
  * One idea per scene: ${optimizedDNA.philosophy?.oneIdeaPerScene ? "YES (Strict)" : "NO (Flexible)"}
  * Minimalism level: ${(optimizedDNA.philosophy?.minimalism || 1.0) * 100}%
  * Clarity priority: ${(optimizedDNA.philosophy?.clarity || 1.0) * 100}%

- LAYOUT GRAMMAR CONSTRAINTS (Crucial for UI placement):
  ${optimizedGrammar.constraints.map(c => `* ${c}`).join('\n  ')}

- MOTION LANGUAGE:
  * Energy: ${optimizedMotion.energy}
  * Preferred transitions: ${JSON.stringify(optimizedMotion.style)}
  * Strictly avoid: ${JSON.stringify(optimizedMotion.avoid)}

- STORYTELLING & ASSET SELECTION:
  * Pacing: ${style.storytelling?.pacing || "steady"}
  * Average Scene Duration: ${style.storytelling?.averageSceneDuration || 6}s
  * Preferred assets: ${JSON.stringify(style.assets?.preferred || [])}
  * Avoid assets: ${JSON.stringify(style.assets?.avoid || [])}
`;
}

// Export functions
module.exports = {
  getStyle,
  getStylePrompt,
  initializeVDESubdirs,
  BUILTIN_STYLES
};
