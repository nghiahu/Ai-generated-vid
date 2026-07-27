import React, { useState, useEffect } from "react";
import { api } from "./services/api";
import { Dashboard } from "./components/Dashboard";
import { SidebarConfig } from "./components/SidebarConfig";
import { StoryboardEditor } from "./components/StoryboardEditor";
import { MasterPlayer } from "./components/MasterPlayer";
import { StudioAIGen } from "./components/StudioAIGen";
import "./App.css";

function App() {
  const getInitialView = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlView = urlParams.get("view");
      if (urlView) return urlView;
      const storedView = localStorage.getItem("activeView");
      if (storedView) return storedView;
    } catch (e) {
      console.warn("Failed to read initial view:", e);
    }
    return "PROJECTS";
  };

  const getInitialProjectId = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlProjectId = urlParams.get("projectId");
      if (urlProjectId) return urlProjectId;
      const storedProjectId = localStorage.getItem("activeProjectId");
      if (storedProjectId) return storedProjectId;
    } catch (e) {
      console.warn("Failed to read initial project id:", e);
    }
    return null;
  };

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(getInitialProjectId);
  const [currentProject, setCurrentProject] = useState(null);
  const [selectedSceneId, setSelectedSceneId] = useState(null);
  const [view, setView] = useState(getInitialView); // "PROJECTS", "STUDIO", "STUDIO_AI_GEN", "BATCH", "WORKSPACE_EDITOR", "WORKSPACE_SETUP"
  const [draftConfig, setDraftConfig] = useState({
    length: "Short (~60s)",
    language: "Vietnamese",
    voice: "rachel",
    watermark: { enabled: true, text: "yupclip.com", position: "top-right", color: "#000000" },
    backgroundMusic: "Chill Lofi Beats",
    backgroundMusicVolume: 0.025
  });

  // States for generation & rendering loading
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedFrames, setRenderedFrames] = useState(0);
  const [renderTotalFrames, setRenderTotalFrames] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [regeneratingTts, setRegeneratingTts] = useState(false);
  const [regeneratingSceneId, setRegeneratingSceneId] = useState(null);
  const [toast, setToast] = useState(null);
  const [regeneratingCodeSceneId, setRegeneratingCodeSceneId] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [modalVoice, setModalVoice] = useState("rachel");
  const [modalCustomVoiceId, setModalCustomVoiceId] = useState("");

  // Sync modal voice when project updates
  useEffect(() => {
    if (currentProject?.config) {
      setModalVoice(currentProject.config.voice || "rachel");
      setModalCustomVoiceId(currentProject.config.customVoiceId || "");
    }
  }, [currentProject]);

  // Sync URL search parameters and localStorage whenever view or selectedProjectId changes
  useEffect(() => {
    try {
      if (view) {
        localStorage.setItem("activeView", view);
      }
      const url = new URL(window.location.href);
      if (view) {
        url.searchParams.set("view", view);
      } else {
        url.searchParams.delete("view");
      }
      if (selectedProjectId) {
        localStorage.setItem("activeProjectId", selectedProjectId);
        url.searchParams.set("projectId", selectedProjectId);
      } else {
        localStorage.removeItem("activeProjectId");
        url.searchParams.delete("projectId");
      }
      window.history.replaceState({}, "", url.toString());
    } catch (e) {
      console.warn("Failed to sync view/projectId URL state:", e);
    }
  }, [view, selectedProjectId]);

  // Load projects list on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const list = await api.getProjects();
      setProjects(list);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  // Fetch full project details when one is selected
  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetail(selectedProjectId);
    } else {
      setCurrentProject(null);
      setSelectedSceneId(null);
      setVideoUrl(null);
    }
  }, [selectedProjectId]);

  const fetchProjectDetail = async (id) => {
    try {
      const project = await api.getProjectById(id);
      if (!project) return;

      // Smart AI Gen detection: check type OR config.scenes visualPattern
      const isAIGen = project.type === "AIGEN" || (
        project.config &&
        Array.isArray(project.config.scenes) &&
        project.config.scenes.length > 0 &&
        Boolean(project.config.scenes[0].visualPattern)
      );

      if (!isAIGen) {
        project.config = { visualStyle: "rikkei", ...(project.config || {}) };
        if (!project.config.visualStyle) project.config.visualStyle = "rikkei";
      }

      setCurrentProject(project);

      if (project.scenes && project.scenes.length > 0) {
        setSelectedSceneId(project.scenes[0].id);
      }
      setView("WORKSPACE_EDITOR");
    } catch (error) {
      console.error("Failed to fetch project detail:", error);
    }
  };

  const handleCreateProject = async (title) => {
    try {
      const newProj = await api.createProject(title);
      await fetchProjects();
      setSelectedProjectId(newProj.id);
      setView("WORKSPACE_EDITOR");
    } catch (error) {
      console.error("Failed to create project:", error);
      alert(`Không thể tạo dự án mới: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await api.deleteProject(projectId);
      await fetchProjects();
      alert("Đã xóa dự án thành công!");
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert(`Không thể xóa dự án: ${error.response?.data?.error || error.message}`);
    }
  };


  const handleUpdateConfig = async (newConfig) => {
    if (!currentProject) return;
    // Optimistic update
    setCurrentProject(prev => ({
      ...prev,
      config: newConfig
    }));

    try {
      const savedConfig = await api.updateProjectConfig(currentProject.id, newConfig);
      // Update with exact backend details (including compiled vdeTokens)
      setCurrentProject(prev => ({
        ...prev,
        config: savedConfig
      }));
    } catch (error) {
      console.error("Failed to save project configuration:", error);
      alert(`Không thể lưu cấu hình dự án: ${error.response?.data?.error || error.message}`);
      // Revert optimistic update
      fetchProjects();
    }
  };

  const handleRegenerateTts = () => {
    if (!currentProject) return;
    setShowVoiceModal(true);
  };

  const confirmRegenerateTts = async () => {
    setShowVoiceModal(false);
    setRegeneratingTts(true);
    setLoading(true);
    setLoadingMessage("Đang làm mới toàn bộ giọng thoại...");
    try {
      // 1. Save config first to set the chosen voice in backend
      const updatedConfig = {
        ...currentProject.config,
        voice: modalVoice,
        customVoiceId: modalCustomVoiceId
      };
      const savedConfig = await api.updateProjectConfig(currentProject.id, updatedConfig);

      // Update local state config
      setCurrentProject(prev => ({
        ...prev,
        config: savedConfig
      }));

      // 2. Trigger regeneration
      await api.regenerateTts(currentProject.id);
      await fetchProjectDetail(currentProject.id);
      showToast("Đã làm mới tất cả giọng đọc thành công!", "success");
    } catch (error) {
      console.error("Failed to regenerate TTS:", error);
      showToast(`Không thể làm mới giọng đọc: ${error.response?.data?.error || error.message}`, "error");
    } finally {
      setRegeneratingTts(false);
      setLoading(false);
    }
  };

  const handleUpdateScene = async (sceneId, sceneData) => {
    if (!currentProject) return;

    // Optimistic client-side state update for instant live preview updates
    setCurrentProject(prev => {
      const newScenes = prev.scenes.map(s => s.id === sceneId ? { ...s, ...sceneData } : s);
      return { ...prev, scenes: newScenes };
    });

    try {
      const updatedScene = await api.updateScene(currentProject.id, sceneId, sceneData);

      // Update with exact backend details (including voiceoverAudioUrl path)
      setCurrentProject(prev => {
        const newScenes = prev.scenes.map(s => s.id === sceneId ? { ...s, ...updatedScene } : s);
        return { ...prev, scenes: newScenes };
      });
    } catch (error) {
      console.error("Failed to update scene:", error);
      showToast(`Không thể cập nhật phân cảnh: ${error.response?.data?.error || error.message}`, "error");
    }
  };

  const handleRegenerateSceneTts = async (sceneId) => {
    if (!currentProject) return;
    setRegeneratingSceneId(sceneId);
    try {
      const updatedScene = await api.regenerateSceneTts(currentProject.id, sceneId);

      // Update local state with the exact updated scene
      setCurrentProject(prev => {
        const newScenes = prev.scenes.map(s => s.id === sceneId ? { ...s, ...updatedScene } : s);
        return { ...prev, scenes: newScenes };
      });

      showToast("Đã tái tạo giọng đọc phân cảnh thành công!", "success");
    } catch (error) {
      console.error("Failed to regenerate scene TTS:", error);
      showToast(`Không thể tái tạo giọng đọc: ${error.response?.data?.error || error.message}`, "error");
    } finally {
      setRegeneratingSceneId(null);
    }
  };

  const handleRegenerateSceneCode = async (sceneId, scriptText) => {
    if (!currentProject) return;
    setRegeneratingCodeSceneId(sceneId);
    setLoading(true);
    setLoadingMessage("AI đang thiết kế và sinh lại mã nguồn phân cảnh...");
    try {
      const scene = currentProject.scenes.find(s => s.id === sceneId);
      if (!scene) throw new Error("Không tìm thấy phân cảnh");

      const voiceKey = currentProject.config?.voice || "quanganh";
      const theme = currentProject.config?.theme || "ai_hub_grid";
      const bgImage = currentProject.config?.bgImage || "";
      const refImages = currentProject.config?.refImages || [];
      const script = scriptText || scene.voiceover || "";

      await api.generateStudioAiGenScene(
        currentProject.id,
        scene,
        voiceKey,
        theme,
        bgImage,
        refImages,
        script,
        true, // bypassCache
        "" // userNote
      );

      await fetchProjectDetail(currentProject.id);
      showToast("Đã sinh lại phân cảnh thành công!", "success");
    } catch (error) {
      console.error("Failed to regenerate scene code:", error);
      showToast(`Không thể sinh lại phân cảnh: ${error.response?.data?.error || error.message}`, "error");
    } finally {
      setRegeneratingCodeSceneId(null);
      setLoading(false);
    }
  };

  const handleGenerateStoryboard = async (scriptText, visualStyle, selectedMedia = []) => {
    // If not saved yet, we'll create the project first
    let projectId = selectedProjectId;
    let traits = [];

    if (!projectId) {
      // Determine project title from script text
      let title = "";
      const trimmedScript = (scriptText || "").trim();
      if (trimmedScript) {
        // Take the first line or first 40 chars
        const firstLine = trimmedScript.split("\n")[0];
        title = firstLine.length > 40 ? firstLine.substring(0, 37) + "..." : firstLine;
      }
      if (!title) {
        const now = new Date();
        title = `Dự án Studio ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
      }

      setLoading(true);
      setLoadingMessage("Đang tạo dự án mới...");

      try {
        const newProj = await api.createProject(title);
        projectId = newProj.id;
        setSelectedProjectId(newProj.id);

        // Save the settings from the draft config
        await api.updateProjectConfig(newProj.id, draftConfig);
        traits = draftConfig.traits || [];

        // Refresh project list in background
        fetchProjects();
      } catch (error) {
        console.error("Failed to auto-create project:", error);
        alert(`Không thể tạo dự án mới: ${error.response?.data?.error || error.message}`);
        setLoading(false);
        return;
      }
    } else {
      traits = currentProject?.config?.traits || [];
    }

    setLoading(true);
    setLoadingMessage("AI đang phân tích kịch bản và sinh phân cảnh...");

    try {
      const result = await api.generateStoryboard(projectId, scriptText, visualStyle, traits, selectedMedia);

      // Update the current project details
      const detailedProj = await api.getProjectById(projectId);
      setCurrentProject(detailedProj);

      if (detailedProj.scenes && detailedProj.scenes.length > 0) {
        setSelectedSceneId(detailedProj.scenes[0].id);
      }
      setView("WORKSPACE_EDITOR");
    } catch (error) {
      console.error("Failed to generate storyboard:", error);
      alert(`Lỗi tạo Storyboard bằng AI: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Trigger video render and poll status
  const handleRenderVideo = async () => {
    if (!currentProject) return;
    setRendering(true);
    setRenderProgress(0);
    setRenderedFrames(0);
    setRenderTotalFrames(0);
    setVideoUrl(null);

    try {
      const renderResponse = await api.triggerRender(currentProject.id);
      const renderId = renderResponse.renderId;

      // Start Polling
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.getRenderStatus(currentProject.id, renderId);

          const totalF = statusRes.totalFrames || 0;
          const renderedF = statusRes.renderedFrames || 0;
          const rawPct = statusRes.progress || 0;

          const computedPct = totalF > 0 ? (renderedF / totalF) : rawPct;
          const progressPercent = Math.min(100, Math.max(0, Math.round(computedPct * 100)));

          setRenderProgress(progressPercent);
          setRenderedFrames(renderedF);
          setRenderTotalFrames(totalF);

          if (statusRes.status === "completed") {
            setVideoUrl(statusRes.videoUrl);
            setRendering(false);
            clearInterval(pollInterval);
          } else if (statusRes.status === "failed") {
            alert("Kết xuất video thất bại!");
            setRendering(false);
            clearInterval(pollInterval);
          }
        } catch (err) {
          console.error("Error polling render status:", err);
          setRendering(false);
          clearInterval(pollInterval);
        }
      }, 300);

    } catch (error) {
      console.error("Failed to start video rendering:", error);
      alert(`Không thể khởi động tiến trình xuất video: ${error.response?.data?.error || error.message}`);
      setRendering(false);
    }
  };

  // Main navigation sidebar layout for PROJECTS, STUDIO, BATCH views
  if (!selectedProjectId || view === "PROJECTS" || view === "STUDIO" || view === "BATCH") {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "var(--bg-secondary)" }}>
        {/* Left Sidebar */}
        <nav style={{
          width: "260px",
          backgroundColor: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(15, 23, 42, 0.08)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 20px",
          flexShrink: 0
        }}>
          {/* Logo */}
          <div style={{ marginBottom: "36px", paddingLeft: "12px" }}>
            <span style={{
              fontSize: "24px",
              fontFamily: "var(--font-heading)",
              fontWeight: "900",
              letterSpacing: "-0.04em",
              background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              cursor: "pointer"
            }} onClick={() => { setSelectedProjectId(null); setView("PROJECTS"); }}>
              kisafes
            </span>
          </div>

          {/* Navigation Links */}
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
            <li>
              <button
                onClick={() => { setSelectedProjectId(null); setView("PROJECTS"); }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  boxShadow: "none",
                  color: "var(--text-secondary)",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: "600",
                  textTransform: "none",
                  letterSpacing: "0",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.04)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                🏠 Home
              </button>
            </li>

            <li>
              <button
                onClick={() => { setSelectedProjectId(null); setView("STUDIO_AI_GEN"); }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: view === "STUDIO_AI_GEN" ? "rgba(37, 99, 235, 0.08)" : "none",
                  border: "none",
                  boxShadow: "none",
                  color: view === "STUDIO_AI_GEN" ? "var(--color-primary)" : "var(--text-secondary)",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: view === "STUDIO_AI_GEN" ? "700" : "600",
                  textTransform: "none",
                  letterSpacing: "0",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => { if (view !== "STUDIO_AI_GEN") e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.04)"; }}
                onMouseLeave={(e) => { if (view !== "STUDIO_AI_GEN") e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                ✨ Studio AI Gen
              </button>
            </li>
            <li>
              <button
                onClick={() => { setSelectedProjectId(null); setView("BATCH"); }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: view === "BATCH" ? "rgba(37, 99, 235, 0.08)" : "none",
                  border: "none",
                  boxShadow: "none",
                  color: view === "BATCH" ? "var(--color-primary)" : "var(--text-secondary)",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: view === "BATCH" ? "700" : "600",
                  textTransform: "none",
                  letterSpacing: "0",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => { if (view !== "BATCH") e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.04)"; }}
                onMouseLeave={(e) => { if (view !== "BATCH") e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                📦 Hàng loạt
              </button>
            </li>
            <li>
              <button
                onClick={() => { setSelectedProjectId(null); setView("PROJECTS"); }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: view === "PROJECTS" ? "rgba(37, 99, 235, 0.08)" : "none",
                  border: "none",
                  boxShadow: "none",
                  color: view === "PROJECTS" ? "var(--color-primary)" : "var(--text-secondary)",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: view === "PROJECTS" ? "700" : "600",
                  textTransform: "none",
                  letterSpacing: "0",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => { if (view !== "PROJECTS") e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.04)"; }}
                onMouseLeave={(e) => { if (view !== "PROJECTS") e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                📁 Dự án
              </button>
            </li>
          </ul>
        </nav>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          {view === "STUDIO_AI_GEN" ? (
            <StudioAIGen
              projectId={selectedProjectId}
              onBack={() => { setSelectedProjectId(null); setView("PROJECTS"); }}
              onUpdateProjectsList={fetchProjects}
              onGenerationSuccess={(id) => {
                setSelectedProjectId(id);
                setView("WORKSPACE_EDITOR");
              }}
            />
          ) : view === "BATCH" ? (
            <div style={{ padding: "50px 40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <h2 style={{ fontSize: "28px", marginBottom: "16px" }}>Sản xuất video Hàng loạt</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>Chức năng sản xuất hàng loạt video cùng lúc đang được phát triển.</p>
            </div>
          ) : (
            <Dashboard
              projects={projects}
              onCreateProject={handleCreateProject}
              onSelectProject={setSelectedProjectId}
              onDeleteProject={handleDeleteProject}
            />
          )}
        </div>
      </div>
    );
  }

  // Full Storyboard Editor Workspace (Setup or Editor mode)
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", backgroundColor: "var(--bg-secondary)" }}>
      {/* TopNavBar */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 40px",
        backgroundColor: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
        height: "70px",
        zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
          <span
            style={{
              fontSize: "20px",
              fontFamily: "var(--font-heading)",
              fontWeight: "900",
              letterSpacing: "-0.04em",
              cursor: "pointer",
              background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
            onClick={() => { setSelectedProjectId(null); setView("DASHBOARD"); }}
          >
            HYPERFRAMES
          </span>

          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <button
              className="secondary"
              style={{ padding: "6px 14px", fontSize: "11px", borderRadius: "20px" }}
              onClick={() => { setSelectedProjectId(null); setView("DASHBOARD"); }}
            >
              &larr; Projects
            </button>
          </div>
        </div>

      </header>

      {/* Main Workspace content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* Middle Column: Storyboard cards list */}
            <div style={{ flex: 1, overflowY: "auto", borderRight: "1px solid rgba(15, 23, 42, 0.08)" }}>
              <StoryboardEditor
                mode="editor"
                scenes={currentProject?.scenes || []}
                config={currentProject?.config || {}}
                projectId={currentProject?.id}
                onGenerateStoryboard={handleGenerateStoryboard}
                onUpdateScene={handleUpdateScene}
                onRegenerateSceneTts={handleRegenerateSceneTts}
                regeneratingSceneId={regeneratingSceneId}
                onRegenerateSceneCode={handleRegenerateSceneCode}
                regeneratingCodeSceneId={regeneratingCodeSceneId}
                loading={loading}
                loadingMessage={loadingMessage}
                selectedSceneId={selectedSceneId}
                onSelectScene={setSelectedSceneId}
              />
            </div>

            {/* Right Column: Master Preview Player */}
            <div style={{ width: "400px", flexShrink: 0, overflowY: "auto" }}>
              <MasterPlayer
                scenes={currentProject?.scenes || []}
                config={currentProject?.config || {}}
                projectTitle={currentProject?.title}
                onRender={handleRenderVideo}
                rendering={rendering}
                renderProgress={renderProgress}
                renderedFrames={renderedFrames}
                renderTotalFrames={renderTotalFrames}
                videoUrl={videoUrl}
                onRegenerateTts={handleRegenerateTts}
                regeneratingTts={regeneratingTts}
              />
            </div>
          </div>
      </div>

      {showVoiceModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(8px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div className="border-strict" style={{
            backgroundColor: "#ffffff",
            padding: "30px",
            width: "420px",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}>
            <div>
              <h3 style={{ fontSize: "20px", fontFamily: "Space Grotesk", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "-0.01em", margin: 0, color: "#000000" }}>
                Chọn Giọng Đọc Tái Tạo
              </h3>
              <p style={{ fontSize: "13px", color: "#555555", marginTop: "4px", fontFamily: "Inter" }}>
                Chọn giọng đọc AI bạn muốn sử dụng để làm mới toàn bộ video này.
              </p>
            </div>

            <div>
              <label className="form-label-mono" style={{ display: "block", marginBottom: "6px" }}>AI Voice</label>
              <select
                className="form-input-mono"
                value={modalVoice}
                onChange={(e) => setModalVoice(e.target.value)}
                style={{ cursor: "pointer", width: "100%" }}
              >
                <optgroup label="OmniVoice (Offline Clone)">
                  <option value="omnivoice_duythanh">OmniVoice - Giọng Duy Thanh (Trầm ấm, Nam Bắc)</option>
                  <option value="omnivoice_quanganh">OmniVoice - Giọng Quang Anh (Hiện đại, Nam Bắc)</option>
                </optgroup>
                <optgroup label="Vbee AI Voice (Chờ kết nối API)">
                  <option value="vbee_minhtien">Vbee - Minh Tiến (📰 Tin tức / Kịch tính - Nam Bắc)</option>
                  <option value="vbee_thuyduyen">Vbee - Thùy Duyên (🎓 Truyền cảm / Sách nói - Nữ Bắc)</option>
                  <option value="vbee_ngochuyen">Vbee - Ngọc Huyền (💡 Quảng cáo / Hào hứng - Nữ Bắc)</option>
                  <option value="vbee_naman">Vbee - Nam An (🚀 Năng động / Công nghệ - Nam Nam)</option>
                  <option value="vbee_maiphuong">Vbee - Mai Phương (🎭 Tâm sự / Trầm ấm - Nữ Nam)</option>
                </optgroup>
                <optgroup label="Khác & Tiếng Anh">
                  <option value="microsoft_hoaimy">Microsoft Hoài My (Free, Fluent Female)</option>
                  <option value="microsoft_namminh">Microsoft Nam Minh (Free, Fluent Male)</option>
                  <option value="rachel">Hoai My (Rachel - English Accent)</option>
                  <option value="antonio">Tuan Dung (Antoni - English Accent)</option>
                </optgroup>
              </select>
            </div>

            {modalVoice === "custom" && (
              <div>
                <label className="form-label-mono" style={{ fontSize: "11px", color: "#555555", display: "block", marginBottom: "6px" }}>
                  Custom ElevenLabs Voice ID
                </label>
                <input
                  type="text"
                  className="form-input-mono"
                  value={modalCustomVoiceId}
                  onChange={(e) => setModalCustomVoiceId(e.target.value)}
                  placeholder="Ví dụ: pNInz6obpgq5paqqJ155..."
                  style={{ fontSize: "12px", width: "100%", boxSizing: "border-box" }}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
              <button
                type="button"
                className="secondary"
                style={{ flex: 1, padding: "12px", borderRadius: "20px", cursor: "pointer" }}
                onClick={() => setShowVoiceModal(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="primary"
                style={{ flex: 1, padding: "12px", borderRadius: "20px", cursor: "pointer" }}
                onClick={confirmRegenerateTts}
              >
                Xác nhận tái tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom-Right Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            background: toast.type === "error"
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : "linear-gradient(135deg, #059669, #10b981)",
            color: "#ffffff",
            padding: "14px 22px",
            borderRadius: "14px",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.25)",
            fontSize: "14px",
            fontWeight: "700",
            fontFamily: "Space Grotesk, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          <span>{toast.type === "error" ? "❌" : "✨"}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
