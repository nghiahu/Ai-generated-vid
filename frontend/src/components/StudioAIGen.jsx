import React, { useState, useEffect, useRef } from "react";
import { Player } from "@remotion/player";
import * as Remotion from "remotion";
import * as LucideIcons from "lucide-react";
import { api } from "../services/api";
import axios from "axios";
import { MainComposition } from "../../../my-video/src/compositions/MainComposition";
import { DynamicSubtitle } from "../../../my-video/src/components/DynamicSubtitle";

// Safe ES6 Proxy for Lucide Icons to prevent runtime undefined component crashes
const SafeLucideIcons = new Proxy(LucideIcons, {
  get: (target, prop) => {
    if (typeof prop === "symbol" || prop === "then" || prop === "__esModule" || prop === "default") {
      return target[prop];
    }
    if (prop in target && target[prop]) {
      return target[prop];
    }
    // Safe Fallback Icon Component for hallucinated or missing icon names
    const SafeFallbackIcon = (props) => {
      const FallbackComp = target.Sparkles || target.HelpCircle || target.Zap || (() => null);
      return React.createElement(FallbackComp, props);
    };
    return SafeFallbackIcon;
  }
});

// Expose globals for runtime dynamic import of Blob URLs
window.React = React;
window.Remotion = Remotion;
window.LucideIcons = SafeLucideIcons;

// Dynamic loader: compiles JS string from Sucrase into live React Component
async function loadComponentFromJS(compiledJS) {
  if (!compiledJS || typeof compiledJS !== "string" || compiledJS.trim() === "") {
    return { Component: null, error: "Empty code content", isEmpty: true };
  }
  try {
    // Rewrite React, Remotion, and Lucide React imports robustly to global window variables
    let rewrittenJS = compiledJS;

    // Match any import from "react" (including multiline, default, and named imports)
    rewrittenJS = rewrittenJS.replace(/import\s+([\s\S]*?)\s+from\s+['"]react['"];?/gi, (match, imports) => {
      let result = "const React = window.React;";
      if (imports.includes("{")) {
        const named = imports.match(/\{([\s\S]*?)\}/);
        if (named && named[1]) {
          result += `\nconst { ${named[1].replace(/[\r\n]+/g, " ").trim()} } = window.React;`;
        }
      }
      return result;
    });

    // Match any import from "remotion" (including multiline and named imports)
    rewrittenJS = rewrittenJS.replace(/import\s+([\s\S]*?)\s+from\s+['"]remotion['"];?/gi, (match, imports) => {
      if (imports.includes("{")) {
        const named = imports.match(/\{([\s\S]*?)\}/);
        if (named && named[1]) {
          const cleanImports = named[1].replace(/[\r\n]+/g, " ").trim();
          return `const { ${cleanImports} } = window.Remotion;`;
        }
      }
      return `const Remotion = window.Remotion;`;
    });

    // Match any import from "lucide-react" (including named imports with aliases)
    rewrittenJS = rewrittenJS.replace(/import\s+([\s\S]*?)\s+from\s+['"]lucide-react['"];?/gi, (match, imports) => {
      if (imports.includes("{")) {
        const named = imports.match(/\{([\s\S]*?)\}/);
        if (named && named[1]) {
          const cleanImports = named[1].replace(/[\r\n]+/g, " ").replace(/\s+as\s+/gi, ": ").trim();
          return `const { ${cleanImports} } = window.LucideIcons;`;
        }
      }
      return `const LucideIcons = window.LucideIcons;`;
    });

    // Strip any other unsupported external package imports
    rewrittenJS = rewrittenJS.replace(/import\s+([\s\S]*?)\s+from\s+['"](?!react|remotion|lucide-react)[^'"]+['"];?/gi, "");

    const blob = new Blob([rewrittenJS], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const mod = await import(/* @vite-ignore */ url);
    // Keep blob URL alive briefly so the browser has time to instantiate the module
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch (_) { }
    }, 5000);

    const comp = mod.default || mod.GeneratedScene;
    if (!comp) {
      return { Component: null, error: "Could not find exported default or GeneratedScene component", isEmpty: false };
    }
    return { Component: comp, error: null, isEmpty: false };
  } catch (err) {
    console.error("Lỗi khi dynamic import Blob URL:", err);
    return { Component: null, error: err.message, isEmpty: false };
  }
}

// Wrapper component for Remotion Player
const SceneWrapper = ({ Component, audioUrl, loadError, isEmpty, heading, visualPattern, scene = {}, subtitlesJson = [], fps = 30, isGenerating = false, isRegenerating = false, onRegenerate = null }) => {
  // Skeleton / Spinner when scene is pending generation
  if ((isGenerating || isRegenerating) && (!Component || isEmpty)) {
    return (
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        background: "linear-gradient(135deg, #090d16 0%, #0f172a 100%)",
        color: "#ffffff",
        fontFamily: "'Be Vietnam Pro', sans-serif",
        boxSizing: "border-box",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Animated Spinner Icon */}
        <div style={{
          width: "50px",
          height: "50px",
          border: "4px solid rgba(255, 255, 255, 0.1)",
          borderTop: "4px solid #3b82f6",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: "20px",
          zIndex: 10
        }} />

        <h4 style={{ margin: "0 0 10px 0", color: "#60a5fa", fontSize: "17px", fontWeight: "700", zIndex: 10 }}>
          🤖 AI đang biên dịch phân cảnh...
        </h4>
        <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", margin: "0 0 16px 0", maxWidth: "85%", lineHeight: 1.5, zIndex: 10 }}>
          Đang khởi tạo React TSX code & giọng đọc TTS cho <strong>{visualPattern || "Phân cảnh"}</strong> ({heading || "..."})
        </p>

        <div style={{
          padding: "6px 16px",
          borderRadius: "20px",
          background: "rgba(59, 130, 246, 0.15)",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          color: "#93c5fd",
          fontSize: "12px",
          fontWeight: 600,
          zIndex: 10
        }}>
          {isRegenerating ? "🔄 Đang sinh lại riêng phân cảnh..." : "⚡ Đang xử lý tự động..."}
        </div>
      </div>
    );
  }

  // Error Card when compilation failed or code remains missing after generation finished
  if (loadError || (!Component && isEmpty)) {
    const errorText = isEmpty ? "Chưa nhận được mã nguồn TSX từ AI Gemini." : loadError;
    return (
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px",
        background: "linear-gradient(135deg, #181825 0%, #11111b 100%)",
        color: "#f38ba8",
        fontFamily: "sans-serif",
        boxSizing: "border-box",
        textAlign: "center",
        zIndex: 50
      }}>
        <span style={{ fontSize: "36px", marginBottom: "10px" }}>⚠️</span>
        <h4 style={{ margin: "0 0 8px 0", color: "#f38ba8", fontSize: "16px", fontWeight: "bold" }}>
          KHÔNG THỂ HIỂN THỊ PHÂN CẢNH
        </h4>
        <p style={{ fontSize: "12px", color: "#cdd6f4", margin: "0 0 12px 0", lineHeight: 1.4, maxWidth: "90%" }}>
          Phân cảnh <strong>{visualPattern}</strong> ({heading}) gặp sự cố:
        </p>
        <div style={{
          width: "100%",
          background: "#09090e",
          border: "1px solid rgba(243, 139, 168, 0.2)",
          padding: "10px",
          borderRadius: "8px",
          fontSize: "11px",
          color: "#a6e3a1",
          textAlign: "left",
          overflow: "auto",
          maxHeight: "160px",
          whiteSpace: "pre-wrap",
          boxSizing: "border-box",
          marginBottom: "16px",
          fontFamily: "monospace"
        }}>
          {errorText}
        </div>

        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isRegenerating}
            style={{
              padding: "9px 18px",
              borderRadius: "24px",
              background: isRegenerating ? "#6c7086" : "linear-gradient(135deg, #2563eb, #3b82f6)",
              color: "#ffffff",
              border: "none",
              fontWeight: "700",
              fontSize: "13px",
              cursor: isRegenerating ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease"
            }}
          >
            {isRegenerating ? "⏳ Đang sinh lại..." : "🔄 Thử sinh lại phân cảnh này"}
          </button>
        )}
      </div>
    );
  }

  const sceneDurationSec = (scene?.durationFrames || 150) / (fps || 30);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#030712" }}>
      {Component ? (
        <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
          <Component fps={fps} scene={scene} subtitlesJson={subtitlesJson} />
          {/* Central Outer Subtitle Layer */}
          <DynamicSubtitle
            voiceover={scene?.voiceover || ""}
            durationSeconds={sceneDurationSec}
            subtitlesJson={subtitlesJson || scene?.subtitlesJson || scene?.voiceoverTtsJson}
            accentColor="#f97316"
          />
        </div>
      ) : (
        <div style={{ color: "#fff", display: "grid", placeItems: "center", height: "100%", fontFamily: "sans-serif" }}>
          Đang tải giao diện...
        </div>
      )}
      {audioUrl && (
        <Remotion.Audio src={`http://localhost:5000${audioUrl}`} />
      )}
    </div>
  );
};

