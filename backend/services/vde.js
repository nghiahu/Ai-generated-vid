const fs = require('fs');
const path = require('path');

// Default built-in VDE Style specifications to guarantee absolute stability
const BUILTIN_STYLES = {
  minimal: {
    dna: {
      philosophy: { oneIdeaPerScene: true, clarity: 1.0, minimalism: 0.95 },
      tone: "clean, premium, highly focused, silent space",
      description: "Tập trung tối đa vào thông tin chính, loại bỏ mọi chi tiết thừa thãi. Không gian trống đóng vai trò quan trọng."
    },
    grammar: {
      nodes: ["primary_focus", "supporting_text", "background_element"],
      constraints: [
        "Only one dominant visual focus is allowed per scene.",
        "Whitespace must occupy at least 45% of the viewport.",
        "Supporting text must never visually dominate the title."
      ]
    },
    tokens: {
      colors: {
        background: "#080b11",
        cardBg: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
        border: "rgba(255, 255, 255, 0.1)",
        accent: "#3b82f6",
        text: "#ffffff",
        textSecondary: "rgba(255,255,255,0.6)"
      },
      fonts: {
        title: "Montserrat",
        body: "Inter"
      },
      spacing: { padding: "40px", gap: "24px" },
      radius: "20px",
      shadow: "0 10px 30px rgba(0,0,0,0.5)"
    },
    motion: {
      energy: "low",
      style: ["fade", "opacity", "scale-in"],
      avoid: ["bounce", "spin", "shake", "flash", "glitch"]
    },
    storytelling: {
      scenePattern: ["hook", "reveal", "feature", "benefit", "ending"],
      pacing: "steady",
      averageSceneDuration: 6
    },
    assets: {
      preferred: ["product_render", "ui_mockup", "outline_icon"],
      avoid: ["anime", "sticker", "meme", "cartoon"]
    },
    validator: {
      rules: [
        { rule: "Only one dominant focus", severity: "error" },
        { rule: "Whitespace > 45%", severity: "warning" }
      ]
    }
  },
  apple: {
    extends: "minimal",
    dna: {
      philosophy: { oneIdeaPerScene: true, clarity: 1.0, minimalism: 0.98 },
      tone: "premium, sleek, presentation keynote, luxury",
      description: "Thiết kế dạng slide ra mắt sản phẩm của Apple: chữ trắng cực lớn trên nền đen tuyền, tối giản tuyệt đối."
    },
    tokens: {
      colors: {
        background: "#000000",
        cardBg: "rgba(255, 255, 255, 0.03)",
        border: "rgba(255, 255, 255, 0.08)",
        accent: "#ffffff",
        text: "#ffffff",
        textSecondary: "#86868b"
      },
      fonts: {
        title: "SF Pro, Inter",
        body: "SF Pro, Inter"
      },
      radius: "28px",
      shadow: "none"
    },
    motion: {
      energy: "very_low",
      style: ["fade", "opacity", "mask_reveal"]
    }
  },
  cyberpunk: {
    extends: "minimal",
    dna: {
      philosophy: { oneIdeaPerScene: false, clarity: 0.8, minimalism: 0.4 },
      tone: "high energy, futuristic, neon cyberpunk, data-rich",
      description: "Thế giới tương lai ngập tràn ánh sáng neon, dữ liệu chạy liên tục, chữ phát sáng rực rỡ."
    },
    grammar: {
      nodes: ["primary_focus", "supporting_text", "statistic", "technical_grid"],
      constraints: [
        "High energy and high contrast are preferred.",
        "Allow glowing visual noise and technical UI elements in the background."
      ]
    },
    tokens: {
      colors: {
        background: "#030008",
        cardBg: "linear-gradient(135deg, rgba(255,0,128,0.08) 0%, rgba(0,229,255,0.03) 100%)",
        border: "rgba(0, 229, 255, 0.25)",
        accent: "#ff007f",
        accentSecondary: "#00e5ff",
        text: "#ffffff",
        textSecondary: "rgba(255, 255, 255, 0.7)"
      },
      fonts: {
        title: "Orbitron, Montserrat",
        body: "Share Tech Mono, Inter"
      },
      radius: "8px",
      shadow: "0 0 25px rgba(0, 229, 255, 0.3)"
    },
    motion: {
      energy: "high",
      style: ["slide-up", "glitch", "scale-in"],
      avoid: ["fade"]
    },
    assets: {
      preferred: ["technical_grid", "hacker_terminal", "neon_device"]
    }
  },
  anime: {
    extends: "minimal",
    dna: {
      philosophy: { oneIdeaPerScene: true, clarity: 0.9, minimalism: 0.7 },
      tone: "vibrant, creative, sketch, hand-drawn comic",
      description: "Phong cách truyện tranh/hoạt hình Nhật Bản với các mảng màu tươi tắn, nét vẽ thô phác họa viền đen đậm."
    },
    tokens: {
      colors: {
        background: "#fdf8f5",
        cardBg: "#ffffff",
        border: "#000000",
        accent: "#ff6b6b",
        text: "#1e1e24",
        textSecondary: "#5a5a66"
      },
      fonts: {
        title: "Outfit, Comic Sans MS",
        body: "Outfit, Inter"
      },
      radius: "16px",
      shadow: "6px 6px 0px #000000"
    },
    motion: {
      energy: "medium",
      style: ["scale-in", "bounce"]
    }
  },
  claude: {
    extends: "minimal",
    dna: {
      philosophy: { oneIdeaPerScene: true, clarity: 0.95, minimalism: 0.9 },
      tone: "warm editorial, premium publishing, claude beige, cozy scholarly",
      description: "Phong cách biên tập báo chí cổ điển của Anthropic Claude: nền cát ấm, tiêu đề có chân chữ lớn, màu nhấn cam đất sét ấm áp."
    },
    tokens: {
      colors: {
        background: "#FBF9F4",
        cardBg: "rgba(217, 107, 67, 0.03)",
        border: "rgba(217, 107, 67, 0.15)",
        accent: "#d96b43",
        text: "#191919",
        textSecondary: "#6b655f"
      },
      fonts: {
        title: "Playfair Display, Georgia, serif",
        body: "Inter"
      },
      radius: "20px",
      shadow: "none"
    },
    motion: {
      energy: "low",
      style: ["fade", "opacity"]
    }
  },
  light: {
    extends: "minimal",
    dna: {
      philosophy: { oneIdeaPerScene: true, clarity: 1.0, minimalism: 0.95 },
      tone: "clean minimalist light, bright corporate, positive startup",
      description: "Thiết kế phẳng sáng sủa và tối giản: nền trắng tinh khiết, thẻ xám nhạt, màu nhấn xanh hoàng gia tươi tắn."
    },
    tokens: {
      colors: {
        background: "#ffffff",
        cardBg: "#f8fafc",
        border: "#e2e8f0",
        accent: "#2563eb",
        text: "#0f172a",
        textSecondary: "#475569"
      },
      fonts: {
        title: "Montserrat, Inter",
        body: "Inter"
      },
      radius: "16px",
      shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
    }
  },
  rikkei: {
    extends: "minimal",
    dna: {
      philosophy: { oneIdeaPerScene: true, clarity: 0.95, minimalism: 0.8 },
      tone: "professional, educational, academic, clean, corporate, structured",
      description: "Phong cách học viện Rikkei Academy: Nền trắng sạch sẽ, màu đỏ crimson làm chủ đạo, thẻ bo góc lớn màu hồng nhạt siêu dịu."
    },
    tokens: {
      colors: {
        background: "#ffffff",
        cardBg: "#FAF5F5",
        border: "rgba(168, 35, 42, 0.08)",
        accent: "#A8232A",
        text: "#000000",
        textSecondary: "#595959"
      },
      fonts: {
        title: "Be Vietnam Pro",
        body: "Be Vietnam Pro"
      },
      radius: "16px",
      shadow: "0 8px 24px rgba(168, 35, 42, 0.03)"
    },
    motion: {
      energy: "medium",
      style: ["slide-up", "fade"]
    }
  }
};

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
  if (targetStyleId.includes("cyberpunk") || targetStyleId.includes("neon")) targetStyleId = "cyberpunk";
  else if (targetStyleId.includes("anime") || targetStyleId.includes("manga")) targetStyleId = "anime";
  else if (targetStyleId.includes("apple") || targetStyleId.includes("keynote")) targetStyleId = "apple";
  else if (targetStyleId.includes("claude")) targetStyleId = "claude";
  else if (targetStyleId.includes("light") || targetStyleId.includes("white")) targetStyleId = "light";
  else if (!styleExists(targetStyleId)) targetStyleId = "minimal"; // Default fallback

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
      
      const styleConfig = BUILTIN_STYLES[styleId];
      Object.keys(styleConfig).forEach(compName => {
        if (compName === 'extends') {
          fs.writeFileSync(path.join(stylePath, 'extends.txt'), styleConfig.extends);
        } else {
          fs.writeFileSync(
            path.join(stylePath, `${compName}.json`), 
            JSON.stringify(styleConfig[compName], null, 2)
          );
        }
      });
      console.log(`[VDE] Created filesystem style template for "${styleId}"`);
    }
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
  initializeVDESubdirs
};
