import React from "react"; // trigger rebuild for pullquote layout template addition
import { Player } from "@remotion/player";
import { MainComposition, safeParseFloat, getSceneDurationFrames } from "../../../my-video/src/compositions/MainComposition";

export const MasterPlayer = ({ 
  scenes = [], 
  config = {}, 
  projectTitle = "",
  onRender, 
  onCancelRender,
  rendering, 
  renderProgress, 
  renderedFrames,
  renderTotalFrames,
  videoUrl,
  onRegenerateTts,
  regeneratingTts
}) => {
  const fps = 30;
  const totalFrames = Math.max(
    30,
    scenes.reduce((sum, scene) => sum + getSceneDurationFrames(scene, fps), 0)
  );

  const handleDownloadVideo = async () => {
    if (!videoUrl) return;
    const fullUrl = `http://localhost:5000${videoUrl}`;
    
    // Determine title for default filename
    const rawTitle = projectTitle || scenes[0]?.heading || "Video_kisafresh";
    // Sanitize title for valid OS filename
    const safeTitle = rawTitle.replace(/[/\\?%*:|"<>]/g, "_").trim().replace(/\s+/g, "_");
    const defaultFilename = `${safeTitle}.mp4`;

    const triggerDirectDownload = () => {
      const downloadUrl = `${fullUrl}?download=1&filename=${encodeURIComponent(defaultFilename)}`;
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    try {
      // Fetch the file FIRST to ensure network/CORS/extensions don't block the request.
      // Since it's localhost, this is extremely fast and preserves the user gesture.
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}: ${response.statusText}`);
      }
      const blob = await response.blob();

      // If we have the blob and showSaveFilePicker is supported, try to save it via the picker
      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: defaultFilename,
            types: [{
              description: "Video MP4",
              accept: { "video/mp4": [".mp4"] }
            }]
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return; // Success!
        } catch (pickerErr) {
          if (pickerErr.name === "AbortError") {
            return; // User cancelled the save dialog, exit silently
          }
          console.warn("File System Access API picker/write error, falling back to direct download:", pickerErr);
          // Fall back if gesture expired (SecurityError) or other write errors occurred
          triggerDirectDownload();
          return;
        }
      }

      // If showSaveFilePicker is not supported, download the blob using URL.createObjectURL
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

    } catch (err) {
      console.error("Fetch failed or browser blocked download, using fallback:", err);
      // Fallback: direct download via link (failsafe)
      triggerDirectDownload();
    }
  };

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
        padding: "12px",
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
            maxWidth: "280px",
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
              acknowledgeRemotionLicense
              numberOfSharedAudioTags={5}
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
            {onCancelRender && (
              <button 
                type="button"
                onClick={onCancelRender}
                style={{
                  marginTop: "14px",
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "rgba(220, 38, 38, 0.08)",
                  border: "1px solid rgba(220, 38, 38, 0.2)",
                  borderRadius: "var(--radius-pill)",
                  color: "#dc2626",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.15)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.08)"}
              >
                ❌ Hủy xuất video
              </button>
            )}
          </div>
        ) : videoUrl ? (
          /* Successfully Rendered State */
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "13px", color: "#10b981", fontWeight: "800", fontFamily: "var(--font-heading)", display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              KẾT XUẤT HOÀN TẤT!
            </div>
            <button 
              type="button"
              className="primary" 
              onClick={handleDownloadVideo}
              style={{ 
                width: "100%", 
                padding: "12px", 
                borderRadius: "var(--radius-pill)",
                background: "linear-gradient(135deg, var(--color-secondary), #f97316)",
                boxShadow: "0 4px 15px rgba(249, 115, 22, 0.25)",
                cursor: "pointer"
              }}
            >
              📥 Tải Video MP4
            </button>
            <button className="secondary" style={{ width: "100%", padding: "10px", fontSize: "11px", borderRadius: "var(--radius-pill)" }} onClick={onRender}>
              Xuất lại video
            </button>
            <button 
              type="button"
              className="secondary" 
              style={{ 
                width: "100%", 
                padding: "10px", 
                fontSize: "11px", 
                borderRadius: "var(--radius-pill)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: regeneratingTts ? "not-allowed" : "pointer"
              }} 
              disabled={rendering || regeneratingTts}
              onClick={onRegenerateTts}
            >
              {regeneratingTts ? "🔄 Đang tái tạo..." : "🔄 Làm mới giọng đọc (TTS)"}
            </button>
          </div>
        ) : (
          /* Trigger Render State */
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button 
              type="button"
              className="secondary"
              style={{ 
                width: "100%", 
                padding: "10px", 
                fontSize: "12px", 
                borderRadius: "var(--radius-pill)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: regeneratingTts ? "not-allowed" : "pointer"
              }}
              disabled={scenes.length === 0 || rendering || regeneratingTts}
              onClick={onRegenerateTts}
            >
              {regeneratingTts ? "🔄 Đang tái tạo..." : "🔄 Làm mới giọng đọc (TTS)"}
            </button>
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
