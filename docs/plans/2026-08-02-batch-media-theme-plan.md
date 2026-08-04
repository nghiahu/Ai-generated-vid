# Batch Video Setup — Theme and Media Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Bổ sung chức năng chọn Giao diện (Theme / Style) và thêm ảnh (Shared Media) dùng chung cho trang Sản xuất Hàng loạt (Batch Studio).

**Architecture:** 
1. Cập nhật `BatchStudioPage.jsx` để thêm:
   - Dropdown chọn theme/style (rikkei, ai_hub_grid, fintech_edu, ba, minimal).
   - Ô tải ảnh lên & chọn ảnh từ nguồn trước đó (Your Media) hoặc tìm kiếm Unsplash (Stock) bằng cách tích hợp trực tiếp một Modal Media chuyên nghiệp.
   - Hiển thị danh sách ảnh đã chọn dạng thumbnail có nút xoá.
2. Truyền danh sách ảnh dùng chung (`sharedMedia`) và theme đã chọn vào API `generateStoryboard` khi chạy batch.

---

## Task 1: Thiết kế giao diện và logic chọn Theme & Media trong BatchStudioPage.jsx

**Files:**
- Modify: `frontend/src/components/BatchStudioPage.jsx`

**Step 1: Khai báo thêm các state cần thiết**

Thêm các state sau vào đầu component `BatchStudioPage`:
```javascript
  const [selectedStyle, setSelectedStyle] = useState("minimal");
  const [sharedMedia, setSharedMedia] = useState([]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaTab, setMediaTab] = useState("YOUR_MEDIA"); // YOUR_MEDIA, UPLOAD, STOCK
  const [previousMedia, setPreviousMedia] = useState([]);
  const [stockQuery, setStockQuery] = useState("");
  const [stockResults, setStockResults] = useState([]);
  const [uploading, setUploading] = useState(false);
```

**Step 2: Cập nhật hàm `handleRunBatch` để truyền `selectedStyle` và `sharedMedia`**

Sửa API call trong vòng lặp:
```javascript
        // 3. Generate storyboard
        const traits = sharedConfig.traits || [];
        await api.generateStoryboard(newProj.id, slot.text, selectedStyle, traits, sharedMedia);
```

**Step 3: Viết logic tải ảnh và tìm kiếm stock**

Tích hợp các helper functions:
```javascript
  const fetchPreviousMedia = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/media/previous");
      const list = res.data || [];
      setPreviousMedia(Array.from(new Set(list.map(u => typeof u === "string" ? u.trim() : u))));
    } catch (err) {
      console.error("Failed to fetch previous media:", err);
    }
  };

  const handleOpenMediaModal = () => {
    fetchPreviousMedia();
    setShowMediaModal(true);
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
          setSharedMedia(prev => Array.from(new Set([...prev, uploadedUrl])));
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
    setSharedMedia(prev => {
      if (prev.includes(url)) {
        return prev.filter(u => u !== url);
      } else {
        return [...prev, url];
      }
    });
  };
```

**Step 4: Commit**

```bash
git add frontend/src/components/BatchStudioPage.jsx
git commit -m "feat(batch): add theme and shared media state logic to BatchStudioPage"
```

---

## Task 2: Implement UI render cho Theme Selector & Media Section & MediaModal

**Files:**
- Modify: `frontend/src/components/BatchStudioPage.jsx`

**Step 1: Sửa UI Sidebar bên phải để nhét Theme & Media lên trên cùng**

