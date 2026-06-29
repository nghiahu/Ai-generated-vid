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
  const [view, setView] = useState("DASHBOARD"); // "DASHBOARD", "WORKSPACE_SETUP", "WORKSPACE_EDITOR"

  // States for generation & rendering loading
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedFrames, setRenderedFrames] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
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
      setView("DASHBOARD");
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
      await api.updateProjectConfig(currentProject.id, newConfig);
    } catch (error) {
      console.error("Failed to save project configuration:", error);
      alert(`Không thể lưu cấu hình dự án: ${error.response?.data?.error || error.message}`);
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

  const handleGenerateStoryboard = async (scriptText) => {
    if (!currentProject) return;
    setLoading(true);
    setLoadingMessage("AI đang phân tích kịch bản và sinh phân cảnh...");

    try {
      const scenes = await api.generateStoryboard(currentProject.id, scriptText);
      setCurrentProject(prev => ({
        ...prev,
        scenes
      }));
      if (scenes && scenes.length > 0) {
        setSelectedSceneId(scenes[0].id);
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
    setTotalFrames(0);
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
          setTotalFrames(statusRes.totalFrames || 0);

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

  // If in dashboard, show dashboard screen
  if (view === "DASHBOARD" || !selectedProjectId) {
    return (
      <Dashboard
        projects={projects}
        onCreateProject={handleCreateProject}
        onSelectProject={setSelectedProjectId}
        onDeleteProject={handleDeleteProject}
      />
    );
  }

  // Full Storyboard Editor Workspace (Setup or Editor mode)
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", backgroundColor: "#ffffff" }}>
      {/* TopNavBar */}
      <header className="border-b-strict" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        backgroundColor: "#ffffff",
        height: "64px",
        zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
          <span style={{ fontSize: "20px", fontFamily: "Space Grotesk", fontWeight: "900", tracking: "-0.05em", cursor: "pointer" }} onClick={() => { setSelectedProjectId(null); setView("DASHBOARD"); }}>
            HYPERFRAMES
          </span>
          
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <button 
              className="secondary" 
              style={{ padding: "6px 12px", fontSize: "12px", boxShadow: "none", border: "1px solid #000", height: "auto" }} 
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
        
        <div>
          <button 
            className="btn-mono btn-mono-primary" 
            style={{ fontSize: "12px", padding: "8px 16px" }}
            onClick={handleRenderVideo}
            disabled={rendering}
          >
            {rendering ? `Exporting (${renderProgress}%)` : "Export"}
          </button>
        </div>
      </header>

      {/* Main Workspace content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {view === "WORKSPACE_SETUP" ? (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Left Column: Script input & Generation */}
            <div style={{ flex: "0 0 58.33%", borderRight: "2px solid #000000", overflowY: "auto", display: "flex" }}>
              <StoryboardEditor
                mode="setup"
                scenes={currentProject?.scenes || []}
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
            <nav className="border-r-strict" style={{ width: "256px", backgroundColor: "#ffffff", height: "100%", display: "flex", flexDirection: "column", padding: "20px", flexShrink: 0 }}>
              <div style={{ paddingBottom: "15px", borderBottom: "1px solid #000", marginBottom: "15px" }}>
                <span style={{ fontSize: "14px", fontFamily: "Space Grotesk", fontWeight: "bold", display: "block" }}>{currentProject?.title || "Dự án hiện tại"}</span>
                <span style={{ fontSize: "11px", color: "#666666" }}>v1.0.4-alpha</span>
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                <li>
                  <a href="#" style={{ textDecoration: "none", color: "#000", fontWeight: "bold", display: "flex", gap: "8px", alignItems: "center" }}>
                    📂 Projects
                  </a>
                </li>
                <li>
                  <a href="#" style={{ textDecoration: "none", color: "#666", display: "flex", gap: "8px", alignItems: "center" }}>
                    🎥 Media
                  </a>
                </li>
                <li>
                  <a href="#" style={{ textDecoration: "none", color: "#000", backgroundColor: "#f0f0f0", padding: "6px 10px", borderRadius: "4px", display: "flex", gap: "8px", alignItems: "center" }}>
                    📈 Timeline
                  </a>
                </li>
                <li>
                  <a href="#" style={{ textDecoration: "none", color: "#666", display: "flex", gap: "8px", alignItems: "center" }}>
                    ✨ Effects
                  </a>
                </li>
                <li>
                  <a href="#" style={{ textDecoration: "none", color: "#666", display: "flex", gap: "8px", alignItems: "center" }}>
                    🔊 Audio
                  </a>
                </li>
              </ul>
              <div style={{ borderTop: "1px solid #000", paddingTop: "15px" }}>
                <a href="#" style={{ textDecoration: "none", color: "#666", display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
                  ❓ Help
                </a>
                <a href="#" onClick={() => { setSelectedProjectId(null); setView("DASHBOARD"); }} style={{ textDecoration: "none", color: "#666", display: "flex", gap: "8px", alignItems: "center" }}>
                  🚪 Logout
                </a>
              </div>
            </nav>

            {/* Middle Column: Storyboard cards list */}
            <div style={{ flex: 1, overflowY: "auto", borderRight: "2px solid #000000" }}>
              <StoryboardEditor
                mode="editor"
                scenes={currentProject?.scenes || []}
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
                totalFrames={totalFrames}
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
