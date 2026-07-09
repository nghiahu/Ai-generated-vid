const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("./db");

const cmuDict = new Map();

// Load CMU Pronouncing Dictionary from resources
function loadCmuDict() {
  const filePath = path.join(__dirname, "../resources/cmudict.dict");
  if (!fs.existsSync(filePath)) {
    console.warn("[Phoneme Engine] File cmudict.dict không tồn tại tại: " + filePath);
    return;
  }
  
  console.log("[Phoneme Engine] Đang nạp từ điển CMU vào bộ nhớ...");
  const start = Date.now();
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const firstSpace = trimmed.indexOf(" ");
    if (firstSpace === -1) continue;
    
    let word = trimmed.substring(0, firstSpace).toLowerCase();
    const phonemes = trimmed.substring(firstSpace + 1).trim();
    
    // Remove variants like (2), (3) from terms
    word = word.replace(/\(\d+\)$/, "");
    
    // Set default pronunciation (first one encountered)
    if (!cmuDict.has(word)) {
      cmuDict.set(word, phonemes);
    }
  }
  console.log(`[Phoneme Engine] Đã nạp thành công ${cmuDict.size} từ duy nhất trong ${Date.now() - start}ms.`);
}

loadCmuDict();

const VIETNAMESE_STOP_WORDS = new Set([
  'ai', 'an', 'anh', 'ao', 'ba', 'ban', 'bao', 'bay', 'be', 'ben', 'beo', 'bi', 'bia', 'bien', 'biet', 'binh', 'bo', 'bon', 'bong', 'bot', 'boi', 'buom', 'buon', 'buoc', 'ca', 'cac', 'cai', 'cam', 'can', 'cap', 'cat', 'cau', 'cay', 'cha', 'chai', 'cham', 'chan', 'chao', 'chap', 'chat', 'chau', 'chay', 'che', 'chem', 'chen', 'cheo', 'chhe', 'chi', 'chia', 'chieu', 'chim', 'chin', 'chinh', 'chip', 'cho', 'chon', 'chong', 'choi', 'chu', 'chua', 'chuc', 'chum', 'chung', 'chuon', 'chuot', 'chuy', 'chuyen', 'co', 'coc', 'con', 'cong', 'coi', 'cu', 'cua', 'cuc', 'cui', 'cung', 'cuoi', 'cuon', 'cuoc', 'da', 'dac', 'dai', 'dam', 'dan', 'dang', 'dao', 'dap', 'dat', 'dau', 'day', 'de', 'dem', 'den', 'deo', 'dep', 'deu', 'di', 'dia', 'dich', 'diem', 'dien', 'diep', 'dieu', 'dim', 'dinh', 'do', 'doc', 'doi', 'don', 'dong', 'dot', 'du', 'dua', 'duc', 'dui', 'dung', 'duoi', 'duoc', 'duong', 'duy', 'duyet', 'em', 'en', 'e', 'eo', 'ga', 'gac', 'gai', 'gan', 'gap', 'gat', 'gau', 'gay', 'ghe', 'ghep', 'ghi', 'ghia', 'gia', 'giac', 'giam', 'gian', 'giao', 'giap', 'giay', 'gieo', 'gio', 'gioi', 'giot', 'giu', 'giua', 'go', 'goc', 'goi', 'gom', 'gon', 'guong', 'ha', 'hac', 'hai', 'ham', 'han', 'hang', 'hao', 'hap', 'hat', 'hau', 'hay', 'he', 'hem', 'hen', 'heo', 'het', 'hieu', 'hiep', 'hien', 'hieu', 'him', 'hinh', 'ho', 'hoa', 'hoac', 'hoan', 'hoang', 'hoap', 'hoat', 'hoc', 'hoi', 'hom', 'hon', 'hong', 'hop', 'hot', 'hu', 'hua', 'hue', 'hung', 'huong', 'huu', 'huy', 'huyen', 'it', 'ke', 'kem', 'ken', 'keo', 'ket', 'keu', 'kha', 'khac', 'khai', 'kham', 'khan', 'khang', 'khao', 'khap', 'khat', 'khau', 'khay', 'khe', 'khep', 'khi', 'khia', 'khieu', 'khim', 'khin', 'khinh', 'kho', 'khoa', 'khoan', 'khoang', 'khoap', 'khoat', 'khoe', 'khoi', 'khom', 'khon', 'khong', 'khop', 'khot', 'khu', 'khua', 'khue', 'khung', 'khuong', 'khuyn', 'khuyt', 'khuyen', 'ki', 'kia', 'kich', 'kiem', 'kien', 'kiep', 'kieu', 'kim', 'kin', 'kinh', 'kip', 'la', 'lac', 'lai', 'lam', 'lan', 'lang', 'lao', 'lap', 'lat', 'lau', 'lay', 'le', 'lem', 'len', 'leo', 'lep', 'let', 'leu', 'li', 'lia', 'lich', 'liem', 'lien', 'liep', 'lieu', 'lim', 'linh', 'lip', 'lo', 'loa', 'loai', 'loan', 'loang', 'loap', 'loat', 'loc', 'loi', 'lom', 'lon', 'long', 'lop', 'lot', 'lu', 'lua', 'luc', 'lui', 'luat', 'luon', 'luong', 'luot', 'luu', 'ma', 'mac', 'mai', 'mam', 'man', 'mang', 'mao', 'map', 'mat', 'mau', 'may', 'me', 'mem', 'men', 'meo', 'met', 'meu', 'mi', 'mia', 'mich', 'mien', 'mieu', 'mim', 'minh', 'mit', 'mo', 'moa', 'moai', 'moan', 'moang', 'moap', 'moat', 'moc', 'moi', 'mom', 'mon', 'mong', 'mop', 'mot', 'mu', 'mua', 'muc', 'mui', 'muon', 'muong', 'muot', 'muu', 'my', 'na', 'nac', 'nai', 'nam', 'nan', 'nang', 'nao', 'nap', 'nat', 'nau', 'nay', 'ne', 'nem', 'nen', 'neo', 'nep', 'net', 'neu', 'ngga', 'nghe', 'nghi', 'nghia', 'ngo', 'ngoa', 'ngoai', 'ngoan', 'ngoang', 'ngoap', 'ngoat', 'ngoc', 'ngoi', 'ngom', 'ngon', 'ngong', 'ngop', 'ngot', 'ngu', 'ngua', 'nguc', 'ngui', 'nguon', 'nguong', 'nguot', 'nguy', 'nguyen', 'nha', 'nhac', 'nhai', 'nham', 'nhan', 'nhang', 'nhao', 'nhap', 'nhat', 'nhau', 'nhe', 'nhem', 'nhen', 'nheo', 'nhep', 'nhet', 'nheu', 'nhi', 'nhia', 'nhich', 'nhiem', 'nhien', 'nhiep', 'nhieu', 'nhim', 'nhin', 'nhinh', 'nhip', 'nho', 'nhoa', 'nhoai', 'nhoan', 'nhoang', 'nhoap', 'nhoat', 'nhoc', 'nhoi', 'nhom', 'nhon', 'nhong', 'nhop', 'nhot', 'nhu', 'nhua', 'nhuc', 'nhui', 'nhuon', 'nhuong', 'nhuot', 'nhuy', 'nhuyen', 'ni', 'nia', 'nich', 'niem', 'nien', 'niep', 'nieu', 'nim', 'ninh', 'nip', 'no', 'noa', 'noai', 'noan', 'noang', 'noap', 'noat', 'noc', 'noi', 'nom', 'non', 'nong', 'nop', 'not', 'nu', 'nua', 'nuc', 'nui', 'nuon', 'nuong', 'nuot', 'nuu', 'ny', 'o', 'oa', 'oai', 'oan', 'oang', 'oap', 'oat', 'oc', 'oi', 'om', 'on', 'ong', 'op', 'ot', 'pa', 'pe', 'pi', 'po', 'pu', 'py', 'qua', 'quac', 'quai', 'quan', 'quang', 'quap', 'quat', 'quau', 'quay', 'que', 'quep', 'quet', 'queu', 'qui', 'quia', 'quich', 'quiem', 'quien', 'quiep', 'quieu', 'quim', 'quin', 'quinh', 'quip', 'quo', 'quoc', 'quoi', 'quon', 'quong', 'quop', 'quot', 'quu', 'qy', 'ra', 'rac', 'rai', 'ram', 'ran', 'rang', 'rao', 'rap', 'rat', 'rau', 'ray', 're', 'rem', 'ren', 'reo', 'rep', 'ret', 'reu', 'ri', 'ria', 'rich', 'riem', 'rien', 'riep', 'rieu', 'rim', 'rinh', 'rip', 'ro', 'roa', 'roai', 'roan', 'roang', 'roap', 'roat', 'roc', 'roi', 'rom', 'ron', 'rong', 'rop', 'rot', 'ru', 'rua', 'ruc', 'rui', 'ruon', 'ruong', 'ruot', 'ruu', 'ry', 'sa', 'sac', 'sai', 'sam', 'san', 'sang', 'sao', 'sap', 'sat', 'sau', 'say', 'se', 'sem', 'sen', 'seo', 'sep', 'set', 'seu', 'si', 'sia', 'sich', 'siem', 'sien', 'siep', 'sieu', 'sim', 'sinh', 'sip', 'so', 'soa', 'soai', 'soan', 'soang', 'soap', 'soat', 'soc', 'soi', 'som', 'son', 'song', 'sop', 'sot', 'su', 'sua', 'suc', 'sui', 'suon', 'suong', 'suot', 'suu', 'sy', 'ta', 'tac', 'tai', 'tam', 'tan', 'tang', 'tao', 'tap', 'tat', 'tau', 'tay', 'te', 'tem', 'ten', 'teo', 'tep', 'tet', 'teu', 'thha', 'thhe', 'thhi', 'thho', 'thhu', 'thhy', 'ti', 'tia', 'tich', 'tiem', 'tien', 'tiep', 'tieu', 'tim', 'tinh', 'tip', 'to', 'toa', 'toai', 'toan', 'toang', 'toap', 'toat', 'toc', 'toi', 'tom', 'ton', 'tong', 'top', 'tot', 'tu', 'tua', 'tuc', 'tui', 'tuon', 'tuong', 'tuot', 'tuu', 'ty', 'u', 'ua', 'uai', 'uan', 'uang', 'uap', 'uat', 'uc', 'ui', 'um', 'un', 'ung', 'up', 'ut', 'uy', 'uya', 'uyc', 'uye', 'uyeh', 'uyen', 'uyo', 'uyp', 'uyt', 'uyu', 'uyy', 'va', 'vac', 'vai', 'vam', 'van', 'vang', 'vao', 'vap', 'vat', 'vau', 'vay', 've', 'vem', 'ven', 'veo', 'vep', 'vet', 'veu', 'vi', 'via', 'vich', 'viem', 'vien', 'viep', 'vieu', 'vim', 'vinh', 'vip', 'vo', 'voa', 'voai', 'voan', 'voang', 'voap', 'voat', 'voc', 'voi', 'vom', 'von', 'vong', 'vop', 'vot', 'vu', 'vua', 'vuc', 'vui', 'vuon', 'vuong', 'vuot', 'vuu', 'vy', 'xa', 'xac', 'xai', 'xam', 'xan', 'xang', 'xao', 'xap', 'xat', 'xau', 'xay', 'xe', 'xem', 'xen', 'xeo', 'xep', 'xet', 'xeu', 'xi', 'xia', 'xich', 'xiem', 'xien', 'xiep', 'xieu', 'xim', 'xinh', 'xip', 'xo', 'xoa', 'xoai', 'xoan', 'xoang', 'xoap', 'xoat', 'xoc', 'xoi', 'xom', 'xon', 'xong', 'xop', 'xot', 'xu', 'xua', 'xuc', 'xui', 'xuon', 'xuong', 'xuot', 'xuu', 'xy', 'y', 'ya', 'yc', 'ye', 'yeh', 'yen', 'yo', 'yp', 'yt', 'yu', 'yy'
]);