export const StudioAIGen = ({ projectId = null, onBack = null, onUpdateProjectsList = null, onGenerationSuccess = null }) => {
  const [script, setScript] = useState("");
  const [theme, setTheme] = useState("ai_hub_grid");
  const [targetLength, setTargetLength] = useState("Short (~60s)");
  const [language, setLanguage] = useState("Vietnamese");
  const [voice, setVoice] = useState("duythanh");
  const [bgImage, setBgImage] = useState("");
  const [refImages, setRefImages] = useState([]);
  const [mediaModalMode, setMediaModalMode] = useState("background"); // "background" or "references"
  const [bgm, setBgm] = useState("Chill Lofi Beats");
  const [bgmVolume, setBgmVolume] = useState(0.025);

  // UI View Modes
  const [editorMode, setEditorMode] = useState("setup"); // "setup" or "preview"
  const [previewType, setPreviewType] = useState("SCENE"); // "SCENE" or "MASTER"

  // VDE Themes state & Theme Modal
  const [vdeThemes, setVdeThemes] = useState([]);
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Media Modal state
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaTab, setMediaTab] = useState("YOUR_MEDIA");
  const [stockQuery, setStockQuery] = useState("");
  const [stockResults, setStockResults] = useState([]);
  const [previousMedia, setPreviousMedia] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Watermark state
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkText, setWatermarkText] = useState("yupclip.com");
  const [watermarkPosition, setWatermarkPosition] = useState("top-right");
  const [watermarkLogo, setWatermarkLogo] = useState("");

  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Render & Export MP4 state
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedFrames, setRenderedFrames] = useState(0);
  const [renderTotalFrames, setRenderTotalFrames] = useState(0);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState(null);

  const getInitialActiveSceneIndex = () => {
    try {
      const stored = localStorage.getItem("studio_aigen_active_scene");
      if (stored !== null) return parseInt(stored, 10) || 0;
    } catch (e) { }
    return 0;
  };

  const [rawScenes, setRawScenes] = useState([]);
  const [loadedScenes, setLoadedScenes] = useState([]);
  const [activeSceneIndex, setActiveSceneIndex] = useState(getInitialActiveSceneIndex);
  const [regeneratingIndex, setRegeneratingIndex] = useState(null);

  // Sync activeSceneIndex to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("studio_aigen_active_scene", String(activeSceneIndex));
    } catch (e) { }
  }, [activeSceneIndex]);

  // Per-scene regenerate modal state
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenSceneIndex, setRegenSceneIndex] = useState(null);
  const [regenVoice, setRegenVoice] = useState("quanganh");
  const [regenVoiceover, setRegenVoiceover] = useState("");
  const [regenUserNote, setRegenUserNote] = useState("");

  const logoFileInputRef = useRef(null);
  const playerRef = useRef(null);

  // Restores session cache or loads project from database on mount
  useEffect(() => {
    if (projectId) {
      setLoading(true);
      setStatusText("🔄 Đang tải dữ liệu dự án từ máy chủ...");
      api.getProjectById(projectId)
        .then(proj => {
          if (proj && proj.config) {
            setScript(proj.config.script || "");
            setTheme(proj.config.theme || "ai_hub_grid");
            setTargetLength(proj.config.targetLength || "Short (~60s)");
            setVoice(proj.config.voiceKey || proj.config.voice || "duythanh");
            setBgImage(proj.config.bgImage || "");
            setRefImages(proj.config.refImages || []);
            setRawScenes(proj.config.scenes || []);

            // Restore Watermark & BGM settings from saved config
            if (proj.config.watermark) {
              setWatermarkEnabled(proj.config.watermark.enabled ?? true);
              setWatermarkText(proj.config.watermark.text || "yupclip.com");
              setWatermarkPosition(proj.config.watermark.position || "top-right");
            }
            if (proj.config.backgroundMusic) {
              setBgm(proj.config.backgroundMusic);
            }
            if (proj.config.backgroundMusicVolume !== undefined) {
              setBgmVolume(proj.config.backgroundMusicVolume);
            }

            setEditorMode("preview"); // Go straight to preview if project is already generated
            setStatusText("📋 Dự án đã được tải thành công từ cơ sở dữ liệu.");
          }
        })
        .catch(err => {
          console.error("Failed to load project details:", err);
          setErrorMsg("Không thể tải thông tin dự án.");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Fallback to localStorage if no projectId (fresh new creation mode)
      try {
        const cachedRaw = localStorage.getItem("studio_aigen_raw_scenes");
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRawScenes(parsed);
            setEditorMode("preview");
            setStatusText("📋 Đã khôi phục các phân cảnh từ phiên làm việc trước.");
          }
        }
        const cachedScript = localStorage.getItem("studio_aigen_script");
        if (cachedScript) setScript(cachedScript);
        const cachedTheme = localStorage.getItem("studio_aigen_theme");
        if (cachedTheme) setTheme(cachedTheme);
        const cachedVoice = localStorage.getItem("studio_aigen_voice");
        if (cachedVoice) setVoice(cachedVoice);
        const cachedBg = localStorage.getItem("studio_aigen_bg");
        if (cachedBg) setBgImage(cachedBg);
        const cachedRefs = localStorage.getItem("studio_aigen_ref_images");
        if (cachedRefs) setRefImages(JSON.parse(cachedRefs));
      } catch (e) {
        console.warn("Failed to restore cached session data:", e);
      }
    }
  }, [projectId]);

  // Fetch VDE Themes on mount
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/vde-themes");
        if (response.data && response.data.length > 0) {
          setVdeThemes(response.data);
        }
      } catch (err) {
        console.error("Error fetching VDE themes:", err);
      }
    };
    fetchThemes();
  }, []);

  // Handle Browser Sandbox Validation Telemetry
  useEffect(() => {
    const handleSandboxMessage = async (event) => {
      if (!event.data || !event.data.type) return;
      
      if (event.data.type === 'VALIDATION_SUCCESS' || event.data.type === 'VALIDATION_ERROR') {
        const isSuccess = event.data.type === 'VALIDATION_SUCCESS';
        const validationId = window.__activeValidationId;
        
        if (!validationId) return;

        try {
          await axios.post("http://localhost:5000/api/studio-ai-gen/validate-result", {
            validationId,
            success: isSuccess,
            error: isSuccess ? null : event.data.error,
            stack: isSuccess ? null : event.data.stack,
            visualErrors: event.data.errors || []
          });
        } catch (err) {
          console.error("Failed to post validation telemetry:", err);
        }
      }
    };

    window.addEventListener('message', handleSandboxMessage);
    return () => window.removeEventListener('message', handleSandboxMessage);
  }, []);

  // Expose global callback for orchestrator triggering
  useEffect(() => {
    window.triggerBrowserValidation = (validationId, code, sceneData) => {
      const iframe = document.getElementById('validation-sandbox-iframe');
      if (!iframe) {
        console.warn("Validation sandbox iframe not mounted");
        return;
      }
      window.__activeValidationId = validationId;
      iframe.contentWindow.postMessage({
        type: 'VALIDATE_CODE',
        code,
        sceneData
      }, '*');
    };
    return () => {
      delete window.triggerBrowserValidation;
    };
  }, []);

  // Fetch previous media items when Media Modal opens
  useEffect(() => {
    if (showMediaModal) {
      axios.get("http://localhost:5000/api/media/previous")
        .then(res => {
          const list = res.data || [];
          const uniqueList = Array.from(new Set(list.map(u => typeof u === "string" ? u.trim() : u)));
          setPreviousMedia(uniqueList);
        })
        .catch(err => console.error("Failed to fetch previous media:", err));
    }
  }, [showMediaModal]);

  // Handle local background file upload to backend
  const handleBgFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      setUploading(true);
      try {
        const res = await axios.post("http://localhost:5000/api/upload", { file: reader.result });
        if (res.data && res.data.url) {
          const uploadedUrl = res.data.url.trim();
          if (mediaModalMode === "background") {
            setBgImage(uploadedUrl);
            setShowMediaModal(false);
          } else {
            setRefImages(prev => Array.from(new Set([...prev, uploadedUrl])));
          }
          setPreviousMedia(prev => Array.from(new Set([uploadedUrl, ...prev])));
          setMediaTab("YOUR_MEDIA");
        }
      } catch (err) {
        console.error("Upload background failed:", err);
        alert("Không thể tải ảnh nền lên: " + (err.response?.data?.error || err.message));
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectMedia = (url) => {
    if (mediaModalMode === "background") {
      setBgImage(url);
      setShowMediaModal(false);
    } else {
      setRefImages(prev => {
        if (prev.includes(url)) {
          return prev.filter(u => u !== url);
        } else {
          return [...prev, url];
        }
      });
    }
  };

  // Search stock images from Unsplash
  const handleStockSearch = async () => {
    if (!stockQuery.trim()) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/media/search?query=${encodeURIComponent(stockQuery)}`);
      setStockResults(res.data || []);
    } catch (err) {
      console.error("Stock search failed:", err);
    }
  };

  // Handle Watermark Logo Upload
  const handleLogoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setWatermarkLogo(evt.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Load compiled JS strings into live React components
  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      if (!rawScenes || rawScenes.length === 0) {
        setLoadedScenes([]);
        return;
      }

      const list = await Promise.all(
        rawScenes.map(async (sc) => {
          const loadResult = await loadComponentFromJS(sc.compiledJS);
          return {
            ...sc,
            Component: loadResult?.Component || null,
            loadError: loadResult?.error || null,
            isEmpty: loadResult?.isEmpty ?? false
          };
        })
      );

      if (isMounted) {
        setLoadedScenes(list);
      }
    };

    loadAll();
    return () => { isMounted = false; };
  }, [rawScenes]);

  // Reset Remotion Player seek to 0 and autoPlay when switching scenes
  useEffect(() => {
    if (playerRef.current) {
      try {
        playerRef.current.seekTo(0);
        playerRef.current.play();
      } catch (err) {
        console.warn("Failed to reset player seek:", err);
      }
    }
  }, [activeSceneIndex]);

  const handleResetSession = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phiên làm việc hiện tại và thiết lập lại từ đầu?")) {
      setRawScenes([]);
      setLoadedScenes([]);
      setScript("");
      setBgImage("");
      setRefImages([]);
      localStorage.removeItem("studio_aigen_raw_scenes");
      localStorage.removeItem("studio_aigen_script");
      localStorage.removeItem("studio_aigen_theme");
      localStorage.removeItem("studio_aigen_voice");
      localStorage.removeItem("studio_aigen_bg");
      localStorage.removeItem("studio_aigen_ref_images");
      setStatusText("🔄 Đã đặt lại phiên làm việc.");
    }
  };

  const triggerOpenRegenModal = (idx) => {
    setRegenSceneIndex(idx);
    setRegenVoice(voice || "quanganh");
    setRegenVoiceover(rawScenes[idx]?.voiceover || "");
    setRegenUserNote("");
    setShowRegenModal(true);
  };

  const handleRegenerateSingleScene = async (index, selectedVoice = null, customVoiceover = null, customUserNote = "") => {
    if (regeneratingIndex !== null || loading) return;
    const baseScene = rawScenes[index];
    if (!baseScene) return;

    const targetScene = { ...baseScene };
    if (customVoiceover !== null && customVoiceover.trim() !== "") {
      targetScene.voiceover = customVoiceover.trim();
    }

    const targetVoice = selectedVoice || voice;
    setRegeneratingIndex(index);
    setStatusText(`🔄 AI đang sinh lại code & giọng đọc cho phân cảnh ${index + 1}...`);
    setErrorMsg("");

    try {
      const activeProjId = projectId || localStorage.getItem("studio_aigen_project_id") || "proj_aigen_draft";
      const res = await api.generateStudioAiGenScene(
        activeProjId,
        targetScene,
        targetVoice,
        theme,
        bgImage,
        refImages,
        script,
        true,
        customUserNote
      );

      if (res && res.scene) {
        const updatedScenes = [...rawScenes];
        updatedScenes[index] = res.scene;
        setRawScenes(updatedScenes);
        localStorage.setItem("studio_aigen_raw_scenes", JSON.stringify(updatedScenes));
        setStatusText(`✅ Đã sinh lại thành công phân cảnh ${index + 1}!`);
      } else {
        throw new Error("Không nhận được dữ liệu phân cảnh từ server.");
      }
    } catch (err) {
      console.error("Failed to regenerate single scene:", err);
      setErrorMsg("Không thể sinh lại phân cảnh: " + (err.response?.data?.error || err.message));
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleRenderVideo = async () => {
    if (!rawScenes || rawScenes.length === 0) return;
    const activeProjId = projectId || localStorage.getItem("activeProjectId") || localStorage.getItem("studio_aigen_project_id") || "proj_aigen_draft";
    setRendering(true);
    setRenderProgress(0);
    setRenderedFrames(0);
    setRenderTotalFrames(0);
    setRenderedVideoUrl(null);
    setStatusText("🚀 Đang khởi động tiến trình kết xuất Video MP4 Remotion...");

    try {
      // 1. Save latest project details to DB first
      const config = {
        script,
        targetLength,
        theme,
        voiceKey: voice,
        bgImage,
        refImages,
        watermark: {
          enabled: watermarkEnabled,
          text: watermarkText,
          position: watermarkPosition,
          color: "#000000"
        },
        scenes: rawScenes
      };
      await api.saveStudioAiGenConfig(activeProjId, `AI Gen - ${(script || "").substring(0, 30)}...`, config);

      // 2. Trigger render
      const renderResponse = await api.triggerRender(activeProjId);
      const renderId = renderResponse.renderId;

      // 3. Start Polling
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.getRenderStatus(activeProjId, renderId);
          const totalF = statusRes.totalFrames || 0;
          const renderedF = statusRes.renderedFrames || 0;
          const rawPct = statusRes.progress || 0;
          const computedPct = totalF > 0 ? (renderedF / totalF) : rawPct;
          const progressPercent = Math.min(100, Math.max(0, Math.round(computedPct * 100)));

          setRenderProgress(progressPercent);
          setRenderedFrames(renderedF);
          setRenderTotalFrames(totalF);

          if (statusRes.status === "completed") {
            setRenderedVideoUrl(statusRes.videoUrl);
            setRendering(false);
            clearInterval(pollInterval);
          } else if (statusRes.status === "failed") {
            setErrorMsg("Kết xuất video MP4 thất bại!");
            setRendering(false);
            clearInterval(pollInterval);
          }
        } catch (err) {
          console.error("Error polling render status:", err);
          setRendering(false);
          clearInterval(pollInterval);
        }
      }, 500);

    } catch (error) {
      console.error("Failed to start video rendering:", error);
      setErrorMsg(`Không thể khởi động tiến trình xuất video: ${error.response?.data?.error || error.message}`);
      setRendering(false);
    }
  };

  const handleGenerate = async () => {
    if (!script.trim()) return;

    setLoading(true);
    setErrorMsg("");
    setStatusText("🤖 AI đang đọc kịch bản & lập kế hoạch phân cảnh...");
    setRawScenes([]);
    setLoadedScenes([]);

    try {
      // Step 1: Request scene plan
      const planRes = await api.planStudioAiGen(script, targetLength, theme, voice, bgImage, refImages, projectId);

      if (!planRes || !planRes.scenes || planRes.scenes.length === 0) {
        throw new Error("Không lập được kế hoạch phân cảnh từ kịch bản.");
      }

      const activeProjId = planRes.projectId;
      let currentScenes = [...planRes.scenes];

      // Immediately display outline scenes list to the user
      setRawScenes(currentScenes);
      setActiveSceneIndex(0);
      // No preview tab switch, stay in setup

      // Step 2: Sequentially generate code & audio for each scene in the plan
      for (let i = 0; i < currentScenes.length; i++) {
        const scenePlan = currentScenes[i];
        const percent = Math.round((i / currentScenes.length) * 100);
        setStatusText(`✨ AI đang tạo phân cảnh ${i + 1}/${currentScenes.length} (${percent}%)...`);

        const sceneRes = await api.generateStudioAiGenScene(
          activeProjId,
          scenePlan,
          voice,
          theme,
          bgImage,
          refImages,
          script
        );

        if (sceneRes && sceneRes.scene) {
          // Update local state arrays
          currentScenes[i] = sceneRes.scene;
          setRawScenes([...currentScenes]);

          // Cache intermediate progress to localStorage
          localStorage.setItem("studio_aigen_raw_scenes", JSON.stringify(currentScenes));
          localStorage.setItem("studio_aigen_script", script);
          localStorage.setItem("studio_aigen_theme", theme);
          localStorage.setItem("studio_aigen_voice", voice);
          localStorage.setItem("studio_aigen_bg", bgImage);
          localStorage.setItem("studio_aigen_ref_images", JSON.stringify(refImages));
        } else {
          throw new Error(`Lỗi nhận dữ liệu tại phân cảnh ${i + 1}.`);
        }

        // Pacing delay between scenes to protect Gemini API rate limits
        if (i < currentScenes.length - 1) {
          await new Promise((r) => setTimeout(r, 2500));
        }
      }

      setStatusText("✅ Hoàn tất sinh video Studio AI Gen!");

      if (onUpdateProjectsList) {
        onUpdateProjectsList();
      }
      if (onGenerationSuccess) {
        onGenerationSuccess(activeProjId);
      }
    } catch (err) {
      console.error("Studio AI Gen Error:", err);
      setErrorMsg(err.response?.data?.error || err.message || "Đã xảy ra lỗi khi tạo video AI.");
    } finally {
      setLoading(false);
    }
  };

  const currentScene = loadedScenes[activeSceneIndex];
  const durationInFrames = currentScene?.durationFrames || 150;
  const currentThemeObj = vdeThemes.find(t => t.id === theme) || { name: "AI Hub Grid", id: "ai_hub_grid" };

  const getPatternBadgeColor = (pattern) => {
    switch (pattern) {
      case "DONUT_GAUGE": return { bg: "#fff7ed", border: "#fdba74", text: "#c2410c" };
      case "DUAL_METRIC_CARDS": return { bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8" };
      case "HERO_METRIC_GLOW": return { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1" };
      default: return { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569" };
    }
  };

  // Calculate total sequence duration for Master Preview
  // Mirrors getSceneDurationFrames() in MainComposition.tsx exactly:
  //   max(durationFrames, subtitleFrames, secFrames) + 15 safety buffer
  const calcSceneDurationFrames = (sc) => {
    const FPS = 30;
    const backendFrames = (sc.durationFrames && typeof sc.durationFrames === 'number')
      ? Math.round((sc.durationFrames / 30) * FPS)
      : 0;
    let maxSubTime = 0;
    const subJson = sc.subtitlesJson || sc.voiceoverTtsJson;
    if (Array.isArray(subJson) && subJson.length > 0) {
      for (const w of subJson) {
        const endVal = w.end !== undefined ? w.end : (w.endMs ? w.endMs / 1000 : 0);
        if (typeof endVal === 'number' && endVal > maxSubTime) maxSubTime = endVal;
      }
    }
    const subtitleFrames = maxSubTime > 0 ? Math.round(maxSubTime * FPS) : 0;
    const sec = (sc.duration !== undefined && sc.duration !== null && sc.duration !== '')
      ? parseFloat(sc.duration) || 0
      : 0;
    const secFrames = sec > 0 ? Math.round(sec * FPS) : 0;
    const maxSignal = Math.max(backendFrames, secFrames, subtitleFrames);
    const baseFrames = maxSignal > 0 ? maxSignal : Math.round(6.0 * FPS);
    return baseFrames + 15; // +15 frames (0.5s) safety buffer — same as MainComposition
  };

  const totalDurationFrames = loadedScenes.reduce(
    (sum, sc) => sum + calcSceneDurationFrames(sc),
    0
  );

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "var(--bg-secondary, #f8fafc)",
      color: "var(--text-primary, #0f172a)",
      fontFamily: "'Be Vietnam Pro', Inter, sans-serif",
      padding: "28px 36px",
      gap: "24px",
      boxSizing: "border-box",
      overflowY: "auto"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
        paddingBottom: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "20px",
                background: "#ffffff",
                border: "1px solid rgba(15, 23, 42, 0.12)",
                color: "#475569",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}
            >
              &larr; Dự án của tôi
            </button>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "#0f172a" }}>
              ✨ Studio AI Gen <span style={{ fontSize: "16px", fontWeight: 600, color: "#2563eb", marginLeft: "8px" }}>(Live Codegen)</span>
            </h1>
            <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>
              Tự động sinh mã nguồn Remotion TSX từ kịch bản và live preview
            </p>
          </div>
        </div>

      </div>

      {/* Status Bar */}
      {(statusText || errorMsg) && (
        <div style={{
          padding: "14px 18px",
          borderRadius: "12px",
          background: errorMsg ? "#fef2f2" : "#eff6ff",
          border: `1px solid ${errorMsg ? "#fecaca" : "#bfdbfe"}`,
          color: errorMsg ? "#991b1b" : "#1e40af",
          fontSize: "14px",
          fontWeight: 600
        }}>
          {errorMsg || statusText}
        </div>
      )}

      {/* VIEW 1: Setup Mode (Inputs Form) */}
      {editorMode === "setup" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px" }}>
          {/* Left Column: Script + Background Image Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Script Area */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid rgba(15, 23, 42, 0.08)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)"
            }}>
              <label style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                Kịch bản video (Script):
              </label>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Nhập nội dung kịch bản văn bản vào đây..."
                rows={8}
                style={{
                  width: "100%",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "12px",
                  padding: "16px",
                  color: "#0f172a",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  resize: "vertical",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  outline: "none"
                }}
              />
            </div>

            {/* Background Image Selection & Upload Card */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid rgba(15, 23, 42, 0.08)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                  🖼️ Chọn Ảnh Nền Video (Background Image):
                </label>
                {bgImage && (
                  <button
                    onClick={() => setBgImage("")}
                    style={{ background: "none", border: "none", color: "#ef4444", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}
                  >
                    ✕ Gỡ ảnh nền
                  </button>
                )}
              </div>

              {bgImage ? (
                <div style={{ position: "relative", width: "100%", height: "180px", borderRadius: "12px", overflow: "hidden", border: "2px solid #2563eb" }}>
                  <img
                    src={bgImage.startsWith("http") ? bgImage : `http://localhost:5000${bgImage}`}
                    alt="Background Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div
                    onClick={() => {
                      setMediaModalMode("background");
                      setMediaTab("YOUR_MEDIA");
                      setShowMediaModal(true);
                    }}
                    style={{ position: "absolute", bottom: "10px", right: "10px", background: "#0f172a", color: "#fff", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                  >
                    Thay đổi ảnh 🔄
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setMediaModalMode("background");
                    setMediaTab("YOUR_MEDIA");
                    setShowMediaModal(true);
                  }}
                  style={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: "12px",
                    padding: "32px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "#f8fafc",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.background = "#eff6ff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; }}
                >
                  <div style={{ fontSize: "36px", marginBottom: "8px" }}>🖼️</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Mở cửa sổ chọn ảnh nền (VDE Modal)</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Duyệt từ kho ảnh cũ, Unsplash hoặc tải lên từ máy tính</div>
                </div>
              )}
            </div>

            {/* Design Reference Images Selection Card (Multimodal Reference) */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid rgba(15, 23, 42, 0.08)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <label style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", display: "block" }}>
                    📐 Ảnh Thiết Kế Tham Khảo (Design Layout References):
                  </label>
                  <span style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", display: "block" }}>
                    Chọn các ảnh giao diện để LLM tham khảo khi tự sinh code bố cục.
                  </span>
                </div>
                {refImages.length > 0 && (
                  <button
                    onClick={() => setRefImages([])}
                    style={{ background: "none", border: "none", color: "#ef4444", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}
                  >
                    ✕ Xóa tất cả ({refImages.length})
                  </button>
                )}
              </div>

              {/* Selected Images Grid & Add Button */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "12px", marginTop: "4px" }}>
                {refImages.map((url, idx) => (
                  <div key={idx} style={{ position: "relative", width: "100%", paddingTop: "100%", borderRadius: "8px", overflow: "hidden", border: "1.5px solid #cbd5e1" }}>
                    <img
                      src={url.startsWith("http") ? url : `http://localhost:5000${url}`}
                      alt={`Reference design ${idx}`}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => setRefImages(prev => prev.filter(u => u !== url))}
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        background: "rgba(15, 23, 42, 0.8)",
                        color: "#ffffff",
                        border: "none",
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "9px",
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Add reference button */}
                <div
                  onClick={() => {
                    setMediaModalMode("references");
                    setMediaTab("YOUR_MEDIA");
                    setShowMediaModal(true);
                  }}
                  style={{
                    width: "100%",
                    height: "0",
                    paddingTop: "calc(100% - 4px)", // square mockup
                    position: "relative",
                    border: "2px dashed #cbd5e1",
                    borderRadius: "8px",
                    cursor: "pointer",
                    background: "#f8fafc",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.background = "#eff6ff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; }}
                >
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "14px", fontWeight: "700", color: "#64748b", textAlign: "center" }}>
                    <div style={{ fontSize: "20px", marginBottom: "2px" }}>➕</div>
                    <span>Thêm ảnh</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Full Setup Configurations Panel */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            background: "#ffffff",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            borderRadius: "16px",
            padding: "22px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)"
          }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a", borderBottom: "2px solid #0f172a", paddingBottom: "10px" }}>
              ⚙️ Cấu Hình Video Output
            </h3>

            {/* Theme Selector Modal Trigger Card */}
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "8px" }}>
                Theme thiết kế (VDE Modal):
              </label>
              <div
                onClick={() => setShowThemeModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  cursor: "pointer"
                }}
              >
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                    {currentThemeObj.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                    {currentThemeObj.id}
                  </div>
                </div>
                <span style={{ fontSize: "16px" }}>🎨</span>
              </div>
            </div>

            {/* Video Length Button Group */}
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "8px" }}>
                Độ dài video (Video Length):
              </label>
              <div style={{ display: "flex", borderRadius: "10px", border: "1px solid #cbd5e1", overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => setTargetLength("Short (~60s)")}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    border: "none",
                    borderRight: "1px solid #cbd5e1",
                    background: targetLength.includes("Short") ? "#0f172a" : "#ffffff",
                    color: targetLength.includes("Short") ? "#ffffff" : "#0f172a",
                    fontWeight: targetLength.includes("Short") ? 700 : 500,
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  Short (&lt;1m)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetLength("Medium (~120s)")}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    border: "none",
                    background: targetLength.includes("Medium") ? "#0f172a" : "#ffffff",
                    color: targetLength.includes("Medium") ? "#ffffff" : "#0f172a",
                    fontWeight: targetLength.includes("Medium") ? 700 : 500,
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  Medium (1-3m)
                </button>
              </div>
            </div>

            {/* AI Voice Selector */}
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                Giọng đọc AI (Voiceover):
              </label>
              <select
                value={voice}
                onChange={(e) => {
                  const newVoice = e.target.value;
                  setVoice(newVoice);
                  localStorage.setItem("studio_aigen_voice", newVoice);
                }}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              >
                <optgroup label="OmniVoice (Offline Clone)">
                  <option value="duythanh">OmniVoice - Duy Thanh (Trầm ấm, Nam Bắc)</option>
                  <option value="quanganh">OmniVoice - Quang Anh (Hiện đại, Nam Bắc)</option>
                </optgroup>
                <optgroup label="Vbee AI Voice (Chờ kết nối API)">
                  <option value="vbee_minhtien">Vbee - Minh Tiến (📰 Tin tức / Kịch tính - Nam Bắc)</option>
                  <option value="vbee_thuyduyen">Vbee - Thùy Duyên (🎓 Truyền cảm / Sách nói - Nữ Bắc)</option>
                  <option value="vbee_ngochuyen">Vbee - Ngọc Huyền (💡 Quảng cáo / Hào hứng - Nữ Bắc)</option>
                  <option value="vbee_naman">Vbee - Nam An (🚀 Năng động / Công nghệ - Nam Nam)</option>
                  <option value="vbee_maiphuong">Vbee - Mai Phương (🎭 Tâm sự / Trầm ấm - Nữ Nam)</option>
                </optgroup>
              </select>
            </div>

            {/* Background Music Select */}
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                Nhạc nền BGM:
              </label>
              <select
                value={bgm}
                onChange={(e) => setBgm(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              >
                <option>Chill Lofi Beats</option>
                <option>Tech Ambient</option>
                <option>Energy Beats</option>
                <option>None</option>
              </select>

              {bgm !== "None" && (
                <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px", fontWeight: 600 }}>
                    <span>Âm lượng BGM:</span>
                    <span>{(bgmVolume * 100).toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.20"
                    step="0.005"
                    value={bgmVolume}
                    onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: "#2563eb", cursor: "pointer" }}
                  />
                </div>
              )}
            </div>

            {/* Watermark Section */}
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", background: "#fafafa" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Watermark</label>
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  style={{ accentColor: "#2563eb", cursor: "pointer" }}
                />
              </div>

              {watermarkEnabled && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="Chữ Watermark e.g. yupclip.com"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", boxSizing: "border-box" }}
                  />

                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#64748b", marginBottom: "3px", fontWeight: 600 }}>Vị trí Watermark</label>
                    <select
                      value={watermarkPosition}
                      onChange={(e) => setWatermarkPosition(e.target.value)}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", boxSizing: "border-box", background: "#ffffff" }}
                    >
                      <option value="top-right">Góc Trên - Phải</option>
                      <option value="top-left">Góc Trên - Trái</option>
                      <option value="bottom-right">Góc Dưới - Phải</option>
                      <option value="bottom-left">Góc Dưới - Trái</option>
                      <option value="bottom-center">Góc Dưới - Giữa</option>
                    </select>
                  </div>

                  <input
                    type="file"
                    ref={logoFileInputRef}
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    style={{ padding: "6px 10px", background: "#ffffff", border: "1px dashed #94a3b8", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                  >
                    {watermarkLogo ? "✅ Đã tải Logo Watermark" : "📁 Upload Logo Watermark"}
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                onClick={handleGenerate}
                disabled={loading || !script.trim()}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: loading ? "#cbd5e1" : "linear-gradient(135deg, #2563eb 0%, #ea580c 100%)",
                  border: "none",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "15px",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 18px rgba(37, 99, 235, 0.3)",
                  transition: "all 0.2s ease"
                }}
              >
                {loading ? "⌛ Đang xử lý AI..." : "🎬 Sinh Video Studio AI Gen"}
              </button>

              {rawScenes.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetSession}
                  disabled={loading}
                  style={{
                    padding: "14px 20px",
                    background: "#ffffff",
                    border: "2px solid #ef4444",
                    borderRadius: "12px",
                    color: "#ef4444",
                    fontWeight: 800,
                    fontSize: "15px",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease"
                  }}
                  title="Xóa bộ nhớ tạm và thiết lập lại"
                >
                  🔄 Đặt lại
                </button>
              )}
            </div>
          </div>
        </div>
      )}



      {/* Render Progress & Download Modal Overlay */}
      {(rendering || renderedVideoUrl) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(10px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1200 }}>
          <div style={{ background: "#ffffff", width: "90%", maxWidth: "520px", borderRadius: "24px", padding: "32px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)", border: "1px solid #e2e8f0", textAlign: "center" }}>
            {rendering ? (
              <>
                <div style={{ fontSize: "42px", marginBottom: "12px", animation: "bounce 1.5s infinite" }}>🚀</div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                  Đang Kết Xuất Video Remotion MP4
                </h3>
                <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#64748b" }}>
                  Vui lòng đợi trong giây lát, hệ thống đang ghép hiệu ứng và âm thanh...
                </p>

                {/* Progress Bar */}
                <div style={{ width: "100%", height: "14px", background: "#e2e8f0", borderRadius: "10px", overflow: "hidden", marginBottom: "12px" }}>
                  <div style={{ width: `${renderProgress}%`, height: "100%", background: "linear-gradient(90deg, #2563eb, #3b82f6)", borderRadius: "10px", transition: "width 0.3s ease" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", fontWeight: 700 }}>
                  <span>Tiến trình: {renderProgress}%</span>
                  <span>{renderedFrames} / {renderTotalFrames} frames</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "22px", fontWeight: 800, color: "#10b981" }}>
                  KẾT XUẤT VIDEO THÀNH CÔNG!
                </h3>
                <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#475569" }}>
                  Video MP4 chuẩn 1080x1920 đã sẵn sàng để tải xuống.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                  <a
                    href={`http://localhost:5000${renderedVideoUrl}`}
                    download
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      width: "100%",
                      padding: "16px 24px",
                      borderRadius: "30px",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "#ffffff",
                      fontWeight: 800,
                      fontSize: "16px",
                      textDecoration: "none",
                      boxShadow: "0 6px 20px rgba(16, 185, 129, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      boxSizing: "border-box"
                    }}
                  >
                    ⬇️ Tải Video MP4 Về Máy (.mp4)
                  </a>

                  <button
                    type="button"
                    onClick={() => setRenderedVideoUrl(null)}
                    style={{ background: "none", border: "none", color: "#64748b", fontSize: "14px", fontWeight: 600, cursor: "pointer", marginTop: "8px" }}
                  >
                    Đóng cửa sổ này
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* VDE Theme Selection Modal (Matching StoryboardEditor VDE Picker) */}
      {showThemeModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(8px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            width: "90%",
            maxWidth: "1000px",
            maxHeight: "85vh",
            borderRadius: "24px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "2px solid #000000"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "24px 30px",
              borderBottom: "2px solid #000000",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#ffffff"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#000000" }}>
                  🎨 CHỌN PHONG CÁCH VIDEO (VDE THEMES)
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                  Chọn theme để AI áp dụng màu sắc & phong cách giao diện phù hợp
                </p>
              </div>
              <button
                onClick={() => setShowThemeModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "28px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            {/* Themes Grid Container */}
            <div className="custom-scrollbar" style={{ padding: "30px", overflowY: "auto", flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }}>
                {vdeThemes.map(styleItem => {
                  const isSelected = theme === styleItem.id;
                  const tokens = styleItem.tokens || {};
                  const bgVal = tokens.background || "#030712";
                  const textVal = tokens.text || "#ffffff";
                  const accentVal = tokens.accent || "#3b82f6";
                  const cardBgVal = tokens.cardBg || "rgba(255, 255, 255, 0.05)";
                  const borderVal = tokens.border || "1px solid rgba(255, 255, 255, 0.1)";

                  return (
                    <div
                      key={styleItem.id}
                      onClick={() => {
                        setTheme(styleItem.id);
                        setShowThemeModal(false);
                      }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        cursor: "pointer",
                        padding: "16px",
                        borderRadius: "20px",
                        border: isSelected ? "3px solid #000000" : "1.5px solid #e2e8f0",
                        backgroundColor: isSelected ? "#f8fafc" : "#ffffff",
                        boxShadow: isSelected ? "4px 4px 0px #000000" : "none",
                        transition: "all 0.15s ease-in-out"
                      }}
                    >
                      {/* Mini Viewport Mockup */}
                      <div style={{
                        width: "100%",
                        aspectRatio: "9/16",
                        backgroundColor: bgVal,
                        border: "2px solid #000",
                        borderRadius: "12px",
                        padding: "16px",
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        position: "relative",
                        overflow: "hidden",
                        color: textVal
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                          <div style={{ fontSize: "9px", textTransform: "uppercase", padding: "3px 8px", border: `1px solid ${accentVal}50`, borderRadius: "10px", color: accentVal, fontWeight: "bold" }}>
                            {styleItem.name || styleItem.id}
                          </div>
                        </div>

                        <div style={{ background: cardBgVal, borderRadius: "10px", padding: "10px", border: borderVal }}>
                          <div style={{ fontSize: "11px", fontWeight: "bold", color: textVal }}>Giao diện AI Gen</div>
                          <div style={{ fontSize: "8px", opacity: 0.7, marginTop: "2px", color: tokens.textSecondary || "rgba(255,255,255,0.6)" }}>Visual design mockup</div>
                        </div>

                        <div style={{ fontSize: "8px", opacity: 0.6, textAlign: "center", color: tokens.textSecondary || "rgba(255,255,255,0.6)" }}>
                          9:16 Vertical Preview
                        </div>
                      </div>

                      {/* Theme Name & Description */}
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: "bold", color: "#000000" }}>
                          {styleItem.name || styleItem.id}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666666", marginTop: "4px", lineHeight: "1.4" }}>
                          {styleItem.description || "Phong cách giao diện video AI"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Selection Modal (Matches StoryboardEditor Modal Grid) */}
      {showMediaModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "blur(6px)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            width: "1000px",
            maxWidth: "95%",
            height: "80vh",
            maxHeight: "750px",
            borderRadius: "20px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            fontFamily: "Inter, sans-serif"
          }}>
            {/* Modal Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 24px",
              borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
              backgroundColor: "#fafbfc"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>{mediaModalMode === "background" ? "🖼️" : "📐"}</span>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                  {mediaModalMode === "background" ? "Chọn Ảnh Nền Video" : "Chọn Thiết Kế Giao Diện Tham Khảo"}
                </h3>
              </div>

              {/* Tabs Switcher */}
              <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "30px", gap: "4px" }}>
                <button
                  type="button"
                  onClick={() => setMediaTab("YOUR_MEDIA")}
                  style={{
                    border: "none",
                    background: mediaTab === "YOUR_MEDIA" ? "#ffffff" : "none",
                    color: mediaTab === "YOUR_MEDIA" ? "#0f172a" : "#64748b",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: mediaTab === "YOUR_MEDIA" ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                  }}
                >
                  Ảnh trước đây (Your Media)
                </button>
                <button
                  type="button"
                  onClick={() => setMediaTab("UPLOAD")}
                  style={{
                    border: "none",
                    background: mediaTab === "UPLOAD" ? "#ffffff" : "none",
                    color: mediaTab === "UPLOAD" ? "#0f172a" : "#64748b",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: mediaTab === "UPLOAD" ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                  }}
                >
                  Upload từ máy
                </button>
                <button
                  type="button"
                  onClick={() => setMediaTab("STOCK")}
                  style={{
                    border: "none",
                    background: mediaTab === "STOCK" ? "#ffffff" : "none",
                    color: mediaTab === "STOCK" ? "#0f172a" : "#64748b",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: mediaTab === "STOCK" ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                  }}
                >
                  Kho ảnh Unsplash
                </button>
              </div>

              {mediaModalMode === "references" && (
                <button
                  type="button"
                  onClick={() => setShowMediaModal(false)}
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    marginRight: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  Xác nhận ({refImages.length} ảnh) ✓
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                style={{
                  border: "none",
                  background: "rgba(15, 23, 42, 0.04)",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#64748b"
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, padding: "24px", overflowY: "auto", minHeight: 0 }}>
              {mediaTab === "YOUR_MEDIA" && (
                <div>
                  <div style={{ marginBottom: "16px" }}>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "600", color: "#1e293b" }}>Ảnh cũ của dự án</h4>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Tái sử dụng các hình ảnh bạn đã tải lên trước đó.</p>
                  </div>
                  {previousMedia.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", border: "2px dashed #e2e8f0", borderRadius: "12px" }}>
                      <span style={{ fontSize: "32px", marginBottom: "12px" }}>📂</span>
                      <p style={{ margin: 0, fontSize: "14px", color: "#64748b", fontWeight: "600" }}>Chưa có file phương tiện nào được lưu trước đây.</p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "16px" }}>
                      {previousMedia.map((url, idx) => {
                        const isSelected = mediaModalMode === "background" ? (bgImage === url) : refImages.includes(url);
                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectMedia(url)}
                            style={{
                              position: "relative",
                              width: "100%",
                              paddingTop: "100%",
                              borderRadius: "12px",
                              overflow: "hidden",
                              cursor: "pointer",
                              border: isSelected ? "3px solid #3b82f6" : "1px solid rgba(15,23,42,0.08)",
                              boxShadow: isSelected ? "0 4px 12px rgba(59,130,246,0.15)" : "none",
                              transition: "all 0.2s ease"
                            }}
                          >
                            <img
                              src={url.startsWith("http") ? url : `http://localhost:5000${url}`}
                              alt="Previous media option"
                              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            {isSelected && (
                              <div style={{ position: "absolute", top: "8px", right: "8px", backgroundColor: "#3b82f6", color: "#ffffff", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold" }}>
                                ✓
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {mediaTab === "UPLOAD" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "300px" }}>
                  <div
                    onClick={() => document.getElementById("media-modal-bg-upload-input").click()}
                    style={{
                      width: "100%",
                      maxWidth: "500px",
                      border: "2px dashed #cbd5e1",
                      borderRadius: "16px",
                      padding: "48px 24px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      backgroundColor: "#f8fafc",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.backgroundColor = "#f0f9ff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                  >
                    <input
                      type="file"
                      id="media-modal-bg-upload-input"
                      accept="image/*"
                      onChange={handleBgFileUpload}
                      style={{ display: "none" }}
                    />
                    {uploading ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: "30px", height: "30px", border: "3px solid #cbd5e1", borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "12px" }} />
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Đang tải ảnh lên Cloudinary...</span>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>☁️</span>
                        <span style={{ fontSize: "15px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Click to upload background image</span>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>Supports JPG, PNG up to 5MB</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {mediaTab === "STOCK" && (
                <div>
                  {/* Search bar */}
                  <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                    <input
                      type="text"
                      placeholder="Tìm kiếm kho ảnh miễn phí chất lượng cao từ Unsplash..."
                      value={stockQuery}
                      onChange={(e) => setStockQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleStockSearch()}
                      style={{ flex: 1, padding: "12px 16px", borderRadius: "30px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
                    />
                    <button
                      type="button"
                      onClick={handleStockSearch}
                      style={{ backgroundColor: "#0f172a", color: "#ffffff", border: "none", padding: "0 24px", borderRadius: "30px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                    >
                      Tìm kiếm
                    </button>
                  </div>

                  {stockResults.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
                      <span style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</span>
                      <p style={{ margin: 0, fontSize: "14px", color: "#64748b", fontWeight: "600" }}>Nhập từ khóa để duyệt ảnh Unsplash</p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "16px" }}>
                      {stockResults.map((url, idx) => {
                        const isSelected = mediaModalMode === "background" ? (bgImage === url) : refImages.includes(url);
                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectMedia(url)}
                            style={{
                              position: "relative",
                              width: "100%",
                              paddingTop: "100%",
                              borderRadius: "12px",
                              overflow: "hidden",
                              cursor: "pointer",
                              border: isSelected ? "3px solid #3b82f6" : "1px solid rgba(15,23,42,0.08)",
                              boxShadow: isSelected ? "0 4px 12px rgba(59,130,246,0.15)" : "none",
                              transition: "all 0.2s ease"
                            }}
                          >
                            <img
                              src={url}
                              alt="Unsplash stock choice"
                              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            {isSelected && (
                              <div style={{ position: "absolute", top: "8px", right: "8px", backgroundColor: "#3b82f6", color: "#ffffff", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold" }}>
                                ✓
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Per-Scene Regenerate Voice & Custom Prompt Selection Modal */}
      {showRegenModal && regenSceneIndex !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 }}>
          <div style={{ background: "#ffffff", width: "90%", maxWidth: "520px", borderRadius: "20px", padding: "26px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                🔄 Sinh Lại Phân Cảnh {regenSceneIndex + 1}
              </h3>
              <button
                type="button"
                onClick={() => setShowRegenModal(false)}
                style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer", fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                🗣️ Lời thoại phân cảnh (Có thể chỉnh sửa):
              </label>
              <textarea
                value={regenVoiceover}
                onChange={(e) => setRegenVoiceover(e.target.value)}
                rows={3}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "13px", color: "#0f172a", lineHeight: 1.4, resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                ✍️ Chỉ thị thiết kế / Lưu ý riêng cho AI (Tùy chọn):
              </label>
              <textarea
                value={regenUserNote}
                onChange={(e) => setRegenUserNote(e.target.value)}
                placeholder="VD: Muốn layout dạng so sánh 2 cột, nổi bật màu cam, dùng hiệu ứng Glassmorphism..."
                rows={2}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "13px", color: "#0f172a", lineHeight: 1.4, resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                🎙️ Chọn giọng đọc AI cho phân cảnh này:
              </label>
              <select
                value={regenVoice}
                onChange={(e) => setRegenVoice(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "13px", fontWeight: 600, color: "#0f172a" }}
              >
                <optgroup label="OmniVoice (Offline Clone)">
                  <option value="quanganh">OmniVoice - Quang Anh (Hiện đại, Nam Bắc)</option>
                  <option value="duythanh">OmniVoice - Duy Thanh (Trầm ấm, Nam Bắc)</option>
                </optgroup>
                <optgroup label="Vbee AI Voice (Chờ kết nối API)">
                  <option value="vbee_minhtien">Vbee - Minh Tiến (📰 Tin tức / Kịch tính - Nam Bắc)</option>
                  <option value="vbee_thuyduyen">Vbee - Thùy Duyên (🎓 Truyền cảm / Sách nói - Nữ Bắc)</option>
                  <option value="vbee_ngochuyen">Vbee - Ngọc Huyền (💡 Quảng cáo / Hào hứng - Nữ Bắc)</option>
                  <option value="vbee_naman">Vbee - Nam An (🚀 Năng động / Công nghệ - Nam Nam)</option>
                  <option value="vbee_maiphuong">Vbee - Mai Phương (🎭 Tâm sự / Trầm ấm - Nữ Nam)</option>
                </optgroup>
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowRegenModal(false)}
                style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const idx = regenSceneIndex;
                  const v = regenVoice;
                  const vo = regenVoiceover;
                  const note = regenUserNote;
                  setShowRegenModal(false);
                  handleRegenerateSingleScene(idx, v, vo, note);
                }}
                style={{ padding: "10px 22px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#ffffff", fontWeight: 700, fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)" }}
              >
                🚀 Xác Nhận Sinh Lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Validation Sandbox Iframe */}
      <iframe
        id="validation-sandbox-iframe"
        src="http://localhost:5000/validation-sandbox.html"
        style={{ display: "none" }}
      />
    </div>
  );
};

export default StudioAIGen;
