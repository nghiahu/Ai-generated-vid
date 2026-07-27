const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function validateTSXCode(code) {
  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx"]
    });

    let hasValidExport = false;
    let errorMsg = null;

    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        const whitelist = ["react", "remotion", "lucide-react"];
        if (!whitelist.includes(source)) {
          errorMsg = `Forbidden import: ${source}`;
          path.stop();
        }
      },
      CallExpression(path) {
        if (path.node.callee.name === 'eval') {
          errorMsg = `Forbidden security statement: eval`;
          path.stop();
        }
      },
      JSXOpeningElement(path) {
        if (path.node.name.name === 'Sequence') {
          const fromAttr = path.node.attributes.find(attr => attr.name?.name === 'from');
          if (fromAttr && fromAttr.value?.type === 'JSXExpressionContainer') {
            const expr = fromAttr.value.expression;
            if (expr.type === 'UnaryExpression' && expr.operator === '-' && expr.argument.type === 'NumericLiteral') {
              errorMsg = 'Sequence "from" frame must be non-negative';
              path.stop();
            }
          }
        }
      },
      ExportDefaultDeclaration() {
        hasValidExport = true;
      },
      ExportNamedDeclaration(path) {
        if (path.node.declaration?.declarations) {
          for (const dec of path.node.declaration.declarations) {
            if (dec.id?.name === 'GeneratedScene') {
              hasValidExport = true;
            }
          }
        }
      }
    });

    if (errorMsg) return { isValid: false, error: errorMsg };
    if (!hasValidExport) return { isValid: false, error: "Missing default export or GeneratedScene named export" };

    return { isValid: true };
  } catch (err) {
    return { isValid: false, error: `AST Parsing Error: ${err.message}` };
  }
}

module.exports = { validateTSXCode };
