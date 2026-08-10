import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FIELD_LABELS = {
  GEMINI_API_KEY: {
    label: "Gemini API Key",
    placeholder: "AIza...",
    hint: "Lấy tại: https://aistudio.google.com/app/apikey",
    icon: "🤖"
  },
  VBEE_API_KEY: {
    label: "VBEE API Key",
    placeholder: "eyJhbGciOi...",
    hint: "Lấy tại: https://vbee.vn (Text-to-Speech tiếng Việt)",
    icon: "🎙️"
  },
  VBEE_APP_ID: {
    label: "VBEE App ID",
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    hint: "App ID từ dashboard VBEE của bạn",
    icon: "🆔"
  }
};

export function SettingsPage({ onBack }) {
  const [status, setStatus] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showSecrets, setShowSecrets] = useState({});

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch(`${API_BASE}/api/config/status`);
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      setStatus({ configured: false });
    }
  }

  function handleChange(key, value) {
    setFormValues(prev => ({ ...prev, [key]: value }));
  }

  function toggleSecret(key) {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      // Only send non-empty values
      const payload = {};
      for (const [k, v] of Object.entries(formValues)) {
        if (v && v.trim()) payload[k] = v.trim();
      }

      const res = await fetch(`${API_BASE}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: "success", text: "✅ Đã lưu cấu hình thành công! Các API key đã được kích hoạt." });
        setFormValues({});
        fetchStatus();
      } else {
        setMessage({ type: "error", text: `❌ Lỗi: ${data.error || "Không thể lưu cấu hình"}` });
      }
    } catch (err) {
      setMessage({ type: "error", text: `❌ Lỗi kết nối: ${err.message}` });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        {onBack && (
          <button style={styles.backBtn} onClick={onBack}>
            ← Quay lại
          </button>
        )}
        <div>
          <h1 style={styles.title}>⚙️ Cài đặt API</h1>
          <p style={styles.subtitle}>Cấu hình các API key để sử dụng đầy đủ tính năng</p>
        </div>
      </div>

      {/* Status banner */}
      {status && (
        <div style={status.configured ? styles.bannerOk : styles.bannerWarn}>
          {status.configured ? (
            <span>✅ App đã được cấu hình. Tất cả tính năng sẵn sàng.</span>
          ) : (
            <span>⚠️ Chưa có API key nào được cấu hình. Vui lòng nhập ít nhất Gemini API Key để bắt đầu.</span>
          )}
          <div style={styles.statusBadges}>
            <span style={status.hasGemini ? styles.badgeOk : styles.badgeMissing}>
              {status.hasGemini ? "✓" : "✗"} Gemini
            </span>
            <span style={status.hasVbee ? styles.badgeOk : styles.badgeMissing}>
              {status.hasVbee ? "✓" : "✗"} VBEE TTS
            </span>
            <span style={status.hasCloudinary ? styles.badgeOk : styles.badgeMissing}>
              {status.hasCloudinary ? "✓" : "✗"} Cloudinary
            </span>
            <span style={status.hasOmnivoice ? styles.badgeOk : styles.badgeMissing}>
              {status.hasOmnivoice ? "✓" : "✗"} OmniVoice (Offline)
            </span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} style={styles.form}>
        {/* Gemini Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🤖 Google Gemini AI</h2>
          <p style={styles.sectionDesc}>
            Dùng để sinh nội dung video, viết kịch bản. Model mặc định là <strong>gemini-3.1-flash-lite</strong>.
          </p>
          {["GEMINI_API_KEY"].map(key => (
            <FieldInput
              key={key}
              fieldKey={key}
              meta={FIELD_LABELS[key]}
              value={formValues[key] ?? ""}
              onChange={handleChange}
              showSecret={showSecrets[key]}
              onToggleSecret={toggleSecret}
            />
          ))}
        </div>

        {/* VBEE Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🎙️ VBEE Text-to-Speech</h2>
          <p style={styles.sectionDesc}>Giọng đọc tiếng Việt tự nhiên cho video</p>
          {["VBEE_API_KEY", "VBEE_APP_ID"].map(key => (
            <FieldInput
              key={key}
              fieldKey={key}
              meta={FIELD_LABELS[key]}
              value={formValues[key] ?? ""}
              onChange={handleChange}
              showSecret={showSecrets[key]}
              onToggleSecret={toggleSecret}
            />
          ))}
        </div>

        {/* Message */}
        {message && (
          <div style={message.type === "success" ? styles.msgSuccess : styles.msgError}>
            {message.text}
          </div>
        )}

        {/* Save button */}
        <button type="submit" disabled={saving} style={styles.saveBtn}>
          {saving ? "⏳ Đang lưu..." : "💾 Lưu cấu hình"}
        </button>

        <p style={styles.note}>
          🔒 API keys được lưu cục bộ trên máy tính của bạn, không gửi đến bất kỳ server nào của chúng tôi.
        </p>
      </form>
    </div>
  );
}

function FieldInput({ fieldKey, meta, value, onChange, showSecret, onToggleSecret }) {
  const isSecret = meta.secret || fieldKey.toLowerCase().includes("secret") || fieldKey.toLowerCase().includes("api_key");
  const inputType = isSecret && !showSecret ? "password" : "text";

  return (
    <div style={styles.field}>
      <label style={styles.label}>
        <span style={styles.labelIcon}>{meta.icon}</span>
        <span>{meta.label}</span>
      </label>
      <div style={styles.inputWrap}>
        <input
          type={inputType}
          placeholder={value ? "••••••••" : meta.placeholder}
          value={value}
          onChange={e => onChange(fieldKey, e.target.value)}
          style={styles.input}
          autoComplete="off"
        />
        {isSecret && (
          <button
            type="button"
            style={styles.eyeBtn}
            onClick={() => onToggleSecret(fieldKey)}
            title={showSecret ? "Ẩn" : "Hiện"}
          >
            {showSecret ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      <p style={styles.hint}>{meta.hint}</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "32px",
    fontFamily: "'Space Grotesk', 'Inter', sans-serif",
    color: "#0f172a"
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "32px"
  },
  backBtn: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    color: "#475569",
    padding: "8px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    whiteSpace: "nowrap",
    flexShrink: 0,
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    margin: 0,
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  subtitle: {
    margin: "4px 0 0",
    color: "#475569",
    fontSize: "14px"
  },
  bannerOk: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: "12px",
    padding: "16px 20px",
    marginBottom: "28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    color: "#065f46",
    fontSize: "14px"
  },
  bannerWarn: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "12px",
    padding: "16px 20px",
    marginBottom: "28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    color: "#92400e",
    fontSize: "14px"
  },
  statusBadges: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },
  badgeOk: {
    background: "#d1fae5",
    color: "#065f46",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600"
  },
  badgeMissing: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600"
  },
  form: {
    maxWidth: "680px"
  },
  section: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)"
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    margin: "0 0 4px",
    color: "#0f172a"
  },
  sectionDesc: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 20px"
  },
  field: {
    marginBottom: "20px"
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155"
  },
  labelIcon: {
    fontSize: "16px"
  },
  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  input: {
    width: "100%",
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "11px 44px 11px 14px",
    color: "#0f172a",
    fontSize: "14px",
    fontFamily: "monospace",
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.2s"
  },
  eyeBtn: {
    position: "absolute",
    right: "10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px",
    color: "#64748b"
  },
  hint: {
    margin: "6px 0 0",
    fontSize: "12px",
    color: "#64748b"
  },
  msgSuccess: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: "10px",
    padding: "14px 18px",
    color: "#065f46",
    marginBottom: "20px",
    fontSize: "14px"
  },
  msgError: {
    background: "#fee2e2",
    border: "1px solid #fca5a5",
    borderRadius: "10px",
    padding: "14px 18px",
    color: "#991b1b",
    marginBottom: "20px",
    fontSize: "14px"
  },
  saveBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    border: "none",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "16px",
    transition: "opacity 0.2s"
  },
  note: {
    fontSize: "12px",
    color: "#64748b",
    textAlign: "center",
    margin: 0
  }
};

