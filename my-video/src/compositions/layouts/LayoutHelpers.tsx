import React from "react";

// CSS-based Browser Window Mockup
export const BrowserMockup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      borderRadius: "20px",
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 30px 70px rgba(0,0,0,0.65)",
      backgroundColor: "#0A0B10"
    }}>
      {/* Mock Browser Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        backgroundColor: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.08)"
      }}>
        {/* Window controls */}
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#FF5F56" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#FFBD2E" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#27C93F" }} />
        </div>
        {/* Address bar */}
        <div style={{
          fontSize: "14px",
          color: "rgba(255,255,255,0.35)",
          fontFamily: "Inter, sans-serif",
          backgroundColor: "rgba(255,255,255,0.05)",
          padding: "4px 30px",
          borderRadius: "8px",
          width: "250px",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
          https://app.io/preview
        </div>
        <div style={{ width: "52px" }} />
      </div>
      {/* Client frame area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
};
