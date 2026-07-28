import React from "react";
import { useCurrentFrame } from "remotion";
import { fontInter, fontMontserrat } from "../../styles/fonts";
import { getThemeStyles } from "../../styles/themes";


export const highlightHeadingText = (text: string, accentColor: string, theme?: string, highlightWords?: string[]) => {
  if (!text) return "";
  
  // Filter custom highlightWords to ONLY those that actually exist inside text
  const validWords = (highlightWords || []).filter(w => {
    if (!w || typeof w !== "string") return false;
    const clean = w.trim();
    if (!clean) return false;
    return text.toLowerCase().includes(clean.toLowerCase());
  });

  if (validWords.length === 0) {
    return text;
  }

  const sortedKeywords = [...validWords].sort((a, b) => b.length - a.length);
  const escapedKeywords = sortedKeywords.map(k => k.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join("|");
  const pattern = new RegExp(`(?<=^|[^a-zA-Z0-9_À-ỹđĐ])(${escapedKeywords})(?=$|[^a-zA-Z0-9_À-ỹđĐ])`, "gi");
  
  const parts = text.split(pattern);
  return parts.map((part, index) => {
    const isMatch = sortedKeywords.some(k => k.toLowerCase() === part.toLowerCase());
    if (isMatch) {
      if (theme === "ai_hub_grid") {
        return (
          <span 
            key={index} 
            style={{ 
              background: "linear-gradient(to bottom, #ffffff 10%, #00e5ff 60%, #3b82f6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "inline-block",
              paddingTop: "0.22em",
              marginTop: "-0.22em",
              paddingBottom: "0.08em",
              marginBottom: "-0.08em",
              verticalAlign: "bottom"
            }}
          >
            {part}
          </span>
        );
      }
      return (
        <span key={index} style={{ color: accentColor }}>
          {part}
        </span>
      );
    }
    return part;
  });
};

export const TitleBlock: React.FC<{ text: string; theme: string; accentColor: string; highlightWords?: string[] }> = ({ text, theme, accentColor, highlightWords }) => {
  const styles = getThemeStyles(theme, accentColor);
  const activeAccent = styles.badgeStyle.color || accentColor;
  const isRikkei = theme?.toLowerCase().includes("rikkei");
  
  return (
    <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", gap: "20px" }}>
      {!isRikkei && (
        <div style={{ display: "flex" }}>
          <span style={styles.badgeStyle}>
            • FEATURE INFO •
          </span>
        </div>
      )}

      <h1 style={{
        fontSize: text.length > 25 ? "80px" : "105px",
        lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.32,
        margin: 0,
        marginTop: "10px",
        fontFamily: styles.fontFamily,
        textTransform: "uppercase",
        letterSpacing: "-0.01em",
        ...styles.titleStyle
      }}>
        {isRikkei && <span style={{ color: "#A8232A", marginRight: "10px" }}>[</span>}
        {highlightHeadingText(text, activeAccent, theme, highlightWords)}
        {isRikkei && <span style={{ color: "#A8232A", marginLeft: "10px" }}>]</span>}
      </h1>
    </div>
  );
};

// Custom tokenizer for basic shell commands syntax highlighting
const highlightTerminal = (code: string, accentColor: string, textColor: string) => {
  const parts = code.split(/(\s+)/);
  return parts.map((part, index) => {
    if (part.startsWith("-")) {
      return <span key={index} style={{ color: "#8E9AA8" }}>{part}</span>; // flags
    }
    if (part.match(/^(npm|pip|git|npx|node|python|curl|wget)$/)) {
      return <span key={index} style={{ color: accentColor }}>{part}</span>; // main commands
    }
    if (part.match(/^(install|run|clone|add|init|dev|start)$/)) {
      return <span key={index} style={{ color: "#00E5FF" }}>{part}</span>; // subcommands
    }
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return <span key={index} style={{ color: "#61AFEF", textDecoration: "underline" }}>{part}</span>; // urls
    }
    return <span key={index} style={{ color: textColor }}>{part}</span>;
  });
};

