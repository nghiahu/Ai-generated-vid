const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;

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

// Automatically clamp animation physics configs to safe ranges and enforce minimum 12px font size (Layer 6)
function clampMotionParameters(code) {
  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx"]
    });

    traverse(ast, {
      CallExpression(path) {
        if (path.node.callee.name === 'spring') {
          const argObj = path.node.arguments[0];
          if (argObj && argObj.type === 'ObjectExpression') {
            const configProp = argObj.properties.find(p => p.key?.name === 'config');
            if (configProp && configProp.value.type === 'ObjectExpression') {
              const damping = configProp.value.properties.find(p => p.key?.name === 'damping');
              const stiffness = configProp.value.properties.find(p => p.key?.name === 'stiffness');
              
              if (damping && damping.value.type === 'NumericLiteral') {
                const val = damping.value.value;
                if (val < 5 || val > 80) {
                  damping.value.value = 14; // Clamped default damping
                }
              }
              if (stiffness && stiffness.value.type === 'NumericLiteral') {
                const val = stiffness.value.value;
                if (val < 10 || val > 300) {
                  stiffness.value.value = 55; // Clamped default stiffness
                }
              }
            }
          }
        }
      },
      JSXAttribute(path) {
        if (path.node.name.name === 'style') {
          const val = path.node.value;
          if (val && val.type === 'JSXExpressionContainer' && val.expression.type === 'ObjectExpression') {
            val.expression.properties.forEach(prop => {
              if (prop.type === 'ObjectProperty') {
                const keyName = prop.key.name || prop.key.value;
                if (keyName === 'fontSize') {
                  const propVal = prop.value;
                  if (propVal.type === 'NumericLiteral') {
                    if (propVal.value < 20) {
                      propVal.value = 20;
                    }
                  } else if (propVal.type === 'StringLiteral') {
                    const match = propVal.value.match(/^(\d+)(px)?$/);
                    if (match) {
                      const num = parseInt(match[1], 10);
                      if (num < 20) {
                        propVal.value = '20px';
                      }
                    }
                  }
                }
              }
            });
          }
        }
      }
    });

    return generator(ast).code;
  } catch (err) {
    return code; // Fallback to original code if parse fails
  }
}

module.exports = { validateTSXCode, clampMotionParameters };
