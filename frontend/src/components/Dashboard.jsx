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
    <div style={{ minHeight: "100vh", backgroundColor: "#fafafa", display: "flex", flexDirection: "column" }}>
      {/* TopNavBar */}
      <nav className="border-b-strict" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", backgroundColor: "#ffffff", height: "64px", shrink: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
          <span style={{ fontSize: "20px", fontFamily: "Space Grotesk", fontWeight: "900", tracking: "-0.05em", color: "#000000" }}>
            HYPERFRAMES
          </span>
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <span className="tab-active" style={{ fontSize: "14px", cursor: "pointer", paddingBottom: "4px" }}>Projects</span>
            <span className="tab-inactive" style={{ fontSize: "14px", cursor: "pointer", paddingBottom: "4px" }}>Assets</span>
            <span className="tab-inactive" style={{ fontSize: "14px", cursor: "pointer", paddingBottom: "4px" }}>Team</span>
            <span className="tab-inactive" style={{ fontSize: "14px", cursor: "pointer", paddingBottom: "4px" }}>Settings</span>
          </div>
        </div>
        <button className="btn-mono btn-mono-primary" style={{ fontSize: "12px", padding: "8px 16px" }} onClick={() => setShowModal(true)}>
          Tạo Video Mới
        </button>
      </nav>

      {/* Main Content Area */}
      <div style={{ padding: "40px 24px", maxWidth: "1200px", width: "100%", margin: "0 auto", flex: 1 }}>
        <h2 style={{ fontSize: "28px", fontFamily: "Space Grotesk", textTransform: "uppercase", marginBottom: "30px", tracking: "-0.02em", borderBottom: "2px solid #000000", paddingBottom: "10px" }}>
          Dự án của tôi
        </h2>

        {/* Project grid list */}
        {projects.length === 0 ? (
          <div style={{ border: "2px dashed #000000", padding: "80px 20px", textAlign: "center", borderRadius: "4px", backgroundColor: "#ffffff", boxShadow: "4px 4px 0px 0px #000000" }}>
            <p style={{ color: "#555555", fontSize: "16px", marginBottom: "20px", fontFamily: "Space Grotesk", fontWeight: "bold" }}>
              Chưa có dự án nào được tạo. Hãy khởi tạo dự án đầu tiên của bạn!
            </p>
            <button className="btn-mono btn-mono-primary" onClick={() => setShowModal(true)}>Tạo Dự Án Mới</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                style={{
                  backgroundColor: "#ffffff",
                  border: "2px solid #000000",
                  borderRadius: "4px",
                  padding: "24px",
                  cursor: "pointer",
                  boxShadow: "4px 4px 0px 0px #000000",
                  transition: "transform 0.1s ease, box-shadow 0.1s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "160px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translate(-2px, -2px)";
                  e.currentTarget.style.boxShadow = "6px 6px 0px 0px #000000";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "4px 4px 0px 0px #000000";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontSize: "17px", fontFamily: "Space Grotesk", marginBottom: "8px", fontWeight: "bold", textTransform: "uppercase", paddingRight: "10px" }}>
                      {project.title}
                    </h3>
                    <span style={{ fontSize: "12px", color: "#555555" }}>
                      Tạo ngày: {new Date(project.createdAt).toLocaleDateString("vi-VN")}
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
                      background: "none",
                      border: "1px solid #000000",
                      borderRadius: "4px",
                      padding: "2px 6px",
                      fontSize: "11px",
                      cursor: "pointer",
                      color: "#ff3333",
                      fontWeight: "bold",
                      fontFamily: "Space Grotesk"
                    }}
                    title="Xóa dự án"
                  >
                    ✕ Xóa
                  </button>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    border: "1px solid #000000",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    backgroundColor: project.status === "DRAFT" ? "#ffffff" : "#000000",
                    color: project.status === "DRAFT" ? "#000000" : "#ffffff",
                    letterSpacing: "0.05em"
                  }}>
                    {project.status}
                  </span>
                  <span style={{ fontWeight: "900", fontSize: "18px" }}>&rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <form
            onSubmit={handleSubmit}
            style={{
              backgroundColor: "#ffffff",
              border: "3px solid #000000",
              borderRadius: "4px",
              padding: "30px",
              width: "450px",
              boxShadow: "8px 8px 0px 0px #000000"
            }}
          >
            <h2 style={{ fontFamily: "Space Grotesk", fontSize: "22px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "20px" }}>
              Tạo Video Mới
            </h2>
            <div style={{ marginBottom: "24px" }}>
              <label className="form-label-mono">
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
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button type="button" className="btn-mono btn-mono-secondary" onClick={() => setShowModal(false)}>
                Hủy bỏ
              </button>
              <button type="submit" className="btn-mono btn-mono-primary">
                Khởi tạo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