export const TerminalBlock: React.FC<{ code: string; theme: string; accentColor: string }> = ({ code, theme, accentColor }) => {
  const styles = getThemeStyles(theme, accentColor);
  const isBrutalist = theme === "brutalist";
  const frame = useCurrentFrame();
  const showCursor = Math.floor(frame / 10) % 2 === 0;
  const cleanCode = code.startsWith("$") ? code.substring(1).trim() : code;

  const isLight = styles.backgroundColor === "#ffffff" || styles.backgroundColor === "#FBF9F4" || theme === "claude" || theme === "light";
  const textColor = isLight ? "#191919" : "rgba(255,255,255,0.85)";
  const gutterColor = isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)";
  const promptColor = isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.3)";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      padding: "0px",
      overflow: "hidden",
      ...styles.terminalStyle
    }}>
      {/* MacOS Window Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: isLight ? "#F1F5F9" : "rgba(255,255,255,0.03)",
        borderBottom: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
        padding: "16px 20px"
      }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#FF5F56" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#FFBD2E" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#27C93F" }} />
        </div>
        <div style={{
          fontSize: "14px",
          color: isLight ? "#475569" : "rgba(255,255,255,0.4)",
          fontFamily: "JetBrains Mono, monospace",
          backgroundColor: isLight ? "#FFFFFF" : "rgba(255,255,255,0.05)",
          padding: "4px 16px",
          borderRadius: "8px",
          border: isLight ? "1px solid rgba(0,0,0,0.08)" : "none"
        }}>
          terminal.sh
        </div>
        <div style={{ width: "52px" }} />
      </div>

      {/* Editor Content Gutter + Code */}
      <div style={{ display: "flex", padding: "24px", boxSizing: "border-box" }}>
        {/* Line Numbers */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "24px",
          color: gutterColor,
          marginRight: "24px",
          textAlign: "right",
          userSelect: "none"
        }}>
          <div>1</div>
        </div>

        {/* Code Content */}
        <div style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "24px",
          textAlign: "left",
          lineHeight: 1.4,
          flex: 1
        }}>
          <span style={{ color: promptColor, marginRight: "16px" }}>$</span>
          {isBrutalist ? cleanCode : highlightTerminal(cleanCode, accentColor, textColor)}
          <span style={{
            display: showCursor ? "inline-block" : "none",
            width: "12px",
            height: "22px",
            backgroundColor: accentColor,
            marginLeft: "6px",
            verticalAlign: "middle"
          }} />
        </div>
      </div>
    </div>
  );
};

