import React, { useState, useEffect, Suspense, useRef } from "react";
import { api } from "./services/api";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  useProjects,
  useProjectDetail,
  useCreateProject,
  useDeleteProject,
  useUpdateProjectConfig,
  useUpdateScene,
  useRegenerateTts,
  useRegenerateSceneTts,
  useGenerateStoryboard
} from "./hooks/useProjectQueries";
import { SkeletonLoader } from "./components/SkeletonLoader";
import { SettingsPage } from "./components/SettingsPage";
import { PronunciationModal } from "./components/PronunciationModal";
import "./App.css";

const Dashboard = React.lazy(() => import("./components/Dashboard").then(m => ({ default: m.Dashboard })));
const SidebarConfig = React.lazy(() => import("./components/SidebarConfig").then(m => ({ default: m.SidebarConfig })));
const StoryboardEditor = React.lazy(() => import("./components/StoryboardEditor").then(m => ({ default: m.StoryboardEditor })));
const MasterPlayer = React.lazy(() => import("./components/MasterPlayer").then(m => ({ default: m.MasterPlayer })));
const BatchStudioPage = React.lazy(() => import("./components/BatchStudioPage").then(m => ({ default: m.BatchStudioPage })));

const INITIAL_DRAFT_CONFIG = {
  length: "Short (~60s)",
  language: "Vietnamese",
  voice: "rachel",
  watermark: { enabled: true, text: "yupclip.com", position: "top-right", color: "#000000" },
  backgroundMusic: "Chill Lofi Beats",
  backgroundMusicVolume: 0.025
};

