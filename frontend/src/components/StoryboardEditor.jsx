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

const LAYOUTS_BY_FAMILY = {
  "Blank": [
    { value: "Blank", label: "Blank / Subtitles Only" }
  ],
  "Opening / Headline": [
    { value: "IntroBriefingCard", label: "Intro Briefing Card" },
    { value: "IntroBubbleImage", label: "Intro Bubble Image" },
    { value: "IntroCutoutHeadlineImage", label: "Intro Cutout Headline Image" },
    { value: "IntroFullImage", label: "Intro Full Image" },
    { value: "IntroMapPinsImage", label: "Intro MAP Pins Image" },
    { value: "IntroRadarSignalImage", label: "Intro Radar Signal Image" },
    { value: "AppCardConcept", label: "APP Card Concept" },
    { value: "AppShowcaseTitle", label: "APP Showcase Title" },
    { value: "BroadcastLowerThirdTitle", label: "Broadcast Lower Third Title" },
    { value: "CaseStudyEditorial", label: "Case Study Editorial" },
    { value: "DossierNotes", label: "Dossier Notes" },
    { value: "EvidenceBoardConcept", label: "Evidence Board Concept" },
    { value: "FearGreedHook", label: "Fear Greed Hook" },
    { value: "FeedScrollHook", label: "Feed Scroll Hook" },
    { value: "IntroChapterStack", label: "Intro Chapter Stack Image" },
    { value: "IntroEvidenceReadlineImage", label: "Intro Evidence Readline Image" },
    { value: "IntroEvidenceScanlineImage", label: "Intro Evidence Scanline Image" }
  ],
  "Comparison / Table": [
    { value: "BeforeAfterPanel", label: "Before After Panel (So sánh Trước / Sau)" },
    { value: "VersusArena", label: "Versus Arena (So sánh Đối đầu)" },
    { value: "SplitProofBullet", label: "Split Proof Bullet" },
    { value: "SplitBandChecklist", label: "Split Band Checklist" }
  ],
  "Data / Metrics": [
    { value: "OpsMonitorHook", label: "OPS Monitor Hook (Bảng giám sát)" },
    { value: "HeroMetricCards", label: "Hero Metric Cards" },
    { value: "MetricCards", label: "Metric Cards" },
    { value: "GridMetrics", label: "Grid Metrics" },
    { value: "EarningsSnapshotHook", label: "Earnings Snapshot Hook" },
    { value: "CandlestickBreakoutHook", label: "Candlestick Breakout Hook" },
    { value: "IntroMetricPillImage", label: "Intro Metric Pill Image" }
  ],
  "List / Steps": [
    { value: "AIHubGrid1", label: "AI Hub Grid 1 (Emotion Column)" },
    { value: "RankedImpactBullet", label: "Ranked Impact Bullet" },
    { value: "SelectorWheelRadio", label: "Selector Wheel Radio" },
    { value: "SignalRailBullet", label: "Signal Rail Bullet" }
  ],
  "Timeline / Steps": [
    { value: "TimelineBeamRail", label: "Timeline Beam Rail" },
    { value: "TimelineChapters", label: "Timeline Chapters" },
    { value: "IntroSignalStepsImages", label: "Intro Signal Steps Images" },
    { value: "IntroEvidenceTimelineImage", label: "Intro Evidence Timeline Image" },
    { value: "FlowchartTitle", label: "Flowchart Title" }
  ],
  "Quote / Insight": [
    { value: "Pullquote", label: "Pullquote Highlight" },
    { value: "VignelliQuote", label: "Vignelli Quote" }
  ],
  "Media": [
    { value: "IntroMediaHero", label: "Intro Media Hero" },
    { value: "MediaCard", label: "Media Showcase Card" }
  ],
  "Ending": [
    { value: "BottomAnchorOutro", label: "Bottom Anchor Outro" },
    { value: "BrandOutro", label: "Brand Outro" },
    { value: "CenterLineOutro", label: "Center Line Outro" },
    { value: "HustXRikkei", label: "HUST X RIKKEI" },
    { value: "ContactCardEnding", label: "Contact Card Ending" },
    { value: "Ending", label: "Ending / CTA Screen" },
    { value: "Launch", label: "Launch" },
    { value: "Minimal", label: "Minimal" },
    { value: "NextStepEnding", label: "Next Step Ending" }
  ]
};

