import React, { useState } from "react";
import axios from "axios";

const resolveEditorComponents = (scene, currentImg, layoutType) => {
  const list = [
    { type: 'title', height: 180, priority: 100, data: { text: scene.heading || "Untitled" } }
  ];

  if (scene.points) {
    scene.points.forEach((pt, idx) => {
      const p = pt.trim();
      if (!p) return;

      const isCommandLine = p.startsWith("$") || p.includes("curl ") || p.includes("npm install") || p.includes("pip install") || p.includes("git clone");
      if (isCommandLine) {
        list.push({ type: 'terminal', height: 140, priority: 85, data: { code: p } });
        return;
      }

      const isBadges = p.includes(",") && (p.includes("⭐") || p.includes("🔥") || p.includes("sao") || p.includes("MIT") || p.length < 60);
      if (isBadges) {
        list.push({ type: 'badge_row', height: 80, priority: 50, data: { badges: p.split(",").map(b => b.trim()).filter(b => b.length > 0) } });
        return;
      }

      const isHeroMetric = p.startsWith("-") || p.startsWith("+") || p.match(/^[+-]?\d+%/i);
      if (isHeroMetric) {
        list.push({ type: 'hero_metric', height: 180, priority: 90, data: { text: p } });
        return;
      }

      list.push({ type: 'feature_card', height: 100, priority: 70, data: { text: p } });
    });
  }

  // Filter based on 1600px budget (scaled down on editor layout but logically same)
  let active = [...list];
  while (active.length > 0) {
    const totalHeight = active.reduce((sum, item) => sum + item.height, 0) + (active.length - 1) * 30;
    if (totalHeight <= 1550) break;
    
    let lowestIdx = 0;
    for (let i = 1; i < active.length; i++) {
      if (active[i].priority < active[lowestIdx].priority) lowestIdx = i;
    }
    active.splice(lowestIdx, 1);
  }

  return active;
};

