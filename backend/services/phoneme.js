const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("./db");

const TECH_TERMS_TRANSLITERATION = {
  'react': 'ri-ắc',
  'api': 'ây-pi-ai',
  'vite': 'vít',
  'nextjs': 'lếch-gi-ét',
  'next.js': 'lếch-gi-ét',
  'nodejs': 'nốt-gi-ét',
  'node.js': 'nốt-gi-ét',
  'javascript': 'gia-va-sờ-cờ-ríp',
  'typescript': 'tai-sờ-cờ-ríp',
  'css': 'xê-ét-ét',
  'html': 'hắt-ty-em-eo',
  'npm': 'en-pi-em',
  'json': 'giây-xơn',
  'sql': 'ét-quy-eo',
  'cli': 'xê-lờ-ai',
  'git': 'gít',
  'github': 'gít-hắp',
  'docker': 'đốc-cơ',
  'aws': 'ây-dub-lờ-ét',
  'vercel': 'vơ-xen',
  'remotion': 'ri-mô-sần',
  'video': 'vi-đê-ô',
  'marketing': 'mác-két-tinh',
  'dashboard': 'đát-bót',
  'animation': 'a-ni-mei-sơn',
  'avatar': 'a-va-ta',
  'website': 'oét-sai',
  'logo': 'lô-gô',
  'brand': 'bờ-ren',
  'component': 'com-po-nơnt',
  'framework': 'fờ-rem-uốc',
  'timeline': 'tai-lai',
  'audio': 'au-đi-ô',
  'mp4': 'em-pi-bốn',
  'mp3': 'em-pi-ba',
  'client': 'clai-ơn',
  'server': 'sơ-vơ',
  'app': 'áp',
  'dev': 'đép',
  'build': 'biu',
  'deploy': 'đi-ploi',
  'code': 'cốt',
  'database': 'đê-ta-bây',
  'ai': 'ây-ai',
  'AI': 'ây-ai',
  'Ai': 'ây-ai',
  'gpt': 'gi-pi-ti',
  'llm': 'en-en-em',
  'agent': 'ây-dừn',
  'agents': "ây-dừn",
  'premiere': 'pờ-re-mi-e',
  'capcut': 'cáp-cắt',
  'photoshop': 'phô-tô-thóp',
  'illustrator': 'in-lút-trây-tơ',
  'canva': 'can-va',
  'figma': 'fích-ma',
  'ui': 'u-ai',
  'ux': 'u-ích',
  'front-end': 'phờ-rơn-en',
  'back-end': 'bách-en',
  'native': 'nây-típ',
  'gateway': 'gết-uê',
  'service': 'sơ-vít',
  'cloud': 'clao',
  'serverless': 'sơ-vơ-lét',
  'verceljs': 'vơ-xen-chây-ét',
  'supabase': 'xu-pa-bây',
  'tailwind': 'teo-uin',
  'rag': 'rác',
  'hust': "hớt",
  'seee': "se",
  'rikkei': "rì-kây",
  'academy': "a-ka-đê-mi",
  'mcp': "em-ci-pi",
  'usb-c': "ui-ét-bi-ci",
  'drive': "đì-vai",
  'google': "gu-gồ",
  'database': "đa-ta-bây",
  'model': "mo-đồ",
  'context': "con-tếch",
  'protocol': "pô-tô-cô",
  'paper': "bây-bờ",
  'abstract': "áp-trách",
  'iot': "ai-ô-ti",
  'internet': "in-tơ-nét",
  'zoom': "rum",
  'wi-fi': "uai-fai",
  'arm': "a-r-m",
  'of': "ợp",
  'thinks': 'thinh',
  'memory': "mem-mo-ri",
  'hub': "hắp",
  'follow': "fo-lâu",
  'course': "cót",
  'trend': "chen",
  'open': 'âu-bần',
  'openai': 'âu-bần-ây-ai',
  'reinforcement': "ri-in-pho-mừn",
  'learning': "lơn-ing",
  'meta': "mê-ta",
  'backend': "bách-en",
  'software': "sóp-woe",
  'engineer': "en-rin-nia",
  'programmer': "pro-gram-mơ",
  'developer': "đi-vơ-lốp-bơ",
  'cursor': "cơ-sờ",
  'c': 'xi',
  'c++': 'xi cộng cộng',
  'cplusplus': 'xi cộng cộng',
  'c#': 'xi sáp',
  'csharp': 'xi sáp',
  'real-time': "riu-tham",
  'Spacex': "sờ-pây-ích",
  'realtime': 'riu-tham',
  'selfie': "seo-phi",
  'photo': "Phô-tô"
};

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

