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
      backgroundColor: "#ffffff",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      borderLeft: "2px solid #000000",
      boxSizing: "border-box"
    }}>
      {/* Top Header */}
      <div className="border-b-strict" style={{ 
        padding: "16px 20px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        backgroundColor: "#ffffff",
        height: "64px",
        boxSizing: "border-box",
        shrink: 0
      }}>
        <h2 style={{ fontSize: "13px", fontFamily: "Space Grotesk", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", color: "#000000", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
          <span>▶</span> Master Preview
        </h2>
        <span style={{ px: "8px", py: "4px", backgroundColor: "#000000", color: "#ffffff", fontSize: "10px", fontWeight: "bold", fontFamily: "monospace", borderRadius: "3px", padding: "2px 6px" }}>
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
        padding: "20px",
        backgroundColor: "#fafafa",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Simulated Grid Background Pattern */}
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          pointerEvents: "none",
          backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }} />

        {/* Portrait Phone Frame Player */}
        <div 
          className="border-strict"
          style={{
            width: "100%",
            maxWidth: "240px",
            aspectRatio: "9/16",
            backgroundColor: "#000000",
            boxShadow: "6px 6px 0px 0px #000000",
            overflow: "hidden",
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column"
          }}
        >
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
              color: "#ffffff",
              fontSize: "13px",
              fontFamily: "Space Grotesk",
              padding: "20px",
              textAlign: "center"
            }}>
              Chưa có phân cảnh nào để phát
            </div>
          )}
        </div>
      </div>

      {/* Timeline & Scrubber Panel */}
      <div className="border-t-strict" style={{
        padding: "20px",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        gap: "15px"
      }}>
        {/* Scrubber timeline */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontFamily: "monospace", fontWeight: "bold", color: "#000000", marginBottom: "6px" }}>
            <span>00:00:00</span>
            <span style={{ color: "#666666" }}>00:00:{totalSeconds < 10 ? `0${Math.round(totalSeconds)}` : Math.round(totalSeconds)}</span>
          </div>
          {/* Simulated Scrubber Bar */}
          <div className="border-strict" style={{ height: "10px", backgroundColor: "#f0f0f0", position: "relative", cursor: "pointer" }}>
            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", backgroundColor: "#000000", width: "15%" }} />
            <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: "15%", width: "10px", height: "14px", backgroundColor: "#000000", border: "1px solid #ffffff" }} />
          </div>
        </div>

        {/* Transport buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", padding: 0 }}>⏮</button>
            <button style={{ width: "36px", height: "36px", backgroundColor: "#000000", color: "#ffffff", border: "none", borderRadius: "4px", fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "2px 2px 0px 0px rgba(0,0,0,0.2)" }}>
              ▶
            </button>
            <button style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", padding: 0 }}>⏭</button>
            <div style={{ width: "1px", height: "20px", backgroundColor: "#cccccc", margin: "0 5px" }} />
            <button style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", padding: 0, color: "#666666" }}>🔊</button>
          </div>

          <button className="btn-mono btn-mono-secondary" style={{ padding: "6px 12px", fontSize: "11px" }}>
            ⚙ Config
          </button>
        </div>
      </div>

      {/* Rendering Progress Panel */}
      <div className="border-t-strict" style={{
        padding: "20px",
        backgroundColor: "#ffffff"
      }}>
        {rendering ? (
          /* Render progress bar styled in thick brutalist monochrome */
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontFamily: "Space Grotesk", fontWeight: "bold", marginBottom: "8px" }}>
              <span>
                {renderedFrames > 0 && renderTotalFrames > 0 
                  ? `Đang kết xuất (Frame ${renderedFrames}/${renderTotalFrames})` 
                  : "Đang kết xuất MP4..."}
              </span>
              <span>{renderProgress}%</span>
            </div>
            <div className="border-strict" style={{ height: "14px", backgroundColor: "#ffffff", overflow: "hidden" }}>
              <div style={{
                width: `${renderProgress}%`,
                height: "100%",
                backgroundColor: "#000000",
                transition: "width 0.2s ease-out"
              }} />
            </div>
          </div>
        ) : videoUrl ? (
          /* Successfully Rendered State */
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "13px", color: "green", fontWeight: "bold", fontFamily: "Space Grotesk", display: "flex", alignItems: "center", gap: "6px" }}>
              ✓ KẾT XUẤT HOÀN TẤT!
            </div>
            <a 
              href={`http://localhost:5000${videoUrl}`} 
              target="_blank" 
              rel="noreferrer"
              style={{ textDecoration: "none", width: "100%" }}
            >
              <button className="btn-mono btn-mono-primary" style={{ width: "100%", padding: "12px" }}>
                📥 Tải Video MP4
              </button>
            </a>
            <button className="btn-mono btn-mono-secondary" style={{ width: "100%", padding: "10px", fontSize: "11px" }} onClick={onRender}>
              Xuất lại video
            </button>
          </div>
        ) : (
          /* Trigger Render State */
          <div>
            <button 
              className="btn-mono btn-mono-primary" 
              style={{ width: "100%", padding: "14px", fontSize: "13px" }}
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
