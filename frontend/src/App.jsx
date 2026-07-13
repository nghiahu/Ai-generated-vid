import React, { useState, useEffect } from "react";
import { api } from "./services/api";
import { Dashboard } from "./components/Dashboard";
import { SidebarConfig } from "./components/SidebarConfig";
import { StoryboardEditor } from "./components/StoryboardEditor";
import { MasterPlayer } from "./components/MasterPlayer";
import "./App.css";

function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [selectedSceneId, setSelectedSceneId] = useState(null);
  const [view, setView] = useState("PROJECTS"); // "PROJECTS", "STUDIO", "BATCH", "WORKSPACE_EDITOR"

  // States for generation & rendering loading
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedFrames, setRenderedFrames] = useState(0);
  const [renderTotalFrames, setRenderTotalFrames] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);

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
      setCurrentProject(project);
      if (project.scenes && project.scenes.length > 0) {
        setSelectedSceneId(project.scenes[0].id);
        setView("WORKSPACE_EDITOR");
      } else {
        setView("WORKSPACE_SETUP");
      }
    } catch (error) {
      console.error("Failed to fetch project detail:", error);
    }
  };

  const handleCreateProject = async (title) => {
    try {
      const newProj = await api.createProject(title);
      await fetchProjects();
      setSelectedProjectId(newProj.id);
      setView("WORKSPACE_SETUP");
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
      alert(`Không thể cập nhật phân cảnh: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleGenerateStoryboard = async (scriptText, visualStyle) => {
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
      const result = await api.generateStoryboard(projectId, scriptText, visualStyle, traits);
      
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
          
          const progressPercent = Math.round((statusRes.progress || 0) * 100);
          setRenderProgress(progressPercent);
          setRenderedFrames(statusRes.renderedFrames || 0);
          setRenderTotalFrames(statusRes.totalFrames || 0);

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
      }, 1000);

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
                onClick={() => { setSelectedProjectId(null); setView("STUDIO"); }}
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
          </ul>
        </nav>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          {view === "STUDIO" ? (
            <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
              <div style={{ flex: "0 0 58.33%", borderRight: "1px solid rgba(15, 23, 42, 0.08)", overflowY: "auto", display: "flex" }}>
                <StoryboardEditor
                  mode="setup"
                  scenes={[]}
                  config={{}}
                  projectId={null}
                  onGenerateStoryboard={handleGenerateStoryboard}
                  onUpdateScene={() => {}}
                  loading={loading}
                  loadingMessage={loadingMessage}
                  selectedSceneId={null}
                  onSelectScene={() => {}}
                />
              </div>
              <div style={{ flex: "0 0 41.67%", overflowY: "auto" }}>
                <SidebarConfig
                  config={{}}
                  onChange={() => {}}
                  onBack={() => setView("PROJECTS")}
                />
              </div>
            </div>
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
        {view === "WORKSPACE_SETUP" ? (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Left Column: Script input & Generation */}
            <div style={{ flex: "0 0 58.33%", borderRight: "1px solid rgba(15, 23, 42, 0.08)", overflowY: "auto", display: "flex" }}>
              <StoryboardEditor
                mode="setup"
                scenes={currentProject?.scenes || []}
                config={currentProject?.config || {}}
                projectId={currentProject?.id}
                onGenerateStoryboard={handleGenerateStoryboard}
                onUpdateScene={handleUpdateScene}
                loading={loading}
                loadingMessage={loadingMessage}
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
              />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Left Column: SideNavBar */}
            <nav style={{ width: "256px", backgroundColor: "rgba(255, 255, 255, 0.65)", backdropFilter: "blur(16px)", height: "100%", display: "flex", flexDirection: "column", padding: "24px 20px", flexShrink: 0, borderRight: "1px solid rgba(15, 23, 42, 0.08)" }}>
              <div style={{ paddingBottom: "15px", borderBottom: "1px solid rgba(15, 23, 42, 0.08)", marginBottom: "15px" }}>
                <span style={{ fontSize: "14px", fontFamily: "var(--font-heading)", fontWeight: "800", display: "block", color: "var(--text-primary)" }}>{currentProject?.title || "Dự án hiện tại"}</span>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>v1.0.4-alpha</span>
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                <li>
                  <a href="#" style={{ textDecoration: "none", color: "var(--text-primary)", fontWeight: "600", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center", padding: "8px 12px" }}>
                    📂 Projects
                  </a>
                </li>
                <li>
                  <a href="#" style={{ textDecoration: "none", color: "var(--text-secondary)", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center", padding: "8px 12px" }}>
                    🎥 Media
                  </a>
                </li>
                <li>
                  <a href="#" style={{ textDecoration: "none", color: "var(--color-primary)", backgroundColor: "rgba(37, 99, 235, 0.08)", padding: "8px 12px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center" }}>
                    📈 Timeline
                  </a>
                </li>
                <li>
                  <a href="#" style={{ textDecoration: "none", color: "var(--text-secondary)", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center", padding: "8px 12px" }}>
                    ✨ Effects
                  </a>
                </li>
                <li>
                  <a href="#" style={{ textDecoration: "none", color: "var(--text-secondary)", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center", padding: "8px 12px" }}>
                    🔊 Audio
                  </a>
                </li>
              </ul>
              <div style={{ borderTop: "1px solid rgba(15, 23, 42, 0.08)", paddingTop: "15px" }}>
                <a href="#" style={{ textDecoration: "none", color: "var(--text-secondary)", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px", padding: "4px 12px" }}>
                  ❓ Help
                </a>
                <a href="#" onClick={() => { setSelectedProjectId(null); setView("DASHBOARD"); }} style={{ textDecoration: "none", color: "var(--text-secondary)", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center", padding: "4px 12px" }}>
                  🚪 Logout
                </a>
              </div>
            </nav>

            {/* Middle Column: Storyboard cards list */}
            <div style={{ flex: 1, overflowY: "auto", borderRight: "1px solid rgba(15, 23, 42, 0.08)" }}>
              <StoryboardEditor
                mode="editor"
                scenes={currentProject?.scenes || []}
                config={currentProject?.config || {}}
                projectId={currentProject?.id}
                onGenerateStoryboard={handleGenerateStoryboard}
                onUpdateScene={handleUpdateScene}
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
                onRender={handleRenderVideo}
                rendering={rendering}
                renderProgress={renderProgress}
                renderedFrames={renderedFrames}
                renderTotalFrames={renderTotalFrames}
                videoUrl={videoUrl}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
