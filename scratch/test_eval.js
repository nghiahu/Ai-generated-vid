let code = 'import React from "react"; import { Terminal as TerminalIcon, Cpu, Sparkles } from "lucide-react"; export const GeneratedScene = () => {};';
let rewrittenJS = code.replace(/import\s+([\s\S]*?)\s+from\s+['"]lucide-react['"];?/g, (match, imports) => {
  if (imports.includes('{')) {
    const named = imports.match(/\{([\s\S]*?)\}/);
    if (named && named[1]) {
      const cleanImports = named[1].replace(/[\r\n]+/g, ' ').replace(/\s+as\s+/g, ': ').trim();
      return `const { ${cleanImports} } = window.LucideIcons;`;
    }
  }
  return 'const LucideIcons = window.LucideIcons;';
});

console.log('Rewritten code:\n', rewrittenJS);

try {
  eval('const window = { LucideIcons: { Terminal: () => null } };\n' + rewrittenJS);
  console.log('EVAL SUCCESS: No syntax error!');
} catch (e) {
  console.error('EVAL ERROR:', e.message);
}
