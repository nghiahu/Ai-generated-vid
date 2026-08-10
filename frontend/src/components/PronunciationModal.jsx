import React, { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function PronunciationModal({ onClose }) {
  const [term, setTerm] = useState("");
  const [phoneme, setPhoneme] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    try {
      const res = await fetch(`${API_BASE}/api/phonemes`);
      const data = await res.json();
      if (res.ok) {
        setList(data);
      }
    } catch (err) {
      console.error("Failed to fetch custom phonemes:", err.message);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!term.trim() || !phoneme.trim()) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/phonemes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: term.trim(),
          phoneme: phoneme.trim()
        })
      });

      if (res.ok) {
        setTerm("");
        setPhoneme("");
        setMessage({ type: "success", text: "✅ Đã thêm từ thành công!" });
        fetchList();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: `❌ Lỗi: ${data.error || "Không thể thêm từ"}` });
      }
    } catch (err) {
      setMessage({ type: "error", text: `❌ Lỗi kết nối: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(deleteTerm) {
    try {
      const res = await fetch(`${API_BASE}/api/phonemes/${encodeURIComponent(deleteTerm)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchList();
      }
    } catch (err) {
      console.error("Failed to delete custom phoneme:", err.message);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Cách đọc</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Info Banner */}
        <div style={styles.infoBanner}>
          <span style={styles.infoIcon}>💡</span>
          <span style={styles.infoText}>
            Hệ thống sẽ phát âm các từ theo cách đọc mà bạn đã thiết lập.
          </span>
        </div>

        {/* Add Form */}
        <form onSubmit={handleAdd} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Từ viết tắt/từ nước ngoài</label>
            <div style={styles.inputContainer}>
              <input
                type="text"
                maxLength={50}
                placeholder="QL4H, H2T, PSG, pronunciation"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                style={styles.input}
                disabled={loading}
              />
              <span style={styles.charCounter}>{term.length}/50</span>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Cách đọc</label>
            <div style={styles.inputContainer}>
              <input
                type="text"
                maxLength={100}
                placeholder="Quốc lộ bốn hát, hoa học trò, pi-ét-x-gi, p-rô-năn-xi-ây-xừn"
                value={phoneme}
                onChange={(e) => setPhoneme(e.target.value)}
                style={styles.input}
                disabled={loading}
              />
              <span style={styles.charCounter}>{phoneme.length}/100</span>
            </div>
          </div>

          {message && (
            <div style={message.type === "success" ? styles.msgSuccess : styles.msgError}>
              {message.text}
            </div>
          )}

          <div style={styles.submitContainer}>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? "Đang thêm..." : "Thêm từ"}
            </button>
          </div>
        </form>

        {/* Custom Terms List */}
        <div style={styles.listSection}>
          <h3 style={styles.listTitle}>Danh sách từ tùy chỉnh ({list.length})</h3>
          {list.length === 0 ? (
            <div style={styles.emptyText}>Chưa có từ viết tắt tùy chỉnh nào được cấu hình.</div>
          ) : (
            <div style={styles.listContainer}>
              {list.map((item) => (
                <div key={item.id} style={styles.listItem}>
                  <div style={styles.listItemText}>
                    <strong style={styles.termName}>{item.display_term || item.term}</strong>
                    <span style={styles.arrow}>➔</span>
                    <span style={styles.phonemeVal}>{item.phoneme}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(item.term)}
                    style={styles.deleteBtn}
                    title="Xóa từ này"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    backdropFilter: "blur(8px)",
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  modal: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    width: "480px",
    maxWidth: "90%",
    padding: "24px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "12px"
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s"
  },
  infoBanner: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "10px",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  infoIcon: {
    fontSize: "16px"
  },
  infoText: {
    fontSize: "12px",
    color: "#1e3a8a",
    lineHeight: "1.4"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569"
  },
  inputContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  input: {
    width: "100%",
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "10px 60px 10px 12px",
    fontSize: "13px",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s"
  },
  charCounter: {
    position: "absolute",
    right: "12px",
    fontSize: "11px",
    color: "#94a3b8"
  },
  submitContainer: {
    display: "flex",
    justifyContent: "flex-end"
  },
  submitBtn: {
    padding: "10px 24px",
    background: "#facc15",
    color: "#0f172a",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "opacity 0.2s",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
  },
  msgSuccess: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: "8px",
    padding: "8px 12px",
    color: "#065f46",
    fontSize: "12px"
  },
  msgError: {
    background: "#fee2e2",
    border: "1px solid #fca5a5",
    borderRadius: "8px",
    padding: "8px 12px",
    color: "#991b1b",
    fontSize: "12px"
  },
  listSection: {
    borderTop: "1px solid #e2e8f0",
    paddingTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  listTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#334155",
    margin: 0
  },
  emptyText: {
    fontSize: "12px",
    color: "#64748b",
    textAlign: "center",
    padding: "16px 0"
  },
  listContainer: {
    maxHeight: "150px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    paddingRight: "4px"
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px"
  },
  listItemText: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#334155"
  },
  termName: {
    fontWeight: "600",
    color: "#1e293b"
  },
  arrow: {
    color: "#94a3b8"
  },
  phonemeVal: {
    color: "#475569"
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s"
  }
};