function App() {
  const queryClient = useQueryClient();

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

  const [selectedProjectId, setSelectedProjectId] = useState(getInitialProjectId);
  const [selectedSceneId, setSelectedSceneId] = useState(null);
  const [view, setView] = useState(getInitialView); // "PROJECTS", "STUDIO", "STUDIO_AI_GEN", "BATCH", "WORKSPACE_EDITOR", "WORKSPACE_SETUP"
  const [draftConfig, setDraftConfig] = useState(INITIAL_DRAFT_CONFIG);

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

  const [activeRenderId, setActiveRenderId] = useState(null);
  const pollIntervalRef = useRef(null);
  const generateAbortControllerRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showPronunciationModal, setShowPronunciationModal] = useState(false);
  const [modalVoice, setModalVoice] = useState("rachel");
  const [modalCustomVoiceId, setModalCustomVoiceId] = useState("");

  const { data: projects = [] } = useProjects();
  const { data: currentProject } = useProjectDetail(selectedProjectId);

  const createProjectMutation = useCreateProject();
  const deleteProjectMutation = useDeleteProject();
  const updateProjectConfigMutation = useUpdateProjectConfig();
  const updateSceneMutation = useUpdateScene();
  const regenerateTtsMutation = useRegenerateTts();
  const regenerateSceneTtsMutation = useRegenerateSceneTts();
  const generateStoryboardMutation = useGenerateStoryboard();

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

  // Auto-navigate and set selected scene when currentProject detail resolves
  useEffect(() => {
    if (currentProject) {
      // Smart AI Gen detection: check type OR config.scenes visualPattern
      const isAIGen = currentProject.type === "AIGEN" || (
        currentProject.config &&
        Array.isArray(currentProject.config.scenes) &&
        currentProject.config.scenes.length > 0 &&
        Boolean(currentProject.config.scenes[0].visualPattern)
      );

      // Initialize selected scene if editor is workspace and none selected
      if (!isAIGen && currentProject.scenes && currentProject.scenes.length > 0 && !selectedSceneId) {
        setSelectedSceneId(currentProject.scenes[0].id);
      }

      // Only automatically redirect view if we are on dashboard / default PROJECTS view
      if (view === "PROJECTS" || view === "DASHBOARD" || view === "STUDIO") {
        if (isAIGen) {
          setView("STUDIO_AI_GEN");
        } else if (currentProject.scenes && currentProject.scenes.length > 0) {
          setView("WORKSPACE_EDITOR");
        } else {
          setView("WORKSPACE_SETUP");
        }
      }
    } else {
      setSelectedSceneId(null);
      setVideoUrl(null);
    }
  }, [currentProject]);

  const handleCreateProject = async (title) => {
    try {
      const newProj = await createProjectMutation.mutateAsync(title);
      setSelectedProjectId(newProj.id);
      setView("WORKSPACE_SETUP");
    } catch (error) {
      console.error("Failed to create project:", error);
      alert(`Không thể tạo dự án mới: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await deleteProjectMutation.mutateAsync(projectId);
      alert("Đã xóa dự án thành công!");
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert(`Không thể xóa dự án: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleUpdateConfig = async (newConfig) => {
    if (!currentProject) return;
    const previousProject = queryClient.getQueryData(["projects", currentProject.id]);

    // Optimistic update
    queryClient.setQueryData(["projects", currentProject.id], (prev) => {
      if (!prev) return prev;
      return { ...prev, config: newConfig };
    });

    try {
      const savedConfig = await updateProjectConfigMutation.mutateAsync({
        id: currentProject.id,
        config: newConfig
      });
      queryClient.setQueryData(["projects", currentProject.id], (prev) => {
        if (!prev) return prev;
        return { ...prev, config: savedConfig };
      });
    } catch (error) {
      console.error("Failed to save project configuration:", error);
      alert(`Không thể lưu cấu hình dự án: ${error.response?.data?.error || error.message}`);
      // Rollback
      queryClient.setQueryData(["projects", currentProject.id], previousProject);
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
      // 1. Save config first
      const updatedConfig = {
        ...currentProject.config,
        voice: modalVoice,
        customVoiceId: modalCustomVoiceId
      };
      const savedConfig = await updateProjectConfigMutation.mutateAsync({
        id: currentProject.id,
        config: updatedConfig
      });

      queryClient.setQueryData(["projects", currentProject.id], (prev) => {
        if (!prev) return prev;
        return { ...prev, config: savedConfig };
      });

      // 2. Trigger regeneration
      await regenerateTtsMutation.mutateAsync(currentProject.id);
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

    // Optimistic cache update for instant live preview updates
    const previousProject = queryClient.getQueryData(["projects", currentProject.id]);
    
    queryClient.setQueryData(["projects", currentProject.id], (prev) => {
      if (!prev) return prev;
      const newScenes = prev.scenes.map(s => s.id === sceneId ? { ...s, ...sceneData } : s);
      return { ...prev, scenes: newScenes };
    });

    try {
      const updatedScene = await updateSceneMutation.mutateAsync({
        projectId: currentProject.id,
        sceneId,
        sceneData
      });

      // Update cache with the exact backend response
      queryClient.setQueryData(["projects", currentProject.id], (prev) => {
        if (!prev) return prev;
        const newScenes = prev.scenes.map(s => s.id === sceneId ? { 
          ...s, 
          ...updatedScene,
          compiledJS: sceneData.hasOwnProperty("compiledJS") ? sceneData.compiledJS : s.compiledJS
        } : s);
        return { ...prev, scenes: newScenes };
      });
    } catch (error) {
      console.error("Failed to update scene:", error);
      showToast(`Không thể cập nhật phân cảnh: ${error.response?.data?.error || error.message}`, "error");
      // Rollback
      queryClient.setQueryData(["projects", currentProject.id], previousProject);
    }
  };

  const handleRegenerateSceneTts = async (sceneId) => {
    if (!currentProject) return;
    setRegeneratingSceneId(sceneId);
    try {
      const updatedScene = await regenerateSceneTtsMutation.mutateAsync({
        projectId: currentProject.id,
        sceneId
      });

      // Update cache
      queryClient.setQueryData(["projects", currentProject.id], (prev) => {
        if (!prev) return prev;
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

  const handleGenerateStoryboard = async (scriptText, visualStyle, selectedMedia = [], selectedBgMedia = [], selectedCtaMedia = []) => {
    let projectId = selectedProjectId;
    let traits = [];

    if (!projectId) {
      // Determine project title from script text
      let title = "";
      const trimmedScript = (scriptText || "").trim();
      if (trimmedScript) {
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
        const newProj = await createProjectMutation.mutateAsync(title);
        projectId = newProj.id;
        setSelectedProjectId(newProj.id);

        // Save settings
        const savedConfig = await updateProjectConfigMutation.mutateAsync({
          id: newProj.id,
          config: draftConfig
        });
        traits = savedConfig.traits || [];
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

    const controller = new AbortController();
    generateAbortControllerRef.current = controller;

    try {
      await generateStoryboardMutation.mutateAsync({
        projectId,
        scriptText,
        visualStyle,
        traits,
        selectedMedia,
        selectedBgMedia,
        selectedCtaMedia,
        options: { signal: controller.signal }
      });

      // Refetch details
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      setView("WORKSPACE_EDITOR");
    } catch (error) {
      if (error.name === "CanceledError" || axios.isCancel(error) || error.message === "canceled") {
        console.log("Storyboard generation cancelled by user");
        return;
      }
      console.error("Failed to generate storyboard:", error);
      alert(`Lỗi tạo Storyboard bằng AI: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
      generateAbortControllerRef.current = null;
    }
  };

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
      setActiveRenderId(renderId);

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
            setActiveRenderId(null);
            clearInterval(pollInterval);
          } else if (statusRes.status === "failed") {
            alert("Kết xuất video thất bại!");
            setRendering(false);
            setActiveRenderId(null);
            clearInterval(pollInterval);
          }
        } catch (err) {
          console.error("Error polling render status:", err);
          setRendering(false);
          setActiveRenderId(null);
          clearInterval(pollInterval);
        }
      }, 300);
      pollIntervalRef.current = pollInterval;

    } catch (error) {
      console.error("Failed to start video rendering:", error);
      alert(`Không thể khởi động tiến trình xuất video: ${error.response?.data?.error || error.message}`);
      setRendering(false);
      setActiveRenderId(null);
    }
  };

  const handleCancelRender = async () => {
    if (!currentProject || !activeRenderId) return;
    try {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      await axios.post(`http://localhost:5000/api/projects/${currentProject.id}/render/cancel/${activeRenderId}`);
      showToast("Đã hủy quá trình xuất video!", "info");
    } catch (err) {
      console.error("Failed to cancel render:", err);
    } finally {
      setRendering(false);
      setActiveRenderId(null);
      setRenderProgress(0);
      setRenderedFrames(0);
      setRenderTotalFrames(0);
    }
  };

  const handleCancelGenerate = () => {
    if (generateAbortControllerRef.current) {
      generateAbortControllerRef.current.abort();
      generateAbortControllerRef.current = null;
    }
    setLoading(false);
    showToast("Đã hủy quá trình phân tích kịch bản!", "info");
  };

  // Main navigation sidebar layout for PROJECTS, STUDIO, BATCH, SETTINGS views
  if (!selectedProjectId || view === "PROJECTS" || view === "STUDIO" || view === "BATCH" || view === "SETTINGS") {
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
                onClick={() => {
                  setSelectedProjectId(null);
                  setView("STUDIO");
                  setDraftConfig(INITIAL_DRAFT_CONFIG);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: view === "STUDIO" ? "rgba(37, 99, 235, 0.08)" : "none",
                  border: "none",
                  boxShadow: "none",
                  color: view === "STUDIO" ? "var(--color-primary)" : "var(--text-secondary)",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: view === "STUDIO" ? "700" : "600",
                  textTransform: "none",
                  letterSpacing: "0",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => { if (view !== "STUDIO") e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.04)"; }}
                onMouseLeave={(e) => { if (view !== "STUDIO") e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                🎥 Studio
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
            <li>
              <button
                onClick={() => { setSelectedProjectId(null); setView("SETTINGS"); }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: view === "SETTINGS" ? "rgba(99, 102, 241, 0.12)" : "none",
                  border: "none",
                  boxShadow: "none",
                  color: view === "SETTINGS" ? "#6366f1" : "var(--text-secondary)",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: view === "SETTINGS" ? "700" : "600",
                  textTransform: "none",
                  letterSpacing: "0",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => { if (view !== "SETTINGS") e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.04)"; }}
                onMouseLeave={(e) => { if (view !== "SETTINGS") e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                ⚙️ Cài đặt API
              </button>
            </li>
          </ul>
        </nav>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          <Suspense fallback={<SkeletonLoader type={view === "BATCH" ? "workspace" : "dashboard"} />}>
            {view === "STUDIO" ? (
              <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
                <div style={{ flex: "0 0 58.33%", borderRight: "1px solid rgba(15, 23, 42, 0.08)", overflowY: "auto", display: "flex" }}>
                  <StoryboardEditor
                    mode="setup"
                    scenes={[]}
                    config={draftConfig}
                    onUpdateConfig={setDraftConfig}
                    projectId={null}
                    onGenerateStoryboard={handleGenerateStoryboard}
                    onUpdateScene={() => { }}
                    loading={loading}
                    loadingMessage={loadingMessage}
                    selectedSceneId={null}
                    onSelectScene={() => { }}
                  />
                </div>
                <div style={{ flex: "0 0 41.67%", overflowY: "auto" }}>
                  <SidebarConfig
                    config={draftConfig}
                    onChange={setDraftConfig}
                    onBack={() => setView("PROJECTS")}
                    onOpenPronunciationModal={() => setShowPronunciationModal(true)}
                  />
                </div>
              </div>
            ) : view === "BATCH" ? (
              <BatchStudioPage
                sharedConfig={draftConfig}
                onConfigChange={setDraftConfig}
                onOpenPronunciationModal={() => setShowPronunciationModal(true)}
                onBatchComplete={async () => {
                  queryClient.invalidateQueries({ queryKey: ["projects"] });
                  setView("PROJECTS");
                }}
              />
            ) : view === "SETTINGS" ? (
              <SettingsPage onBack={() => setView("PROJECTS")} />
            ) : (
              <Dashboard
                projects={projects}
                onCreateProject={handleCreateProject}
                onSelectProject={setSelectedProjectId}
                onDeleteProject={handleDeleteProject}
              />
            )}
          </Suspense>
        </div>
        {showPronunciationModal && (
          <PronunciationModal onClose={() => setShowPronunciationModal(false)} />
        )}
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
            KISAFRESH
          </span>

          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <button
              className="secondary"
              style={{ padding: "6px 14px", fontSize: "11px", borderRadius: "20px" }}
              onClick={() => { setSelectedProjectId(null); setView("DASHBOARD"); }}
            >
              &larr; Projects
            </button>

            <button
              className={view === "WORKSPACE_SETUP" ? "tab-active" : "tab-inactive"}
              style={{ background: "none", border: "none", fontSize: "14px", cursor: "pointer", paddingBottom: "4px" }}
              onClick={() => setView("WORKSPACE_SETUP")}
            >
              Thiết lập & Kịch bản
            </button>
            <button
              className={view === "WORKSPACE_EDITOR" ? "tab-active" : "tab-inactive"}
              style={{ background: "none", border: "none", fontSize: "14px", cursor: "pointer", paddingBottom: "4px" }}
              onClick={() => setView("WORKSPACE_EDITOR")}
            >
              Biên tập Storyboard
            </button>
          </div>
        </div>

      </header>

      {/* Main Workspace content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <Suspense fallback={<SkeletonLoader type="workspace" />}>
          {view === "WORKSPACE_SETUP" ? (
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* Left Column: Script input & Generation */}
              <div style={{ flex: "0 0 58.33%", borderRight: "1px solid rgba(15, 23, 42, 0.08)", overflowY: "auto", display: "flex" }}>
                <StoryboardEditor
                  mode="setup"
                  scenes={currentProject?.scenes || []}
                  config={currentProject?.config || {}}
                  onUpdateConfig={handleUpdateConfig}
                  projectId={currentProject?.id}
                  onGenerateStoryboard={handleGenerateStoryboard}
                  onUpdateScene={handleUpdateScene}
                  loading={loading}
                  loadingMessage={loadingMessage}
                  onCancelGenerate={handleCancelGenerate}
                  selectedSceneId={selectedSceneId}
                  onSelectScene={setSelectedSceneId}
                />
              </div>
              {/* Right Column: Video Config */}
              <div style={{ flex: "0 0 41.67%", overflowY: "auto" }}>
                <SidebarConfig
                  config={currentProject?.config || {}}
                  onChange={handleUpdateConfig}
                  onBack={() => { setSelectedProjectId(null); setView("DASHBOARD"); }}
                  onOpenPronunciationModal={() => setShowPronunciationModal(true)}
                />
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

              {/* Middle Column: Storyboard cards list */}
              <div style={{ flex: 1, overflowY: "auto", borderRight: "1px solid rgba(15, 23, 42, 0.08)" }}>
                <StoryboardEditor
                  mode="editor"
                  scenes={currentProject?.scenes || []}
                  config={currentProject?.config || {}}
                  onUpdateConfig={handleUpdateConfig}
                  projectId={currentProject?.id}
                  onGenerateStoryboard={handleGenerateStoryboard}
                  onUpdateScene={handleUpdateScene}
                  onRegenerateSceneTts={handleRegenerateSceneTts}
                  regeneratingSceneId={regeneratingSceneId}
                  loading={loading}
                  loadingMessage={loadingMessage}
                  onCancelGenerate={handleCancelGenerate}
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
                  onCancelRender={handleCancelRender}
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
          )}
        </Suspense>
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
                <option value="omnivoice_duythanh">OmniVoice - Giọng Duy Thanh (Offline Clone)</option>
                <option value="omnivoice_quanganh">OmniVoice - Giọng Quang Anh (Offline Clone)</option>
                <option value="vbee_ngochuyen">Vbee - Giọng Ngọc Huyền (Nữ miền Bắc)</option>
                <option value="vbee_manhdung">Vbee - Giọng Mạnh Dũng (Nam miền Bắc)</option>
                <option value="vbee_thutrang">Vbee - Giọng Thu Trang (Nữ miền Bắc)</option>
                <option value="vbee_minhhoang">Vbee - Giọng Minh Hoàng (Nữ miền Nam)</option>
                <option value="vbee_naman">Vbee - Giọng Nam An (Nam miền Nam)</option>
                <option value="vbee_minhquan">Vbee - Giọng Minh Quân (Nam miền Bắc)</option>
                <option value="microsoft_hoaimy">Microsoft Hoài My (Free, Fluent Female)</option>
                <option value="microsoft_namminh">Microsoft Nam Minh (Free, Fluent Male)</option>
                <option value="rachel">Hoai My (Rachel - English Accent)</option>
                <option value="antonio">Tuan Dung (Antoni - English Accent)</option>
                <option value="bella">Bella (English Accent)</option>
                <option value="domic">Domic (English Accent)</option>
                <option value="custom">-- Giọng đọc tự chọn (Nhập ID) --</option>
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

      {showPronunciationModal && (
        <PronunciationModal onClose={() => setShowPronunciationModal(false)} />
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
