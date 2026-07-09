const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const db = require("./services/db");
const phoneme = require("./services/phoneme");

async function runTest() {
  console.log("=== BẮT ĐẦU KIỂM TRA PHONEME AGENT ===");
  
  try {
    // 1. Khởi tạo Database và chạy Migrations mới
    console.log("\n1. Khởi tạo cơ sở dữ liệu và dọn dẹp...");
    await db.initDb();
    console.log("Đã khởi tạo xong cơ sở dữ liệu mới.");

    // 2. Chạy thử văn bản mẫu qua Phoneme Agent
    const sampleText = "Hôm nay chúng ta học React và Docker để xây dựng API. Không ai phủ nhận sức mạnh của AI. Sau đó triển khai lên Vercel.";
    console.log(`\n2. Văn bản mẫu đầu vào:\n"${sampleText}"`);
    
    console.log("\nĐang gọi Phoneme Agent...");
    const optimizedText = await phoneme.optimizeTextForPhonemes(sampleText);
    console.log(`\nKết quả tối ưu hóa (tts_script):\n"${optimizedText}"`);

    // 3. Kiểm tra xem các thuật ngữ mới (như Vercel) có được lưu vào cache của Database hay không
    console.log("\n3. Kiểm tra Cache Database...");
    const cachedEntry = await db.getPhonemeFromCache("vercel");
    if (cachedEntry) {
      console.log(` ✅ Đạt: Tìm thấy thuật ngữ "vercel" trong cache DB.`);
      console.log(`  - Từ gốc: "${cachedEntry.term}"`);
      console.log(`  - Âm vị CMU: "${cachedEntry.phoneme}"`);
      console.log(`  - Nguồn sinh: "${cachedEntry.source}" (g2p = Gemini Fallback)`);
      console.log(`  - Độ tin cậy (Confidence): ${cachedEntry.confidence}`);
      console.log(`  - Cần duyệt (Review Required): ${cachedEntry.review_required}`);
    } else {
      console.log(` ❌ Lỗi: Không tìm thấy thuật ngữ "vercel" trong cache DB.`);
    }

    // 4. Kiểm tra các phiên âm quan trọng trong kết quả
    const assertions = [
      { term: "React", pattern: /\[R IY\d AE\d K T\]/i },
      { term: "Docker", pattern: /\[D AA\d K ER\d\]/i },
      { term: "API", pattern: /\[EY\d P IY\d AY\d\]/i },
      { term: "Vercel", pattern: /\[V ER\d S EH\d L\]/i },
      { term: "AI", pattern: /\[EY\d AY\d\]/ } // AI must be replaced
    ];

    console.log("\n4. Chạy các khẳng định kiểm tra (Assertions)...");
    let allPassed = true;
    for (const test of assertions) {
      const passed = test.pattern.test(optimizedText);
      if (passed) {
        console.log(` ✅ Đạt: Thẻ âm vị khớp mẫu cho từ "${test.term}"`);
      } else {
        console.log(` ❌ Lỗi: Thẻ âm vị KHÔNG khớp mẫu cho từ "${test.term}" (kỳ vọng khớp: ${test.pattern})`);
        allPassed = false;
      }
    }

    // Kiểm tra riêng xem từ "ai" viết thường có bị thay thế sai không
    if (optimizedText.includes("Không ai")) {
      console.log(" ✅ Đạt: Từ 'ai' (viết thường, pronoun tiếng Việt) KHÔNG bị thay thế sai.");
    } else {
      console.log(" ❌ Lỗi: Từ 'ai' (viết thường, pronoun tiếng Việt) đã bị thay thế sai thành âm vị tiếng Anh!");
      allPassed = false;
    }

    // 5. Kiểm tra tính nguyên vẹn của văn bản tiếng Việt
    console.log("\n5. Kiểm tra tính nguyên vẹn của văn bản tiếng Việt...");
    const expectedCleanText = optimizedText
      .replace(/\[[^\]]+\]/g, "---")
      .replace(/\s+/g, " ");
    
    const originalWithPlaceholders = sampleText
      .replace(/React/g, "---")
      .replace(/Docker/g, "---")
      .replace(/API/g, "---")
      .replace(/Vercel/g, "---")
      .replace(/AI/g, "---")
      .replace(/\s+/g, " ");

    if (expectedCleanText === originalWithPlaceholders) {
      console.log(" ✅ Đạt: Chữ tiếng Việt, dấu câu và khoảng trắng xung quanh được bảo lưu nguyên vẹn 100%.");
    } else {
      console.log(" ❌ Lỗi: Chữ tiếng Việt hoặc dấu câu bị biến đổi!");
      console.log(`  - Kết quả nhận được: "${expectedCleanText}"`);
      console.log(`  - Kết quả kỳ vọng:   "${originalWithPlaceholders}"`);
      allPassed = false;
    }

    if (allPassed) {
      console.log("\n🎉 TẤT CẢ KIỂM TRA PHONEME AGENT ĐỀU THÀNH CÔNG!");
    } else {
      console.log("\n⚠️ CÓ MỘT SỐ LỖI KIỂM TRA, VUI LÒNG KIỂM TRA LẠI LOGS.");
    }
  } catch (err) {
    console.error("\nGặp lỗi trong quá trình chạy kiểm tra:", err);
  } finally {
    console.log("\nKết thúc kiểm tra. Thoát...");
    process.exit(0);
  }
}

runTest();