/**
 * Trích xuất thuật ngữ cục bộ không dùng LLM (sử dụng từ điển CMU và DB cache) làm fallback khi Gemini lỗi/quota
 */
function localExtractTerms(text) {
  // Tách văn bản thành các từ bằng khoảng trắng
  const rawWords = text.split(/\s+/);
  const terms = [];
  
  for (const rawWord of rawWords) {
    // Làm sạch dấu câu ở đầu và cuối từ (như dấu phẩy, chấm, ngoặc kép, ngoặc vuông)
    const cleanWord = rawWord.replace(/^[-.,!?;()'"“”\[\]]+|[-.,!?;()'"“”\[\]]+$/g, "");
    
    // Nếu từ rỗng hoặc chứa ký tự tiếng Việt có dấu (non-ASCII như â, ê, ô, á, à, ự...), bỏ qua toàn bộ từ
    if (!cleanWord || /[^\x00-\x7F]/.test(cleanWord)) continue;
    
    // Kiểm tra xem từ có phải là từ tiếng Anh chuẩn (gồm chữ cái, chấm, gạch ngang)
    if (!/^[a-zA-Z]+(?:[-.][a-zA-Z]+)*$/.test(cleanWord)) continue;
    
    const lower = cleanWord.toLowerCase();
    
    // Nếu từ này nằm trong danh mục từ dừng tiếng Việt (viết không dấu), bỏ qua
    // Ngoại lệ: Nếu từ viết HOA TOÀN BỘ từ 2 chữ cái trở lên (như "AI", "API", "SDK") thì không bỏ qua vì đó là viết tắt tiếng Anh.
    const isAllCaps = cleanWord === cleanWord.toUpperCase() && cleanWord.length >= 2;
    if (VIETNAMESE_STOP_WORDS.has(lower) && !isAllCaps) continue;
    
    // Giữ lại từ nếu nó nằm trong từ điển CMU hoặc là từ viết tắt từ 2 ký tự trở lên (như AI, API, SDK, CLI)
    if (cmuDict.has(lower) || cleanWord.length >= 2) {
      terms.push(cleanWord);
    }
  }
  return [...new Set(terms)];
}

/**
 * Trích xuất các thuật ngữ tiếng Anh từ văn bản tiếng Việt sử dụng Gemini.
 */
async function extractTerms(text) {
  if (!text) return [];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[Phoneme Agent] GEMINI_API_KEY không được cấu hình. Sử dụng Local Extractor Fallback...");
    return localExtractTerms(text);
  }

  let modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  if (modelName.includes("3.5")) modelName = "gemini-2.5-flash";

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      Analyze the following Vietnamese script. Extract all English words, technical terms, technology/product names, acronyms, or versions that should be pronounced in English.
      Return ONLY a JSON array of strings containing the exact extracted terms (preserving their original spelling and casing as they appear in the script).
      
      Example Input: "Hôm nay chúng ta sẽ học React và Docker để xây dựng API. Sau đó deploy lên Vercel."
      Example Output: ["React", "Docker", "API", "Vercel"]

      Script:
      "${text}"
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    let terms;
    try {
      terms = JSON.parse(responseText);
    } catch (e) {
      const cleaned = responseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      terms = JSON.parse(cleaned);
    }

    if (Array.isArray(terms)) {
      // Filter out duplicate or empty terms
      return [...new Set(terms.map(t => t.trim()).filter(Boolean))];
    }
    return [];
  } catch (err) {
    console.error("[Phoneme Agent] Lỗi khi trích xuất thuật ngữ từ Gemini:", err.message);
    console.log("[Phoneme Agent] Đang kích hoạt Local Term Extractor fallback...");
    return localExtractTerms(text);
  }
}

