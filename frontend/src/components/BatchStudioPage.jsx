import React, { useState, useCallback, useEffect } from "react";
import { SidebarConfig } from "./SidebarConfig";
import { api } from "../services/api";
import axios from "axios";

const generateId = () => Math.random().toString(36).slice(2, 9);

const createEmptySlot = () => ({
  id: generateId(),
  text: "",
  status: "idle", // "idle" | "pending" | "running" | "done" | "error"
  projectName: null,
  error: null,
  selectedMedia: [],
  selectedBgMedia: [],
});

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
  },
  {
    id: "fintech_edu",
    name: "FinTech Edu — Deep Blue AI",
    description: "Nền Royal Navy đậm, họa tiết vi mạch SVG cyan phát sáng, thẻ thông số Dashboard và nút CTA Gold nổi bật.",
    tokens: {
      background: "linear-gradient(160deg, #0028a0 0%, #001060 50%, #000A3A 100%)",
      cardBg: "rgba(0, 25, 80, 0.55)",
      border: "1.5px solid rgba(255, 215, 0, 0.45)",
      text: "#FFFFFF",
      textSecondary: "rgba(255, 255, 255, 0.85)",
      accent: "#FFD700",
      radius: "12px",
      shadow: "0 0 30px rgba(0, 212, 255, 0.35)",
      fontFamily: "Chakra Petch, sans-serif"
    }
  },
  {
    id: "ba",
    name: "Ba — Modern Corporate",
    description: "Theme Ba: Phong cách doanh nghiệp hiện đại. Nền xanh gradient sâu thẳm, thẻ Business Blue kính mờ, viền Electric Blue và điểm nhấn Tech Cyan.",
    tokens: {
      background: "linear-gradient(135deg, #002691 0%, #004BBF 50%, #0059D7 100%)",
      cardBg: "linear-gradient(135deg, rgba(0, 38, 145, 0.85) 0%, rgba(0, 75, 191, 0.8) 100%)",
      border: "1.5px solid rgba(2, 89, 233, 0.45)",
      text: "#FFFFFF",
      textSecondary: "#EAF8FF",
      accent: "#5DC8FB",
      radius: "16px",
      shadow: "0 8px 32px rgba(2, 89, 233, 0.15)",
      fontFamily: "Be Vietnam Pro, sans-serif"
    }
  },
  {
    id: "ai_driven",
    name: "AI-Driven — Electric Blue",
    description: "Tone Navy-to-Midnight cực deep, viền Electric Cyan phát sáng, thẻ kính mờ đậm chất Sci-Fi. Font Chakra Petch cực công nghệ.",
    tokens: {
      background: "linear-gradient(180deg, #000A3A 0%, #001060 40%, #0026A8 80%)",
      cardBg: "linear-gradient(135deg, rgba(0, 30, 100, 0.55) 0%, rgba(0, 10, 58, 0.75) 100%)",
      border: "1.5px solid rgba(0, 200, 255, 0.55)",
      text: "#FFFFFF",
      textSecondary: "rgba(200, 230, 255, 0.85)",
      accent: "#00C8FF",
      radius: "12px",
      shadow: "0 0 40px rgba(0, 200, 255, 0.4)",
      fontFamily: "Chakra Petch, sans-serif"
    }
  }
];

