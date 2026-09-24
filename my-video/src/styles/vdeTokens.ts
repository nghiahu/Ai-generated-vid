export interface VDETokens {
  colors: {
    background: string;
    cardBg: string;
    border: string;
    accent: string;
    text: string;
    textSecondary: string;
  };
  fonts: {
    title: string;
    body: string;
  };
  radius: string;
  shadow: string;
}

import vdeThemes from "./vde_themes.json";

export const VDE_TOKENS: Record<string, VDETokens> = {};
Object.keys(vdeThemes).forEach(key => {
  const theme = (vdeThemes as any)[key];
  VDE_TOKENS[key] = {
    colors: theme.tokens.colors,
    fonts: theme.tokens.fonts,
    radius: theme.tokens.radius,
    shadow: theme.tokens.shadow
  };
});

let activeCompiledTokens: VDETokens | null = null;

export function registerCompiledTokens(tokens: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (tokens && tokens.tokens) {
    // If it's a full style JSON from backend, extract the tokens part
    activeCompiledTokens = tokens.tokens;
  } else if (tokens) {
    activeCompiledTokens = tokens;
  } else {
    activeCompiledTokens = null;
  }
}

export function getVDETokens(styleName?: string): VDETokens {
  let tokens: VDETokens | null = null;
  
  if (styleName) {
    const name = styleName.toLowerCase();
    if (name.includes("cyberpunk") || name.includes("neon")) tokens = VDE_TOKENS.cyberpunk;
    else if (name.includes("anime") || name.includes("manga")) tokens = VDE_TOKENS.anime;
    else if (name.includes("apple") || name.includes("keynote")) tokens = VDE_TOKENS.apple;
    else if (name.includes("flat") || name.includes("vector")) tokens = VDE_TOKENS.anime;
    else if (VDE_TOKENS[name]) tokens = VDE_TOKENS[name];
  }
  
  if (!tokens) {
    tokens = activeCompiledTokens;
  }
  
  if (!tokens) {
    tokens = VDE_TOKENS.rikkei || VDE_TOKENS.minimal;
  }
  
  // Force local static overrides for borders, backgrounds, and shadows to prevent stale database fields from overriding visual style guidelines
  const name = (styleName || "").toLowerCase();
  const isRikkei = !styleName || name.includes("rikkei") || name.includes("academic") || name === "minimal" || name === "default";

  if (isRikkei) {
    return {
      ...(tokens || VDE_TOKENS.rikkei),
      colors: {
        background: "linear-gradient(135deg, #FFFFFF 0%, #FFF2F4 50%, #FFE6E9 100%)",
        cardBg: "linear-gradient(135deg, #FFFFFF 0%, #FFF8F8 100%)",
        border: "1.5px solid rgba(168, 35, 42, 0.22)",
        accent: "#A8232A",
        text: "#191919",
        textSecondary: "#595959"
      },
      fonts: {
        title: "Be Vietnam Pro",
        body: "Be Vietnam Pro"
      },
      shadow: "0 10px 30px rgba(168, 35, 42, 0.08)",
      radius: "16px"
    };
  }

  if (name.includes("fintech_edu") || name.includes("fintech-edu")) {
    return {
      ...(tokens || VDE_TOKENS.fintech_edu),
      colors: {
        background: "linear-gradient(160deg, #0028a0 0%, #001060 50%, #000A3A 100%)",
        cardBg: "linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(0, 100, 240, 0.35) 100%)",
        border: "1.5px solid rgba(0, 229, 255, 0.6)",
        accent: "#00e5ff",
        text: "#FFFFFF",
        textSecondary: "rgba(255, 255, 255, 0.95)"
      },
      fonts: {
        title: "Chakra Petch",
        body: "Be Vietnam Pro"
      },
      shadow: "0 0 30px rgba(0, 212, 255, 0.35), 0 0 60px rgba(0, 212, 255, 0.1)",
      radius: "12px"
    };
  }

  if (name.includes("ai_driven") || name.includes("ai-driven")) {
    return {
      ...(tokens || VDE_TOKENS.ai_driven),
      colors: {
        background: "linear-gradient(180deg, #000A3A 0%, #001060 40%, #0026A8 80%, #0015C0 100%)",
        cardBg: "linear-gradient(135deg, rgba(0, 30, 100, 0.55) 0%, rgba(0, 10, 58, 0.75) 100%)",
        border: "1.5px solid rgba(0, 200, 255, 0.55)",
        accent: "#00C8FF",
        text: "#FFFFFF",
        textSecondary: "rgba(200, 230, 255, 0.85)"
      },
      fonts: {
        title: "Chakra Petch",
        body: "Be Vietnam Pro"
      },
      shadow: "0 0 40px rgba(0, 200, 255, 0.4), 0 0 80px rgba(27, 111, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
      radius: "12px"
    };
  }

  if (name.includes("cyber_security") || name.includes("cyber-security") || name.includes("cyber_sec")) {
    return {
      ...(tokens || VDE_TOKENS.cyber_security),
      colors: {
        background: "linear-gradient(180deg, #01080F 0%, #02121D 40%, #031E2B 75%, #010C14 100%)",
        cardBg: "linear-gradient(135deg, rgba(3, 24, 38, 0.85) 0%, rgba(2, 13, 22, 0.92) 100%)",
        border: "1.5px solid rgba(0, 176, 234, 0.7)",
        accent: "#00b0ea",
        text: "#66efff",
        textSecondary: "rgba(180, 235, 255, 0.85)"
      },
      fonts: {
        title: "Chakra Petch",
        body: "Be Vietnam Pro"
      },
      shadow: "0 0 35px rgba(0, 176, 234, 0.35), 0 0 70px rgba(102, 239, 255, 0.15)",
      radius: "14px"
    };
  }

  if (name.includes("ba")) {
    return {
      ...(tokens || VDE_TOKENS.ba),
      colors: {
        background: "#FFFFFF",
        cardBg: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 246, 255, 0.8) 100%)",
        border: "1.5px solid rgba(0, 103, 221, 0.15)",
        accent: "#0067dd",
        text: "#0067dd",
        textSecondary: "#475569"
      },
      fonts: {
        title: "Be Vietnam Pro",
        body: "Be Vietnam Pro"
      },
      shadow: "0 8px 32px rgba(0, 103, 221, 0.08)",
      radius: "16px"
    };
  }

  if (name.includes("claude")) {
    return {
      ...tokens,
      colors: {
        ...tokens.colors,
        cardBg: "rgba(217, 107, 67, 0.08)", // Crisp warm clay background
        border: "2.5px solid rgba(217, 107, 67, 0.45)" // Highly defined clay orange border
      },
      shadow: "0 10px 25px rgba(217, 107, 67, 0.05)" // Restore soft warm shadow for Claude block container
    };
  }
  
  if (name.includes("light")) {
    return {
      ...tokens,
      colors: {
        ...tokens.colors,
        cardBg: "#f1f5f9",
        border: "2.5px solid #cbd5e1"
      },
      shadow: "0 10px 25px rgba(0, 0, 0, 0.04)" // Restore soft shadow for Light block container
    };
  }

  if (name.includes("apple") || name.includes("keynote")) {
    return {
      ...tokens,
      colors: {
        ...tokens.colors,
        cardBg: "rgba(255, 255, 255, 0.04)",
        border: "2px solid rgba(255, 255, 255, 0.18)"
      },
      shadow: "none"
    };
  }

  if (name.includes("minimal")) {
    return {
      ...tokens,
      colors: {
        ...tokens.colors,
        cardBg: "linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.03) 100%)",
        border: "2.2px solid rgba(255, 255, 255, 0.26)"
      },
      shadow: "none"
    };
  }

  if (name.includes("retro_editorial") || name.includes("retro-editorial") || name.includes("editorial")) {
    return {
      ...(tokens || VDE_TOKENS.retro_editorial),
      colors: {
        background: "#0B1E43",
        cardBg: "linear-gradient(135deg, rgba(253, 248, 245, 0.96) 0%, rgba(247, 240, 232, 0.92) 100%)",
        border: "2px solid #0B1E43",
        accent: "#0B1E43",
        text: "#0B1E43",
        textSecondary: "rgba(11, 30, 67, 0.75)"
      },
      fonts: {
        title: "Lora",
        body: "Be Vietnam Pro"
      },
      radius: "8px",
      shadow: "4px 4px 0px rgba(11, 30, 67, 0.2)"
    };
  }

  if (name.includes("students_2k9") || name.includes("students-2k9") || name.includes("2k9")) {
    return {
      ...(tokens || VDE_TOKENS.students_2k9),
      colors: {
        background: "linear-gradient(180deg, #0B192C 0%, #0F172A 50%, #1E293B 100%)",
        cardBg: "linear-gradient(135deg, rgba(11, 25, 44, 0.85) 0%, rgba(15, 23, 42, 0.75) 100%)",
        border: "1px solid rgba(56, 189, 248, 0.35)",
        accent: "#00F2FE",
        text: "#FFFFFF",
        textSecondary: "#B7C8E2"
      },
      fonts: {
        title: "Montserrat",
        body: "Inter"
      },
      radius: "16px",
      shadow: "0 10px 30px rgba(11, 25, 44, 0.25)"
    };
  }

  return tokens;
}