/**
 * Tra cứu âm vị CMU cho danh sách các thuật ngữ.
 * Gọi Gemini làm G2P fallback nếu không có trong Cache DB hoặc CMU Dict.
 */
async function getPhonemesForTerms(terms) {
  const mapping = {};
  if (!terms || terms.length === 0) return mapping;

  const unknownTerms = [];

  for (const term of terms) {
    const cleanTerm = term.toLowerCase().trim();
    
    // 1. Kiểm tra database cache
    try {
      const cached = await db.getPhonemeFromCache(cleanTerm);
      if (cached) {
        mapping[term] = cached.phoneme;
        console.log(`[Phoneme Engine] Tra cứu thành công từ Cache DB: "${term}" -> [${cached.phoneme}] (matched_from_cache: true)`);
        continue;
      }
    } catch (dbErr) {
      console.error("[Phoneme Engine] Lỗi truy vấn Cache DB:", dbErr.message);
    }

    // 2. Kiểm tra từ điển CMU local
    if (cmuDict.has(cleanTerm)) {
      const phoneme = cmuDict.get(cleanTerm);
      mapping[term] = phoneme;
      console.log(`[Phoneme Engine] Tra cứu thành công từ CMU Dict: "${term}" -> [${phoneme}]`);
      
      // Tự động lưu vào DB cache để tối ưu hóa truy vấn sau này
      try {
        await db.savePhonemeToCache({
          term: cleanTerm,
          display_term: term,
          phoneme: phoneme,
          source: "cmudict",
          confidence: 1.0
        });
      } catch (saveErr) {}
      continue;
    }

    // 3. Nếu không có ở cả 2 nguồn, cho vào danh sách chưa biết để chạy G2P Fallback
    unknownTerms.push(term);
  }

  // 3. Chạy Gemini làm Fallback G2P cho các từ chưa biết
  if (unknownTerms.length > 0) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[Phoneme Agent] GEMINI_API_KEY chưa cấu hình. Không thể chạy G2P fallback cho:", unknownTerms);
      return mapping;
    }

    let modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    if (modelName.includes("3.5")) modelName = "gemini-2.5-flash";

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `
        Translate this list of technical English terms or proper nouns into CMU/ARPABET phoneme sequences.
        
        Guidelines:
        - Generate phonemes closest to American English pronunciation.
        - Return a JSON array matching this schema:
          [
            {
              "term": "the lowercase word (e.g. 'vercel')",
              "display_term": "original word (e.g. 'Vercel')",
              "phoneme": "CMU phoneme string (e.g. 'V ER1 S EH1 L')",
              "confidence": 1.000, // Float value representing accuracy
              "source": "g2p",
              "aliases": ["verceljs"]
            }
          ]
        
        Confidence rules:
        - 0.95 for famous tech companies (e.g. OpenAI, Anthropic, ElevenLabs)
        - 0.90 for common frameworks/tools (e.g. Supabase, Vercel, Remotion)
        - 0.80 for new product names (e.g. Lovable, Bolt.new)
        - 0.60 for contextual guesses
        - <0.5 for uncertain translations

        Terms List to Translate:
        ${JSON.stringify(unknownTerms)}
      `;

      console.log(`[Phoneme Agent] Gọi Gemini G2P Fallback cho ${unknownTerms.length} từ:`, unknownTerms);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      let newPhonemes;
      try {
        newPhonemes = JSON.parse(responseText);
      } catch (e) {
        const cleaned = responseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        newPhonemes = JSON.parse(cleaned);
      }

      if (Array.isArray(newPhonemes)) {
        for (const item of newPhonemes) {
          if (!item.term || !item.phoneme) continue;
          
          const confidence = parseFloat(item.confidence) || 1.0;
          const reviewRequired = confidence < 0.8;
          
          const dbItem = {
            term: item.term.toLowerCase().trim(),
            display_term: item.display_term || item.term,
            phoneme: item.phoneme.trim(),
            source: "g2p",
            confidence,
            review_required: reviewRequired,
            aliases: item.aliases || []
          };

          // Lưu vào Cache DB
          try {
            await db.savePhonemeToCache(dbItem);
            console.log(`[Phoneme Engine] Đã lưu G2P Fallback vào DB: "${dbItem.display_term}" -> [${dbItem.phoneme}] (Confidence: ${dbItem.confidence}, Review Required: ${dbItem.review_required})`);
          } catch (dbSaveErr) {
            console.error("[Phoneme Engine] Không thể lưu G2P vào DB:", dbSaveErr.message);
          }

          // Ánh xạ lại cho kết quả
          // Tìm xem thuật ngữ gốc có viết hoa/thường thế nào để map chính xác
          const originalTerm = unknownTerms.find(t => t.toLowerCase() === dbItem.term) || item.display_term;
          mapping[originalTerm] = dbItem.phoneme;
        }
      }
    } catch (g2pErr) {
      console.error("[Phoneme Agent] Lỗi trong G2P Fallback:", g2pErr.message);
    }
  }

  return mapping;
}