export const HeroMetricBlock: React.FC<{ value: string; subtext: string; theme: string; accentColor: string }> = ({ value, subtext, theme, accentColor }) => {
  const styles = getThemeStyles(theme, accentColor);
  const isBrutalist = theme === "brutalist";
  const frame = useCurrentFrame();
  
  // Animate the sparkline line drawing progress from frame 0 to 30
  const progress = Math.min(1, Math.max(0, frame / 30));
  
  // Custom SVG Sparkline wave path
  const lineLength = 200;
  const strokeDashoffset = lineLength * (1 - progress);

  return (
    <div style={{
      ...styles.cardStyle,
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      borderRadius: isBrutalist ? "0px" : "20px",
      border: isBrutalist ? "5px solid #000" : "1px solid rgba(255,255,255,0.08)",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 2 }}>
        {/* Metric Value */}
        <div style={{
          fontSize: "110px",
          fontWeight: 900,
          color: isBrutalist ? "#000000" : accentColor,
          fontFamily: fontMontserrat,
          lineHeight: 1,
          textShadow: isBrutalist ? "none" : `0 0 40px ${accentColor}25`
        }}>
          {value}
        </div>

        {/* SVG Sparkline Chart */}
        {!isBrutalist && (
          <div style={{ width: "150px", height: "80px" }}>
            <svg width="100%" height="100%" viewBox="0 0 100 50" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id={`grad_${value.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={accentColor} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Filled Area under the curve */}
              <path
                d="M 0 45 C 20 40, 40 10, 60 25 C 80 40, 90 5, 100 15 L 100 50 L 0 50 Z"
                fill={`url(#grad_${value.replace(/[^a-zA-Z0-9]/g, "")})`}
                opacity={progress}
              />
              {/* Animate path stroke */}
              <path
                d="M 0 45 C 20 40, 40 10, 60 25 C 80 40, 90 5, 100 15"
                fill="none"
                stroke={accentColor}
                strokeWidth="3.5"
                strokeDasharray={lineLength.toString()}
                strokeDashoffset={strokeDashoffset.toString()}
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>

      {subtext && (
        <div style={{
          fontSize: "28px",
          fontWeight: 600,
          color: isBrutalist ? "#333333" : "rgba(255,255,255,0.6)",
          textAlign: "left",
          lineHeight: 1.3,
          fontFamily: styles.fontFamily,
          zIndex: 2
        }}>
          {subtext.includes(" · ") ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>hơn</span>
              <s style={{ textDecorationColor: "#ff3333", textDecorationThickness: "3px" }}>
                {subtext.replace(/^hơn\s+/i, "")}
              </s>
            </div>
          ) : subtext}
        </div>
      )}
    </div>
  );
};

const getSmartIcon = (text: string, color: string) => {
  const t = text.toLowerCase();
  let path = ""; // SVG Path d attribute
  
  if (t.includes("tốc độ") || t.includes("nhanh") || t.includes("speed") || t.includes("performance") || t.includes("hiệu năng")) {
    // Bolt/Speed
    path = "M13 2L3 14h9l-1 8 10-12h-9l1-8z";
  } else if (t.includes("bảo mật") || t.includes("an toàn") || t.includes("secure") || t.includes("auth") || t.includes("khóa")) {
    // Shield/Lock
    path = "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z";
  } else if (t.includes("cloud") || t.includes("đám mây") || t.includes("server") || t.includes("host") || t.includes("deploy")) {
    // Cloud
    path = "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z";
  } else if (t.includes("data") || t.includes("dữ liệu") || t.includes("db") || t.includes("database") || t.includes("lưu trữ")) {
    // Database
    path = "M12 2C6.48 2 2 4.02 2 6.5s4.48 4.5 10 4.5 10-2.02 10-4.5S17.52 2 12 2zm0 18c-5.52 0-10-2.02-10-4.5v-3.5c0 2.48 4.48 4.5 10 4.5s10-2.02 10-4.5v3.5c0 2.48-4.48 4.5-10 4.5z";
  } else if (t.includes("code") || t.includes("lập trình") || t.includes("dev") || t.includes("api") || t.includes("sdk")) {
    // Code
    path = "M16 18l6-6-6-6M8 6L2 12l6 6";
  } else {
    // Fallback: Checkmark
    path = "M20 6L9 17l-5-5";
  }

  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <path d={path} />
    </svg>
  );
};

export const FeatureCardBlock: React.FC<{
  text: string;
  theme: string;
  accentColor: string;
  hideDot?: boolean;
  isPrimary?: boolean;
}> = ({ text, theme, accentColor, hideDot = false, isPrimary = false }) => {
  const styles = getThemeStyles(theme, accentColor);
  const isRikkei = theme === "rikkei";

  let cardStyle = { ...styles.cardStyle };
  let iconColor = styles.badgeStyle.color || accentColor;
  let iconBg = styles.badgeStyle.backgroundColor;
  let iconBorder = styles.badgeStyle.border;
  let textWeight = 600;

  if (isRikkei) {
    if (isPrimary) {
      cardStyle = {
        ...cardStyle,
        backgroundColor: "#A8232A",
        color: "#ffffff",
        border: "none",
        boxShadow: "none"
      };
      iconColor = "#ffffff";
      iconBg = "rgba(255, 255, 255, 0.15)";
      iconBorder = "none";
      textWeight = 600;
    } else {
      cardStyle = {
        ...cardStyle,
        backgroundColor: "#FAF5F5",
        color: "#333333", // xám đậm
        border: "1.5px solid #F1E2E3",
        boxShadow: "none"
      };
      iconColor = "#A8232A";
      iconBg = "#FEECEC";
      iconBorder = "1.5px solid #F1E2E3";
      textWeight = 800; // chữ xám đậm 700-800
    }
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "24px",
      fontSize: "30px",
      textAlign: "left",
      lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.4,
      ...cardStyle,
    }}>
      {!hideDot && (
        <div style={{
          width: "60px",
          height: "60px",
          borderRadius: styles.cardStyle.borderRadius === "0px" ? "0px" : "12px",
          backgroundColor: iconBg,
          border: iconBorder,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}>
          {getSmartIcon(text, iconColor)}
        </div>
      )}
      <span style={{ fontFamily: styles.fontFamily, fontWeight: textWeight, flex: 1 }}>{text}</span>
    </div>
  );
};

export const BadgeRowBlock: React.FC<{ badges: string[]; theme: string; accentColor: string }> = ({ badges, theme, accentColor }) => {
  const styles = getThemeStyles(theme, accentColor);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", width: "100%", justifyContent: "flex-start" }}>
      {badges.map((bg, idx) => (
        <span
          key={idx}
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            padding: "12px 24px",
            borderRadius: styles.cardStyle.borderRadius || "12px",
            border: styles.cardStyle.border,
            backgroundColor: styles.cardStyle.backgroundColor,
            boxShadow: styles.cardStyle.boxShadow,
            color: styles.cardStyle.color,
            fontFamily: styles.fontFamily
          }}
        >
          {bg}
        </span>
      ))}
    </div>
  );
};

