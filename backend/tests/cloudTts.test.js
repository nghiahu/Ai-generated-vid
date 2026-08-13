const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { generateTTS } = require('../services/tts');

test('Cloud OmniVoice TTS generation mock-test', async (t) => {
  // Save current env variables
  const originalUrl = process.env.OMNIVOICE_CLOUD_API_URL;
  const originalKey = process.env.OMNIVOICE_CLOUD_API_KEY;

  // Setup mock server variables
  process.env.OMNIVOICE_CLOUD_API_URL = 'http://localhost:9999/runsync';
  process.env.OMNIVOICE_CLOUD_API_KEY = 'mock_key';

  // Mock global fetch
  const mockAudioBase64 = Buffer.from('RIFF....mock_audio_data....').toString('base64');
  
  global.fetch = async (url, options) => {
    assert.strictEqual(url, 'http://localhost:9999/runsync');
    assert.strictEqual(options.headers['Authorization'], 'Bearer mock_key');
    
    return {
      ok: true,
      json: async () => ({
        status: "COMPLETED",
        output: {
          audio_base64: mockAudioBase64
        }
      })
    };
  };

  try {
    // Generate mock TTS
    const result = await generateTTS('Test cloud tts', 'proj_test', 'scene_test', 'omnivoice_quanganh');
    
    assert.ok(result.url.startsWith('/tts/'));
    const absoluteWavPath = path.join(__dirname, '../public', result.url);
    
    assert.ok(fs.existsSync(absoluteWavPath), 'WAV file should be successfully created');
    
    // Clean up created mock file
    if (fs.existsSync(absoluteWavPath)) {
      fs.unlinkSync(absoluteWavPath);
    }
  } finally {
    // Restore env variables
    process.env.OMNIVOICE_CLOUD_API_URL = originalUrl;
    process.env.OMNIVOICE_CLOUD_API_KEY = originalKey;
    delete global.fetch;
  }
});