const ADDITIONAL_VIETNAMESE_WORDS = [
  // Missing 'tr' group
  'tra', 'trac', 'trai', 'tram', 'tran', 'trang', 'tranh', 'trao', 'trap', 'trat', 'trau', 'tray', 'tre', 'tren', 'treo', 'trep', 'tret', 'tri', 'tria', 'trich', 'triem', 'trien', 'triet', 'trieu', 'trinh', 'tro', 'troc', 'troi', 'trom', 'tron', 'trong', 'chong', 'trot', 'tru', 'trua', 'truc', 'trui', 'trum', 'trun', 'trung', 'truoc', 'truoi', 'truon', 'truong', 'truot', 'truu', 'truy', 'truyen', 'truyet',
  // Missing 'th' group
  'tha', 'thac', 'thai', 'tham', 'than', 'thang', 'thanh', 'thao', 'thap', 'that', 'thau', 'thay', 'the', 'them', 'then', 'theo', 'thep', 'thet', 'theu', 'thi', 'thia', 'thich', 'thiem', 'thien', 'thiep', 'thiet', 'thieu', 'thim', 'thinh', 'thip', 'thit', 'thiu', 'tho', 'thoc', 'thoi', 'thom', 'thon', 'thong', 'thop', 'thot', 'thu', 'thua', 'thuc', 'thui', 'thum', 'thun', 'thung', 'thuoc', 'thuong', 'thuot', 'thuu', 'thuy', 'thuyen', 'thuyet',
  // Missing t-group additions
  'tin', 'tiet',
  // Missing other common Vietnamese syllables
  'nguoi', 'phat', 'trinh', 'hoc', 'vien', 'truong', 'chuyen', 'nghiep', 'viet', 'nam', 'dong', 'hanh', 'phuc', 'khoe', 'dep'
];
ADDITIONAL_VIETNAMESE_WORDS.forEach(w => VIETNAMESE_STOP_WORDS.add(w));

const TECH_TERMS_WHITELIST = new Set([
  'react', 'api', 'vite', 'nextjs', 'next.js', 'nodejs', 'node.js', 'javascript', 'typescript',
  'css', 'html', 'npm', 'json', 'sql', 'cli', 'git', 'github', 'docker', 'aws', 'vercel',
  'remotion', 'video', 'marketing', 'dashboard', 'animation', 'avatar', 'website', 'logo',
  'brand', 'component', 'framework', 'timeline', 'audio', 'mp4', 'mp3', 'client', 'server',
  'app', 'dev', 'build', 'deploy', 'code', 'database', 'ai', 'gpt', 'llm', 'agent', 'premiere',
  'capcut', 'photoshop', 'illustrator', 'canva', 'figma', 'ui', 'ux', 'front-end', 'back-end',
  'native', 'gateway', 'service', 'cloud', 'serverless'
]);

/**
 * Kiểm tra một từ đơn có phải từ tiếng Anh cần phiên âm hay không
 */
function isEnglishWord(word) {
  if (!word) return false;
  if (/[^\x00-\x7F]/.test(word)) return false;
  if (!/[a-zA-Z]/.test(word)) return false;
  const lower = word.toLowerCase();
  if (TECH_TERMS_TRANSLITERATION[lower]) return true;
  const isAllCaps = word === word.toUpperCase() && word.length >= 2;
  if (VIETNAMESE_STOP_WORDS.has(lower) && !isAllCaps) return false;
  if (TECH_TERMS_WHITELIST.has(lower)) return true;
  if (isAllCaps) return true;
  const hasForeignChars = /[wfzj]/i.test(word);
  const endsWithEnglishConsonant = /[rsldgbk]$/i.test(word) && word.length >= 3;
  const hasEnglishPrefix = /^(cl|cr|fl|gl|gr|pl|pr|sl|sp|st|sh|str)/i.test(word);
  const hasEnglishSuffix = /(rt|nd|ld|ck|ct|mp|lt|nt|rk|st)$/i.test(word);
  if (hasForeignChars || endsWithEnglishConsonant || hasEnglishPrefix || hasEnglishSuffix) {
    if (cmuDict.has(lower)) return true;
  }
  return false;
}

/**
 * Trích xuất thuật ngữ cục bộ không dùng LLM.
 * Nhận diện cả cụm từ tiếng Anh liên tiếp (n-gram) để xử lý như một thể thống nhất.
 */