// PhoneMockup renders a premium smartphone frame
export const PhoneMockup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{
      width: "220px",
      height: "440px",
      borderRadius: "36px",
      border: "10px solid #111827",
      backgroundColor: "#030712",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75)",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>
      {/* Notch */}
      <div style={{
        position: "absolute",
        top: "0",
        left: "50%",
        transform: "translateX(-50%)",
        width: "100px",
        height: "18px",
        backgroundColor: "#111827",
        borderBottomLeftRadius: "12px",
        borderBottomRightRadius: "12px",
        zIndex: 10
      }} />
      
      {/* Inner Screen */}
      <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", padding: "24px 12px 12px 12px", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
};

// SaaSHeaderMockup renders a mock navigation bar for statistical layouts
export const SaaSHeaderMockup: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  return (
    <div style={{
      width: "100%",
      height: "56px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      backgroundColor: "rgba(255, 255, 255, 0.02)",
      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      boxSizing: "border-box"
    }}>
      {/* Mock logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: accentColor }} />
        <span style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff", letterSpacing: "1px", fontFamily: fontMontserrat }}>SaaSApp</span>
      </div>
      {/* Mock tabs */}
      <div style={{ display: "flex", gap: "20px" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: accentColor }}>Overview</span>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Analytics</span>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Settings</span>
      </div>
      {/* Mock Search & Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "80px", height: "20px", borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.05)" }} />
        <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.25)" }} />
      </div>
    </div>
  );
};

// IntegrationNode represents an orb in the connectivity diagram
export const IntegrationNode: React.FC<{ text: string; iconColor: string }> = ({ text, iconColor }) => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px"
    }}>
      <div style={{
        width: "70px",
        height: "70px",
        borderRadius: "50%",
        backgroundColor: "rgba(255, 255, 255, 0.02)",
        border: `2px solid ${iconColor}44`,
        boxShadow: `0 0 20px ${iconColor}15, inset 0 0 12px ${iconColor}10`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(8px)"
      }}>
        {getSmartIcon(text, iconColor)}
      </div>
      <span style={{
        fontSize: "12px",
        fontWeight: "bold",
        color: "#ffffff",
        textTransform: "uppercase",
        letterSpacing: "1px",
        fontFamily: fontInter
      }}>
        {text}
      </span>
    </div>
  );
};

// PricingCard renders a plan card in the SaaS pricing tier bento layout
export const PricingCard: React.FC<{
  title: string;
  price: string;
  features: string[];
  isPopular?: boolean;
  accentColor: string;
}> = ({ title, price, features, isPopular = false, accentColor }) => {
  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      padding: "36px 28px",
      borderRadius: "20px",
      backgroundColor: isPopular ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.01)",
      border: isPopular ? `2.5px solid ${accentColor}` : "1.5px solid rgba(255, 255, 255, 0.07)",
      boxShadow: isPopular ? `0 15px 40px -10px ${accentColor}20` : "none",
      boxSizing: "border-box",
      position: "relative",
      textAlign: "left",
      justifyContent: "space-between",
      height: "450px"
    }}>
      {isPopular && (
        <span style={{
          position: "absolute",
          top: "-15px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "11px",
          fontWeight: 800,
          color: "#000000",
          backgroundColor: accentColor,
          padding: "6px 16px",
          borderRadius: "20px",
          textTransform: "uppercase",
          letterSpacing: "1.5px"
        }}>
          Popular
        </span>
      )}
      
      <div>
        <h4 style={{
          fontSize: "20px",
          fontWeight: 800,
          color: isPopular ? accentColor : "#ffffff",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          margin: "0 0 10px 0",
          fontFamily: fontMontserrat
        }}>
          {title}
        </h4>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px", margin: "15px 0 25px 0" }}>
          <span style={{ fontSize: "42px", fontWeight: 900, color: "#ffffff", fontFamily: fontMontserrat }}>{price}</span>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", fontFamily: fontInter }}>/month</span>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {features.map((feat, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "rgba(255,255,255,0.75)", fontFamily: fontInter }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: accentColor }} />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        width: "100%",
        padding: "14px",
        borderRadius: "10px",
        backgroundColor: isPopular ? accentColor : "rgba(255,255,255,0.06)",
        color: isPopular ? "#000000" : "#ffffff",
        fontWeight: "bold",
        fontSize: "14px",
        textAlign: "center",
        marginTop: "30px",
        border: isPopular ? "none" : "1px solid rgba(255,255,255,0.12)",
        boxShadow: isPopular ? `0 8px 20px ${accentColor}35` : "none",
        fontFamily: fontMontserrat,
        textTransform: "uppercase",
        letterSpacing: "1px"
      }}>
        Choose Plan
      </div>
    </div>
  );
};

// Inline SVG Logos for LogoRowBlock
const ClaudeLogo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#E8DCD0" />
    <path d="M50 25C36.19 25 25 36.19 25 50C25 63.81 36.19 75 50 75C63.81 75 75 63.81 75 50C75 36.19 63.81 25 50 25ZM50 67C40.61 67 33 59.39 33 50C33 40.61 40.61 33 50 33C59.39 33 67 40.61 67 50C67 59.39 59.39 67 50 67Z" fill="#D96B43" />
    <circle cx="42" cy="46" r="5" fill="#D96B43" />
    <circle cx="58" cy="46" r="5" fill="#D96B43" />
    <path d="M40 58Q50 64 60 58" stroke="#D96B43" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const RemotionLogo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#000000" />
    <path d="M35 25L75 50L35 75V25Z" fill="url(#remotion_grad)" />
    <defs>
      <linearGradient id="remotion_grad" x1="35" y1="25" x2="75" y2="75" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00F5D4" />
        <stop offset="1" stopColor="#00BBF9" />
      </linearGradient>
    </defs>
  </svg>
);

const ReactLogo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="-11.5 -10.23174 23 20.46348" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ backgroundColor: "#20232a", borderRadius: "20%" }}>
    <circle cx="0" cy="0" r="2.05" fill="#61dafb"/>
    <g stroke="#61dafb" strokeWidth="1.2" fill="none">
      <ellipse rx="11" ry="4.2"/>
      <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
      <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
    </g>
  </svg>
);

const GithubLogo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#181717" />
    <path fillRule="evenodd" clipRule="evenodd" d="M50 15C30.67 15 15 30.67 15 50C15 65.46 25.03 78.58 38.97 83.22C40.72 83.54 41.36 82.46 41.36 81.53C41.36 80.71 41.33 78.53 41.31 75.65C31.57 77.76 29.52 70.96 29.52 70.96C27.93 66.92 25.63 65.84 25.63 65.84C22.45 63.67 25.87 63.71 25.87 63.71C29.39 63.96 31.24 67.33 31.24 67.33C34.37 72.69 39.45 71.14 41.45 70.24C41.77 67.98 42.67 66.44 43.67 65.56C35.89 64.68 27.7 61.67 27.7 48.25C27.7 44.42 29.07 41.3 31.32 38.85C30.96 37.97 29.76 34.39 31.67 29.56C31.67 29.56 34.62 28.61 41.31 33.15C44.11 32.37 47.11 31.98 50 31.97C52.89 31.98 55.89 32.37 58.69 33.15C65.38 28.61 68.33 29.56 68.33 29.56C70.24 34.39 69.04 37.97 68.68 38.85C70.93 41.3 72.3 44.42 72.3 48.25C72.3 61.71 64.1 64.67 56.3 65.53C57.56 66.61 58.68 68.75 58.68 72.03C58.68 76.72 58.64 80.53 58.64 81.67C58.64 82.6 59.27 83.7 61.04 83.36C74.97 78.7 85 65.51 85 50C85 30.67 69.33 15 50 15Z" fill="#ffffff" />
  </svg>
);

const TiktokLogo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#010101" />
    <path d="M68.55 42.15C61.42 42.15 56.45 38.3 56.45 38.3V67C56.45 77.22 48.17 85.5 37.95 85.5C27.73 85.5 19.45 77.22 19.45 67C19.45 56.78 27.73 48.5 37.95 48.5C39.88 48.5 41.7 48.8 43.45 49.35V59.45C41.7 58.85 39.88 58.5 37.95 58.5C33.26 58.5 29.45 62.31 29.45 67C29.45 71.69 33.26 75.5 37.95 75.5C42.64 75.5 46.45 71.69 46.45 67V15.5H56.45C56.45 23.55 62.9 30 70.95 30V40C69.75 40 69.15 42.15 68.55 42.15Z" fill="#ffffff" />
  </svg>
);

const YoutubeLogo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FF0000" />
    <path d="M38 32L68 50L38 68V32Z" fill="#ffffff" />
  </svg>
);

const NodejsLogo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#333333" />
    <path d="M50 20L75 34.5V63.5L50 78L25 63.5V34.5L50 20Z" stroke="#68A063" strokeWidth="6" fill="none" />
    <path d="M50 32L65 40.5V57.5L50 66L35 57.5V40.5L50 32Z" fill="#68A063" />
  </svg>
);

const PythonLogo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#306998" />
    <path d="M50 15C36.2 15 35 21 35 25V35H50V37.5H30C23 37.5 20 42.5 20 50C20 57.5 25 60 30 60H35V55C35 46.7 41.7 40 50 40H60V30C60 20.3 54 15 50 15Z" fill="#FFE873" />
    <path d="M50 85C63.8 85 65 79 65 75V65H50V62.5H70C77 62.5 80 57.5 80 50C80 42.5 75 40 70 40H65V45C65 53.3 58.3 60 50 60H40V70C40 79.7 46 85 50 85Z" fill="#FFE873" />
  </svg>
);

const renderLogoIcon = (name: string, size = 56) => {
  const key = name.toLowerCase().trim();
  switch (key) {
    case "claude": return <ClaudeLogo size={size} />;
    case "remotion": return <RemotionLogo size={size} />;
    case "react": return <ReactLogo size={size} />;
    case "github": return <GithubLogo size={size} />;
    case "tiktok": return <TiktokLogo size={size} />;
    case "youtube": return <YoutubeLogo size={size} />;
    case "nodejs": case "node": return <NodejsLogo size={size} />;
    case "python": return <PythonLogo size={size} />;
    default:
      return (
        <div style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "14px",
          backgroundColor: "#2E3440",
          color: "#ECEFF4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          fontWeight: 800,
          fontFamily: fontMontserrat,
          textTransform: "uppercase"
        }}>
          {key.substring(0, 2)}
        </div>
      );
  }
};

export const SubheaderBlock: React.FC<{ text: string; theme: string; accentColor: string }> = ({ text, theme, accentColor }) => {
  const styles = getThemeStyles(theme, accentColor);
  const isBrutalist = theme === "brutalist";
  
  return (
    <div style={{
      display: "flex",
      justifyContent: "flex-start",
      width: "100%",
      margin: "0 0 5px 0"
    }}>
      <span style={{
        fontFamily: styles.fontFamily,
        fontSize: "20px",
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.15em",
        color: accentColor,
        borderBottom: isBrutalist ? `3px solid ${accentColor}` : "none",
        paddingBottom: isBrutalist ? "4px" : "0px"
      }}>
        {text}
      </span>
    </div>
  );
};

export const LogoRowBlock: React.FC<{ logos: string[]; theme: string; accentColor: string }> = ({ logos, theme, accentColor }) => {
  const isLight = theme === "claude" || theme === "light";
  
  if (!logos || logos.length === 0) return null;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: "20px",
      margin: "15px 0"
    }}>
      {logos.map((logo, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && (
            <span style={{
              fontSize: "28px",
              fontWeight: 800,
              color: isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)",
              fontFamily: fontMontserrat,
              userSelect: "none"
            }}>
              ×
            </span>
          )}
          <div style={{
            padding: "8px",
            borderRadius: "18px",
            backgroundColor: isLight ? "#ffffff" : "rgba(255,255,255,0.06)",
            border: isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.08)",
            boxShadow: isLight ? "0 8px 20px rgba(0,0,0,0.04)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {renderLogoIcon(logo, 64)}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export const CTAButtonBlock: React.FC<{ text: string; theme: string; accentColor: string }> = ({ text, theme, accentColor }) => {
  const styles = getThemeStyles(theme, accentColor);
  const isClaude = theme === "claude";
  const isCyberpunk = theme === "cyberpunk";
  const isBrutalist = theme === "brutalist";
  const isLight = theme === "light";
  
  let buttonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "16px 36px",
    borderRadius: "30px",
    fontSize: "22px",
    fontWeight: 800,
    fontFamily: styles.fontFamily,
    boxSizing: "border-box",
    width: "fit-content"
  };

  if (isClaude) {
    buttonStyle = {
      ...buttonStyle,
      backgroundColor: accentColor,
      color: styles.cardStyle.color || "#ffffff",
      boxShadow: `0 8px 24px ${accentColor}40`
    };
  } else if (isCyberpunk) {
    buttonStyle = {
      ...buttonStyle,
      backgroundColor: "transparent",
      color: "#00E5FF",
      border: "2px solid #00E5FF",
      borderRadius: "0px",
      textTransform: "uppercase",
      boxShadow: "0 0 15px rgba(0,229,255,0.4)"
    };
  } else if (isBrutalist) {
    buttonStyle = {
      ...buttonStyle,
      backgroundColor: accentColor,
      color: "#000000",
      border: "3px solid #000000",
      borderRadius: "0px",
      boxShadow: "5px 5px 0px #000000"
    };
  } else {
    buttonStyle = {
      ...buttonStyle,
      backgroundColor: accentColor,
      color: isLight ? "#ffffff" : "#000000",
      boxShadow: `0 8px 24px ${accentColor}35`
    };
  }

  return (
    <div style={{ display: "flex", width: "100%", justifyContent: "flex-start", marginTop: "15px" }}>
      <div style={buttonStyle}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        <span>{text}</span>
      </div>
    </div>
  );
};

