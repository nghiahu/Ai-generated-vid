import { Composition } from "remotion";
import React from "react";
import { MainComposition, SceneData, MainCompositionProps, getSceneDurationFrames } from "./compositions/MainComposition";
// Import font loader — bắt buộc để Remotion load Google Fonts đúng cách với subset Vietnamese
import "./styles/fonts";


export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainComposition"
        component={MainComposition}
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={({ props }) => {
          const fps = 30;
          const mainProps = props as unknown as MainCompositionProps;
          const scenes = mainProps.scenes || [];
          
          const durationInFrames = scenes.reduce(
            (sum: number, scene: SceneData) => sum + getSceneDurationFrames(scene, fps),
            0
          );

          return {
            fps,
            durationInFrames: Math.max(fps, durationInFrames),
          };
        }}
        defaultProps={{
          scenes: [
            {
              id: "scene_mock_1",
              sceneIndex: 0,
              duration: 6.0,
              layoutFamily: "Opening / Headline",
              visualLayout: "Intro Profile",
              heading: "Xây dựng Video bằng React",
              points: ["Sử dụng Remotion", "Lập trình thay vì kéo thả"],
              voiceover: "Chào mừng các bạn đến với công cụ tạo video tự động bằng React.",
              voiceoverAudioUrl: "",
              mediaList: ["https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800"],
              selectedMediaIndex: 0,
              placement: "Full"
            }
          ] as SceneData[],
          config: {
            voice: "rachel",
            backgroundMusic: "Chill Lofi Beats",
            backgroundMusicVolume: 0.025,
            watermark: { enabled: true, text: "yupclip.com", position: "top-right", color: "#000000" }
          }
        }}
      />
    </>
  );
};