function localExtractTerms(text) {
  const rawWords = text.split(/\s+/);
  const cleanWords = rawWords.map(w => w.replace(/^[-.,!?;()'""\[\]—–]+|[-.,!?;()'""\[\]—–]+$/g, ''));

  const terms = [];
  let i = 0;

  while (i < cleanWords.length) {
    const word = cleanWords[i];
    if (!word || !isEnglishWord(word)) {
      i++;
      continue;
    }

    // Thử gộp cụm từ tiếng Anh liên tiếp (tối đa 4 từ)
    let longestPhrase = word;
    let longestEnd = i;
    for (let j = i + 1; j <= Math.min(i + 3, cleanWords.length - 1); j++) {
      const nextWord = cleanWords[j];
      if (!nextWord || !isEnglishWord(nextWord)) break;
      // Nếu rawWords[j] chứa ký tự tiếng Việt thì dừng
      if (/[^\x00-\x7F]/.test(rawWords[j])) break;
      longestPhrase = `${longestPhrase} ${nextWord}`;
      longestEnd = j;
    }

    if (longestEnd > i) {
      terms.push(longestPhrase);
      i = longestEnd + 1;
    } else {
      terms.push(word);
      i++;
    }
  }

  return [...new Set(terms)];
}

// Generic helper to generate content with exponential backoff retries and model fallbacks
async function generateContentWithRetryAndFallback(genAI, options, promptText, fallbackModels = [], projectId = null) {
  const modelsToTry = [options.model, ...fallbackModels];
  let lastError = new Error("No models tried");

  for (const modelName of modelsToTry) {
    let attempt = 0;
    const maxRetries = 3;
    const initialDelay = 1500;

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: options.generationConfig
    });

    console.log(`[Phoneme API] Đang thử sử dụng model: ${modelName}`);

    while (attempt <= maxRetries) {
      try {
        const result = await model.generateContent(promptText);
        if (result && result.response) {
          console.log(`[Phoneme API] Thành công với model: ${modelName}`);
          if (projectId && result.response.usageMetadata) {
            const usage = result.response.usageMetadata;
            const promptTokens = usage.promptTokenCount || 0;
            const completionTokens = usage.candidatesTokenCount || 0;
            await db.accumulateTokens(projectId, promptTokens, completionTokens);
          }
          return result;
        }
        throw new Error("Phản hồi rỗng từ API");
      } catch (err) {
        lastError = err;
        attempt++;
        const status = err.status || (err.response ? err.response.status : null);
        const isTransient = status === 503 || status === 429 ||
          err.message?.includes("503") || err.message?.includes("429") ||
          err.message?.includes("high demand") || err.message?.includes("Service Unavailable") ||
          err.message?.includes("overloaded") || err.message?.includes("ResourceExhausted") ||
          err.message?.includes("fetch failed");

        const isApiKeyError = err.message?.includes("API_KEY") || status === 400;

        if (isTransient && !isApiKeyError && attempt <= maxRetries) {
          const backoff = initialDelay * Math.pow(2, attempt - 1);
          console.warn(`[Phoneme API] Gặp lỗi tạm thời (${status || 'unknown'}) với model ${modelName}: ${err.message}. Thử lại lần ${attempt}/${maxRetries} sau ${backoff}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
        } else {
          console.error(`[Phoneme API] Thất bại với model ${modelName} (không thử lại model này): ${err.message}`);
          break; // Thử model tiếp theo
        }
      }
    }
  }

  throw lastError;
}

/**
 * Trích xuất các thuật ngữ tiếng Anh từ văn bản tiếng Việt sử dụng Gemini.
 */
async function extractTerms(text, projectId = null) {
  if (!text) return [];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[Phoneme Agent] GEMINI_API_KEY không được cấu hình. Sử dụng Local Extractor Fallback...");
    return localExtractTerms(text);
  }

  let modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  if (modelName.includes("2.0") && !modelName.includes("exp")) {
    modelName = "gemini-3.5-flash";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const options = {
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        thinkingConfig: {
          thinkingBudget: 0
        }
      }
    };

    const prompt = `
      Analyze the following Vietnamese script. Extract all English words, technical terms, technology/product names, acronyms, or versions that should be pronounced in English.
      Return ONLY a JSON array of strings containing the exact extracted terms (preserving their original spelling and casing as they appear in the script).
      
      Example Input: "Hôm nay chúng ta sẽ học React và Docker để xây dựng API. Sau đó deploy lên Vercel."
      Example Output: ["React", "Docker", "API", "Vercel"]

      Script:
      "${text}"
    `;

    const fallbacks = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-3.5-flash"].filter(m => m !== modelName);
    console.log(`[Phoneme Agent] Gọi Gemini G2P Extract với model ${modelName}...`);
    const result = await generateContentWithRetryAndFallback(genAI, options, prompt, fallbacks, projectId);
    const responseText = result.response.text().trim();

    let terms;
    try {
      terms = JSON.parse(responseText);
    } catch (e) {
      const cleaned = responseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      terms = JSON.parse(cleaned);
    }

    if (Array.isArray(terms)) {
      return [...new Set(terms.map(t => t.trim()).filter(Boolean))];
    }
    return [];
  } catch (err) {
    console.error("[Phoneme Agent] Lỗi khi trích xuất thuật ngữ từ Gemini:", err.message);
    console.log("[Phoneme Agent] Đang kích hoạt Local Term Extractor fallback...");
    return localExtractTerms(text);
  }
}


async function getPhonemesForTerms(terms, projectId = null) {
  const mapping = {};
  if (!terms || terms.length === 0) return mapping;

  const unknownTerms = [];

  for (const term of terms) {
    const cleanTerm = term.toLowerCase().trim();

    // 1. Kiểm tra từ điển dịch tĩnh TECH_TERMS_TRANSLITERATION
    if (TECH_TERMS_TRANSLITERATION[cleanTerm]) {
      const transliterated = TECH_TERMS_TRANSLITERATION[cleanTerm];
      mapping[term] = transliterated;
      console.log(`[Phoneme Engine] Tra cứu thành công từ Static Dict: "${term}" -> "${transliterated}"`);
      try {
        await db.savePhonemeToCache({
          term: cleanTerm,
          display_term: term,
          phoneme: transliterated,
          source: "static_dict",
          confidence: 1.0
        });
      } catch (saveErr) { }
      continue;
    }

    // 1.1. Nếu là cụm từ (có khoảng trắng), thử dịch từng từ riêng lẻ nếu chúng có trong static dict hoặc cache
    if (cleanTerm.includes(" ")) {
      const words = cleanTerm.split(/\s+/);
      let allResolved = true;
      const resolvedWords = [];
      for (const w of words) {
        if (TECH_TERMS_TRANSLITERATION[w]) {
          resolvedWords.push(TECH_TERMS_TRANSLITERATION[w]);
        } else {
          // Thử check cache DB
          try {
            const cached = await db.getPhonemeFromCache(w);
            if (cached && cached.phoneme && !/[A-Z0-9]/.test(cached.phoneme)) {
              resolvedWords.push(cached.phoneme);
              continue;
            }
          } catch (e) { }
          allResolved = false;
          break;
        }
      }
      if (allResolved) {
        const transliterated = resolvedWords.join(" ");
        mapping[term] = transliterated;
        console.log(`[Phoneme Engine] Tra cứu thành công cụm từ từ Static Dict/Cache: "${term}" -> "${transliterated}"`);
        continue;
      }
    }

    // 2. Kiểm tra database cache (bỏ qua nếu cache chứa CMU cũ hoặc không hợp lệ)
    try {
      const cached = await db.getPhonemeFromCache(cleanTerm);
      if (cached && cached.phoneme) {
        const isLegacyCmu = /[A-Z0-9]/.test(cached.phoneme);
        if (!isLegacyCmu) {
          mapping[term] = cached.phoneme;
          console.log(`[Phoneme Engine] Tra cứu thành công từ Cache DB (Vietnamese): "${term}" -> "${cached.phoneme}"`);
          continue;
        } else {
          console.log(`[Phoneme Engine] Phát hiện CMU cũ trong cache cho "${term}" -> [${cached.phoneme}], tiến hành dịch lại sang tiếng Việt.`);
        }
      }
    } catch (dbErr) {
      console.error("[Phoneme Engine] Lỗi truy vấn Cache DB:", dbErr.message);
    }

    // 3. Nếu không có ở cả 2 nguồn, cho vào danh sách chưa biết để chạy G2P Fallback
    unknownTerms.push(term);
  }

  // 3. Chạy Gemini làm Fallback G2P cho các từ chưa biết (dịch sang tiếng Việt tự nhiên)
  if (unknownTerms.length > 0) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[Phoneme Agent] GEMINI_API_KEY chưa cấu hình. Không thể chạy G2P fallback cho:", unknownTerms);
      return mapping;
    }

    let modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";
    if (modelName.includes("2.0") && !modelName.includes("exp")) {
      modelName = "gemini-3.5-flash";
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const options = {
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          thinkingConfig: {
            thinkingBudget: 0
          }
        }
      };

      const prompt = `
        Translate this list of technical English terms or proper nouns into natural, easy-to-read Vietnamese phonetic pronunciations.
        
        Guidelines:
        - Convert the English words to standard, simple Vietnamese syllables representing how they are naturally pronounced by Vietnamese developers.
        - Separate syllables with hyphens (e.g. 'vercel' -> 'vơ-xen', 'supabase' -> 'xu-pa-bây', 'tailwind' -> 'teo-uin', 'clippy' -> 'clíp-pi').
        - Use lowercase letters only.
        - Return a JSON array matching this schema:
          [
            {
              "term": "the lowercase word (e.g. 'vercel')",
              "display_term": "original word (e.g. 'Vercel')",
              "phoneme": "Vietnamese phonetic string (e.g. 'vơ-xen')",
              "confidence": 1.000,
              "source": "g2p"
            }
          ]
        
        Terms List to Translate:
        ${JSON.stringify(unknownTerms)}
      `;

      const fallbacks = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-3.5-flash"].filter(m => m !== modelName);
      console.log(`[Phoneme Agent] Gọi Gemini G2P Fallback dịch sang tiếng Việt cho ${unknownTerms.length} từ:`, unknownTerms);
      const result = await generateContentWithRetryAndFallback(genAI, options, prompt, fallbacks, projectId);
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
            phoneme: item.phoneme.toLowerCase().trim(),
            source: "g2p",
            confidence,
            review_required: reviewRequired,
            aliases: item.aliases || []
          };

          // Lưu vào Cache DB
          try {
            await db.savePhonemeToCache(dbItem);
            console.log(`[Phoneme Engine] Đã lưu G2P Fallback (Vietnamese) vào DB: "${dbItem.display_term}" -> "${dbItem.phoneme}"`);
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
async function optimizeTextForPhonemes(text, projectId = null) {
  if (!text) return "";

  try {
    // 1. Trích xuất thuật ngữ tiếng Anh bằng Gemini/AI
    const aiTerms = await extractTerms(text, projectId);

    // 1.1. Tự động quét và thêm tất cả các từ khóa tĩnh trong TECH_TERMS_TRANSLITERATION xuất hiện trong văn bản
    const staticTerms = Object.keys(TECH_TERMS_TRANSLITERATION).filter(term => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?<=^|\\s|[-.,!?;()'"“”\\/\\\\*+={}\\[\\]])${escaped}(?=$|\\s|[-.,!?;()'"“”\\/\\\\*+={}\\[\\]])`, "i");
      return regex.test(text);
    });

    // Gộp cả 2 danh sách lại và loại bỏ trùng lặp
    const terms = [...new Set([...aiTerms, ...staticTerms])];
    if (terms.length === 0) return text;

    // 2. Tra cứu/dịch âm vị CMU
    const mapping = await getPhonemesForTerms(terms, projectId);

    // 3. Thực hiện thay thế từ tiếng Anh bằng từ phiên âm tiếng Việt tương đương
    let optimizedText = text;

    // Sắp xếp các từ theo độ dài giảm dần để thay thế từ dài trước (tránh lỗi thay thế chuỗi con trước, vd: "ReactJS" trước "React")
    const sortedTerms = Object.keys(mapping).sort((a, b) => b.length - a.length);

    for (const term of sortedTerms) {
      const phoneme = mapping[term];
      if (!phoneme) continue;

      const isStopWord = VIETNAMESE_STOP_WORDS.has(term.toLowerCase());
      // Nếu là từ trùng với stopword tiếng Việt (như 'ai', 'ba', 'an'), ta ép buộc tìm kiếm dạng VIẾT HOA TOÀN BỘ (AI, BA, AN)
      // Điều này giúp tránh việc Gemini trích xuất dạng viết thường 'ai' làm lệch so khớp hoặc thay thế nhầm từ tiếng Việt thường
      const searchPattern = isStopWord ? term.toUpperCase() : term;
      const escaped = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const regex = new RegExp(
        `(?<=^|\\s|[-.,!?;()'"“”\\/\\\\*+={}\\[\\]])(${escaped})(?=$|\\s|[-.,!?;()'"“”\\/\\\\*+={}\\[\\]])`,
        isStopWord ? "g" : "gi"
      );

      optimizedText = optimizedText.replace(regex, phoneme);
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
