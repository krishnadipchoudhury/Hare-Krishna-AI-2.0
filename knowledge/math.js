// knowledge/math.js
//
// Hare Krishna AI 2.0 — Advanced Math Engine
//
// Features:
//   • Natural-language math recognition
//   • Unicode superscripts: 5⁹⁹
//   • Normal powers: 5^99
//   • "5 to the power 99"
//   • "5 raised to 99"
//   • "5 squared", "5 cubed"
//   • +, -, ×, ÷, *, /
//   • Parentheses
//   • Decimals
//   • Negative numbers
//   • Scientific notation
//   • Exact BigInt arithmetic for large integers
//   • Short, natural explanations
//   • Existing trySolveMath() / explainMathSolution() API
//
// No external dependencies.


// ============================================================
// CONFIGURATION
// ============================================================

const MAX_INPUT_LENGTH = 1000;
const MAX_TOKENS = 300;

// Maximum exponent for exact BigInt powers.
// This prevents accidentally creating absurdly huge values.
const MAX_BIGINT_EXPONENT = 100000;


// ============================================================
// SUPERSCRIPT SUPPORT
// ============================================================

const SUPERSCRIPT_MAP = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  "⁺": "+",
  "⁻": "-",
  "⁽": "(",
  "⁾": ")"
};

function superscriptToNormal(text) {
  return String(text).replace(
    /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾]+/g,
    match =>
      match
        .split("")
        .map(ch => SUPERSCRIPT_MAP[ch] ?? ch)
        .join("")
  );
}


// ============================================================
// NUMBER FORMATTING
// ============================================================

function formatBigInt(value) {
  const text = value.toString();

  return text.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ","
  );
}

function formatNumber(value) {
  if (typeof value === "bigint") {
    return formatBigInt(value);
  }

  if (!Number.isFinite(value)) {
    return String(value);
  }

  if (Object.is(value, -0)) {
    return "0";
  }

  const rounded =
    Math.round(
      (value + Number.EPSILON) * 1e12
    ) / 1e12;

  if (Object.is(rounded, -0)) {
    return "0";
  }

  if (!Number.isFinite(rounded)) {
    return String(value);
  }

  if (
    Math.abs(rounded) >= 1e-6 &&
    Math.abs(rounded) < 1e15
  ) {
    return String(rounded);
  }

  return Number(
    rounded.toPrecision(12)
  ).toString();
}

function formatValue(value) {
  return formatNumber(value);
}


// ============================================================
// OPERATOR SYMBOLS
// ============================================================

function opSymbol(op) {
  return {
    "+": "+",
    "-": "−",
    "*": "×",
    "/": "÷",
    "^": "^"
  }[op] || op;
}


// ============================================================
// NATURAL-LANGUAGE MATH EXTRACTION
// ============================================================