export const StoryboardEditor = ({ 
  scenes = [], 
  projectId, 
  onGenerateStoryboard, 
  onUpdateScene, 
  loading, 
  loadingMessage,
  selectedSceneId,
  onSelectScene,
  mode = "editor"
}) => {
  const [topicText, setTopicText] = useState("");
  const [scriptText, setScriptText] = useState("");
  
  const [searchQueries, setSearchQueries] = useState({});
  const [searchingImages, setSearchingImages] = useState({});

  const handleGenerate = () => {
    if (!scriptText.trim()) return;
    onGenerateStoryboard(scriptText);
  };

  const handleFieldChange = (sceneId, field, value) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    onUpdateScene(sceneId, {
      ...scene,
      [field]: value
    });
  };

  const handlePointsChangeTextarea = (sceneId, textValue) => {
    const lines = textValue.split("\n").filter(line => line.trim() !== "");
    handleFieldChange(sceneId, "points", lines);
  };

  // Search images via backend Unsplash search API
  const handleSearchImages = async (sceneId) => {
    const query = searchQueries[sceneId];
    if (!query || !query.trim()) return;

    setSearchingImages(prev => ({ ...prev, [sceneId]: true }));
    try {
      const response = await axios.get(`http://localhost:5000/api/media/search?query=${encodeURIComponent(query)}`);
      const images = response.data;
      if (images && images.length > 0) {
        handleFieldChange(sceneId, "mediaList", images);
        handleFieldChange(sceneId, "selectedMediaIndex", 0);
      }
    } catch (error) {
      console.error("Failed to search Unsplash images:", error);
    } finally {
      setSearchingImages(prev => ({ ...prev, [sceneId]: false }));
    }
  };

  const handleAddScene = async () => {
    try {
      await axios.post(`http://localhost:5000/api/projects/${projectId}/scenes`, {
        heading: "Cảnh Mới",
        visualLayout: "Intro Profile",
        points: ["Ý chính mới 1", "Ý chính mới 2"],
        voiceover: "Đây là lời thoại của phân cảnh mới thêm.",
        duration: 5.0
      });
      window.location.reload();
    } catch (err) {
      console.error("Failed to add new scene:", err);
    }
  };

  const handleDeleteScene = async (sceneId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phân cảnh này?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/projects/${projectId}/scenes/${sceneId}`);
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete scene:", err);
    }
  };

  // MODE 1: SETUP & SCRIPT INPUT
  if (mode === "setup") {
    return (
      <div className="custom-scrollbar" style={{ flex: 1, padding: "30px", display: "flex", flexDirection: "column", gap: "25px", overflowY: "auto", boxSizing: "border-box" }}>
        {/* Tab Selector matching Stitch */}
        <div style={{ display: "flex", borderBottom: "2px solid #000000", gap: "30px", marginBottom: "5px" }}>
          <button className="tab-active" style={{ background: "none", border: "none", fontSize: "14px", fontWeight: "bold", paddingBottom: "12px", cursor: "pointer", textTransform: "uppercase" }}>Kịch bản AI</button>
          <button className="tab-inactive" style={{ background: "none", border: "none", fontSize: "14px", paddingBottom: "12px", cursor: "pointer", textTransform: "uppercase" }}>Bài viết thành Video</button>
          <button className="tab-inactive" style={{ background: "none", border: "none", fontSize: "14px", paddingBottom: "12px", cursor: "pointer", textTransform: "uppercase" }}>Kịch bản thủ công</button>
        </div>

        {loading ? (
          <div className="border-strict" style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "350px", backgroundColor: "#ffffff", boxShadow: "4px 4px 0px 0px #000000" }}>
            <div style={{
              width: "40px",
              height: "40px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #000000",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <p style={{ marginTop: "20px", fontFamily: "Space Grotesk", fontWeight: "bold" }}>
              {loadingMessage || "AI đang phân tách kịch bản..."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1 }}>
            <div>
              <label className="form-label-mono" style={{ fontSize: "15px" }}>Chủ đề video</label>
              <input 
                type="text"
                className="form-input-mono"
                value={topicText}
                onChange={(e) => setTopicText(e.target.value)}
                placeholder="Ví dụ: Lợi ích của việc thiền định mỗi ngày..."
                style={{ padding: "14px", fontSize: "15px" }}
              />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "250px" }}>
              <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
                <label className="form-label-mono" style={{ fontSize: "15px", marginBottom: 0 }}>Kịch bản chi tiết</label>
                <span style={{ fontSize: "12px", color: "#555555", fontFamily: "Inter" }}>~150 words</span>
              </div>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder="Ví dụ: Thiền định không chỉ là ngồi yên. Đó là một cách để thiết lập lại tâm trí của bạn..."
                className="form-input-mono"
                style={{ flex: 1, padding: "14px", fontSize: "15px", resize: "none", lineHeight: "1.6" }}
              />
            </div>

            <div style={{ borderTop: "2px solid #000000", paddingTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <button 
                className="btn-mono btn-mono-primary"
                style={{ width: "100%", padding: "16px", fontSize: "15px", letterSpacing: "0.05em" }}
                onClick={handleGenerate}
              >
                🪄 &nbsp; TẠO STORYBOARD
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MODE 2: STORYBOARD SCENE EDITOR LIST
  return (
    <div className="custom-scrollbar" style={{ flex: 1, padding: "30px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "25px", boxSizing: "border-box" }}>
      <div style={{ borderBottom: "2px solid #000000", paddingBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontFamily: "Space Grotesk", fontSize: "24px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "-0.02em" }}>
          Storyboard Editor
        </h2>
        <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#555555" }}>
          SCENES: {scenes.length}
        </span>
      </div>

      {scenes.length === 0 ? (
        <div className="border-strict" style={{ borderStyle: "dashed", padding: "60px 20px", textAlign: "center", backgroundColor: "#ffffff" }}>
          <p style={{ color: "#555555", fontSize: "14px", marginBottom: "15px" }}>
            Chưa có phân cảnh nào được tạo. Hãy viết kịch bản ở tab "Thiết lập & Kịch bản" trước.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {scenes.map((scene, index) => {
            const isSelected = selectedSceneId === scene.id;
            const currentImg = scene.mediaList && scene.mediaList.length > 0 && scene.selectedMediaIndex !== -1
              ? scene.mediaList[scene.selectedMediaIndex || 0] 
              : "";

            return (
              <article
                key={scene.id}
                onClick={() => onSelectScene(scene.id)}
                style={{
                  backgroundColor: "#ffffff",
                  border: "2px solid #000000",
                  borderRadius: "4px",
                  padding: "24px",
                  boxShadow: isSelected ? "4px 4px 0px 0px #000000" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease-in-out",
                  position: "relative",
                  display: "flex",
                  gap: "24px"
                }}
              >
                {/* Scene badge */}
                <div style={{
                  position: "absolute",
                  top: "-12px",
                  left: "20px",
                  backgroundColor: "#000000",
                  color: "#ffffff",
                  padding: "2px 10px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  borderRadius: "4px",
                  border: "2px solid #ffffff",
                  fontFamily: "Space Grotesk",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}>
                  <span>SCENE {index + 1 < 10 ? `0${index + 1}` : index + 1}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteScene(scene.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ff3333",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: "10px",
                      padding: "0 2px",
                      textTransform: "uppercase"
                    }}
                    title="Xóa phân cảnh"
                  >
                    ✕ Delete
                  </button>
                </div>

                {/* Left Side: 9:16 Layout Preview Card */}
                <div style={{ width: "192px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label className="form-label-mono" style={{ fontSize: "11px" }}>Preview (9:16)</label>
                  <div 
                    className="border-strict"
                    style={{ 
                      aspectRatio: "9/16", 
                      backgroundColor: "#e2e2e2", 
                      position: "relative", 
                      overflow: "hidden", 
                      display: "flex", 
                      flexDirection: "column", 
                      alignItems: "center", 
                      justifyContent: "center",
                      padding: "16px",
                      textAlign: "center"
                    }}
                  >
                    {/* Background media if selected */}
                    {currentImg ? (
                      <img 
                        src={currentImg} 
                        style={{ 
                          position: "absolute", 
                          top: 0,
                          bottom: 0,
                          left: 0,
                          width: scene.visualLayout === "Split Screen" ? "45%" : "100%",
                          height: "100%", 
                          objectFit: "cover", 
                          zIndex: 0, 
                          filter: "grayscale(100%) opacity(40%)",
                          borderRight: scene.visualLayout === "Split Screen" ? "2px solid #000000" : "none"
                        }} 
                        alt="bg preview" 
                      />
                    ) : (
                      <div 
                        style={{ 
                          position: "absolute", 
                          top: 0,
                          bottom: 0,
                          left: 0,
                          width: scene.visualLayout === "Split Screen" ? "45%" : "100%",
                          height: "100%", 
                          zIndex: 0,
                          background: `radial-gradient(circle at center, ${(scene.accentColor || "#FFB7C5")}33 0%, #090d1a 100%)`,
                          borderRight: scene.visualLayout === "Split Screen" ? "2px solid #000000" : "none"
                        }} 
                      />
                    )}

                    {/* Component-based Dynamic Preview Area */}
                    <div style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: scene.visualLayout === "Split Screen" ? "45%" : 0,
                      right: 0,
                      zIndex: 1,
                      padding: "12px 8px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "stretch",
                      gap: "8px",
                      boxSizing: "border-box"
                    }}>
                      {resolveEditorComponents(scene, currentImg, scene.visualLayout).map((comp, idx) => {
                        if (comp.type === "title") {
                          return (
                            <div key={idx} className="border-strict" style={{ borderWidth: "1px", backgroundColor: "#ffffff", padding: "4px", width: "100%", boxShadow: "1.5px 1.5px 0px 0px #000" }}>
                              <h3 style={{ fontSize: "9px", fontFamily: "Space Grotesk, sans-serif", fontWeight: "900", lineHeight: "1.1", textTransform: "uppercase", margin: 0 }}>
                                {comp.data.text}
                              </h3>
                            </div>
                          );
                        }
                        if (comp.type === "terminal") {
                          return (
                            <div key={idx} style={{ backgroundColor: "#000000", color: "#00FF66", fontFamily: "monospace", padding: "4px", fontSize: "7.5px", borderRadius: "2px", textAlign: "left", wordBreak: "break-all" }}>
                              $ {comp.data.code}
                            </div>
                          );
                        }
                        if (comp.type === "hero_metric") {
                          return (
                            <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "2px", backgroundColor: "#ffffff", border: "1px solid #000", padding: "3px", boxShadow: "1px 1px 0px 0px #000" }}>
                              <span style={{ fontSize: "11px", fontWeight: "900", color: scene.accentColor || "#FFB7C5", fontFamily: "Space Grotesk", lineHeight: "1" }}>{comp.data.text.split("—")[0]}</span>
                              {comp.data.text.includes("—") && (
                                <span style={{ fontSize: "7px", color: "#666", lineHeight: "1" }}>{comp.data.text.split("—")[1]}</span>
                              )}
                            </div>
                          );
                        }
                        if (comp.type === "feature_card") {
                          return (
                            <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "3px", fontSize: "7.5px", fontWeight: "700", textAlign: "left", textTransform: "uppercase", fontFamily: "Inter" }}>
                              <span style={{ width: "3.5px", height: "3.5px", backgroundColor: "#000000", marginTop: "3px", flexShrink: 0 }}></span>
                              <span style={{ flex: 1 }}>{comp.data.text}</span>
                            </div>
                          );
                        }
                        if (comp.type === "badge_row") {
                          return (
                            <div key={idx} style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                              {comp.data.badges.map((bg, bIdx) => (
                                <span key={bIdx} style={{ fontSize: "6.5px", fontWeight: "bold", padding: "2px 4px", border: "1px solid #000000", backgroundColor: "#ffffff", color: "#000" }}>
                                  {bg}
                                </span>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Side: Editing Inputs */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label className="form-label-mono" style={{ fontSize: "11px" }}>Layout Family</label>
                      <select 
                        className="form-input-mono"
                        value={scene.visualLayout === "Split Grid" ? "Body / Bullet Points" : "Opening / Headline"}
                        onChange={(e) => {}}
                        style={{ padding: "8px", fontSize: "12px" }}
                      >
                        <option>Opening / Headline</option>
                        <option>Body / Bullet Points</option>
                        <option>Closing / CTA</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label-mono" style={{ fontSize: "11px" }}>Visual Layout</label>
                      <select 
                        className="form-input-mono"
                        value={scene.visualLayout} 
                        onChange={(e) => handleFieldChange(scene.id, "visualLayout", e.target.value)}
                        style={{ padding: "8px", fontSize: "12px" }}
                      >
                        <option value="Intro Profile">Intro Profile</option>
                        <option value="Github Status Hook">Github Status Hook</option>
                        <option value="Split Grid">Split Grid</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label-mono" style={{ fontSize: "11px" }}>Duration (Sec)</label>
                      <input 
                        className="form-input-mono"
                        type="number" 
                        step="0.5"
                        value={scene.duration} 
                        onChange={(e) => handleFieldChange(scene.id, "duration", parseFloat(e.target.value) || 6.0)}
                        style={{ padding: "8px", fontSize: "12px" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label-mono" style={{ fontSize: "11px" }}>Heading</label>
                    <input 
                      className="form-input-mono"
                      type="text" 
                      value={scene.heading} 
                      onChange={(e) => handleFieldChange(scene.id, "heading", e.target.value)}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label className="form-label-mono" style={{ fontSize: "11px" }}>Hiệu ứng hạt (Theme)</label>
                      <select 
                        className="form-input-mono"
                        value={scene.theme || "default"} 
                        onChange={(e) => handleFieldChange(scene.id, "theme", e.target.value)}
                        style={{ padding: "8px", fontSize: "12px" }}
                      >
                        <option value="default">Mặc định (Bokeh)</option>
                        <option value="japan">Nhật Bản (Sakura)</option>
                        <option value="tech">Công nghệ (Digital)</option>
                        <option value="finance">Tài chính (Gold)</option>
                        <option value="nature">Thiên nhiên (Lá rụng)</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label-mono" style={{ fontSize: "11px" }}>Màu nhấn (Accent HEX)</label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input 
                          className="form-input-mono"
                          type="color" 
                          value={scene.accentColor || "#FFB7C5"} 
                          onChange={(e) => handleFieldChange(scene.id, "accentColor", e.target.value)}
                          style={{ width: "35px", height: "35px", padding: 0, cursor: "pointer", border: "2px solid #000" }}
                        />
                        <input 
                          className="form-input-mono"
                          type="text" 
                          value={scene.accentColor || "#FFB7C5"} 
                          onChange={(e) => handleFieldChange(scene.id, "accentColor", e.target.value)}
                          style={{ padding: "8px", fontSize: "12px", flex: 1 }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="form-label-mono" style={{ fontSize: "11px" }}>Points (One per line)</label>
                    <textarea 
                      className="form-input-mono"
                      value={scene.points ? scene.points.join("\n") : ""} 
                      onChange={(e) => handlePointsChangeTextarea(scene.id, e.target.value)}
                      style={{ height: "70px", fontSize: "13px", resize: "none" }}
                    />
                  </div>

                  <div>
                    <label className="form-label-mono" style={{ fontSize: "11px" }}>Voiceover Script</label>
                    <textarea 
                      className="form-input-mono"
                      value={scene.voiceover} 
                      onChange={(e) => handleFieldChange(scene.id, "voiceover", e.target.value)}
                      style={{ height: "60px", fontSize: "13px", resize: "none" }}
                    />
                  </div>

                  {/* Unsplash Search & Suggestion Panel */}
                  <div style={{ borderTop: "1px solid #000000", paddingTop: "15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <label className="form-label-mono" style={{ fontSize: "11px", marginBottom: 0 }}>Background Media</label>
                      <button style={{ background: "none", border: "none", fontSize: "11px", fontFamily: "Space Grotesk", fontWeight: "bold", cursor: "pointer", textDecoration: "underline" }}>
                        📁 Upload
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                      <input
                        className="form-input-mono"
                        type="text"
                        placeholder="Search English keywords (e.g., code, zen)..."
                        value={searchQueries[scene.id] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchQueries(prev => ({ ...prev, [scene.id]: val }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSearchImages(scene.id);
                        }}
                        style={{ padding: "8px", fontSize: "12px" }}
                      />
                      <button 
                        className="btn-mono btn-mono-secondary" 
                        style={{ padding: "8px 15px", whiteSpace: "nowrap", height: "auto" }}
                        disabled={searchingImages[scene.id]}
                        onClick={() => handleSearchImages(scene.id)}
                      >
                        {searchingImages[scene.id] ? "..." : "Tìm"}
                      </button>
                    </div>

                    {/* Image Suggestions Grid */}
                    <div className="custom-scrollbar" style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "5px" }}>
                      {/* Default Accent HEX Gradient choice */}
                      <div
                        onClick={() => handleFieldChange(scene.id, "selectedMediaIndex", -1)}
                        style={{
                          width: "48px",
                          height: "48px",
                          flexShrink: 0,
                          borderRadius: "4px",
                          border: scene.selectedMediaIndex === -1 ? "3px solid #000000" : "1px solid #cccccc",
                          background: `linear-gradient(135deg, ${scene.accentColor || "#FFB7C5"}aa 0%, #060813 100%)`,
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "8px",
                          fontWeight: "bold",
                          color: "#ffffff",
                          textAlign: "center",
                          padding: "2px",
                          fontFamily: "Space Grotesk, sans-serif",
                          lineHeight: "1.1",
                          boxSizing: "border-box",
                          textTransform: "uppercase"
                        }}
                      >
                        Nền màu nhấn
                      </div>

                      {scene.mediaList && scene.mediaList.map((imgUrl, imgIdx) => (
                        <div
                          key={imgIdx}
                          onClick={() => handleFieldChange(scene.id, "selectedMediaIndex", imgIdx)}
                          style={{
                            width: "48px",
                            height: "48px",
                            flexShrink: 0,
                            borderRadius: "4px",
                            border: scene.selectedMediaIndex === imgIdx ? "3px solid #000000" : "1px solid #cccccc",
                            overflow: "hidden",
                            cursor: "pointer"
                          }}
                        >
                          <img src={imgUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="media option" />
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </article>
            );
          })}
          
          {/* Add Scene Button */}
          <button 
            type="button"
            className="btn-mono btn-mono-secondary"
            onClick={handleAddScene}
            style={{ 
              width: "100%", 
              border: "2px dashed #000000", 
              boxShadow: "none",
              padding: "24px", 
              borderRadius: "4px", 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              gap: "8px" 
            }}
          >
            <span style={{ fontSize: "28px" }}>➕</span>
            <span style={{ fontFamily: "Space Grotesk", fontWeight: "bold", textTransform: "uppercase", fontSize: "13px" }}>
              Add New Scene
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