Sửa phần render cột phải:
```jsx
      {/* ── Right: Video Setup ── */}
      <div style={{
        flex: "0 0 380px", borderLeft: "1px solid rgba(15,23,42,0.08)",
        overflowY: "auto", display: "flex", flexDirection: "column", backgroundColor: "#ffffff"
      }}>
        {/* Theme & Shared Media Section */}
        <div style={{ padding: "30px", borderBottom: "2px solid #000000", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label className="form-label-mono" style={{ display: "block", marginBottom: "8px" }}>Giao diện (Theme / Style)</label>
            <select
              className="form-input-mono"
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              style={{ cursor: "pointer", width: "100%", padding: "10px", borderRadius: "8px" }}
            >
              <option value="minimal">Minimal</option>
              <option value="rikkei">Rikkei Academic</option>
              <option value="ai_hub_grid">AI Grid Hub</option>
              <option value="fintech_edu">FinTech Deep Blue</option>
              <option value="ba">BA Corporate</option>
            </select>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <label className="form-label-mono" style={{ margin: 0 }}>Ảnh dùng chung ({sharedMedia.length})</label>
              <button
                type="button"
                onClick={handleOpenMediaModal}
                style={{
                  padding: "6px 14px", borderRadius: "20px", border: "1px solid #000",
                  background: "#000", color: "#fff", fontSize: "12px", fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Chọn ảnh 🖼️
              </button>
            </div>

            {/* Thumbnail grid of selected shared images */}
            {sharedMedia.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginTop: "10px" }}>
                {sharedMedia.map((url, idx) => (
                  <div key={idx} style={{ position: "relative", width: "100%", aspectRatio: "1", borderRadius: "6px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                    <img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Shared thumb" />
                    <button
                      onClick={() => handleToggleSelectMedia(url)}
                      style={{
                        position: "absolute", top: "2px", right: "2px",
                        background: "rgba(0,0,0,0.6)", color: "#fff", border: "none",
                        borderRadius: "50%", width: "16px", height: "16px",
                        fontSize: "10px", display: "flex", alignItems: "center",
                        justifyContent: "center", cursor: "pointer"
                      }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SidebarConfig */}
        <div style={{ flex: 1 }}>
          <SidebarConfig config={sharedConfig} onChange={onConfigChange} />
        </div>
      </div>
```

**Step 2: Thêm render Modal chọn ảnh ở cuối component**

