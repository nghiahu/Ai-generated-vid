function getSingleCleanKeyword(keywordStr) {
  if (!keywordStr) return "technology";
  // Loại bỏ các ký tự đặc biệt, giữ lại chữ và số
  const clean = keywordStr.replace(/[^a-zA-Z0-9\s]/g, " ");
  const words = clean.split(/\s+/).filter(w => w.trim().length > 0);
  if (words.length === 0) return "technology";
  // Tìm từ đầu tiên có độ dài từ 3 ký tự trở lên
  const bestWord = words.find(w => w.length >= 3);
  return bestWord || words[0] || "technology";
}

async function searchImages(query) {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  const searchTerm = query || "technology";

  if (!apiKey) {
    const cleanWord = getSingleCleanKeyword(searchTerm);
    console.log(`No UNSPLASH_ACCESS_KEY found. Using Lorem Flickr clean tag: "${cleanWord}" (from "${searchTerm}")`);
    return [
      `https://loremflickr.com/800/1422/${encodeURIComponent(cleanWord)}?random=1`,
      `https://loremflickr.com/800/1422/${encodeURIComponent(cleanWord)}?random=2`,
      `https://loremflickr.com/800/1422/${encodeURIComponent(cleanWord)}?random=3`,
      `https://loremflickr.com/800/1422/${encodeURIComponent(cleanWord)}?random=4`,
      `https://loremflickr.com/800/1422/${encodeURIComponent(cleanWord)}?random=5`,
      `https://loremflickr.com/800/1422/${encodeURIComponent(cleanWord)}?random=6`
    ];
  }

  try {
    console.log(`Searching Unsplash images for query: "${searchTerm}"...`);
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=6`, {
      headers: {
        'Authorization': `Client-ID ${apiKey}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Unsplash API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results.map(img => img.urls.regular);
    }

    throw new Error(`Không tìm thấy hình ảnh nào phù hợp với từ khóa: "${searchTerm}"`);

  } catch (error) {
    console.error("Error searching Unsplash images:", error);
    throw new Error(`Lỗi Unsplash API: ${error.message}`);
  }
}

module.exports = {
  searchImages
};