function extractMathExpression(raw) {
  let text = String(raw ?? "").trim();

  if (!text) {
    return null;
  }

  // Convert:
  // 5⁹⁹ → 5^99
  text = superscriptToNormal(text);

  // ----------------------------------------------------------
  // Mathematical words
  // ----------------------------------------------------------

  text = text
    .replace(
      /\b(raised to the power of|raised to the power|to the power of|to the power)\b/gi,
      "^"
    )
    .replace(
      /\b(squared)\b/gi,
      "^2"
    )
    .replace(
      /\b(cubed)\b/gi,
      "^3"
    )
    .replace(
      /\b(multiplied by)\b/gi,
      "*"
    )
    .replace(
      /\b(divided by)\b/gi,
      "/"
    );

  // ----------------------------------------------------------
  // Natural-language prefixes
  // ----------------------------------------------------------

  text = text.replace(
    /^\s*please\s+/i,
    ""
  );

  text = text.replace(
    /^\s*can\s+you\s+/i,
    ""
  );

  text = text.replace(
    /^\s*could\s+you\s+/i,
    ""
  );

  text = text.replace(
    /^\s*would\s+you\s+/i,
    ""
  );

  text = text.replace(
    /^\s*help\s+me\s+to\s+/i,
    ""
  );

  text = text.replace(
    /^\s*help\s+me\s+/i,
    ""
  );

  text = text.replace(
    /^\s*(solve|calculate|compute|evaluate|find|answer|work\s*out)\s*:?\s*/i,
    ""
  );

  text = text.replace(
    /^\s*(what\s+is|what's|whats)\s*:?\s*/i,
    ""
  );

  text = text.replace(
    /^\s*tell\s+me\s+(the\s+)?(answer|value)\s+(of|for)\s+/i,
    ""
  );

  text = text.replace(
    /^\s*find\s+(the\s+)?(value|answer)\s+(of|for)\s+/i,
    ""
  );

  text = text.replace(
    /^\s*what\s+is\s+the\s+value\s+of\s+/i,
    ""
  );

  // ----------------------------------------------------------
  // Remove trailing punctuation.
  // ----------------------------------------------------------

  text = text
    .replace(/[?!.]+\s*$/g, "")
    .trim();

  if (!text) {
    return null;
  }

  // ----------------------------------------------------------
  // Try to extract the mathematical expression from
  // remaining natural language.
  //
  // Example:
  // "5^99 please"
  // "please solve 5^99"
  // "can you calculate 15 + 8 × 2"
  // ----------------------------------------------------------

  const match = text.match(
    /[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?(?:\s*[\^+\-*/×÷]\s*[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?|\s*[()])*/i
  );

  if (match && match[0]) {
    return match[0].trim();
  }

  return text;
}


// ============================================================
// NORMALIZATION
// ============================================================

function normalizeExpression(raw) {
  return String(raw ?? "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–—]/g, "-")
    .replace(/[·∙⋅]/g, "*")
    .replace(/\s+/g, " ")
    .trim();
}


// ============================================================
// TOKENIZER
// ============================================================

function tokenize(expr) {
  const tokens = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // --------------------------------------------------------
    // NUMBER
    // --------------------------------------------------------

    if (/[0-9.]/.test(ch)) {
      const start = i;

      let hasDigits = false;
      let hasDot = false;

      while (i < expr.length) {
        const current = expr[i];

        if (/[0-9]/.test(current)) {
          hasDigits = true;
          i++;
          continue;
        }

        if (current === ".") {
          if (hasDot) {
            throw new Error("Invalid decimal");
          }

          hasDot = true;
          i++;
          continue;
        }

        break;
      }

      if (!hasDigits) {
        throw new Error("Invalid number");
      }

      // Scientific notation.
      if (
        expr[i] === "e" ||
        expr[i] === "E"
      ) {
        i++;

        if (
          expr[i] === "+" ||
          expr[i] === "-"
        ) {
          i++;
        }

        const exponentStart = i;

        while (
          i < expr.length &&
          /[0-9]/.test(expr[i])
        ) {
          i++;
        }

        if (i === exponentStart) {
          throw new Error(
            "Invalid scientific notation"
          );
        }
      }

      const rawNumber =
        expr.slice(start, i);

      const value = Number(rawNumber);

      if (!Number.isFinite(value)) {
        throw new Error("Invalid number");
      }

      tokens.push({
        type: "number",
        value,
        raw: rawNumber
      });

      if (tokens.length > MAX_TOKENS) {
        throw new Error("Expression too long");
      }

      continue;
    }

    // --------------------------------------------------------
    // OPERATORS / PARENTHESES
    // --------------------------------------------------------

    if ("+-*/^()".includes(ch)) {
      tokens.push({
        type: ch
      });

      i++;

      if (tokens.length > MAX_TOKENS) {
        throw new Error("Expression too long");
      }

      continue;
    }

    throw new Error("Unknown character");
  }

  return tokens;
}


// ============================================================
// PARSER
// ============================================================

function parseExpression(tokens) {
  let position = 0;

  function peek() {
    return tokens[position];
  }

  function consume() {
    return tokens[position++];
  }

  // ----------------------------------------------------------
  // PRIMARY
  // ----------------------------------------------------------

  function parsePrimary() {
    const token = peek();

    if (!token) {
      throw new Error("Unexpected end");
    }

    if (token.type === "number") {
      consume();

      return {
        type: "number",
        value: token.value,
        raw: token.raw
      };
    }

    if (token.type === "(") {
      consume();

      const child = parseAddSub();

      if (!peek() || peek().type !== ")") {
        throw new Error("Missing parenthesis");
      }

      consume();

      return {
        type: "group",
        child
      };
    }

    throw new Error("Expected number");
  }

  // ----------------------------------------------------------
  // POWER
  // ----------------------------------------------------------

  function parsePower() {
    const left = parsePrimary();

    if (peek() && peek().type === "^") {
      consume();

      const right = parseUnary();

      return {
        type: "binary",
        op: "^",
        left,
        right
      };
    }

    return left;
  }

  // ----------------------------------------------------------
  // UNARY
  // ----------------------------------------------------------

  function parseUnary() {
    const token = peek();

    if (!token) {
      throw new Error("Unexpected end");
    }

    if (
      token.type === "+" ||
      token.type === "-"
    ) {
      consume();

      return {
        type: "unary",
        op: token.type,
        operand: parseUnary()
      };
    }

    return parsePower();
  }

  // ----------------------------------------------------------
  // MULTIPLICATION / DIVISION
  // ----------------------------------------------------------

  function parseMulDiv() {
    let node = parseUnary();

    while (
      peek() &&
      (
        peek().type === "*" ||
        peek().type === "/"
      )
    ) {
      const op = consume();

      const right = parseUnary();

      node = {
        type: "binary",
        op: op.type,
        left: node,
        right
      };
    }

    return node;
  }

  // ----------------------------------------------------------
  // ADDITION / SUBTRACTION
  // ----------------------------------------------------------

  function parseAddSub() {
    let node = parseMulDiv();

    while (
      peek() &&
      (
        peek().type === "+" ||
        peek().type === "-"
      )
    ) {
      const op = consume();

      const right = parseMulDiv();

      node = {
        type: "binary",
        op: op.type,
        left: node,
        right
      };
    }

    return node;
  }

  const ast = parseAddSub();

  if (position !== tokens.length) {
    throw new Error(
      "Unexpected trailing tokens"
    );
  }

  return ast;
}


// ============================================================
// BIGINT HELPERS
// ============================================================

function toBigIntExact(value) {
  if (typeof value === "bigint") {
    return value;
  }

  if (
    typeof value === "number" &&
    Number.isSafeInteger(value)
  ) {
    return BigInt(value);
  }

  return null;
}


function bigIntPower(base, exponent) {
  if (exponent < 0n) {
    return null;
  }

  if (
    exponent >
    BigInt(MAX_BIGINT_EXPONENT)
  ) {
    throw new Error("Exponent too large");
  }

  let result = 1n;
  let current = base;
  let power = exponent;

  // Fast exponentiation.
  while (power > 0n) {
    if (power % 2n === 1n) {
      result *= current;
    }

    power /= 2n;

    if (power > 0n) {
      current *= current;
    }
  }

  return result;
}


// ============================================================
// CALCULATE BINARY OPERATION
// ============================================================

function calculateBinary(
  op,
  left,
  right
) {
  const leftBig = toBigIntExact(left);
  const rightBig = toBigIntExact(right);

  // ----------------------------------------------------------
  // Exact integer + - *
  // ----------------------------------------------------------

  if (
    leftBig !== null &&
    rightBig !== null
  ) {
    if (op === "+") {
      return leftBig + rightBig;
    }

    if (op === "-") {
      return leftBig - rightBig;
    }

    if (op === "*") {
      return leftBig * rightBig;
    }
  }

  // ----------------------------------------------------------
  // Exact integer division when divisible.
  // ----------------------------------------------------------

  if (
    op === "/" &&
    leftBig !== null &&
    rightBig !== null
  ) {
    if (rightBig === 0n) {
      throw new Error(
        "Division by zero"
      );
    }

    if (leftBig % rightBig === 0n) {
      return leftBig / rightBig;
    }

    return Number(left) / Number(right);
  }

  // ----------------------------------------------------------
  // Exact huge integer powers.
  // ----------------------------------------------------------

  if (
    op === "^" &&
    leftBig !== null &&
    rightBig !== null
  ) {
    if (rightBig < 0n) {
      const positivePower =
        bigIntPower(
          leftBig,
          -rightBig
        );

      if (positivePower === null) {
        return null;
      }

      return 1 / Number(positivePower);
    }

    return bigIntPower(
      leftBig,
      rightBig
    );
  }

  // ----------------------------------------------------------
  // Normal Number arithmetic.
  // ----------------------------------------------------------

  const a =
    typeof left === "bigint"
      ? Number(left)
      : left;

  const b =
    typeof right === "bigint"
      ? Number(right)
      : right;

  let result;

  switch (op) {
    case "+":
      result = a + b;
      break;

    case "-":
      result = a - b;
      break;

    case "*":
      result = a * b;
      break;

    case "/":
      if (b === 0) {
        throw new Error(
          "Division by zero"
        );
      }

      result = a / b;
      break;

    case "^":
      result = Math.pow(a, b);
      break;

    default:
      throw new Error(
        "Unknown operator"
      );
  }

  if (!Number.isFinite(result)) {
    throw new Error("Invalid result");
  }

  return result;
}


// ============================================================
// EVALUATE WITH STEPS
// ============================================================

function evaluateWithSteps(
  node,
  steps
) {
  // Number
  if (node.type === "number") {
    if (
      Number.isSafeInteger(
        node.value
      )
    ) {
      return BigInt(node.value);
    }

    return node.value;
  }

  // Parentheses
  if (node.type === "group") {
    return evaluateWithSteps(
      node.child,
      steps
    );
  }

  // Unary + / -
  if (node.type === "unary") {
    const value =
      evaluateWithSteps(
        node.operand,
        steps
      );

    if (node.op === "-") {
      return -value;
    }

    return value;
  }

  // Binary operation
  if (node.type === "binary") {
    const left =
      evaluateWithSteps(
        node.left,
        steps
      );

    const right =
      evaluateWithSteps(
        node.right,
        steps
      );

    const result =
      calculateBinary(
        node.op,
        left,
        right
      );

    steps.push({
      op: node.op,
      left,
      right,
      result,

      text:
        formatValue(left) +
        " " +
        opSymbol(node.op) +
        " " +
        formatValue(right) +
        " = " +
        formatValue(result)
    });

    return result;
  }

  throw new Error(
    "Unknown expression node"
  );
}


// ============================================================
// PRECEDENCE
// ============================================================

function precedenceOf(op) {
  if (
    op === "+" ||
    op === "-"
  ) {
    return 1;
  }

  if (
    op === "*" ||
    op === "/"
  ) {
    return 2;
  }

  if (op === "^") {
    return 3;
  }

  return 0;
}


// ============================================================
// AST → DISPLAY EXPRESSION
// ============================================================

function nodeToText(
  node,
  parentPrecedence = 0,
  isRightChild = false
) {
  if (!node) {
    return "";
  }

  if (node.type === "number") {
    return (
      node.raw ??
      formatValue(node.value)
    );
  }

  if (node.type === "group") {
    return (
      "(" +
      nodeToText(node.child) +
      ")"
    );
  }

  if (node.type === "unary") {
    const operand =
      nodeToText(
        node.operand,
        4,
        false
      );

    return node.op === "-"
      ? "−" + operand
      : "+" + operand;
  }

  if (node.type === "binary") {
    const precedence =
      precedenceOf(node.op);

    let left =
      nodeToText(
        node.left,
        precedence,
        false
      );

    let right =
      nodeToText(
        node.right,
        precedence,
        true
      );

    let text =
      left +
      " " +
      opSymbol(node.op) +
      " " +
      right;

    let needsParentheses =
      precedence <
      parentPrecedence;

    if (
      precedence ===
        parentPrecedence &&
      isRightChild &&
      (
        node.op === "-" ||
        node.op === "/"
      )
    ) {
      needsParentheses = true;
    }

    if (needsParentheses) {
      text =
        "(" +
        text +
        ")";
    }

    return text;
  }

  return "";
}


// ============================================================
// COLLECT OPERATORS
// ============================================================

function collectOperators(
  node,
  list = []
) {
  if (!node) {
    return list;
  }

  if (node.type === "group") {
    return collectOperators(
      node.child,
      list
    );
  }

  if (node.type === "unary") {
    return collectOperators(
      node.operand,
      list
    );
  }

  if (node.type === "binary") {
    collectOperators(
      node.left,
      list
    );

    list.push(node.op);

    collectOperators(
      node.right,
      list
    );
  }

  return list;
}


// ============================================================
// EXPLANATION HINT
// ============================================================

function getExplanationHint(
  expression,
  ast,
  steps
) {
  const operators =
    collectOperators(ast);

  // ----------------------------------------------------------
  // Powers
  // ----------------------------------------------------------

  if (operators.includes("^")) {
    const powerStep =
      steps.find(
        step => step.op === "^"
      );

    if (powerStep) {
      const base =
        formatValue(powerStep.left);

      const exponent =
        formatValue(powerStep.right);

      return (
        `**${base}^${exponent} means multiplying ${base} by itself ${exponent} times.**`
      );
    }

    return (
      "A power means multiplying the base by itself the given number of times."
    );
  }

  // ----------------------------------------------------------
  // Parentheses
  // ----------------------------------------------------------

  if (expression.includes("(")) {
    return (
      "The parentheses are solved first."
    );
  }

  // ----------------------------------------------------------
  // Mixed operations
  // ----------------------------------------------------------

  const hasMultiplyDivide =
    operators.includes("*") ||
    operators.includes("/");

  const hasAddSubtract =
    operators.includes("+") ||
    operators.includes("-");

  if (
    hasMultiplyDivide &&
    hasAddSubtract
  ) {
    return (
      "Multiplication and division come before addition and subtraction."
    );
  }

  // ----------------------------------------------------------
  // Addition / subtraction only
  // ----------------------------------------------------------

  if (
    operators.length > 0 &&
    operators.every(
      op =>
        op === "+" ||
        op === "-"
    )
  ) {
    return (
      "Work from left to right."
    );
  }

  return "";
}


// ============================================================
// MAIN SOLVER
// ============================================================

export function trySolveMath(
  rawInput
) {
  if (
    rawInput === null ||
    rawInput === undefined
  ) {
    return null;
  }

  let text =
    String(rawInput).trim();

  if (
    !text ||
    text.length >
      MAX_INPUT_LENGTH
  ) {
    return null;
  }

  // ----------------------------------------------------------
  // Natural-language extraction
  // ----------------------------------------------------------

  text =
    extractMathExpression(text);

  if (!text) {
    return null;
  }

  // ----------------------------------------------------------
  // Normalize
  // ----------------------------------------------------------

  const normalized =
    normalizeExpression(text);

  if (!normalized) {
    return null;
  }

  // ----------------------------------------------------------
  // Basic math validation
  // ----------------------------------------------------------

  if (!/\d/.test(normalized)) {
    return null;
  }

  if (
    !/[+\-*/^]/.test(
      normalized
    )
  ) {
    return null;
  }

  // Only arithmetic characters.
  if (
    !/^[\d+\-*/^().eE\s]+$/.test(
      normalized
    )
  ) {
    return null;
  }

  try {
    // --------------------------------------------------------
    // Tokenize
    // --------------------------------------------------------

    const tokens =
      tokenize(normalized);

    if (
      !tokens ||
      tokens.length === 0
    ) {
      return null;
    }

    // --------------------------------------------------------
    // Parse
    // --------------------------------------------------------

    const ast =
      parseExpression(tokens);

    // --------------------------------------------------------
    // Evaluate
    // --------------------------------------------------------

    const steps = [];

    const result =
      evaluateWithSteps(
        ast,
        steps
      );

    // --------------------------------------------------------
    // Display expression
    // --------------------------------------------------------

    const expression =
      nodeToText(ast);

    // --------------------------------------------------------
    // Explanation
    // --------------------------------------------------------

    const hint =
      getExplanationHint(
        expression,
        ast,
        steps
      );

    return {
      matched: true,

      expression,

      result,

      formattedResult:
        formatValue(result),

      steps,

      hint,

      exact:
        typeof result === "bigint",

      operatorCount:
        tokens.filter(
          token =>
            [
              "+",
              "-",
              "*",
              "/",
              "^"
            ].includes(
              token.type
            )
        ).length
    };

  } catch (error) {
    // Invalid arithmetic:
    // allow the normal AI/web system
    // to handle the request.
    return null;
  }
}


// ============================================================
// EXPLANATION GENERATOR
// ============================================================

export function explainMathSolution(
  solved
) {
  if (
    !solved ||
    !solved.matched
  ) {
    return "";
  }

  const lines = [];

  const finalResult =
    solved.formattedResult ??
    formatValue(
      solved.result
    );

  // ----------------------------------------------------------
  // Main result
  // ----------------------------------------------------------

  lines.push(
    `**${solved.expression} = ${finalResult}**`
  );

  const steps =
    solved.steps || [];

  // ----------------------------------------------------------
  // Single operation
  // ----------------------------------------------------------

  if (steps.length === 1) {
    lines.push("");

    if (solved.hint) {
      lines.push(
        solved.hint
      );

      lines.push("");
    }

    lines.push(
      `**${steps[0].text}**`
    );

    return lines.join("\n");
  }

  // ----------------------------------------------------------
  // Multiple operations
  // ----------------------------------------------------------

  if (solved.hint) {
    lines.push("");
    lines.push(
      solved.hint
    );
  }

  lines.push("");

  steps.forEach(
    (step, index) => {
      lines.push(
        `${index + 1}. **${step.text}**`
      );
    }
  );

  lines.push("");

  lines.push(
    `**Answer: ${finalResult}**`
  );

  return lines.join("\n");
}


// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  trySolveMath,
  explainMathSolution
};