const normalizeFamily = (fam, visualLayout) => {
  if (visualLayout) {
    for (const [familyKey, layouts] of Object.entries(LAYOUTS_BY_FAMILY)) {
      if (Array.isArray(layouts) && layouts.some(l => l.value === visualLayout)) {
        return familyKey;
      }
    }
  }
  if (!fam) return "Opening / Headline";
  if (LAYOUTS_BY_FAMILY[fam]) return fam;
  const f = fam.toLowerCase();
  if (f.includes("opening") || f === "opening") return "Opening / Headline";
  if (f.includes("list") || f.includes("step") || f === "list") return "List / Steps";
  if (f.includes("ending") || f.includes("outro") || f === "ending") return "Ending";
  if (f.includes("data") || f.includes("metric") || f === "metric") return "Data / Metrics";
  if (f.includes("comparison") || f.includes("table") || f === "comparison") return "Comparison / Table";
  if (f.includes("quote") || f.includes("insight") || f === "quote") return "Quote / Insight";
  if (f.includes("timeline") || f === "timeline") return "Timeline / Steps";
  if (f.includes("media") || f === "media") return "Media";
  if (f === "blank") return "Blank";
  return "Opening / Headline";
};

const VDE_PRESET_STYLES = [
  {
    id: "rikkei",
    name: "Rikkei Academic",
    description: "Phong cách Rikkei Education: Nền trắng sạch, viền hồng đỏ, màu Crimson chủ đạo, thẻ học tập phẳng bo góc lớn cực dịu.",
    tokens: {
      background: "#ffffff",
      cardBg: "#FAF5F5",
      border: "1.5px solid #F1E2E3",
      text: "#191919",
      textSecondary: "#595959",
      accent: "#A8232A",
      radius: "16px",
      shadow: "0 8px 24px rgba(168, 35, 42, 0.03)",
      fontFamily: "Be Vietnam Pro, sans-serif"
    }
  },
  {
    id: "ai_hub_grid",
    name: "AI Hub Grid",
    description: "Nền chàm tối với lưới tọa độ kỹ thuật số, quầng sáng xanh dương và các thẻ kính mờ phát sáng viền cyan.",
    tokens: {
      background: "#030712",
      cardBg: "linear-gradient(135deg, rgba(8, 17, 37, 0.7) 0%, rgba(3, 7, 18, 0.4) 100%)",
      border: "1px solid rgba(59, 130, 246, 0.35)",
      text: "#ffffff",
      textSecondary: "rgba(255, 255, 255, 0.65)",
      accent: "#3b82f6",
      radius: "16px",
      shadow: "0 0 25px rgba(59, 130, 246, 0.15)",
      fontFamily: "Be Vietnam Pro, sans-serif"
    }
  }
];

const CircularProgressLoader = ({ loadingMessage }) => {
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        const diff = Math.max(1, Math.floor((95 - prev) * 0.08));
        return prev + diff;
      });
    }, 250);

    return () => clearInterval(timer);
  }, []);

  const getPhaseText = (pct) => {
    if (loadingMessage) return loadingMessage;
    if (pct < 30) return "Phân tích kịch bản & trích xuất ý chính...";
    if (pct < 65) return "Lựa chọn Layout & áp dụng phong cách thiết kế...";
    if (pct < 90) return "Tải quy chuẩn phân cảnh & phối hợp giọng đọc...";
    return "Hoàn tất không gian biên tập Storyboard...";
  };

  const radius = 48;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "380px",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        border: "1px solid rgba(15, 23, 42, 0.08)",
        boxShadow: "0 12px 32px rgba(15, 23, 42, 0.05)",
        padding: "40px 20px",
        boxSizing: "border-box"
      }}
    >
      <div style={{ position: "relative", width: "120px", height: "120px" }}>
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="rgba(15, 23, 42, 0.08)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.3s ease-in-out"
            }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <span style={{ fontSize: "24px", fontFamily: "var(--font-heading)", fontWeight: "900", color: "#0f172a", letterSpacing: "-0.03em" }}>
            {`${progress}%`}
          </span>
        </div>
      </div>

      <p style={{ marginTop: "24px", fontSize: "15px", fontFamily: "var(--font-heading)", fontWeight: "700", color: "#1e293b", textAlign: "center" }}>
        {getPhaseText(progress)}
      </p>

      <span style={{ marginTop: "6px", fontSize: "12px", color: "var(--text-secondary)", fontFamily: "Inter", fontWeight: "500" }}>
        Vui lòng đợi trong giây lát, AI đang xử lý...
      </span>
    </div>
  );
};

