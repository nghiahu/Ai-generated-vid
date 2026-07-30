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

  if (name.includes("ba")) {
    return {
      ...(tokens || VDE_TOKENS.ba),
      colors: {
        background: "linear-gradient(135deg, #002691 0%, #004BBF 50%, #0059D7 100%)",
        cardBg: "linear-gradient(135deg, #0059D7 0%, #0259E9 100%)",
        border: "1.5px solid rgba(93, 200, 251, 0.7)",
        accent: "#5DC8FB",
        text: "#FFFFFF",
        textSecondary: "#EAF8FF"
      },
      fonts: {
        title: "Be Vietnam Pro",
        body: "Be Vietnam Pro"
      },
      shadow: "0 8px 32px rgba(2, 89, 233, 0.15)",
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

  return tokens;
}
