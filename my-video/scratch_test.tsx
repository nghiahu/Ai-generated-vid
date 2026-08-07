import React from 'react';
import ReactDOMServer from 'react-dom/server';

// Setup global mock for remotion
const mockRemotion = {
  useCurrentFrame: () => 15,
  useVideoConfig: () => ({ fps: 30, width: 1080, height: 1920 }),
  interpolate: (val, range, output, options) => {
    return output[0];
  },
  Easing: {
    bezier: () => (t) => t
  },
  spring: () => 1,
  staticFile: (path: string) => path,
  Audio: (props: any) => React.createElement('audio', props),
  Sequence: (props: any) => React.createElement('div', { 'data-sequence': true, ...props }),
  AbsoluteFill: (props: any) => React.createElement('div', { 'data-absolute-fill': true, ...props })
};

// Insert mock into require cache
const remotionPath = require.resolve('remotion');
require.cache[remotionPath] = {
  id: remotionPath,
  filename: remotionPath,
  loaded: true,
  exports: mockRemotion
} as any;

const { MainComposition } = require('./src/compositions/MainComposition');

const mockScene = {
  id: "scene_0",
  sceneIndex: 0,
  duration: 6.29,
  layoutFamily: "opening",
  visualLayout: "MetricShowcaseHook",
  heading: "Sập Mạng Toàn Cầu Lỗi Kỹ Thuật Đáng Giá Tỷ Đô",
  points: [
    {
      type: 'metric',
      text: 'Thiệt hại toàn cầu',
      animation: 'slide-up',
      delay: 0.4,
      logos: [],
      badges: [],
      value: '$1 tỷ+',
      subtext: ''
    },
    {
      type: 'subheader',
      text: 'Sập mạng vì lỗi kỹ thuật',
      animation: 'slide-up',
      delay: 4.7,
      logos: [],
      badges: [],
      value: '',
      subtext: ''
    }
  ],
  voiceover: "Bạn có nhớ cú sập mạng toàn cầu của CrowdStrike khiến hàng ngàn chuyến bay bị hủy? Một lỗi kỹ thuật đáng giá hàng tỷ đô.",
  voiceoverAudioUrl: "dummy.mp3",
  mediaList: [],
  selectedMediaIndex: -1,
  placement: "center",
  theme: "default",
  accentColor: "#00e5ff",
  sceneIntent: {
    highlightWords: ["tỷ đô"]
  }
};

const mockConfig = {
  voice: "vi-VN-Standard-A",
  backgroundMusic: "Chill Lofi Beats",
  backgroundMusicVolume: 0.05,
  watermark: {
    enabled: false,
    text: "Watermark",
    position: "bottom-right",
    color: "#ffffff"
  }
};

try {
  console.log("Starting MainComposition render test with raw database points...");
  const html = ReactDOMServer.renderToString(
    <MainComposition scenes={[mockScene]} config={mockConfig as any} />
  );
  console.log("MainComposition Render successful! HTML length:", html.length);
} catch (err) {
  console.error("MainComposition Render failed with error:", err);
}
