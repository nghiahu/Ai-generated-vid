import React from "react";

export function SkeletonLoader({ type = "dashboard" }) {
  const shimmerStyle = {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    border: "1px solid rgba(15, 23, 42, 0.08)",
  };

  const keyframes = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;

  const shimmerMask = {
    background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  if (type === "dashboard") {
    return (
      <div style={{ padding: "50px 40px", maxWidth: "1080px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <style>{keyframes}</style>
        <div style={{ height: "40px", width: "200px", borderRadius: "8px", ...shimmerStyle, marginBottom: "32px" }}>
          <div style={shimmerMask} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: "340px", ...shimmerStyle }}>
              <div style={shimmerMask} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Workspace 3-column skeleton
  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden", backgroundColor: "var(--bg-secondary)" }}>
      <style>{keyframes}</style>
      {/* Left Sidebar */}
      <div style={{ width: "260px", height: "100%", ...shimmerStyle, borderRadius: 0, borderRight: "1px solid rgba(15,23,42,0.08)", flexShrink: 0 }}>
        <div style={shimmerMask} />
      </div>
      {/* Content */}
      <div style={{ flex: 1, display: "flex" }}>
        {/* Editor */}
        <div style={{ flex: 1, height: "100%", padding: "20px", display: "flex", flexDirection: "column", gap: "20px", boxSizing: "border-box" }}>
          <div style={{ height: "80px", ...shimmerStyle }}>
            <div style={shimmerMask} />
          </div>
          <div style={{ flex: 1, ...shimmerStyle }}>
            <div style={shimmerMask} />
          </div>
        </div>
        {/* Preview Player */}
        <div style={{ width: "400px", height: "100%", ...shimmerStyle, borderRadius: 0, flexShrink: 0 }}>
          <div style={shimmerMask} />
        </div>
      </div>
    </div>
  );
}