export const BatchStudioPage = ({ sharedConfig, onConfigChange, onBatchComplete }) => {
  const [slots, setSlots] = useState([createEmptySlot()]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [importToast, setImportToast] = useState(null);

  useEffect(() => {
    if (importToast) {
      const timer = setTimeout(() => setImportToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [importToast]);

  const handleImportScriptForSlot = (slotId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result || "";
      handleSlotTextChange(slotId, text);
      setImportToast({
        message: `Đã tải kịch bản slot #${slots.findIndex(s => s.id === slotId) + 1}: ${file.name}`,
        type: "success"
      });
    };
    reader.onerror = (err) => {
      console.error("Failed to read file:", err);
      setImportToast({
        message: "Không thể đọc tệp kịch bản này.",
        type: "error"
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Styles & Modals States
  const [selectedStyle, setSelectedStyle] = useState("minimal");
  const [vdeThemes, setVdeThemes] = useState(VDE_PRESET_STYLES);
  const [showStyleModal, setShowStyleModal] = useState(false);

  // Media Modal States
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaTab, setMediaTab] = useState("YOUR_MEDIA"); // YOUR_MEDIA, UPLOAD, STOCK, AI
  const [previousMedia, setPreviousMedia] = useState([]);
  const [stockQuery, setStockQuery] = useState("");
  const [stockResults, setStockResults] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState(null);
  const [mediaModalContext, setMediaModalContext] = useState("content"); // "content" | "background"

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

  // Sync previous media when media modal opens
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

  const handleAddSlot = () => setSlots(prev => [...prev, createEmptySlot()]);

  const handleRemoveSlot = (id) => setSlots(prev => prev.filter(s => s.id !== id));

  const handleSlotTextChange = (id, text) =>
    setSlots(prev => prev.map(s => s.id === id ? { ...s, text } : s));

  const updateSlot = (id, updates) =>
    setSlots(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

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
          
          if (activeSlotId) {
            setSlots(prev => prev.map(slot => {
              if (slot.id !== activeSlotId) return slot;
              if (mediaModalContext === "content") {
                const list = slot.selectedMedia || [];
                return { ...slot, selectedMedia: Array.from(new Set([...list, uploadedUrl])) };
              } else {
                const list = slot.selectedBgMedia || [];
                return { ...slot, selectedBgMedia: Array.from(new Set([...list, uploadedUrl])) };
              }
            }));
          }

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

  const handleStockSearch = async () => {
    if (!stockQuery.trim()) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/media/search?query=${encodeURIComponent(stockQuery)}`);
      setStockResults(res.data || []);
    } catch (err) {
      console.error("Stock search failed:", err);
    }
  };

  const handleToggleSelectMedia = (url) => {
    if (!activeSlotId) return;
    setSlots(prev => prev.map(slot => {
      if (slot.id !== activeSlotId) return slot;
      if (mediaModalContext === "content") {
        const list = slot.selectedMedia || [];
        const newList = list.includes(url) ? list.filter(u => u !== url) : [...list, url];
        return { ...slot, selectedMedia: newList };
      } else {
        const list = slot.selectedBgMedia || [];
        const newList = list.includes(url) ? list.filter(u => u !== url) : [...list, url];
        return { ...slot, selectedBgMedia: newList };
      }
    }));
  };

  const handleCloseMediaModal = () => {
    setShowMediaModal(false);
    setActiveSlotId(null);
  };
  const handleMediaModalConfirm = () => {
    setShowMediaModal(false);
    setActiveSlotId(null);
  };

  const handleRunBatch = useCallback(async () => {
    const activeSlots = slots.filter(s => s.text.trim());
    if (!activeSlots.length) return;

    setIsRunning(true);
    setProgress({ current: 0, total: activeSlots.length });

    // Mark all active as pending
    setSlots(prev => prev.map(s =>
      activeSlots.find(a => a.id === s.id) ? { ...s, status: "pending", error: null } : s
    ));

    for (let i = 0; i < activeSlots.length; i++) {
      const slot = activeSlots[i];
      setProgress({ current: i + 1, total: activeSlots.length });
      updateSlot(slot.id, { status: "running" });

      try {
        // 1. Create project
        const firstLine = slot.text.trim().split("\n")[0];
        const title = firstLine.length > 40 ? firstLine.slice(0, 37) + "..." : firstLine;
        const newProj = await api.createProject(title || `Batch Video #${i + 1}`);

        // 2. Apply shared config
        await api.updateProjectConfig(newProj.id, sharedConfig);

        // 3. Generate storyboard
        const traits = sharedConfig.traits || [];
        await api.generateStoryboard(newProj.id, slot.text, selectedStyle, traits, slot.selectedMedia || [], slot.selectedBgMedia || []);

        updateSlot(slot.id, { status: "done", projectName: title || `Batch Video #${i + 1}` });
      } catch (err) {
        updateSlot(slot.id, {
          status: "error",
          error: err?.response?.data?.error || err.message || "Lỗi không xác định"
        });
      }
    }

    setIsRunning(false);
    // Navigate back after 2.5s
    setTimeout(() => onBatchComplete(), 2500);
  }, [slots, sharedConfig, selectedStyle, onBatchComplete]);

  const handleConfirmStyle = () => {
    setShowStyleModal(false);
    handleRunBatch();
  };

  const validCount = slots.filter(s => s.text.trim()).length;

  const getStatusBadge = (slot) => {
    const baseStyle = {
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "4px 12px", borderRadius: "999px", fontSize: "12px",
      fontWeight: "600", fontFamily: "Inter"
    };
    if (slot.status === "idle") return null;
    if (slot.status === "pending") return (
      <span style={{ ...baseStyle, background: "rgba(100,116,139,0.1)", color: "#64748b" }}>⏳ Đang chờ</span>
    );
    if (slot.status === "running") return (
      <span style={{ ...baseStyle, background: "rgba(37,99,235,0.1)", color: "#2563eb" }}>🔄 Đang xử lý...</span>
    );
    if (slot.status === "done") return (
      <span style={{ ...baseStyle, background: "rgba(22,163,74,0.1)", color: "#16a34a" }}>✅ Xong — "{slot.projectName}"</span>
    );
    if (slot.status === "error") return (
      <span style={{ ...baseStyle, background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>❌ Lỗi: {slot.error}</span>
    );
    return null;
  };

  // Render Project Images Modal
  const renderMediaModal = () => {
    if (!showMediaModal) return null;

    const activeSlot = slots.find(s => s.id === activeSlotId);
    const activeMediaList = activeSlot
      ? (mediaModalContext === "content" ? (activeSlot.selectedMedia || []) : (activeSlot.selectedBgMedia || []))
      : [];

    return (
      <div style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(6px)", zIndex: 9999, display: "flex",
        justifyContent: "center", alignItems: "center", padding: "20px"
      }}>
        <div style={{
          backgroundColor: "#ffffff", width: "1000px", maxWidth: "95%",
          height: "85vh", maxHeight: "800px", borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", display: "flex",
          flexDirection: "column", overflow: "hidden", border: "1px solid rgba(15, 23, 42, 0.08)",
          fontFamily: "Inter, sans-serif"
        }}>
          {/* Modal Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(15, 23, 42, 0.06)", backgroundColor: "#fafbfc" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>🖼️</span>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                {mediaModalContext === "content" ? "Chọn Ảnh Nội Dung" : "Chọn Ảnh Nền"}
              </h3>
            </div>

            <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "30px", gap: "4px" }}>
              <button type="button" onClick={() => setMediaTab("YOUR_MEDIA")} style={{ border: "none", background: mediaTab === "YOUR_MEDIA" ? "#ffffff" : "none", color: mediaTab === "YOUR_MEDIA" ? "#0f172a" : "#64748b", padding: "8px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s ease", boxShadow: mediaTab === "YOUR_MEDIA" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}>Your Media</button>
              <button type="button" onClick={() => setMediaTab("UPLOAD")} style={{ border: "none", background: mediaTab === "UPLOAD" ? "#ffffff" : "none", color: mediaTab === "UPLOAD" ? "#0f172a" : "#64748b", padding: "8px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s ease", boxShadow: mediaTab === "UPLOAD" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}>Upload</button>
              <button type="button" onClick={() => setMediaTab("STOCK")} style={{ border: "none", background: mediaTab === "STOCK" ? "#ffffff" : "none", color: mediaTab === "STOCK" ? "#0f172a" : "#64748b", padding: "8px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s ease", boxShadow: mediaTab === "STOCK" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}>Stock Images</button>
              <button type="button" onClick={() => setMediaTab("AI")} style={{ border: "none", background: mediaTab === "AI" ? "#ffffff" : "none", color: mediaTab === "AI" ? "#0f172a" : "#64748b", padding: "8px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s ease", boxShadow: mediaTab === "AI" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}>AI Images</button>
            </div>

            <button type="button" onClick={handleCloseMediaModal} style={{ border: "none", background: "rgba(15, 23, 42, 0.04)", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "14px", color: "#64748b", transition: "background 0.2s ease" }}>✕</button>
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
                      const isSelected = activeMediaList.includes(url);
                      return (
                        <div key={idx} onClick={() => handleToggleSelectMedia(url)} style={{ position: "relative", width: "100%", paddingTop: "100%", borderRadius: "12px", overflow: "hidden", cursor: "pointer", border: isSelected ? "3px solid #3b82f6" : "1px solid rgba(15,23,42,0.08)", boxShadow: isSelected ? "0 4px 12px rgba(59,130,246,0.15)" : "none", transition: "all 0.2s ease" }}>
                          <img src={url.startsWith("http") ? url : `http://localhost:5000${url}`} alt="Previous Media Item" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                          {isSelected && <div style={{ position: "absolute", top: "8px", right: "8px", backgroundColor: "#3b82f6", color: "#ffffff", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold" }}>✓</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {mediaTab === "UPLOAD" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "300px" }}>
                <div onClick={() => document.getElementById("media-modal-upload-input").click()} style={{ width: "100%", maxWidth: "500px", border: "2px dashed #cbd5e1", borderRadius: "16px", padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", backgroundColor: "#f8fafc", transition: "all 0.2s ease" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.backgroundColor = "#f0f9ff"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.backgroundColor = "#f8fafc"; }}>
                  <input type="file" id="media-modal-upload-input" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
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
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                  <input type="text" placeholder="Search high-quality stock photos from Unsplash..." value={stockQuery} onChange={(e) => setStockQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleStockSearch()} style={{ flex: 1, padding: "12px 16px", borderRadius: "30px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }} />
                  <button type="button" onClick={handleStockSearch} style={{ backgroundColor: "#0f172a", color: "#ffffff", border: "none", padding: "0 24px", borderRadius: "30px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>Tìm kiếm</button>
                </div>
                {stockResults.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
                    <span style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</span>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b", fontWeight: "600" }}>Nhập từ khóa tìm kiếm để duyệt ảnh Unsplash</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "16px" }}>
                    {stockResults.map((url, idx) => {
                      const isSelected = activeMediaList.includes(url);
                      return (
                        <div key={idx} onClick={() => handleToggleSelectMedia(url)} style={{ position: "relative", width: "100%", paddingTop: "100%", borderRadius: "12px", overflow: "hidden", cursor: "pointer", border: isSelected ? "3px solid #3b82f6" : "1px solid rgba(15,23,42,0.08)", boxShadow: isSelected ? "0 4px 12px rgba(59,130,246,0.15)" : "none", transition: "all 0.2s ease" }}>
                          <img src={url} alt="Unsplash Stock" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                          {isSelected && <div style={{ position: "absolute", top: "8px", right: "8px", backgroundColor: "#3b82f6", color: "#ffffff", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold" }}>✓</div>}
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
          <div style={{ borderTop: "1px solid rgba(15, 23, 42, 0.06)", padding: "16px 24px", backgroundColor: "#fafbfc", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>
                Đã chọn ({activeMediaList.length} ảnh)
              </span>
              {activeMediaList.length > 0 && (
                <button type="button" onClick={() => {
                  setSlots(prev => prev.map(slot => {
                    if (slot.id !== activeSlotId) return slot;
                    if (mediaModalContext === "content") {
                      return { ...slot, selectedMedia: [] };
                    } else {
                      return { ...slot, selectedBgMedia: [] };
                    }
                  }));
                }} style={{ border: "none", background: "none", color: "#ef4444", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Xóa tất cả</button>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
              <div style={{ flex: 1, display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px", minHeight: "56px" }}>
                {activeMediaList.length === 0 ? (
                  <span style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic", alignSelf: "center" }}>
                    Chưa chọn ảnh nào.
                  </span>
                ) : (
                  activeMediaList.map((url, idx) => (
                    <div key={idx} style={{ position: "relative", width: "50px", height: "50px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, border: "1px solid rgba(0,0,0,0.1)" }}>
                      <img src={url.startsWith("http") ? url : `http://localhost:5000${url}`} alt="Selected Thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button type="button" onClick={() => handleToggleSelectMedia(url)} style={{ position: "absolute", top: "2px", right: "2px", width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", color: "#ffffff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", cursor: "pointer", lineHeight: 1 }}>✕</button>
                    </div>
                  ))
                )}
              </div>

              <button type="button" onClick={handleMediaModalConfirm} style={{ backgroundColor: "#2563eb", color: "#ffffff", border: "none", padding: "12px 32px", borderRadius: "30px", fontSize: "14px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 10px rgba(59, 130, 246, 0.2)", transition: "all 0.2s ease" }}>XÁC NHẬN</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* ── Left: Script list ── */}
      <div className="custom-scrollbar" style={{
        flex: 1, overflowY: "auto", padding: "30px",
        boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "0"
      }}>
        {/* Header */}
        <div style={{ marginBottom: "24px", borderBottom: "2px solid #000", paddingBottom: "15px" }}>
          <h2 style={{
            fontSize: "24px", fontFamily: "Space Grotesk", fontWeight: "bold",
            color: "#000", textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0
          }}>Sản xuất Hàng loạt</h2>
          <p style={{ fontSize: "13px", fontFamily: "Inter", color: "#555", marginTop: "4px", marginBottom: 0 }}>
            Nhập nhiều kịch bản — hệ thống sẽ tự tạo từng video Studio tuần tự
          </p>
        </div>

        {/* Slot list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {slots.map((slot, idx) => (
            <div key={slot.id} style={{
              border: slot.status === "running"
                ? "2px solid #2563eb"
                : slot.status === "done"
                  ? "2px solid #16a34a"
                  : slot.status === "error"
                    ? "2px solid #dc2626"
                    : "2px solid #000",
              borderRadius: "12px", padding: "20px",
              backgroundColor: slot.status === "done" ? "rgba(22,163,74,0.02)" : "#fff",
              transition: "border-color 0.3s ease"
            }}>
              {/* Slot header */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    fontSize: "11px", fontFamily: "Space Mono", fontWeight: "bold",
                    letterSpacing: "0.08em", color: "#888", textTransform: "uppercase"
                  }}>#{idx + 1}</span>
                  {getStatusBadge(slot)}
                  
                  <input
                    type="file"
                    id={`file-input-${slot.id}`}
                    accept=".md,.txt"
                    style={{ display: "none" }}
                    onChange={(e) => handleImportScriptForSlot(slot.id, e)}
                  />
                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={() => document.getElementById(`file-input-${slot.id}`)?.click()}
                    style={{
                      background: "rgba(37, 99, 235, 0.08)",
                      border: "1px solid rgba(37, 99, 235, 0.2)",
                      borderRadius: "12px",
                      padding: "3px 8px",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#2563eb",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                      transition: "all 0.2s ease",
                      opacity: isRunning ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isRunning) {
                        e.currentTarget.style.background = "rgba(37, 99, 235, 0.15)";
                        e.currentTarget.style.borderColor = "#2563eb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isRunning) {
                        e.currentTarget.style.background = "rgba(37, 99, 235, 0.08)";
                        e.currentTarget.style.borderColor = "rgba(37, 99, 235, 0.2)";
                      }
                    }}
                  >
                    📝 Tải file MD/TXT
                  </button>
                </div>
                {slots.length > 1 && !isRunning && (
                  <button
                    onClick={() => handleRemoveSlot(slot.id)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: "18px", color: "#aaa", padding: "0 4px", lineHeight: 1
                    }}
                    title="Xóa kịch bản này"
                  >✕</button>
                )}
              </div>

              {/* Textarea */}
              <textarea
                value={slot.text}
                onChange={(e) => handleSlotTextChange(slot.id, e.target.value)}
                disabled={isRunning}
                placeholder={`Kịch bản #${idx + 1}. Ví dụ: Thiền định không chỉ là ngồi yên...`}
                className="form-input-mono"
                style={{
                  width: "100%", minHeight: "140px", padding: "14px",
                  fontSize: "14px", resize: "vertical", lineHeight: "1.6",
                  fontFamily: "Inter", boxSizing: "border-box",
                  opacity: isRunning ? 0.7 : 1
                }}
              />

              {/* Slot Media Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                {/* Content Media Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveSlotId(slot.id);
                    setMediaModalContext("content");
                    setShowMediaModal(true);
                  }}
                  disabled={isRunning}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: "1px solid rgba(15, 23, 42, 0.12)",
                    background: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
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
                  <span style={{ fontSize: "14px" }}>🖼️</span>
                  ẢNH NỘI DUNG ({(slot.selectedMedia || []).length})
                </button>

                {/* Background Media Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveSlotId(slot.id);
                    setMediaModalContext("background");
                    setShowMediaModal(true);
                  }}
                  disabled={isRunning}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: "1px solid rgba(15, 23, 42, 0.12)",
                    background: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
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
                  <span style={{ fontSize: "14px" }}>🧱</span>
                  ẢNH NỀN ({(slot.selectedBgMedia || []).length})
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add slot button */}
        {!isRunning && (
          <button
            onClick={handleAddSlot}
            style={{
              marginTop: "16px", padding: "12px 24px", borderRadius: "30px",
              border: "1.5px dashed rgba(15,23,42,0.25)", background: "transparent",
              fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
              transition: "all 0.2s ease", width: "fit-content"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--color-primary)";
              e.currentTarget.style.color = "var(--color-primary)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "rgba(15,23,42,0.25)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            + Thêm kịch bản
          </button>
        )}

        {/* Progress bar */}
        {isRunning && (
          <div style={{
            marginTop: "24px", padding: "16px 20px",
            background: "rgba(37,99,235,0.05)", borderRadius: "10px",
            border: "1px solid rgba(37,99,235,0.15)"
          }}>
            <p style={{
              margin: 0, fontSize: "14px", fontWeight: "600",
              color: "#2563eb", fontFamily: "Inter"
            }}>
              🔄 Đang xử lý {progress.current} / {progress.total} kịch bản...
            </p>
            {/* Simple progress track */}
            <div style={{
              marginTop: "10px", height: "4px", borderRadius: "999px",
              background: "rgba(37,99,235,0.15)", overflow: "hidden"
            }}>
              <div style={{
                height: "100%", borderRadius: "999px", background: "#2563eb",
                width: `${(progress.current / progress.total) * 100}%`,
                transition: "width 0.5s ease"
              }} />
            </div>
          </div>
        )}

        {/* Left Column Footer Actions */}
        <div style={{
          marginTop: "24px",
          borderTop: "1px solid rgba(15, 23, 42, 0.08)",
          paddingTop: "20px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center"
        }}>
          {/* Generate Button */}
          <button
            className="primary"
            style={{
              width: "auto",
              minWidth: "160px",
              padding: "12px 32px",
              fontSize: "14px",
              fontWeight: "bold",
              borderRadius: "30px",
              letterSpacing: "0.03em"
            }}
            onClick={() => setShowStyleModal(true)}
            disabled={isRunning || validCount === 0}
          >
            {isRunning ? "⏳ Đang chạy..." : "Tạo storyboard \u00a0 🪄"}
          </button>
        </div>
      </div>

      {/* ── Right: Video Setup (SidebarConfig) ── */}
      <div style={{
        flex: "0 0 380px", borderLeft: "1px solid rgba(15, 23, 42, 0.08)",
        overflowY: "auto"
      }}>
        <SidebarConfig config={sharedConfig} onChange={onConfigChange} />
      </div>

      {/* VDE Style Selection Modal */}
      {showStyleModal && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(10, 11, 20, 0.75)",
          backdropFilter: "blur(8px)", zIndex: 9999, display: "flex",
          justifyContent: "center", alignItems: "center", padding: "20px"
        }}>
          <div style={{
            backgroundColor: "#ffffff", width: "100%", maxWidth: "960px",
            borderRadius: "24px", border: "3px solid #000000", boxShadow: "8px 8px 0px #000000",
            display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{ padding: "24px 30px", borderBottom: "2px solid #000000", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontFamily: "Space Grotesk", fontSize: "20px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em" }}>CHỌN PHONG CÁCH VIDEO (VDE)</h3>
              <button onClick={() => setShowStyleModal(false)} style={{ background: "none", border: "none", fontSize: "28px", fontWeight: "bold", cursor: "pointer", lineHeight: 1 }}>&times;</button>
            </div>

            {/* Style Grid Container */}
            <div className="custom-scrollbar" style={{ padding: "30px", overflowY: "auto", flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }}>
                {vdeThemes.map(style => {
                  const isSelected = selectedStyle === style.id;
                  return (
                    <div key={style.id} onClick={() => setSelectedStyle(style.id)} style={{ display: "flex", flexDirection: "column", gap: "12px", cursor: "pointer", padding: "16px", borderRadius: "20px", border: isSelected ? "3px solid #000000" : "1.5px solid #e2e8f0", backgroundColor: isSelected ? "#f8fafc" : "#ffffff", boxShadow: isSelected ? "4px 4px 0px #000000" : "none", transition: "all 0.15s ease-in-out" }}>
                      {/* Mini Viewport Code Mockup */}
                      <div style={{ width: "100%", aspectRatio: "9/16", backgroundColor: style.tokens.background, border: "2px solid #000", borderRadius: "12px", padding: "16px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden", color: style.tokens.text }}>
                        {/* 1. Header decoration */}
                        {style.id === "rikkei" ? (
                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                            <span style={{ fontSize: "8px", fontWeight: "bold", color: "#A8232A", fontFamily: "sans-serif" }}>Hệ thống học tập</span>
                            <span style={{ fontSize: "8px", color: "#555555", fontWeight: "500", fontFamily: "sans-serif" }}>Rikkei Edu</span>
                          </div>
                        ) : (
                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                            <div style={{ fontSize: "8px", textTransform: "uppercase", padding: "2px 6px", border: `1px solid ${style.tokens.accent}50`, borderRadius: "10px", color: style.tokens.accent, fontWeight: "bold" }}>Kỷ nguyên AI</div>
                          </div>
                        )}

                        {/* 2. Main Content Card / Block */}
                        {style.id === "rikkei" ? (
                          <div style={{ backgroundColor: "#FAF5F5", border: "1px solid #F1E2E3", borderRadius: "14px", padding: "10px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
                            <h4 style={{ margin: 0, fontSize: "10px", fontWeight: "bold", color: "#191919", fontFamily: "Be Vietnam Pro, sans-serif" }}>Quản lý dự án</h4>
                            <p style={{ margin: 0, fontSize: "7px", color: "#595959", lineHeight: "1.3", fontFamily: "Be Vietnam Pro, sans-serif" }}>Nền kịch bản đăng ký, theo dõi các dự án của sinh viên.</p>
                            <div style={{ width: "fit-content", backgroundColor: "#A8232A", color: "#ffffff", fontSize: "7px", fontWeight: "bold", padding: "3px 8px", borderRadius: "8px", marginTop: "3px", fontFamily: "Be Vietnam Pro, sans-serif" }}>Truy cập →</div>
                          </div>
                        ) : (
                          <div style={{ backgroundColor: style.tokens.cardBg?.includes("gradient") ? undefined : style.tokens.cardBg, backgroundImage: style.tokens.cardBg?.includes("gradient") ? style.tokens.cardBg : undefined, border: style.tokens.border, borderRadius: style.tokens.radius, boxShadow: style.tokens.shadow, padding: "12px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                            <h4 style={{ margin: 0, fontSize: "11px", fontWeight: "bold", fontFamily: style.tokens.fontFamily, color: style.tokens.text, lineHeight: "1.2" }}>AI THAY ĐỔI TOÀN DIỆN</h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: style.tokens.accent }} />
                                <span style={{ fontSize: "8px", color: style.tokens.textSecondary }}>Không chỉ viết vài dòng code</span>
                              </div>
                              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: style.tokens.accent }} />
                                <span style={{ fontSize: "8px", color: style.tokens.textSecondary }}>Phát triển cả dự án phần mềm</span>
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
                        <span style={{ fontSize: "15px", fontWeight: "bold", fontFamily: "Space Grotesk", color: "#0f172a" }}>{style.name}</span>
                        <span style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>{style.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{ padding: "20px 30px", borderTop: "2px solid #000000", display: "flex", justifyContent: "flex-end", gap: "12px", backgroundColor: "#f8fafc" }}>
              <button onClick={() => setShowStyleModal(false)} style={{ padding: "10px 24px", borderRadius: "30px", border: "2px solid #000000", backgroundColor: "#ffffff", fontFamily: "Space Grotesk", fontWeight: "bold", fontSize: "14px", cursor: "pointer", boxShadow: "2px 2px 0px #000000" }}>Cancel</button>
              <button onClick={handleConfirmStyle} style={{ padding: "10px 24px", borderRadius: "30px", border: "2px solid #000000", backgroundColor: "#000000", color: "#ffffff", fontFamily: "Space Grotesk", fontWeight: "bold", fontSize: "14px", cursor: "pointer", boxShadow: "2px 2px 0px #000000" }}>Save & Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Render Project Images Modal */}
      {renderMediaModal()}

      {importToast && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          background: importToast.type === "success" ? "rgba(15, 23, 42, 0.95)" : "rgba(220, 38, 38, 0.95)",
          backdropFilter: "blur(8px)",
          color: "#ffffff",
          padding: "12px 20px",
          borderRadius: "30px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          zIndex: 99999,
          fontSize: "13px",
          fontFamily: "Inter, sans-serif",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          animation: "fadeInUp 0.3s ease"
        }}>
          <span>{importToast.type === "success" ? "✅" : "❌"}</span>
          <span>{importToast.message}</span>
        </div>
      )}
    </div>
  );
};
