const contractLoader = require('../services/contractLoader');

const mockScene = {
  heading: "Tiết kiệm 3× thời gian khi tự động hóa quy trình phân tích dữ liệu",
  layoutId: "BeforeAfterPanel",
  sceneIntent: {
    type: "comparison",
    importance: "medium"
  },
  points: []
};

const contract = contractLoader.getContractForLayout(mockScene.layoutId, mockScene.sceneIntent.type);
console.log("Layout ID:", contract.layoutId);
console.log("Contract Max Heading Chars:", contract.headingMaxChars);

const { scene, warnings } = contractLoader.validateAndFormatSceneContent(mockScene, contract);
console.log("Validated Scene Heading:", scene.heading);
console.log("Validated Heading Length:", scene.heading.length);
console.log("Warnings:", warnings);

if (scene.heading.length <= contract.headingMaxChars) {
  console.log("SUCCESS: Heading successfully trimmed to layout specific contract limit!");
} else {
  console.error("FAIL: Heading length exceeds layout contract limit!");
  process.exit(1);
}
