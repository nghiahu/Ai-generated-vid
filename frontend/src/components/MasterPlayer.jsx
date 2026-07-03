import React from "react";
import { Player } from "@remotion/player";
import { MainComposition } from "../../../my-video/src/compositions/MainComposition";

export const MasterPlayer = ({ 
  scenes = [], 
  config = {}, 
  onRender, 
  rendering, 
  renderProgress, 
  renderedFrames,
  renderTotalFrames,
  videoUrl 
}) => {
  const fps = 30;
  const endingEnabled = config?.ending?.enabled;
  const totalSeconds = scenes.reduce((sum, scene) => sum + (scene.duration || 6.0), 0);
  const totalFrames = Math.max(
    30,
    Math.round((totalSeconds + (endingEnabled ? 4.0 : 0)) * fps)
  );

  return (
    <aside className="custom-scrollbar" style={{
      width: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      backdropFilter: "blur(20px)",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      borderLeft: "1px solid rgba(15, 23, 42, 0.08)",
      boxSizing: "border-box"
    }}>
      {/* Top Header */}
      <div style={{ 
        padding: "16px 24px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
        height: "64px",
        boxSizing: "border-box",
        flexShrink: 0
      }}>
        <h2 style={{ fontSize: "12px", fontFamily: "var(--font-heading)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
          <span style={{ color: "var(--color-primary)" }}>▶</span> Master Preview
        </h2>
        <span style={{ backgroundColor: "rgba(37, 99, 235, 0.08)", color: "var(--color-primary)", fontSize: "10px", fontWeight: "800", fontFamily: "monospace", borderRadius: "20px", padding: "3px 10px" }}>
          1080x1920
        </span>
      </div>

      {/* Main player workspace with grid background */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        backgroundColor: "var(--bg-secondary)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Simulated Grid Background Pattern */}
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          pointerEvents: "none",
          backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }} />

        {/* Portrait Phone Frame Player (Sleek light glass version) */}
        <div 
          style={{
            width: "100%",
            maxWidth: "250px",
            aspectRatio: "9/16",
            backgroundColor: "#000000",
            border: "6px solid #e2e8f0",
            borderRadius: "32px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.12), 0 0 20px rgba(37, 99, 235, 0.05)",
            overflow: "hidden",
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Speaker pill at the top */}
          <div style={{ position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)", width: "50px", height: "4px", backgroundColor: "#e2e8f0", borderRadius: "10px", zIndex: 100 }} />

          {scenes.length > 0 ? (
            <Player
              component={MainComposition}
              inputProps={{ scenes, config }}
              durationInFrames={totalFrames}
              fps={fps}
              compositionWidth={1080}
              compositionHeight={1920}
              style={{
                width: "100%",
                height: "100%",
              }}
              controls
            />
          ) : (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              color: "#aaaaaa",
              fontSize: "13px",
              fontFamily: "var(--font-heading)",
              padding: "20px",
              textAlign: "center"
            }}>
              Chưa có phân cảnh nào để phát
            </div>
          )}
        </div>
      </div>

      {/* Timeline & Scrubber Panel */}
      <div style={{
        padding: "20px 24px",
        borderTop: "1px solid rgba(15, 23, 42, 0.06)",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        display: "flex",
        flexDirection: "column",
        gap: "18px"
      }}>
        {/* Scrubber timeline */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "monospace", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "8px" }}>
            <span>00:00:00</span>
            <span>00:00:{totalSeconds < 10 ? `0${Math.round(totalSeconds)}` : Math.round(totalSeconds)}</span>
          </div>
          {/* Simulated Scrubber Bar */}
          <div style={{ height: "6px", backgroundColor: "rgba(15, 23, 42, 0.06)", borderRadius: "3px", position: "relative", cursor: "pointer" }}>
            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", backgroundColor: "var(--color-primary)", borderRadius: "3px", width: "15%" }} />
            <div style={{ position: "absolute", top: "50%", transform: "translate(-50%, -50%)", left: "15%", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ffffff", border: "2px solid var(--color-primary)", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} />
          </div>
        </div>

        {/* Transport buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <button style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", padding: 0, color: "var(--text-secondary)", boxShadow: "none" }}>⏮</button>
            <button style={{ width: "38px", height: "38px", backgroundColor: "var(--color-primary)", color: "#ffffff", border: "none", borderRadius: "50%", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(37, 99, 235, 0.2)" }}>
              ▶
            </button>
            <button style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", padding: 0, color: "var(--text-secondary)", boxShadow: "none" }}>⏭</button>
            <div style={{ width: "1px", height: "18px", backgroundColor: "rgba(15, 23, 42, 0.1)", margin: "0 5px" }} />
            <button style={{ background: "none", border: "none", fontSize: "15px", cursor: "pointer", padding: 0, color: "var(--text-secondary)", boxShadow: "none" }}>🔊</button>
          </div>

          <button className="secondary" style={{ padding: "6px 14px", fontSize: "11px", borderRadius: "20px" }}>
            ⚙ Config
          </button>
        </div>
      </div>

      {/* Rendering Progress Panel */}
      <div style={{
        padding: "20px 24px",
        borderTop: "1px solid rgba(15, 23, 42, 0.06)",
        backgroundColor: "rgba(255, 255, 255, 0.85)"
      }}>
        {rendering ? (
          /* Render progress bar styled in clean light glass style */
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontFamily: "var(--font-heading)", fontWeight: "800", marginBottom: "10px", color: "var(--text-primary)" }}>
              <span>
                {renderedFrames > 0 && renderTotalFrames > 0 
                  ? `Đang xuất (Frame ${renderedFrames}/${renderTotalFrames})` 
                  : "Đang nén video MP4..."}
              </span>
              <span>{renderProgress}%</span>
            </div>
            <div style={{ height: "10px", backgroundColor: "rgba(15, 23, 42, 0.06)", borderRadius: "5px", overflow: "hidden" }}>
              <div style={{
                width: `${renderProgress}%`,
                height: "100%",
                background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
                borderRadius: "5px",
                transition: "width 0.2s ease-out"
              }} />
            </div>
          </div>
        ) : videoUrl ? (
          /* Successfully Rendered State */
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "13px", color: "#10b981", fontWeight: "800", fontFamily: "var(--font-heading)", display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              KẾT XUẤT HOÀN TẤT!
            </div>
            <a 
              href={`http://localhost:5000${videoUrl}`} 
              target="_blank" 
              rel="noreferrer"
              style={{ textDecoration: "none", width: "100%" }}
            >
              <button 
                className="primary" 
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  borderRadius: "var(--radius-pill)",
                  background: "linear-gradient(135deg, var(--color-secondary), #f97316)",
                  boxShadow: "0 4px 15px rgba(249, 115, 22, 0.25)"
                }}
              >
                📥 Tải Video MP4
              </button>
            </a>
            <button className="secondary" style={{ width: "100%", padding: "10px", fontSize: "11px", borderRadius: "var(--radius-pill)" }} onClick={onRender}>
              Xuất lại video
            </button>
          </div>
        ) : (
          /* Trigger Render State */
          <div>
            <button 
              className="primary" 
              style={{ width: "100%", padding: "14px", fontSize: "12px", borderRadius: "var(--radius-pill)" }}
              disabled={scenes.length === 0}
              onClick={onRender}
            >
              🚀 XUẤT VIDEO (.MP4)
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