Thêm logic render modal ảnh ở dòng cuối cùng trước thẻ đóng `</div>` ngoài cùng:
```jsx
        {/* Media Modal */}
        {showMediaModal && (
          <div style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(6px)", zIndex: 9999, display: "flex",
            justifyContent: "center", alignItems: "center", padding: "20px"
          }}>
            <div style={{
              backgroundColor: "#ffffff", width: "900px", maxWidth: "95%",
              height: "80vh", maxHeight: "700px", borderRadius: "20px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", display: "flex",
              flexDirection: "column", overflow: "hidden", border: "1px solid rgba(15, 23, 42, 0.08)"
            }}>
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(15, 23, 42, 0.06)", backgroundColor: "#fafbfc" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>🖼️</span>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Chọn ảnh dùng chung</h3>
                </div>

                <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "30px", gap: "4px" }}>
                  <button type="button" onClick={() => setMediaTab("YOUR_MEDIA")} style={{ border: "none", background: mediaTab === "YOUR_MEDIA" ? "#ffffff" : "none", color: mediaTab === "YOUR_MEDIA" ? "#0f172a" : "#64748b", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Đã tải lên</button>
                  <button type="button" onClick={() => setMediaTab("UPLOAD")} style={{ border: "none", background: mediaTab === "UPLOAD" ? "#ffffff" : "none", color: mediaTab === "UPLOAD" ? "#0f172a" : "#64748b", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Tải lên mới</button>
                  <button type="button" onClick={() => setMediaTab("STOCK")} style={{ border: "none", background: mediaTab === "STOCK" ? "#ffffff" : "none", color: mediaTab === "STOCK" ? "#0f172a" : "#64748b", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Kho ảnh mẫu</button>
                </div>

                <button onClick={() => setShowMediaModal(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}>&times;</button>
              </div>

              {/* Tab Contents */}
              <div className="custom-scrollbar" style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
                {mediaTab === "YOUR_MEDIA" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "16px" }}>
                    {previousMedia.map((url, idx) => {
                      const isSelected = sharedMedia.includes(url);
                      return (
                        <div key={idx} onClick={() => handleToggleSelectMedia(url)} style={{ position: "relative", aspectRatio: "1", borderRadius: "10px", overflow: "hidden", cursor: "pointer", border: isSelected ? "3px solid #2563eb" : "1px solid #e2e8f0" }}>
                          <img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Media thumb" />
                          {isSelected && <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(37, 99, 235, 0.15)", display: "flex", justifyContent: "center", alignItems: "center" }}><span style={{ color: "#fff", background: "#2563eb", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>✓</span></div>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {mediaTab === "UPLOAD" && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", border: "2px dashed #cbd5e1", borderRadius: "12px", padding: "40px" }}>
                    <span style={{ fontSize: "40px" }}>📁</span>
                    <p style={{ fontWeight: "600", margin: "16px 0 8px 0" }}>Chọn ảnh từ thiết bị của bạn</p>
                    <input type="file" onChange={handleFileUpload} accept="image/*" disabled={uploading} style={{ display: "none" }} id="batch-file-upload" />
                    <label htmlFor="batch-file-upload" style={{ padding: "10px 20px", background: "#2563eb", color: "#fff", borderRadius: "20px", fontWeight: "600", cursor: "pointer" }}>{uploading ? "Đang tải lên..." : "Tải ảnh lên"}</label>
                  </div>
                )}

                {mediaTab === "STOCK" && (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                      <input type="text" value={stockQuery} onChange={(e) => setStockQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleStockSearch()} placeholder="Nhập từ khóa tìm kiếm (tiếng Anh)..." className="form-input-mono" style={{ flex: 1 }} />
                      <button onClick={handleStockSearch} style={{ padding: "10px 20px", background: "#000", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>Tìm kiếm</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "16px", flex: 1 }}>
                      {stockResults.map((url, idx) => {
                        const isSelected = sharedMedia.includes(url);
                        return (
                          <div key={idx} onClick={() => handleToggleSelectMedia(url)} style={{ position: "relative", aspectRatio: "1", borderRadius: "10px", overflow: "hidden", cursor: "pointer", border: isSelected ? "3px solid #2563eb" : "1px solid #e2e8f0" }}>
                            <img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Stock thumb" />
                            {isSelected && <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(37, 99, 235, 0.15)", display: "flex", justifyContent: "center", alignItems: "center" }}><span style={{ color: "#fff", background: "#2563eb", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>✓</span></div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(15, 23, 42, 0.06)", display: "flex", justifyContent: "flex-end", backgroundColor: "#fafbfc" }}>
                <button onClick={() => setShowMediaModal(false)} style={{ padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "20px", fontWeight: "600", cursor: "pointer" }}>Hoàn thành</button>
              </div>
            </div>
          </div>
        )}
```

**Step 3: Thêm import axios vào đầu file `BatchStudioPage.jsx`**

Thêm import ở đầu file:
```javascript
import axios from "axios";
```

**Step 4: Commit**

```bash
git add frontend/src/components/BatchStudioPage.jsx
git commit -m "feat(batch): render Theme dropdown, Media section, and MediaModal in BatchStudioPage"
```

---

## Task 3: Test and verification

**Step 1: Test theme selection**

1. Chọn theme "Rikkei Academic".
2. Bấm chạy batch và verify project được tạo với theme `rikkei`.

**Step 2: Test media upload & selection**

1. Mở modal chọn ảnh, tải lên một ảnh bất kỳ.
2. Chọn thêm một vài ảnh từ kho ảnh mẫu (Stock).
3. Verify ảnh đã chọn xuất hiện trên danh sách thumbnail.
4. Bấm chạy batch và verify các ảnh được gửi đầy đủ.

**Step 3: Commit**

```bash
git commit -a -m "feat(batch): fully verified theme and shared media selection for batch production"
```
