require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { compileTSX, sanitizeTSXCode } = require("../services/aiGen");

function testSanitizer() {
  console.log("Testing TSX Code Sanitizer & Compiler...");

  // Sample TSX snippet with common LLM syntax flaws (TS type annotations, missing imports, unescaped quote in string)
  const flawedTsx = `
import React from 'react';
import { useCurrentFrame } from 'remotion';

interface SceneProps {
  heading: string;
}

export const GeneratedScene: React.FC<SceneProps> = ({ fps = 30 }: any) => {
  const frame = useCurrentFrame();
  const alertText = "BẮT ĐẦU "NGAY" VỚI AI";
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Sparkles size={24} />
      <h1>{alertText}</h1>
    </div>
  );
};
export default GeneratedScene;
`;

  const sanitized = sanitizeTSXCode(flawedTsx);
  console.log("Sanitized Output Snippet:\n-------------------\n", sanitized, "\n-------------------");

  const compiled = compileTSX(flawedTsx);
  if (!compiled || compiled.length < 50) {
    throw new Error("Sanitization failed to produce valid compiled JS");
  }

  console.log("✅ TSX Code Sanitizer & Compiler Test Passed! Compiled length:", compiled.length);
}

testSanitizer();