export const StoryboardEditor = ({

  scenes = [],
  config = {},
  projectId,
  onGenerateStoryboard,
  onUpdateScene,
  onRegenerateSceneTts,
  loading,
  loadingMessage,
  selectedSceneId,
  onSelectScene,
  mode = "editor"
}) => {
  const [topicText, setTopicText] = useState("");
  const [scriptText, setScriptText] = useState("");
  const [localTexts, setLocalTexts] = useState({});
  const [uploadingScenes, setUploadingScenes] = useState({});
  const [playingSceneId, setPlayingSceneId] = useState(null);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("minimal");
  const [vdeThemes, setVdeThemes] = useState(VDE_PRESET_STYLES);

  // Media Modal & Upload states
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaTab, setMediaTab] = useState("YOUR_MEDIA"); // YOUR_MEDIA, UPLOAD, STOCK, AI
  const [previousMedia, setPreviousMedia] = useState([]);
  const [stockQuery, setStockQuery] = useState("");
  const [stockResults, setStockResults] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [mediaModalContext, setMediaModalContext] = useState(null); // 'scene-editor' or null
  const [activeUploadSceneId, setActiveUploadSceneId] = useState(null);

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

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/vde-themes");
        setVdeThemes(response.data);
      } catch (err) {
        console.error("Error fetching VDE themes:", err);
      }
    };
    fetchThemes();
  }, []);

  const playerRefs = useRef({});

  const handleImageUploadClick = (sceneId) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (scene) {
      setSelectedMedia(scene.mediaList || []);
    } else {
      setSelectedMedia([]);
    }
    setActiveUploadSceneId(sceneId);
    setMediaModalContext('scene-editor');
    setShowMediaModal(true);
  };

  const handleCloseMediaModal = () => {
    setShowMediaModal(false);
    setMediaModalContext(null);
    setActiveUploadSceneId(null);
  };

  const handleMediaModalConfirm = () => {
    if (mediaModalContext === 'scene-editor' && activeUploadSceneId) {
      // Update ALL scenes' mediaList with the selectedMedia
      scenes.forEach(scene => {
        const currentMediaList = scene.mediaList || [];
        // Union of current media list and selected media, preserving order and uniqueness
        const unionList = [...currentMediaList];
        selectedMedia.forEach(url => {
          if (!unionList.includes(url)) {
            unionList.push(url);
          }
        });

        const updateData = { mediaList: unionList };

        // For the active scene that initiated the upload, set selectedMediaIndex to the last selected/added image
        if (scene.id === activeUploadSceneId && selectedMedia.length > 0) {
          const lastSelectedUrl = selectedMedia[selectedMedia.length - 1];
          const newIdx = unionList.indexOf(lastSelectedUrl);
          if (newIdx !== -1) {
            updateData.selectedMediaIndex = newIdx;
          }
        }

        onUpdateScene(scene.id, {
          ...scene,
          ...updateData
        });
      });
    }

    // Reset state and close modal
    setShowMediaModal(false);
    setMediaModalContext(null);
    setActiveUploadSceneId(null);
  };

  const handleToggleSelectMedia = (url) => {
    setSelectedMedia(prev => {
      if (prev.includes(url)) {
        return prev.filter(u => u !== url);
      } else {
        return [...prev, url];
      }
    });
  };

  const handleStockSearch = async () => {
    if (!stockQuery.trim()) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/media/search?query=${encodeURIComponent(stockQuery)}`);
      setStockResults(res.data || []);
    } catch (err) {
      console.error("Stock search failed:", err);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      setUploading(true);
      try {
        const res = await axios.post("http://localhost:5000/api/upload", { file: reader.result });
        if (res.data && res.data.url) {
          const uploadedUrl = res.data.url.trim();
          setSelectedMedia(prev => Array.from(new Set([...prev, uploadedUrl])));
          setPreviousMedia(prev => Array.from(new Set([uploadedUrl, ...prev])));
          setMediaTab("YOUR_MEDIA");
        }
      } catch (err) {
        console.error("Upload failed:", err);
        alert("Không thể tải ảnh lên: " + (err.response?.data?.error || err.message));
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const [searchQueries, setSearchQueries] = useState({});
  const [searchingImages, setSearchingImages] = useState({});

  const handleGenerate = () => {
    if (!scriptText.trim()) return;
    setShowStyleModal(true);
  };

  const handleConfirmStyle = () => {
    setShowStyleModal(false);
    onGenerateStoryboard(scriptText, selectedStyle, selectedMedia);
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


  const renderMediaModal = () => {
    if (!showMediaModal) return null;
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px"
      }}>
        <div style={{
          backgroundColor: "#ffffff",
          width: "1000px",
          maxWidth: "95%",
          height: "85vh",
          maxHeight: "800px",
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
              <span style={{ fontSize: "20px" }}>🖼️</span>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Project Images</h3>
            </div>

            {/* Tabs Switcher */}
            <div style={{
              display: "flex",
              background: "#f1f5f9",
              padding: "4px",
              borderRadius: "30px",
              gap: "4px"
            }}>
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
                  transition: "all 0.2s ease",
                  boxShadow: mediaTab === "YOUR_MEDIA" ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                }}
              >
                Your Media
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
                  transition: "all 0.2s ease",
                  boxShadow: mediaTab === "UPLOAD" ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                }}
              >
                Upload
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
                  transition: "all 0.2s ease",
                  boxShadow: mediaTab === "STOCK" ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                }}
              >
                Stock Images
              </button>
              <button
                type="button"
                onClick={() => setMediaTab("AI")}
                style={{
                  border: "none",
                  background: mediaTab === "AI" ? "#ffffff" : "none",
                  color: mediaTab === "AI" ? "#0f172a" : "#64748b",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: mediaTab === "AI" ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                }}
              >
                AI Images
              </button>
            </div>

            <button
              type="button"
              onClick={handleCloseMediaModal}
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
                color: "#64748b",
                transition: "background 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.08)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.04)"}
            >
              ✕
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ flex: 1, padding: "24px", overflowY: "auto", minHeight: 0 }}>
            {mediaTab === "YOUR_MEDIA" && (
              <div>
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "600", color: "#1e293b" }}>Your Media</h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Reuse images and videos from your previous projects.</p>
                </div>
                {previousMedia.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", border: "2px dashed #e2e8f0", borderRadius: "12px" }}>
                    <span style={{ fontSize: "32px", marginBottom: "12px" }}>📂</span>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b", fontWeight: "600" }}>Chưa có file phương tiện nào được lưu trước đây.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "16px" }}>
                    {previousMedia.map((url, idx) => {
                      const isSelected = selectedMedia.includes(url);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleSelectMedia(url)}
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
                            alt="Previous Media Item"
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover"
                            }}
                          />
                          {isSelected && (
                            <div style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                              backgroundColor: "#3b82f6",
                              color: "#ffffff",
                              borderRadius: "50%",
                              width: "20px",
                              height: "20px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: "bold"
                            }}>
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
                  onClick={() => document.getElementById("media-modal-upload-input").click()}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#3b82f6";
                    e.currentTarget.style.backgroundColor = "#f0f9ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#cbd5e1";
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                  }}
                >
                  <input
                    type="file"
                    id="media-modal-upload-input"
                    accept="image/*"
                    onChange={handleFileUpload}
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
                      <span style={{ fontSize: "15px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Click to upload files</span>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>Supports JPG, PNG, GIF up to 5MB</span>
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
                    placeholder="Search high-quality stock photos from Unsplash..."
                    value={stockQuery}
                    onChange={(e) => setStockQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleStockSearch()}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: "30px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleStockSearch}
                    style={{
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                      border: "none",
                      padding: "0 24px",
                      borderRadius: "30px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Tìm kiếm
                  </button>
                </div>

                {stockResults.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
                    <span style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</span>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b", fontWeight: "600" }}>Nhập từ khóa tìm kiếm để duyệt ảnh Unsplash</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "16px" }}>
                    {stockResults.map((url, idx) => {
                      const isSelected = selectedMedia.includes(url);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleSelectMedia(url)}
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
                            alt="Unsplash Stock"
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover"
                            }}
                          />
                          {isSelected && (
                            <div style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                              backgroundColor: "#3b82f6",
                              color: "#ffffff",
                              borderRadius: "50%",
                              width: "20px",
                              height: "20px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: "bold"
                            }}>
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

            {mediaTab === "AI" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "300px" }}>
                <span style={{ fontSize: "48px", marginBottom: "16px" }}>✨</span>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>AI Image Generation</h4>
                <p style={{ margin: 0, fontSize: "14px", color: "#64748b", textAlign: "center", maxWidth: "340px" }}>Tính năng tạo ảnh minh họa tự động bằng AI đang được phát triển và sẽ sớm ra mắt.</p>
              </div>
            )}
          </div>

          {/* Selected Media Preview Bar / Footer */}
          <div style={{
            borderTop: "1px solid rgba(15, 23, 42, 0.06)",
            padding: "16px 24px",
            backgroundColor: "#fafbfc",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>
                Selected Media ({selectedMedia.length} asset{selectedMedia.length !== 1 ? "s" : ""})
              </span>
              {selectedMedia.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedMedia([])}
                  style={{ border: "none", background: "none", color: "#ef4444", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
              <div style={{
                flex: 1,
                display: "flex",
                gap: "10px",
                overflowX: "auto",
                paddingBottom: "4px",
                minHeight: "56px"
              }}>
                {selectedMedia.length === 0 ? (
                  <span style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic", alignSelf: "center" }}>
                    No project media selected yet.
                  </span>
                ) : (
                  selectedMedia.map((url, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        width: "50px",
                        height: "50px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        flexShrink: 0,
                        border: "1px solid rgba(0,0,0,0.1)"
                      }}
                    >
                      <img
                        src={url.startsWith("http") ? url : `http://localhost:5000${url}`}
                        alt="Selected Thumbnail"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        onClick={() => handleToggleSelectMedia(url)}
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          width: "14px",
                          height: "14px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(0,0,0,0.6)",
                          color: "#ffffff",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "8px",
                          cursor: "pointer"
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={handleMediaModalConfirm}
                style={{
                  backgroundColor: "#3b82f6",
                  color: "#ffffff",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "30px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(59, 130, 246, 0.2)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#3b82f6"}
              >
                Xác nhận
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  };

  // MODE 1: SETUP & SCRIPT INPUT
  if (mode === "setup") {
    return (
      <div className="custom-scrollbar" style={{ flex: 1, padding: "30px", display: "flex", flexDirection: "column", gap: "25px", overflowY: "auto", boxSizing: "border-box" }}>

        {loading ? (
          <CircularProgressLoader loadingMessage={loadingMessage} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1 }}>

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

            <div style={{ borderTop: "1px solid rgba(15, 23, 42, 0.08)", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => {
                  setMediaModalContext(null);
                  setActiveUploadSceneId(null);
                  setShowMediaModal(true);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  borderRadius: "30px",
                  border: "1px solid rgba(15, 23, 42, 0.12)",
                  background: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-primary)";
                  e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(15, 23, 42, 0.12)";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }}
              >
                <span style={{ fontSize: "16px" }}>🖼️</span>
                Media ({selectedMedia.length})
              </button>

              <button
                className="btn-mono btn-mono-primary"
                style={{
                  width: "auto",
                  minWidth: "160px",
                  padding: "12px 32px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  borderRadius: "30px",
                  letterSpacing: "0.03em"
                }}
                onClick={handleGenerate}
              >
                Tạo storyboard &nbsp; 🪄
              </button>
            </div>
          </div>
        )}

        {renderMediaModal()}

        {showStyleModal && (
          <div style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10, 11, 20, 0.75)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px"
          }}>
            <div style={{
              backgroundColor: "#ffffff",
              width: "100%",
              maxWidth: "960px",
              borderRadius: "24px",
              border: "3px solid #000000",
              boxShadow: "8px 8px 0px #000000",
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden"
            }}>
              {/* Header */}
              <div style={{
                padding: "24px 30px",
                borderBottom: "2px solid #000000",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <h3 style={{
                  margin: 0,
                  fontFamily: "Space Grotesk",
                  fontSize: "20px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}>
                  CHỌN PHONG CÁCH VIDEO (VDE)
                </h3>
                <button
                  onClick={() => setShowStyleModal(false)}
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

              {/* Style Grid Container */}
              <div className="custom-scrollbar" style={{
                padding: "30px",
                overflowY: "auto",
                flex: 1
              }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: "24px"
                }}>
                  {vdeThemes.map(style => {
                    const isSelected = selectedStyle === style.id;
                    return (
                      <div
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
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
                        {/* Mini Viewport Code Mockup */}
                        <div style={{
                          width: "100%",
                          aspectRatio: "9/16",
                          backgroundColor: style.tokens.background,
                          border: "2px solid #000",
                          borderRadius: "12px",
                          padding: "16px",
                          boxSizing: "border-box",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          position: "relative",
                          overflow: "hidden",
                          color: style.tokens.text
                        }}>
                          {/* 1. Header decoration */}
                          {style.id === "rikkei" ? (
                            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                              <span style={{ fontSize: "8px", fontWeight: "bold", color: "#A8232A", fontFamily: "sans-serif" }}>Hệ thống học tập</span>
                              <span style={{ fontSize: "8px", color: "#555555", fontWeight: "500", fontFamily: "sans-serif" }}>Rikkei Edu</span>
                            </div>
                          ) : (
                            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                              <div style={{ fontSize: "8px", textTransform: "uppercase", padding: "2px 6px", border: `1px solid ${style.tokens.accent}50`, borderRadius: "10px", color: style.tokens.accent, fontWeight: "bold" }}>
                                Kỷ nguyên AI
                              </div>
                            </div>
                          )}

                          {/* 2. Main Content Card / Block */}
                          {style.id === "rikkei" ? (
                            <div style={{
                              backgroundColor: "#FAF5F5",
                              border: "1px solid #F1E2E3",
                              borderRadius: "14px",
                              padding: "10px",
                              boxSizing: "border-box",
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                              width: "100%"
                            }}>
                              <h4 style={{ margin: 0, fontSize: "10px", fontWeight: "bold", color: "#191919", fontFamily: "Be Vietnam Pro, sans-serif" }}>
                                Quản lý dự án
                              </h4>
                              <p style={{ margin: 0, fontSize: "7px", color: "#595959", lineHeight: "1.3", fontFamily: "Be Vietnam Pro, sans-serif" }}>
                                Nền kịch bản đăng ký, theo dõi các dự án của sinh viên.
                              </p>
                              <div style={{
                                width: "fit-content",
                                backgroundColor: "#A8232A",
                                color: "#ffffff",
                                fontSize: "7px",
                                fontWeight: "bold",
                                padding: "3px 8px",
                                borderRadius: "8px",
                                marginTop: "3px",
                                fontFamily: "Be Vietnam Pro, sans-serif"
                              }}>
                                Truy cập →
                              </div>
                            </div>
                          ) : (
                            <div style={{
                              backgroundColor: style.tokens.cardBg.includes("gradient") ? undefined : style.tokens.cardBg,
                              backgroundImage: style.tokens.cardBg.includes("gradient") ? style.tokens.cardBg : undefined,
                              border: style.tokens.border,
                              borderRadius: style.tokens.radius,
                              boxShadow: style.tokens.shadow,
                              padding: "12px",
                              boxSizing: "border-box",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              width: "100%"
                            }}>
                              <h4 style={{
                                margin: 0,
                                fontSize: "11px",
                                fontWeight: "bold",
                                fontFamily: style.tokens.fontFamily,
                                color: style.tokens.text,
                                lineHeight: "1.2"
                              }}>
                                AI THAY ĐỔI TOÀN DIỆN
                              </h4>
                              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                  <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: style.tokens.accent }} />
                                  <span style={{ fontSize: "8px", color: style.tokens.textSecondary }}>
                                    Không chỉ viết vài dòng code
                                  </span>
                                </div>
                                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                  <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: style.tokens.accent }} />
                                  <span style={{ fontSize: "8px", color: style.tokens.textSecondary }}>
                                    Phát triển cả dự án phần mềm
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 3. Footer decoration */}
                          {style.id === "rikkei" ? (
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "7px", color: "#A8232A", fontWeight: "bold", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "4px", width: "100%", fontFamily: "Be Vietnam Pro, sans-serif" }}>
                              <span>Rikkei Education</span>
                              <span style={{ color: "#595959" }}>@rikkeiedu</span>
                            </div>
                          ) : (
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "7px", color: style.tokens.textSecondary }}>
                              <span>• HYPERFRAMES</span>
                              <span>0:15</span>
                            </div>
                          )}
                        </div>

                        {/* Title and Description */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{
                            fontSize: "15px",
                            fontWeight: "bold",
                            fontFamily: "Space Grotesk",
                            color: "#0f172a"
                          }}>
                            {style.name}
                          </span>
                          <span style={{
                            fontSize: "12px",
                            color: "#64748b",
                            lineHeight: "1.4"
                          }}>
                            {style.description}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Actions */}
              <div style={{
                padding: "20px 30px",
                borderTop: "2px solid #000000",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                backgroundColor: "#f8fafc"
              }}>
                <button
                  onClick={() => setShowStyleModal(false)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "30px",
                    border: "2px solid #000000",
                    backgroundColor: "#ffffff",
                    fontFamily: "Space Grotesk",
                    fontWeight: "bold",
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: "2px 2px 0px #000000"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStyle}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "30px",
                    border: "2px solid #000000",
                    backgroundColor: "#000000",
                    color: "#ffffff",
                    fontFamily: "Space Grotesk",
                    fontWeight: "bold",
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: "2px 2px 0px #000000"
                  }}
                >
                  Save & Next
                </button>
              </div>
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
                <div style={{ width: "280px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
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
                    {/* Always-visible Remotion Player - shows last frame when paused */}
                    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
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
                    </div>

                    {/* Play / Pause overlay button — sits directly in the position:relative outer container */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (playingSceneId === scene.id) {
                          const player = playerRefs.current[scene.id];
                          if (player) { try { player.pause(); } catch (_) { } }
                          setPlayingSceneId(null);
                        } else {
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
                        bottom: "12px",
                        left: "12px",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: playingSceneId === scene.id
                          ? "rgba(220, 38, 38, 0.9)"
                          : "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
                        zIndex: 20,
                        color: playingSceneId === scene.id ? "#ffffff" : "#111111",
                        transition: "transform 0.15s ease, background-color 0.15s ease",
                        boxSizing: "border-box"
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.12)"; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                      title={playingSceneId === scene.id ? "Dừng preview" : "Phát preview phân cảnh này"}
                    >
                      {playingSceneId === scene.id ? (
                        // Stop square SVG
                        <svg viewBox="0 0 24 24" width="14" height="14" style={{ fill: "#ffffff", flexShrink: 0, display: "block" }}>
                          <rect x="5" y="5" width="14" height="14" rx="1.5" />
                        </svg>
                      ) : (
                        // Play triangle SVG
                        <svg viewBox="0 0 24 24" width="15" height="15" style={{ fill: "#111111", flexShrink: 0, display: "block", marginLeft: "1.5px" }}>
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
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

                {/* Right Side: Editing Inputs */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label className="form-label-mono" style={{ fontSize: "11px" }}>Layout Family</label>
                      <select
                        className="form-input-mono"
                        value={normalizeFamily(scene.layoutFamily, scene.visualLayout)}
                        onChange={(e) => {
                          const newFamily = e.target.value;
                          const layouts = LAYOUTS_BY_FAMILY[newFamily] || [];
                          const defaultLayout = layouts[0]?.value || "AppCardConcept";

                          onUpdateScene(scene.id, {
                            ...scene,
                            layoutFamily: newFamily,
                            visualLayout: defaultLayout
                          });
                        }}
                        style={{ padding: "8px", fontSize: "12px" }}
                      >
                        {Object.keys(LAYOUTS_BY_FAMILY).map((fam) => (
                          <option key={fam} value={fam}>{fam}</option>
                        ))}
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
                        {(LAYOUTS_BY_FAMILY[normalizeFamily(scene.layoutFamily, scene.visualLayout)] || LAYOUTS_BY_FAMILY["Opening / Headline"]).map((lay) => (
                          <option key={lay.value} value={lay.value}>{lay.label}</option>
                        ))}
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
                      value={localTexts[`${scene.id}_heading`] !== undefined ? localTexts[`${scene.id}_heading`] : scene.heading}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocalTexts(prev => ({ ...prev, [`${scene.id}_heading`]: val }));
                      }}
                      onBlur={() => {
                        const val = localTexts[`${scene.id}_heading`];
                        if (val !== undefined && val !== scene.heading) {
                          handleFieldChange(scene.id, "heading", val);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.target.blur();
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label className="form-label-mono" style={{ fontSize: "11px" }}>Từ khóa nổi bật (cách nhau bằng dấu phẩy)</label>
                    <input
                      className="form-input-mono"
                      type="text"
                      placeholder="Ví dụ: Vendor, AI Agent"
                      value={
                        localTexts[`${scene.id}_highlightWords`] !== undefined
                          ? localTexts[`${scene.id}_highlightWords`]
                          : (scene.sceneIntent?.highlightWords || []).join(", ")
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocalTexts(prev => ({ ...prev, [`${scene.id}_highlightWords`]: val }));
                      }}
                      onBlur={() => {
                        const val = localTexts[`${scene.id}_highlightWords`];
                        if (val !== undefined) {
                          const wordsArray = val.split(",").map(w => w.trim()).filter(w => w.length > 0);
                          const currentHighlightWords = scene.sceneIntent?.highlightWords || [];
                          if (JSON.stringify(wordsArray) !== JSON.stringify(currentHighlightWords)) {
                            const updatedIntent = {
                              ...(scene.sceneIntent || {}),
                              highlightWords: wordsArray
                            };
                            handleFieldChange(scene.id, "sceneIntent", updatedIntent);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.target.blur();
                        }
                      }}
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
                          value={localTexts[`${scene.id}_accentColor`] !== undefined ? localTexts[`${scene.id}_accentColor`] : (scene.accentColor || "#FFB7C5")}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLocalTexts(prev => ({ ...prev, [`${scene.id}_accentColor`]: val }));
                          }}
                          onBlur={() => {
                            const val = localTexts[`${scene.id}_accentColor`];
                            if (val !== undefined && val !== (scene.accentColor || "#FFB7C5")) {
                              handleFieldChange(scene.id, "accentColor", val);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.target.blur();
                            }
                          }}
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
                      gap: "4px",
                      maxHeight: "260px",
                      overflowY: "auto",
                      paddingRight: "4px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "6px",
                      padding: "6px",
                      backgroundColor: "rgba(0, 0, 0, 0.15)"
                    }}>
                      {getNormalizedPoints(scene.points).length === 0 ? (
                        <div style={{ textAlign: "center", padding: "15px", fontSize: "12px", opacity: 0.4 }}>Chưa có ý chính nào. Bấm "+ Thêm ý chính" để tạo mới.</div>
                      ) : (
                        getNormalizedPoints(scene.points).map((pt, idx) => (
                          <div key={idx} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "5px 6px",
                            borderRadius: "5px",
                            backgroundColor: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)"
                          }}>
                            {/* Index badge */}
                            <span style={{
                              fontSize: "10px",
                              fontFamily: "monospace",
                              opacity: 0.35,
                              flexShrink: 0,
                              width: "18px",
                              textAlign: "right"
                            }}>#{idx + 1}</span>

                            {/* Text input */}
                            <input
                              type="text"
                              className="form-input-mono"
                              value={localTexts[`${scene.id}_point_${idx}`] !== undefined ? localTexts[`${scene.id}_point_${idx}`] : pt.text}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLocalTexts(prev => ({ ...prev, [`${scene.id}_point_${idx}`]: val }));
                              }}
                              onBlur={() => {
                                const val = localTexts[`${scene.id}_point_${idx}`];
                                if (val !== undefined && val !== pt.text) {
                                  handlePointChange(scene.id, scene.points, idx, "text", val);
                                }
                              }}
                              onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                              placeholder="Nội dung hiển thị..."
                              style={{ flex: 1, padding: "4px 7px", fontSize: "12px", minWidth: 0 }}
                            />

                            {/* Animation select — compact */}
                            <select
                              className="form-input-mono"
                              value={pt.animation}
                              onChange={(e) => handlePointChange(scene.id, scene.points, idx, "animation", e.target.value)}
                              title="Hiệu ứng xuất hiện"
                              style={{ padding: "4px 4px", fontSize: "11px", height: "auto", width: "110px", flexShrink: 0 }}
                            >
                              <option value="slide-up">↑ Slide Up</option>
                              <option value="scale-in">⊕ Scale In</option>
                              <option value="fade-in">◎ Fade In</option>
                              <option value="blur-in">✦ Blur In</option>
                              <option value="slide-left">← Slide Left</option>
                              <option value="slide-right">→ Slide Right</option>
                            </select>

                            {/* Delay slider + value */}
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0, width: "110px" }}>
                              <input
                                type="range"
                                min="0"
                                max={scene.duration || 10}
                                step="0.1"
                                value={pt.delay}
                                onChange={(e) => handlePointChange(scene.id, scene.points, idx, "delay", parseFloat(e.target.value))}
                                style={{ flex: 1, height: "3px", accentColor: "#00E5FF", cursor: "pointer" }}
                              />
                              <span style={{
                                fontSize: "11px",
                                fontWeight: "700",
                                fontFamily: "Space Grotesk, monospace",
                                width: "32px",
                                textAlign: "center",
                                flexShrink: 0,
                                color: "#111111",
                                backgroundColor: "#ffffff",
                                borderRadius: "4px",
                                padding: "1px 3px",
                                letterSpacing: "-0.3px"
                              }}>
                                {pt.delay}s
                              </span>
                            </div>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => handleRemovePoint(scene.id, scene.points, idx)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "rgba(255,77,77,0.6)",
                                cursor: "pointer",
                                fontSize: "13px",
                                padding: "0 2px",
                                flexShrink: 0,
                                lineHeight: 1,
                                transition: "color 0.15s"
                              }}
                              onMouseOver={(e) => e.currentTarget.style.color = "#ff4d4d"}
                              onMouseOut={(e) => e.currentTarget.style.color = "rgba(255,77,77,0.6)"}
                              title="Xóa ý này"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <label className="form-label-mono" style={{ fontSize: "11px", marginBottom: 0 }}>Voiceover Script</label>
                      {onRegenerateSceneTts && scene.voiceover && (
                        <button
                          type="button"
                          onClick={() => onRegenerateSceneTts(scene.id)}
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: "11px",
                            color: "var(--color-primary, #2563eb)",
                            textDecoration: "underline",
                            cursor: "pointer",
                            fontFamily: "Space Grotesk, sans-serif",
                            fontWeight: "bold",
                            padding: 0
                          }}
                        >
                          🔊 Tái tạo giọng đọc
                        </button>
                      )}
                    </div>
                    <textarea
                      className="form-input-mono"
                      value={localTexts[`${scene.id}_voiceover`] !== undefined ? localTexts[`${scene.id}_voiceover`] : scene.voiceover}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocalTexts(prev => ({ ...prev, [`${scene.id}_voiceover`]: val }));
                      }}
                      onBlur={() => {
                        const val = localTexts[`${scene.id}_voiceover`];
                        if (val !== undefined && val !== scene.voiceover) {
                          handleFieldChange(scene.id, "voiceover", val);
                        }
                      }}
                      style={{ height: "60px", fontSize: "13px", resize: "none" }}
                    />
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
      {renderMediaModal()}
    </div>
  );
};
