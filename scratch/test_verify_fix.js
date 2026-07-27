const path = require("path");
const aiGen = require("./backend/services/aiGen");

const sampleBadCode = `
import React from "react";
import { useCurrentFrame, spring } from "remotion";
import { Zap, Cpu } from "lucide-react";
Import icons directly using their exact names without 'as' alias syntax. Do NOT use import { Terminal as TerminalIcon } alias syntax.

export const GeneratedScene = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Zap size={24} />
    </div>
  );
};
export default GeneratedScene;
`;

try {
  console.log("Testing compileTSX with prompt text leak...");
  const compiled = aiGen.compileTSX(sampleBadCode);
  console.log("SUCCESS! Compiled JS length:", compiled.length);
  console.log("Compiled sample output:\n", compiled.substring(0, 300));
} catch (e) {
  console.error("FAIL:", e.message);
  process.exit(1);
}
