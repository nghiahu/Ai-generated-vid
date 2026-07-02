import React from "react";

export const SidebarConfig = ({ config = {}, onChange }) => {
  const handleConfigChange = (field, value) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  const handleWatermarkChange = (field, value) => {
    onChange({
      ...config,
      watermark: {
        ...config.watermark,
        [field]: value
      }
    });
  };

  const handleEndingChange = (field, value) => {
    onChange({
      ...config,
      ending: {
        ...config.ending,
        [field]: value
      }
    });
  };

  const currentLength = config.length
    ? (config.length.includes("Short") ? "Short" : config.length.includes("Medium") ? "Medium" : "Long")
    : "Short";

  return (
    <div className="custom-scrollbar" style={{
      width: "100%",
      backgroundColor: "#ffffff",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      padding: "30px",
      overflowY: "auto",
      boxSizing: "border-box"
    }}>
      {/* Header matching Stitch */}
      <div style={{ marginBottom: "25px", borderBottom: "2px solid #000000", paddingBottom: "15px" }}>
        <h2 style={{ fontSize: "24px", fontFamily: "Space Grotesk", fontWeight: "bold", color: "#000000", textTransform: "uppercase", letterSpacing: "-0.02em" }}>
          Video setup
        </h2>
        <p style={{ fontSize: "13px", fontFamily: "Inter", color: "#555555", marginTop: "4px" }}>
          Configure output parameters before generation
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>

        {/* Video Length Selector (Stitch styled button group) */}
        <div>
          <label className="form-label-mono">Video Length</label>
          <div className="border-strict" style={{ display: "flex", overflow: "hidden", backgroundColor: "#ffffff" }}>
            <button
              type="button"
              style={{
                flex: 1,
                padding: "12px 0",
                border: "none",
                borderRight: "2px solid #000000",
                borderRadius: 0,
                boxShadow: "none",
                fontSize: "13px",
                fontWeight: currentLength === "Short" ? "700" : "500",
                backgroundColor: currentLength === "Short" ? "#000000" : "#ffffff",
                color: currentLength === "Short" ? "#ffffff" : "#000000",
                transform: "none",
                cursor: "pointer"
              }}
              onClick={() => handleConfigChange("length", "Short (~60s)")}
            >
              Short (&lt;1m)
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: "12px 0",
                border: "none",
                borderRight: "2px solid #000000",
                borderRadius: 0,
                boxShadow: "none",
                fontSize: "13px",
                fontWeight: currentLength === "Medium" ? "700" : "500",
                backgroundColor: currentLength === "Medium" ? "#000000" : "#ffffff",
                color: currentLength === "Medium" ? "#ffffff" : "#000000",
                transform: "none",
                cursor: "pointer"
              }}
              onClick={() => handleConfigChange("length", "Medium (~2m)")}
            >
              Medium (1-3m)
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: "12px 0",
                border: "none",
                borderRadius: 0,
                boxShadow: "none",
                fontSize: "13px",
                fontWeight: currentLength === "Long" ? "700" : "500",
                backgroundColor: currentLength === "Long" ? "#000000" : "#ffffff",
                color: currentLength === "Long" ? "#ffffff" : "#000000",
                transform: "none",
                cursor: "pointer"
              }}
              onClick={() => handleConfigChange("length", "Long (~5m)")}
            >
              Long (&gt;3m)
            </button>
          </div>
        </div>

        {/* Language select */}
        <div>
          <label className="form-label-mono">Language</label>
          <div style={{ position: "relative" }}>
            <select
              className="form-input-mono"
              value={config.language || "Vietnamese"}
              onChange={(e) => handleConfigChange("language", e.target.value)}
              style={{ cursor: "pointer" }}
            >
              <option value="Vietnamese">Vietnamese</option>
              <option value="English (US)">English (US)</option>
            </select>
          </div>
        </div>

        {/* AI Voice selector */}
        <div>
          <label className="form-label-mono">AI Voice</label>
          <div style={{ position: "relative", marginBottom: "8px" }}>
            <select
              className="form-input-mono"
              value={config.voice || "rachel"}
              onChange={(e) => handleConfigChange("voice", e.target.value)}
              style={{ cursor: "pointer" }}
            >
              <option value="omnivoice_female">OmniVoice Nữ - Đọc Tiếng Việt (Local Offline)</option>
              <option value="omnivoice_male">OmniVoice Nam - Đọc Tiếng Việt (Local Offline)</option>
              <option value="omnivoice_whisper">OmniVoice Thì thầm - Đọc Tiếng Việt (Local Offline)</option>
              <option value="omnivoice_british">OmniVoice Nữ - Giọng Anh-Anh (Local Offline)</option>
              <option value="omnivoice_anhquy">OmniVoice - Giọng Anh Quý (Offline Clone)</option>
              <option value="microsoft_hoaimy">Microsoft Hoài My (Free, Fluent Female)</option>
              <option value="microsoft_namminh">Microsoft Nam Minh (Free, Fluent Male)</option>
              <option value="rachel">Hoai My (Rachel - English Accent)</option>
              <option value="antonio">Tuan Dung (Antoni - English Accent)</option>
              <option value="bella">Bella (English Accent)</option>
              <option value="domic">Domic (English Accent)</option>
              <option value="custom">-- Giọng đọc tự chọn (Nhập ID) --</option>
            </select>
          </div>
          {config.voice === "custom" && (
            <div style={{ marginTop: "10px" }}>
              <label className="form-label-mono" style={{ fontSize: "11px", color: "#555555", textTransform: "uppercase" }}>
                Custom ElevenLabs Voice ID
              </label>
              <input
                type="text"
                className="form-input-mono"
                value={config.customVoiceId || ""}
                onChange={(e) => handleConfigChange("customVoiceId", e.target.value)}
                placeholder="Ví dụ: pNInz6obpgq5paqqJ155..."
                style={{ fontSize: "12px", padding: "8px 12px" }}
              />
              <span style={{ fontSize: "11px", color: "#666666", display: "block", marginTop: "4px", lineHeight: "1.4" }}>
                Mẹo: Hãy thêm giọng đọc tiếng Việt bạn thích từ ElevenLabs Voice Library vào tài khoản của bạn, sao chép Voice ID của nó và dán vào đây.
              </span>
            </div>
          )}
        </div>

        {/* BGM select */}
        <div>
          <label className="form-label-mono">Background Music (BGM)</label>
          <div style={{ position: "relative" }}>
            <select
              className="form-input-mono"
              value={config.backgroundMusic || "Chill Lofi Beats"}
              onChange={(e) => handleConfigChange("backgroundMusic", e.target.value)}
              style={{ cursor: "pointer" }}
            >
              <option value="Chill Lofi Beats">Chill Lofi Beats</option>
              <option value="Tech Ambient">Tech Ambient</option>
              <option value="Energy Beats">Energy Beats</option>
              <option value="None">None (No Background Music)</option>
            </select>
          </div>
        </div>

        {/* Video Theme select */}
        <div>
          <label className="form-label-mono">Video Theme</label>
          <div style={{ position: "relative" }}>
            <select
              className="form-input-mono"
              value={config.videoTheme || "glassmorphism"}
              onChange={(e) => handleConfigChange("videoTheme", e.target.value)}
              style={{ cursor: "pointer" }}
            >
              <option value="glassmorphism">Vibrant Glassmorphism (Premium)</option>
              <option value="brutalist">Brutalist Neo-Pop (Dynamic)</option>
              <option value="minimalist">Minimalist Clean (Elegant)</option>
              <option value="cyberpunk">Cyberpunk Neon</option>
            </select>
          </div>
        </div>

        {/* Watermark Section */}
        <div className="border-strict" style={{ padding: "20px", backgroundColor: "#ffffff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <label className="form-label-mono" style={{ marginBottom: 0 }}>Watermark</label>
            <input
              type="checkbox"
              style={{ width: "20px", height: "20px", accentColor: "#000000", cursor: "pointer" }}
              checked={config.watermark?.enabled ?? true}
              onChange={(e) => handleWatermarkChange("enabled", e.target.checked)}
            />
          </div>

          {(config.watermark?.enabled ?? true) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {/* Logo Upload Box */}
              <div className="border-strict" style={{ borderStyle: "dashed", padding: "18px", textAlign: "center", cursor: "pointer", backgroundColor: "#fafafa" }}>
                <span style={{ fontSize: "20px", display: "block" }}>📁</span>
                <span style={{ fontSize: "13px", fontWeight: "bold", fontFamily: "Space Grotesk", display: "block", marginTop: "4px" }}>Upload Logo</span>
                <span style={{ fontSize: "11px", color: "#666666" }}>PNG, SVG (Max 2MB)</span>
              </div>

              {/* Text Watermark Input */}
              <div>
                <label className="form-label-mono" style={{ fontSize: "11px", marginBottom: "4px" }}>Chữ Watermark</label>
                <input
                  className="form-input-mono"
                  type="text"
                  value={config.watermark?.text || ""}
                  onChange={(e) => handleWatermarkChange("text", e.target.value)}
                  placeholder="e.g. yupclip.com"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label-mono" style={{ fontSize: "11px" }}>Position</label>
                  <select
                    className="form-input-mono"
                    value={config.watermark?.position || "top-right"}
                    onChange={(e) => handleWatermarkChange("position", e.target.value)}
                    style={{ padding: "8px", fontSize: "12px" }}
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>
                <div>
                  <label className="form-label-mono" style={{ fontSize: "11px" }}>Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.watermark?.opacity || 80}
                    onChange={(e) => handleWatermarkChange("opacity", parseInt(e.target.value))}
                    style={{ width: "100%", accentColor: "#000000", marginTop: "8px", cursor: "pointer" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ending Scene Section */}
        <div className="border-strict" style={{ padding: "20px", backgroundColor: "#ffffff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <label className="form-label-mono" style={{ marginBottom: 0 }}>Ending Card</label>
            <input
              type="checkbox"
              style={{ width: "20px", height: "20px", accentColor: "#000000", cursor: "pointer" }}
              checked={config.ending?.enabled ?? true}
              onChange={(e) => handleEndingChange("enabled", e.target.checked)}
            />
          </div>

          {(config.ending?.enabled ?? true) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label className="form-label-mono" style={{ fontSize: "11px" }}>Call to Action</label>
                <input
                  className="form-input-mono"
                  type="text"
                  value={config.ending?.logoText || ""}
                  onChange={(e) => handleEndingChange("logoText", e.target.value)}
                  placeholder="e.g. Follow for more daily tips"
                />
              </div>
              <div>
                <label className="form-label-mono" style={{ fontSize: "11px" }}>Website / Link</label>
                <input
                  className="form-input-mono"
                  type="text"
                  value={config.ending?.website || ""}
                  onChange={(e) => handleEndingChange("website", e.target.value)}
                  placeholder="hyperframes.ai"
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
