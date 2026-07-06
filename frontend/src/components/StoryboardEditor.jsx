import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Player } from "@remotion/player";
import { MainComposition, safeParseFloat, getThemeBgStyle } from "../../../my-video/src/compositions/MainComposition";

const InlineScenePlayer = ({ playerRef, scene, config, isPlaying, onEnded }) => {
  const localPlayerRef = useRef(null);
  const sceneDurationFrames = Math.round(safeParseFloat(scene.duration) * 30);
  const lastFrame = Math.max(0, sceneDurationFrames - 1);

  // Forward the local ref to the parent-provided callback/ref object
  useEffect(() => {
    if (typeof playerRef === "function") {
      playerRef(localPlayerRef.current);
    } else if (playerRef) {
      playerRef.current = localPlayerRef.current;
    }
    return () => {
      if (typeof playerRef === "function") {
        playerRef(null);
      } else if (playerRef) {
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  // On initial mount, seek to last frame to show fully-rendered preview
  useEffect(() => {
    const { current } = localPlayerRef;
    if (!current) return;
    // Small delay to let Player fully initialize before seeking
    const t = setTimeout(() => {
      try {
        current.seekTo(lastFrame);
      } catch (err) {
        console.warn("Initial seek to last frame failed:", err);
      }
    }, 100);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle play/pause sync when isPlaying state changes
  useEffect(() => {
    const { current } = localPlayerRef;
    if (!current) return;

    if (!isPlaying) {
      // When stopping, pause and show last frame as thumbnail
      try {
        if (current.isPlaying()) {
          current.pause();
        }
        current.seekTo(lastFrame);
      } catch (err) {
        console.warn("Pause and seek to last frame failed: ", err);
      }
    } else {
      // When starting to play, rewind to frame 0 first
      try {
        current.seekTo(0);
      } catch (err) {
        console.warn("Rewind to frame 0 failed:", err);
      }
    }
  }, [isPlaying, lastFrame]);

  useEffect(() => {
    if (!isPlaying) return;

    const { current } = localPlayerRef;
    if (!current) return;

    const playVideo = () => {
      try {
        if (!current.isPlaying()) {
          current.play();
        }
      } catch (err) {
        console.warn("Programmatic playback failed: ", err);
      }
    };

    // Try playing immediately
    playVideo();

    // Set up multiple delayed retries to guarantee playback starting as media loads
    const timers = [
      setTimeout(playVideo, 50),
      setTimeout(playVideo, 150),
      setTimeout(playVideo, 300),
      setTimeout(playVideo, 600),
      setTimeout(playVideo, 1200)
    ];

    const handleEnded = () => {
      onEnded();
    };

    current.addEventListener("ended", handleEnded);
    return () => {
      timers.forEach(clearTimeout);
      current.removeEventListener("ended", handleEnded);
    };
  }, [isPlaying, onEnded]);

  return (
    <Player
      ref={localPlayerRef}
      component={MainComposition}
      inputProps={{ scenes: [scene], config }}
      durationInFrames={sceneDurationFrames}
      fps={30}
      compositionWidth={1080}
      compositionHeight={1920}
      initialFrame={lastFrame}
      style={{
        width: "100%",
        height: "100%",
      }}
      controls={false}
      autoPlay={false}
      acknowledgeRemotionLicense
    />
  );
};


const resolveEditorComponents = (scene, currentImg, layoutType) => {
  const list = [
    { type: 'title', height: 180, priority: 100, data: { text: scene.heading || "Untitled" } }
  ];

  if (scene.points) {
    scene.points.forEach((pt, idx) => {
      let p = "";
      if (typeof pt === "string") {
        p = pt.trim();
      } else if (pt && typeof pt === "object") {
        p = (pt.text || "").trim();
      }
      if (!p) return;

      const isCommandLine = p.startsWith("$") || p.includes("curl ") || p.includes("npm install") || p.includes("pip install") || p.includes("git clone");
      if (isCommandLine) {
        list.push({ type: 'terminal', height: 140, priority: 85, data: { code: p } });
        return;
      }

      const isBadges = p.includes(",") && (
        p.includes("⭐") || 
        p.includes("🔥") || 
        p.includes("sao") || 
        p.includes("MIT") || 
        p.split(",").every(part => part.trim().length > 0 && part.trim().length < 15)
      );
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
  config = {},
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
  const [uploadingScenes, setUploadingScenes] = useState({});
  const [playingSceneId, setPlayingSceneId] = useState(null);
  const playerRefs = useRef({});

  const handleImageUploadClick = (sceneId) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setUploadingScenes(prev => ({ ...prev, [sceneId]: true }));
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        try {
          const base64data = reader.result;
          // Gửi lên API Backend
          const response = await axios.post("http://localhost:5000/api/upload", {
            file: base64data
          });
          
          const newImageUrl = response.data.url;
          
          // Thêm vào mediaList của Scene hiện tại
          const scene = scenes.find(s => s.id === sceneId);
          if (!scene) return;
          const currentMediaList = scene.mediaList || [];
          const updatedMediaList = [...currentMediaList, newImageUrl];
          const newIndex = updatedMediaList.length - 1;

          // Cập nhật lên CSDL bằng API có sẵn
          onUpdateScene(sceneId, {
            ...scene,
            mediaList: updatedMediaList,
            selectedMediaIndex: newIndex
          });
          
        } catch (err) {
          console.error("Lỗi tải ảnh:", err);
          alert(`Không thể upload ảnh: ${err.response?.data?.error || err.message}`);
        } finally {
          setUploadingScenes(prev => ({ ...prev, [sceneId]: false }));
        }
      };
    };
    
    fileInput.click();
  };
  
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


  const getNormalizedPoints = (points) => {
    return (points || []).map((pt, idx) => {
      if (typeof pt === "string") {
        return { text: pt, animation: "slide-up", delay: Number((idx * 1.5).toFixed(1)) };
      }
      return {
        text: pt.text || "",
        animation: pt.animation || "slide-up",
        delay: typeof pt.delay === "number" ? pt.delay : Number((idx * 1.5).toFixed(1))
      };
    });
  };

  const handlePointChange = (sceneId, points, index, field, value) => {
    const norm = getNormalizedPoints(points);
    norm[index] = { ...norm[index], [field]: value };
    handleFieldChange(sceneId, "points", norm);
  };

  const handleAddPoint = (sceneId, points) => {
    const norm = getNormalizedPoints(points);
    norm.push({ text: "Ý chính mới", animation: "slide-up", delay: Number((norm.length * 1.2).toFixed(1)) });
    handleFieldChange(sceneId, "points", norm);
  };

  const handleRemovePoint = (sceneId, points, index) => {
    const norm = getNormalizedPoints(points);
    norm.splice(index, 1);
    handleFieldChange(sceneId, "points", norm);
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
                      backgroundColor: getThemeBgStyle(config?.videoTheme || scene.theme || "glassmorphism").backgroundColor, 
                      position: "relative", 
                      overflow: "hidden", 
                      display: "flex", 
                      flexDirection: "column", 
                      alignItems: "stretch", 
                      justifyContent: "stretch",
                    }}
                  >
                    {/* Always-visible Remotion Player - shows frame 0 when paused, plays on click */}
                    <div style={{ position: "relative", width: "100%", height: "100%" }}>
                      <InlineScenePlayer 
                        playerRef={(el) => {
                          if (el) {
                            playerRefs.current[scene.id] = el;
                          } else {
                            delete playerRefs.current[scene.id];
                          }
                        }}
                        scene={scene} 
                        config={{ ...config, ending: { enabled: false } }} 
                        isPlaying={playingSceneId === scene.id}
                        onEnded={() => setPlayingSceneId(null)} 
                      />

                      {/* Play / Pause overlay button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (playingSceneId === scene.id) {
                            // Pause: stop and reset
                            const player = playerRefs.current[scene.id];
                            if (player) {
                              try { player.pause(); } catch (_) {}
                            }
                            setPlayingSceneId(null);
                          } else {
                            // Play: pass user gesture event directly to bypass autoplay policy
                            const player = playerRefs.current[scene.id];
                            if (player) {
                              try { player.play(e); } catch (err) {
                                console.warn("Sync gesture play failed:", err);
                              }
                            }
                            setPlayingSceneId(scene.id);
                          }
                        }}
                        style={{
                          position: "absolute",
                          bottom: "16px",
                          left: "16px",
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          backgroundColor: playingSceneId === scene.id 
                            ? "rgba(255, 50, 50, 0.85)" 
                            : "rgba(255, 255, 255, 0.92)",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                          zIndex: 10,
                          fontSize: playingSceneId === scene.id ? "11px" : "13px",
                          color: playingSceneId === scene.id ? "#ffffff" : "#000000",
                          transition: "all 0.15s ease-in-out",
                          fontWeight: "bold",
                          boxSizing: "border-box",
                          paddingLeft: playingSceneId === scene.id ? "0" : "2px"
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                        title={playingSceneId === scene.id ? "Dừng preview" : "Phát preview phân cảnh này"}
                      >
                        {playingSceneId === scene.id ? "■" : "▶"}
                      </button>
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
                        <option value="Hero">Hero (Intro / Headline)</option>
                        <option value="Split Screen">Split Screen (Media + Info)</option>
                        <option value="Dashboard">Dashboard (Statistics)</option>
                        <option value="Feature Grid">Feature Grid (Bento Box)</option>
                        <option value="Timeline">Timeline (Steps)</option>
                        <option value="Comparison">Comparison (VS / Pros-Cons)</option>
                        <option value="Terminal">Terminal (Code Console)</option>
                        <option value="Gallery">Gallery (Screenshots)</option>
                        <option value="Laptop Mockup">Laptop Mockup (Double Device)</option>
                        <option value="Stats Banner">Stats Banner (Dashboard View)</option>
                        <option value="Three Columns">Three Columns (Pricing / Cards)</option>
                        <option value="Integration Cloud">Integration Cloud (API Graph)</option>
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

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label className="form-label-mono" style={{ fontSize: "11px", marginBottom: 0 }}>Các Khối Nội Dung (Points & Hiệu ứng)</label>
                      <button
                        type="button"
                        onClick={() => handleAddPoint(scene.id, scene.points)}
                        style={{
                          padding: "3px 8px",
                          fontFamily: "Space Grotesk",
                          fontWeight: "bold",
                          fontSize: "10px",
                          backgroundColor: "#00E5FF",
                          color: "#000000",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        + Thêm ý chính
                      </button>
                    </div>
                    
                    <div style={{ 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "10px", 
                      maxHeight: "260px", 
                      overflowY: "auto", 
                      paddingRight: "6px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "6px",
                      padding: "8px",
                      backgroundColor: "rgba(0, 0, 0, 0.15)"
                    }}>
                      {getNormalizedPoints(scene.points).length === 0 ? (
                        <div style={{ textAlign: "center", padding: "15px", fontSize: "12px", opacity: 0.4 }}>Chưa có ý chính nào. Bấm "+ Thêm ý chính" để tạo mới.</div>
                      ) : (
                        getNormalizedPoints(scene.points).map((pt, idx) => (
                          <div key={idx} style={{ 
                            display: "flex", 
                            flexDirection: "column", 
                            gap: "8px", 
                            padding: "8px", 
                            borderRadius: "6px", 
                            backgroundColor: "rgba(255, 255, 255, 0.02)", 
                            border: "1px solid rgba(255, 255, 255, 0.05)" 
                          }}>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <span style={{ fontSize: "11px", opacity: 0.4, fontFamily: "monospace" }}>#{idx + 1}</span>
                              <input
                                type="text"
                                className="form-input-mono"
                                value={pt.text}
                                onChange={(e) => handlePointChange(scene.id, scene.points, idx, "text", e.target.value)}
                                placeholder="Nhập nội dung hiển thị..."
                                style={{ padding: "6px 8px", fontSize: "12px", flex: 1 }}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemovePoint(scene.id, scene.points, idx)}
                                style={{ 
                                  background: "none", 
                                  border: "none", 
                                  color: "#ff4d4d", 
                                  cursor: "pointer", 
                                  fontSize: "14px",
                                  padding: "0 4px"
                                }}
                                title="Xóa ý này"
                              >
                                🗑️
                              </button>
                            </div>
                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                              {/* Animation Select */}
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                                <span style={{ fontSize: "9px", opacity: 0.4, fontFamily: "Space Grotesk" }}>Hiệu ứng</span>
                                <select
                                  className="form-input-mono"
                                  value={pt.animation}
                                  onChange={(e) => handlePointChange(scene.id, scene.points, idx, "animation", e.target.value)}
                                  style={{ padding: "4px 6px", fontSize: "11px", height: "auto" }}
                                >
                                  <option value="slide-up">Slide Up (Trượt lên)</option>
                                  <option value="scale-in">Scale In (Phóng to nảy)</option>
                                  <option value="fade-in">Fade In (Mờ dần)</option>
                                  <option value="blur-in">Blur In (Làm nét)</option>
                                  <option value="slide-left">Slide Left (Trượt trái)</option>
                                  <option value="slide-right">Slide Right (Trượt phải)</option>
                                </select>
                              </div>
                              {/* Delay Range Slider */}
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px" }}>
                                  <span style={{ opacity: 0.4, fontFamily: "Space Grotesk" }}>Độ trễ xuất hiện</span>
                                  <span style={{ color: "#00E5FF", fontWeight: "bold" }}>{pt.delay}s</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max={scene.duration || 10}
                                  step="0.1"
                                  value={pt.delay}
                                  onChange={(e) => handlePointChange(scene.id, scene.points, idx, "delay", parseFloat(e.target.value))}
                                  style={{ width: "100%", height: "4px", accentColor: "#00E5FF", cursor: "pointer" }}
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
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
                      <button 
                        type="button"
                        onClick={() => handleImageUploadClick(scene.id)}
                        disabled={uploadingScenes[scene.id]}
                        style={{ background: "none", border: "none", fontSize: "11px", fontFamily: "Space Grotesk", fontWeight: "bold", cursor: "pointer", textDecoration: "underline" }}
                      >
                        {uploadingScenes[scene.id] ? "⏳ Uploading..." : "📁 Upload"}
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
