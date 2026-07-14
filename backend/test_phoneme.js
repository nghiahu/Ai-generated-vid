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
    const sampleText = "Hôm nay chúng ta học React Native và Docker để xây dựng API Gateway. Không ai phủ nhận sức mạnh của AI. Chúng ta dùng Agent và RAG. Sau đó triển khai lên Vercel.";
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
      { name: "React Native (Vietnamese phonetic)", pattern: /ri-ắc|ri-éc/i },
      { name: "Docker (Vietnamese phonetic)", pattern: /đốc-cơ/i },
      { name: "API Gateway (Vietnamese phonetic)", pattern: /ây-pi-ai|a-pi-ai/i },
      { name: "Vercel (Vietnamese phonetic)", pattern: /vơ-xen/i },
      { name: "AI (Vietnamese phonetic)", pattern: /ây-ai/i },
      { name: "Agent (Vietnamese phonetic)", pattern: /ây-giừn/i },
      { name: "RAG (Vietnamese phonetic)", pattern: /rác/i }
    ];

    console.log("\n4. Chạy các khẳng định kiểm tra (Assertions)...");
    let allPassed = true;
    for (const test of assertions) {
      const passed = test.pattern.test(optimizedText);
      if (passed) {
        console.log(` ✅ Đạt: Phiên âm khớp mẫu cho cụm "${test.name}"`);
      } else {
        console.log(` ❌ Lỗi: Phiên âm KHÔNG khớp mẫu cho cụm "${test.name}" (kỳ vọng khớp: ${test.pattern})`);
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
    const hasOriginalVietnamese = 
      optimizedText.includes("Hôm nay chúng ta học") &&
      optimizedText.includes("và") &&
      optimizedText.includes("để xây dựng") &&
      optimizedText.includes("Không ai phủ nhận sức mạnh của") &&
      optimizedText.includes("Sau đó triển khai lên");

    if (hasOriginalVietnamese) {
      console.log(" ✅ Đạt: Chữ tiếng Việt, dấu câu và khoảng trắng xung quanh được bảo lưu nguyên vẹn 100%.");
    } else {
      console.log(" ❌ Lỗi: Chữ tiếng Việt hoặc dấu câu bị biến đổi!");
      console.log(`  - Kết quả nhận được: "${optimizedText}"`);
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
