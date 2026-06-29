import React, { useState } from "react";

export const Dashboard = ({ projects = [], onCreateProject, onSelectProject, onDeleteProject }) => {
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateProject(newTitle);
    setNewTitle("");
    setShowModal(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Background Pastel Blobs for Glassmorphism depth */}
      <div style={{ position: "absolute", top: "10%", left: "5%", width: "350px", height: "350px", borderRadius: "50%", background: "rgba(37, 99, 235, 0.06)", filter: "blur(70px)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "15%", right: "8%", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(168, 85, 247, 0.05)", filter: "blur(80px)", zIndex: 0, pointerEvents: "none" }} />

      {/* TopNavBar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 40px",
          backgroundColor: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
          height: "70px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.01)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
          <span
            style={{
              fontSize: "22px",
              fontFamily: "var(--font-heading)",
              fontWeight: "900",
              letterSpacing: "-0.04em",
              color: "var(--text-primary)",
              background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            HYPERFRAMES
          </span>
          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <span className="tab-active" style={{ fontSize: "14px", cursor: "pointer", paddingBottom: "4px" }}>Projects</span>
            <span className="tab-inactive" style={{ fontSize: "14px", cursor: "pointer", paddingBottom: "4px" }}>Assets</span>
            <span className="tab-inactive" style={{ fontSize: "14px", cursor: "pointer", paddingBottom: "4px" }}>Team</span>
            <span className="tab-inactive" style={{ fontSize: "14px", cursor: "pointer", paddingBottom: "4px" }}>Settings</span>
          </div>
        </div>
        <button className="primary" style={{ padding: "10px 22px", borderRadius: "var(--radius-pill)" }} onClick={() => setShowModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Tạo Video Mới
        </button>
      </nav>

      {/* Main Content Area */}
      <div style={{ padding: "50px 40px", maxWidth: "1280px", width: "100%", margin: "0 auto", flex: 1, zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "36px" }}>
          <h2 style={{ fontSize: "30px", fontFamily: "var(--font-heading)", fontWeight: "800", letterSpacing: "-0.02em" }}>
            Dự án của tôi
          </h2>
          <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 600 }}>{projects.length} Video</span>
        </div>

        {/* Project grid list */}
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
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginBottom: "24px", fontWeight: "600" }}>
              Chưa có dự án nào được tạo. Hãy khởi tạo dự án đầu tiên của bạn!
            </p>
            <button className="primary" style={{ borderRadius: "var(--radius-pill)" }} onClick={() => setShowModal(true)}>
              Khởi Tạo Ngay
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "30px" }}>
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                style={{
                  backgroundColor: "var(--bg-primary)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255, 255, 255, 0.6)",
                  borderRadius: "var(--radius-lg)",
                  padding: "26px",
                  cursor: "pointer",
                  boxShadow: "var(--shadow)",
                  transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "180px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-hover)";
                  e.currentTarget.style.borderColor = "rgba(37, 99, 235, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "var(--shadow)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontFamily: "var(--font-heading)", marginBottom: "8px", fontWeight: "800", color: "var(--text-primary)" }}>
                      {project.title}
                    </h3>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                      Cập nhật: {new Date(project.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Bạn có chắc chắn muốn xóa dự án "${project.title}" không?`)) {
                        onDeleteProject(project.id);
                      }
                    }}
                    style={{
                      background: "rgba(255, 51, 51, 0.06)",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "11px",
                      cursor: "pointer",
                      color: "#ef4444",
                      fontWeight: "700",
                      textTransform: "none",
                      boxShadow: "none",
                      letterSpacing: "0px"
                    }}
                    title="Xóa dự án"
                  >
                    ✕ Xóa
                  </button>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    backgroundColor: project.status === "DRAFT" ? "rgba(37, 99, 235, 0.08)" : "rgba(16, 185, 129, 0.08)",
                    color: project.status === "DRAFT" ? "var(--color-primary)" : "#10b981",
                    letterSpacing: "0.02em"
                  }}>
                    {project.status === "DRAFT" ? "Bản thảo" : "Đã xuất"}
                  </span>
                  <span
                    style={{
                      fontWeight: "900",
                      fontSize: "20px",
                      color: "var(--color-primary)",
                      transition: "transform 0.2s ease"
                    }}
                  >
                    &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.2)",
            backdropFilter: "blur(8px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.6)",
              borderRadius: "var(--radius-lg)",
              padding: "36px",
              width: "480px",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.08)"
            }}
          >
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: "800", marginBottom: "20px" }}>
              Tạo Video Mới
            </h2>
            <div style={{ marginBottom: "28px" }}>
              <label className="form-label-mono" style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-secondary)" }}>
                Tiêu đề dự án
              </label>
              <input
                className="form-input-mono"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nhập tên dự án video..."
                autoFocus
                required
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "14px" }}>
              <button type="button" className="secondary" style={{ textTransform: "uppercase" }} onClick={() => setShowModal(false)}>
                Hủy bỏ
              </button>
              <button type="submit" className="primary" style={{ textTransform: "uppercase" }}>
                Khởi tạo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
