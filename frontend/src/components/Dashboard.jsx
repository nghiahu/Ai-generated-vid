import React, { useState } from "react";

export const Dashboard = ({ projects = [], onSelectProject, onDeleteProject }) => {
  const [playingProjectId, setPlayingProjectId] = useState(null);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Background Pastel Blobs for Glassmorphism depth */}
      <div style={{ position: "absolute", top: "10%", left: "5%", width: "350px", height: "350px", borderRadius: "50%", background: "rgba(37, 99, 235, 0.06)", filter: "blur(70px)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "15%", right: "8%", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(168, 85, 247, 0.05)", filter: "blur(80px)", zIndex: 0, pointerEvents: "none" }} />

      {/* Main Content Area */}
      <div style={{ padding: "50px 40px", maxWidth: "1080px", width: "100%", margin: "0 auto", flex: 1, zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "36px" }}>
          <h2 style={{ fontSize: "30px", fontFamily: "var(--font-heading)", fontWeight: "800", letterSpacing: "-0.02em" }}>
            Dự án của tôi
          </h2>
          <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 600 }}>{projects.length} Video</span>
        </div>

        {/* Project horizontal card list */}
        {projects.length === 0 ? (
          <div
            style={{
              border: "2.5px dashed rgba(15, 23, 42, 0.12)",
              padding: "100px 20px",
              textAlign: "center",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(12px)",
              boxShadow: "var(--shadow)"
            }}
          >
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", fontWeight: "600" }}>
              Chưa có dự án nào được tạo. Hãy nhấn vào mục <strong>Studio</strong> trên thanh điều hướng để sản xuất video mới!
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {projects.map((project) => {
              // Extract concatenated script excerpt
              const scriptExcerpt = project.scenes && project.scenes.length > 0 
                ? project.scenes.map(s => s.voiceover).filter(Boolean).join(" ") 
                : "";
              const shortScript = scriptExcerpt.length > 250 
                ? scriptExcerpt.substring(0, 247) + "..." 
                : scriptExcerpt || "Chưa có kịch bản chi tiết cho dự án này.";

              // Extract thumbnail from first scene
              const firstScene = project.scenes && project.scenes[0];
              const thumbnailUrl = firstScene && firstScene.mediaList && firstScene.mediaList.length > 0
                ? firstScene.mediaList[firstScene.selectedMediaIndex !== -1 ? (firstScene.selectedMediaIndex || 0) : 0]
                : "";

              // Format date: done - MM/DD/YYYY, HH:MM GMT+7
              const dateObj = new Date(project.createdAt);
              const dateStr = dateObj.toLocaleDateString("vi-VN");
              const timeStr = dateObj.toLocaleTimeString("vi-VN", { hour12: false, hour: '2-digit', minute: '2-digit' });
              const formattedDate = `done - ${dateStr}, ${timeStr} GMT+7`;

              return (
                <div
                  key={project.id}
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                    borderRadius: "var(--radius-lg)",
                    padding: "24px",
                    boxShadow: "var(--shadow)",
                    display: "flex",
                    gap: "24px",
                    position: "relative",
                    minHeight: "340px",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "var(--shadow)";
                  }}
                >
                  {/* Left Column: Vertical 9:16 Video Player/Thumbnail */}
                  <div style={{ width: "192px", height: "341px", flexShrink: 0 }}>
                    {playingProjectId === project.id ? (
                      <div style={{ width: "100%", height: "100%", backgroundColor: "#000", borderRadius: "12px", overflow: "hidden" }}>
                        <video
                          src={`http://localhost:5000/downloads/output_${project.id}.mp4`}
                          controls
                          autoPlay
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    ) : (
                      <div 
                        style={{ 
                          width: "100%", 
                          height: "100%", 
                          backgroundColor: "#0f172a", 
                          borderRadius: "12px", 
                          position: "relative", 
                          overflow: "hidden", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          border: "1px solid rgba(15, 23, 42, 0.08)",
                          boxShadow: "inset 0 0 40px rgba(0,0,0,0.5)"
                        }}
                      >
                        {thumbnailUrl ? (
                          <img 
                            src={thumbnailUrl.startsWith("http") ? thumbnailUrl : `http://localhost:5000${thumbnailUrl}`} 
                            alt={project.title} 
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                          />
                        ) : (
                          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", fontFamily: "var(--font-heading)", fontWeight: "700" }}>NO PREVIEW</div>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlayingProjectId(project.id);
                          }}
                          style={{
                            position: "absolute",
                            width: "52px",
                            height: "52px",
                            borderRadius: "50%",
                            backgroundColor: "#ffffff",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                            cursor: "pointer",
                            transition: "transform 0.15s ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#0f172a" style={{ marginLeft: "4px" }}>
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Title, script summary, download/publish options */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "4px 0" }}>
                    <div>
                      {/* Top Row: Title & Action buttons */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
                        <h3 
                          style={{ 
                            fontSize: "20px", 
                            fontFamily: "var(--font-heading)", 
                            fontWeight: "800", 
                            color: "var(--text-primary)",
                            lineHeight: "1.3"
                          }}
                        >
                          {project.title}
                        </h3>

                        {/* Top-Right Action Controls */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
                          {/* Close/Delete Action */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Bạn có chắc chắn muốn xóa dự án "${project.title}" không?`)) {
                                onDeleteProject(project.id);
                              }
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--text-secondary)",
                              fontSize: "18px",
                              padding: "4px",
                              boxShadow: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                            title="Xóa dự án"
                          >
                            ✕
                          </button>
                          
                          {/* Open in Studio button */}
                          <button
                            className="secondary"
                            onClick={() => onSelectProject(project.id)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: "700",
                              textTransform: "none",
                              letterSpacing: "0",
                              border: "1px solid rgba(15, 23, 42, 0.12)"
                            }}
                          >
                            Open in Studio
                          </button>
                        </div>
                      </div>

                      {/* Script Excerpt */}
                      <p 
                        style={{ 
                          color: "var(--text-secondary)", 
                          fontSize: "14px", 
                          lineHeight: "1.6", 
                          margin: "12px 0 8px 0"
                        }}
                      >
                        {shortScript}
                      </p>

                      {/* Status / Timestamp */}
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "monospace", marginBottom: "20px" }}>
                        {formattedDate}
                      </div>
                    </div>

                    {/* Footer sections: Downloads & Publish */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderTop: "1px solid rgba(15, 23, 42, 0.06)", paddingTop: "16px" }}>
                      
                      {/* DOWNLOADS Section */}
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                          DOWNLOADS
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <a 
                            href={`http://localhost:5000/downloads/output_${project.id}.mp4`} 
                            download
                            style={{ textDecoration: "none" }}
                          >
                            <button className="secondary" style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", textTransform: "none", letterSpacing: "0", display: "flex", alignItems: "center", gap: "6px" }}>
                              📥 MP4
                            </button>
                          </a>
                          {thumbnailUrl && (
                            <a 
                              href={thumbnailUrl.startsWith("http") ? thumbnailUrl : `http://localhost:5000${thumbnailUrl}`} 
                              download
                              target="_blank"
                              rel="noreferrer"
                              style={{ textDecoration: "none" }}
                            >
                              <button className="secondary" style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", textTransform: "none", letterSpacing: "0", display: "flex", alignItems: "center", gap: "6px" }}>
                                🖼️ Thumbnail
                              </button>
                            </a>
                          )}
                          {firstScene && firstScene.voiceoverAudioUrl && (
                            <a 
                              href={firstScene.voiceoverAudioUrl.startsWith("http") ? firstScene.voiceoverAudioUrl : `http://localhost:5000${firstScene.voiceoverAudioUrl}`} 
                              download
                              style={{ textDecoration: "none" }}
                            >
                              <button className="secondary" style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", textTransform: "none", letterSpacing: "0", display: "flex", alignItems: "center", gap: "6px" }}>
                                🔊 Voice
                              </button>
                            </a>
                          )}
                          <a 
                            href={`http://localhost:5000/downloads/subtitles_${project.id}.vtt`} 
                            download
                            style={{ textDecoration: "none" }}
                          >
                            <button className="secondary" style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", textTransform: "none", letterSpacing: "0", display: "flex", alignItems: "center", gap: "6px" }}>
                              📝 Subtitles
                            </button>
                          </a>
                        </div>
                      </div>

                      {/* PUBLISH TO PLATFORMS Section */}
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                          PUBLISH TO PLATFORMS
                        </div>
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                          Connect at least one social platform first.
                        </span>
                      </div>

                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