/**
 * Hàm tối ưu hóa chính: Nhận câu thoại gốc tiếng Việt và chèn các thẻ âm vị [PHONEME] cho tiếng Anh.
 */
async function optimizeTextForPhonemes(text) {
  if (!text) return "";

  try {
    // 1. Trích xuất thuật ngữ tiếng Anh
    const terms = await extractTerms(text);
    if (terms.length === 0) return text;

    // 2. Tra cứu/dịch âm vị CMU
    const mapping = await getPhonemesForTerms(terms);

    // 3. Thực hiện chèn âm vị bằng JavaScript Regex cục bộ (Đảm bảo chữ tiếng Việt 100% không đổi)
    let optimizedText = text;
    
    // Sắp xếp các từ theo độ dài giảm dần để thay thế từ dài trước (tránh lỗi thay thế chuỗi con trước, vd: "ReactJS" trước "React")
    const sortedTerms = Object.keys(mapping).sort((a, b) => b.length - a.length);

    for (const term of sortedTerms) {
      const phoneme = mapping[term];
      if (!phoneme) continue;

      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      
      // Tạo Regex khớp từ gốc (phân biệt hoa thường) được bao quanh bởi khoảng trắng, dấu câu hoặc bắt đầu/kết thúc chuỗi
      // Việc phân biệt hoa thường giúp tránh thay thế nhầm các từ tiếng Việt như pronoun "ai" (khi ta cần thay thế viết tắt "AI")
      const regex = new RegExp(`(?<=^|\\s|[-.,!?;()'"“”\\/\\\\*+={}\\[\\]])(${escaped})(?=$|\\s|[-.,!?;()'"“”\\/\\\\*+={}\\[\\]])`, "g");
      
      optimizedText = optimizedText.replace(regex, `[${phoneme}]`);
    }

    return optimizedText;
  } catch (err) {
    console.error("[Phoneme Agent] Lỗi xử lý optimizeTextForPhonemes:", err.message);
    return text;
  }
}

module.exports = {
  optimizeTextForPhonemes,
  extractTerms,
  getPhonemesForTerms
};
