// knowledge/math.js
//
// A small, dependency-free arithmetic solver: +, -, *, /, ×, ÷,
// parentheses, decimals, negative numbers. Used so the AI answers
// basic arithmetic with a guaranteed-correct result and a clear
// step-by-step explanation, instead of relying on the language
// model's own (sometimes shaky) mental math.
//
// trySolveMath(text) returns null if the text isn't a pure
// arithmetic expression (so the caller can fall through to the
// real AI for anything else), or a result object if it is.

function normalizeExpression(raw) {
  return String(raw || "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/–|—/g, "-")
    .replace(/(\d)\s*x\s*(\d)/gi, "$1*$2") // "5 x 3" -> "5*3"
    .replace(/,/g, "");
}

function formatNumber(n) {
  // Avoid floating point ugliness like 0.1 + 0.2 = 0.30000000000000004
  const rounded = Math.round(n * 1e10) / 1e10;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function opSymbol(op) {
  return { "+": "+", "-": "\u2212", "*": "\u00d7", "/": "\u00f7" }[op] || op;
}

function tokenize(expr) {
  const tokens = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      let num = "";

      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        num += expr[i];
        i++;
      }

      const value = parseFloat(num);

      if (Number.isNaN(value)) return null;

      tokens.push({ type: "number", value });
      continue;
    }

    if ("+-*/()".includes(ch)) {
      tokens.push({ type: ch });
      i++;
      continue;
    }

    // Unknown character — not a pure math expression.
    return null;
  }

  return tokens;
}

function parseExpression(tokens) {
  let pos = 0;

  function peek() {
    return tokens[pos];
  }

  function consume() {
    return tokens[pos++];
  }

  function parsePrimary() {
    const token = peek();

    if (!token) throw new Error("Unexpected end of expression");

    if (token.type === "number") {
      consume();
      return { type: "number", value: token.value };
    }

    if (token.type === "(") {
      consume();
      const node = parseAddSub();

      if (!peek() || peek().type !== ")") {
        throw new Error("Missing closing parenthesis");
      }

      consume();
      return node;
    }

    if (token.type === "-") {
      consume();
      const operand = parsePrimary();
      return { type: "negate", operand };
    }

    if (token.type === "+") {
      consume();
      return parsePrimary();
    }

    throw new Error("Unexpected token: " + token.type);
  }

  function parseMulDiv() {
    let node = parsePrimary();

    while (peek() && (peek().type === "*" || peek().type === "/")) {
      const opToken = consume();
      const right = parsePrimary();
      node = { type: "binary", op: opToken.type, left: node, right };
    }

    return node;
  }

  function parseAddSub() {
    let node = parseMulDiv();

    while (peek() && (peek().type === "+" || peek().type === "-")) {
      const opToken = consume();
      const right = parseMulDiv();
      node = { type: "binary", op: opToken.type, left: node, right };
    }

    return node;
  }

  const ast = parseAddSub();

  if (pos !== tokens.length) {
    throw new Error("Unexpected trailing tokens");
  }

  return ast;
}

function precedenceOf(op) {
  return op === "+" || op === "-" ? 1 : 2;
}

function nodeToText(node, parentPrecedence, isRightChild) {
  parentPrecedence = parentPrecedence || 0;
  isRightChild = isRightChild || false;

  if (node.type === "number") return String(formatNumber(node.value));

  if (node.type === "negate") {
    return "-" + nodeToText(node.operand, 4, false);
  }

  if (node.type === "binary") {
    const myPrecedence = precedenceOf(node.op);

    const leftText = nodeToText(node.left, myPrecedence, false);
    const rightText = nodeToText(node.right, myPrecedence, true);

    const text =
      leftText + " " + opSymbol(node.op) + " " + rightText;

    // Wrap in parentheses whenever printing it plainly would
    // change its meaning: lower precedence than the parent
    // operator, or same precedence but on the right side of a
    // non-associative chain (e.g. "5 - (4 - 2)" must keep its
    // parens — "5 - 4 - 2" means something different).
    const needsParens =
      myPrecedence < parentPrecedence ||
      (myPrecedence === parentPrecedence && isRightChild);

    return needsParens ? "(" + text + ")" : text;
  }

  return "";
}

function evaluate(node, steps) {
  if (node.type === "number") {
    return node.value;
  }

  if (node.type === "negate") {
    return -evaluate(node.operand, steps);
  }

  if (node.type === "binary") {
    const left = evaluate(node.left, steps);
    const right = evaluate(node.right, steps);

    let result;

    if (node.op === "+") result = left + right;
    else if (node.op === "-") result = left - right;
    else if (node.op === "*") result = left * right;
    else if (node.op === "/") {
      if (right === 0) throw new Error("Division by zero");
      result = left / right;
    }

    result = formatNumber(result);

    steps.push(
      formatNumber(left) +
        " " +
        opSymbol(node.op) +
        " " +
        formatNumber(right) +
        " = " +
        result
    );

    return result;
  }

  throw new Error("Unknown node type");
}

export function trySolveMath(rawInput) {
  if (!rawInput) return null;

  let text = String(rawInput).trim();

  // Strip common leading phrases so "what is 5 + 3" still works.
  text = text.replace(
    /^(what\s+is|what's|calculate|compute|solve|evaluate|find)\s*:?\s*/i,
    ""
  );

  text = text.replace(/\?+$/, "").trim();

  if (!text) return null;

  const normalized = normalizeExpression(text);

  // Must contain at least one digit and at least one operator,
  // and consist ONLY of digits/operators/parens/whitespace —
  // otherwise this isn't a pure arithmetic question and the real
  // AI (with web search) should handle it instead.
  if (!/\d/.test(normalized)) return null;
  if (!/[+\-*/]/.test(normalized)) return null;
  if (!/^[\d+\-*/().\s]+$/.test(normalized)) return null;

  const tokens = tokenize(normalized);

  if (!tokens || !tokens.length) return null;

  try {
    const ast = parseExpression(tokens);
    const steps = [];
    const result = evaluate(ast, steps);

    return {
      matched: true,
      expression: nodeToText(ast),
      result,
      steps
    };

  } catch (error) {
    // Malformed expression (e.g. "5 + + 3", unmatched parens) —
    // fall through and let the real AI take a shot at it instead.
    return null;
  }
}

export function explainMathSolution(solved) {
  if (!solved || !solved.matched) return "";

  const lines = [];

  lines.push(
    `**${solved.expression} = ${solved.result}**`
  );

  lines.push("");

  if (solved.steps.length > 1) {
    lines.push(
      "Here's the step-by-step working " +
      "(order of operations: parentheses first, then × and ÷, then + and −):"
    );

    lines.push("");

    solved.steps.forEach((step, i) => {
      lines.push(`${i + 1}. ${step}`);
    });

  } else if (solved.steps.length === 1) {
    lines.push(`Working: ${solved.steps[0]}`);
  }

  return lines.join("\n");
}

export default { trySolveMath, explainMathSolution };
