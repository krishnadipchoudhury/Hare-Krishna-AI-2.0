// knowledge/math.js
//
// Hare Krishna AI 2.0 — Mathematics Engine
//
// Supports:
//   • Arithmetic
//   • Large powers
//   • Squares
//   • Square roots
//   • π / pi
//   • Linear equations
//   • Simple quadratic equations
//   • Natural-language math requests
//   • Formulas + substitutions + explanations
//
// No external dependencies.
//
// Existing API:
//   trySolveMath(input)
//   explainMathSolution(result)


// ============================================================
// CONFIG
// ============================================================

const MAX_INPUT_LENGTH = 1000;
const MAX_TOKENS = 300;
const MAX_BIGINT_EXPONENT = 100000;


// ============================================================
// SUPERSCRIPTS
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
// GENERAL FORMATTING
// ============================================================

function formatBigInt(value) {
  return value
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

  return String(rounded);
}

function formatValue(value) {
  return formatNumber(value);
}

function cleanNumber(value) {
  if (
    typeof value === "number" &&
    Number.isInteger(value)
  ) {
    return String(value);
  }

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
// NATURAL LANGUAGE CLEANING
// ============================================================

function extractMathExpression(raw) {
  let text = String(raw ?? "").trim();

  if (!text) return null;

  text = superscriptToNormal(text);

  // Unicode mathematical symbols.
  text = text
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–—]/g, "-")
    .replace(/π/gi, "pi")
    .replace(/√/g, "sqrt ");

  // Powers written in words.
  text = text
    .replace(
      /\b(raised to the power of|raised to the power|to the power of|to the power)\b/gi,
      "^"
    )
    .replace(/\bsquared\b/gi, "^2")
    .replace(/\bcubed\b/gi, "^3");

  // Multiplication/division words.
  text = text
    .replace(/\bmultiplied by\b/gi, "*")
    .replace(/\bdivided by\b/gi, "/");

  // Common request phrases.
  text = text
    .replace(/^\s*please\s+/i, "")
    .replace(/^\s*can\s+you\s+/i, "")
    .replace(/^\s*could\s+you\s+/i, "")
    .replace(/^\s*would\s+you\s+/i, "")
    .replace(/^\s*help\s+me\s+to\s+/i, "")
    .replace(/^\s*help\s+me\s+/i, "")
    .replace(
      /^\s*(solve|calculate|compute|evaluate|work out|answer)\s*:?\s*/i,
      ""
    )
    .replace(
      /^\s*(what is|what's|whats)\s*:?\s*/i,
      ""
    )
    .replace(
      /^\s*find\s+(the\s+)?(value|answer)\s+(of|for)\s+/i,
      ""
    )
    .replace(
      /^\s*tell\s+me\s+(the\s+)?(answer|value)\s+(of|for)\s+/i,
      ""
    );

  text = text
    .replace(/[?!.]+\s*$/g, "")
    .trim();

  return text || null;
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

    // Number
    if (/[0-9.]/.test(ch)) {
      const start = i;
      let hasDigit = false;
      let hasDot = false;

      while (i < expr.length) {
        const c = expr[i];

        if (/[0-9]/.test(c)) {
          hasDigit = true;
          i++;
          continue;
        }

        if (c === ".") {
          if (hasDot) {
            throw new Error("Invalid decimal");
          }

          hasDot = true;
          i++;
          continue;
        }

        break;
      }

      if (!hasDigit) {
        throw new Error("Invalid number");
      }

      const raw = expr.slice(start, i);
      const value = Number(raw);

      if (!Number.isFinite(value)) {
        throw new Error("Invalid number");
      }

      tokens.push({
        type: "number",
        value,
        raw
      });

      continue;
    }

    // Constant pi
    if (
      expr.slice(i, i + 2).toLowerCase() === "pi"
    ) {
      tokens.push({
        type: "number",
        value: Math.PI,
        raw: "π"
      });

      i += 2;
      continue;
    }

    // Operators
    if ("+-*/^()".includes(ch)) {
      tokens.push({
        type: ch
      });

      i++;
      continue;
    }

    throw new Error(
      "Unknown character: " + ch
    );
  }

  if (tokens.length > MAX_TOKENS) {
    throw new Error("Too many tokens");
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

      if (
        !peek() ||
        peek().type !== ")"
      ) {
        throw new Error(
          "Missing closing parenthesis"
        );
      }

      consume();

      return {
        type: "group",
        child
      };
    }

    throw new Error("Expected number");
  }

  function parsePower() {
    const left = parsePrimary();

    if (
      peek() &&
      peek().type === "^"
    ) {
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
// AST DISPLAY
// ============================================================

function precedenceOf(op) {
  if (op === "+" || op === "-") return 1;
  if (op === "*" || op === "/") return 2;
  if (op === "^") return 3;
  return 0;
}

function nodeToText(
  node,
  parentPrecedence = 0,
  rightChild = false
) {
  if (node.type === "number") {
    return node.raw;
  }

  if (node.type === "group") {
    return (
      "(" +
      nodeToText(node.child) +
      ")"
    );
  }

  if (node.type === "unary") {
    return (
      node.op +
      nodeToText(
        node.operand,
        4,
        false
      )
    );
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

    const needsParentheses =
      precedence < parentPrecedence ||
      (
        precedence === parentPrecedence &&
        rightChild &&
        (
          node.op === "-" ||
          node.op === "/"
        )
      );

    if (needsParentheses) {
      text = "(" + text + ")";
    }

    return text;
  }

  return "";
}


// ============================================================
// EVALUATION
// ============================================================

function calculateBinary(
  op,
  left,
  right
) {
  const leftBig = toBigIntExact(left);
  const rightBig = toBigIntExact(right);

  // Exact integers.
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

    if (op === "/") {
      if (rightBig === 0n) {
        throw new Error(
          "Division by zero"
        );
      }

      if (leftBig % rightBig === 0n) {
        return leftBig / rightBig;
      }
    }

    if (op === "^") {
      if (rightBig >= 0n) {
        return bigIntPower(
          leftBig,
          rightBig
        );
      }
    }
  }

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
    throw new Error(
      "Invalid result"
    );
  }

  return result;
}

function evaluate(
  node,
  steps
) {
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

  if (node.type === "group") {
    return evaluate(
      node.child,
      steps
    );
  }

  if (node.type === "unary") {
    const value =
      evaluate(
        node.operand,
        steps
      );

    return node.op === "-"
      ? -value
      : value;
  }

  if (node.type === "binary") {
    const left =
      evaluate(
        node.left,
        steps
      );

    const right =
      evaluate(
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
      type: "calculation",
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
    "Unknown AST node"
  );
}


// ============================================================
// SPECIAL: SQUARE
// ============================================================

function solveSquare(text) {
  const match = text.match(
    /(?:square\s+of|square)\s*(-?\d+(?:\.\d+)?)|(-?\d+(?:\.\d+)?)\s*(?:square|²)/i
  );

  if (!match) return null;

  const value = Number(
    match[1] ?? match[2]
  );

  if (!Number.isFinite(value)) {
    return null;
  }

  const result = value * value;

  return {
    matched: true,
    kind: "square",
    expression: `${cleanNumber(value)}²`,
    result,
    formattedResult: formatValue(result),

    formula: "a² = a × a",

    explanation:
      `The square of a number means multiplying the number by itself.`,

    steps: [
      `${cleanNumber(value)}² = ${cleanNumber(value)} × ${cleanNumber(value)}`,
      `${cleanNumber(value)} × ${cleanNumber(value)} = ${formatValue(result)}`
    ]
  };
}


// ============================================================
// SPECIAL: SQUARE ROOT
// ============================================================

function solveSquareRoot(text) {
  let match =
    text.match(
      /(?:square\s+root\s+of|sqrt)\s*\(?\s*(-?\d+(?:\.\d+)?)\s*\)?/i
    );

  if (!match) {
    match =
      text.match(
        /√\s*\(?\s*(-?\d+(?:\.\d+)?)\s*\)?/
      );
  }

  if (!match) return null;

  const value = Number(match[1]);

  if (value < 0) {
    return {
      matched: true,
      kind: "square-root-error",
      expression: `√${value}`,
      error:
        "A negative number does not have a real square root.",
      steps: []
    };
  }

  const result = Math.sqrt(value);

  const isPerfectSquare =
    Number.isInteger(result);

  const steps = [
    `√${cleanNumber(value)} = ${formatValue(result)}`
  ];

  if (isPerfectSquare) {
    steps.unshift(
      `${formatValue(result)} × ${formatValue(result)} = ${cleanNumber(value)}`
    );
  }

  return {
    matched: true,
    kind: "square-root",
    expression: `√${cleanNumber(value)}`,
    result,
    formattedResult: formatValue(result),

    formula:
      "√a = number that, when multiplied by itself, gives a",

    explanation:
      isPerfectSquare
        ? `The square root is the number whose square equals ${cleanNumber(value)}.`
        : `The square root of ${cleanNumber(value)} is approximately ${formatValue(result)}.`,

    steps
  };
}


// ============================================================
// SPECIAL: CIRCLE / PI
// ============================================================

function solveCircle(text) {
  const lower = text.toLowerCase();

  // Area of circle.
  const areaMatch = lower.match(
    /(?:area\s+of\s+(?:a\s+)?circle|circle\s+area).*?(?:radius|r)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)/i
  );

  if (areaMatch) {
    const r = Number(areaMatch[1]);
    const area = Math.PI * r * r;

    return {
      matched: true,
      kind: "circle-area",
      expression: `Area of circle, r = ${r}`,
      result: area,
      formattedResult: formatValue(area),

      formula: "A = πr²",

      explanation:
        "The area of a circle is found using **A = πr²**, where r is the radius.",

      steps: [
        `A = π × ${r}²`,
        `A = π × ${r * r}`,
        `A ≈ ${formatValue(area)}`
      ]
    };
  }

  // Circumference.
  const circumferenceMatch = lower.match(
    /(?:circumference|perimeter)\s+(?:of\s+(?:a\s+)?)?circle.*?(?:radius|r)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)/i
  );

  if (circumferenceMatch) {
    const r = Number(
      circumferenceMatch[1]
    );

    const circumference =
      2 * Math.PI * r;

    return {
      matched: true,
      kind: "circle-circumference",
      expression:
        `Circumference, r = ${r}`,

      result: circumference,

      formattedResult:
        formatValue(circumference),

      formula: "C = 2πr",

      explanation:
        "The circumference of a circle is found using **C = 2πr**.",

      steps: [
        `C = 2 × π × ${r}`,
        `C ≈ ${formatValue(circumference)}`
      ]
    };
  }

  return null;
}


// ============================================================
// SPECIAL: LINEAR ALGEBRA
// ============================================================
//
// Handles equations such as:
//
// 2x + 5 = 15
// 3x - 7 = 11
// x / 2 + 3 = 7
// 5x = 25
// x + 8 = 20
//
// The equation is converted into:
//
// ax + b = c
//
// Then:
//
// ax = c - b
//
// x = (c - b) / a
// ============================================================

function solveLinearEquation(text) {
  let equation = text
    .replace(/\s+/g, "")
    .replace(/×/g, "*")
    .replace(/−/g, "-");

  if (
    !equation.includes("=") ||
    !/[xX]/.test(equation)
  ) {
    return null;
  }

  // Remove common wording.
  equation = equation
    .replace(
      /^(solve|calculate|findx|find)x?/i,
      ""
    );

  const parts =
    equation.split("=");

  if (parts.length !== 2) {
    return null;
  }

  const left = parts[0];
  const right = parts[1];

  if (!left || !right) {
    return null;
  }

  // Only simple linear expressions.
  const linearPattern =
    /^([+-]?\d*\.?\d*)x(?:([+-]\d+(?:\.\d+)?))?$/i;

  const leftMatch =
    left.match(linearPattern);

  const rightMatch =
    right.match(linearPattern);

  const leftNumber =
    parseConstantSide(left);

  const rightNumber =
    parseConstantSide(right);

  let a = 0;
  let b = 0;
  let c = 0;
  let d = 0;

  if (leftMatch) {
    a =
      parseCoefficient(
        leftMatch[1]
      );

    b =
      leftMatch[2]
        ? Number(leftMatch[2])
        : 0;
  } else if (
    leftNumber !== null
  ) {
    b = leftNumber;
  } else {
    return null;
  }

  if (rightMatch) {
    d =
      parseCoefficient(
        rightMatch[1]
      );

    c =
      rightMatch[2]
        ? Number(rightMatch[2])
        : 0;
  } else if (
    rightNumber !== null
  ) {
    c = rightNumber;
  } else {
    return null;
  }

  // ax + b = dx + c
  const coefficient =
    a - d;

  const constant =
    c - b;

  if (coefficient === 0) {
    return null;
  }

  const x =
    constant / coefficient;

  return {
    matched: true,
    kind: "linear-equation",

    expression: equation,

    result: x,

    formattedResult:
      formatValue(x),

    formula:
      "ax + b = c  →  ax = c − b  →  x = (c − b) / a",

    explanation:
      "We isolate x by moving the constant term first, then divide by the coefficient of x.",

    steps: [
      `${formatValue(a)}x + ${formatValue(b)} = ${formatValue(c)}`,
      `${formatValue(a)}x = ${formatValue(c)} − ${formatValue(b)}`,
      `${formatValue(a)}x = ${formatValue(constant)}`,
      `x = ${formatValue(constant)} ÷ ${formatValue(coefficient)}`,
      `x = ${formatValue(x)}`
    ]
  };
}

function parseCoefficient(value) {
  if (value === "" || value === "+") {
    return 1;
  }

  if (value === "-") {
    return -1;
  }

  return Number(value);
}

function parseConstantSide(value) {
  if (
    !/^[+-]?\d+(?:\.\d+)?$/.test(value)
  ) {
    return null;
  }

  return Number(value);
}


// ============================================================
// SPECIAL: QUADRATIC EQUATION
// ============================================================
//
// Handles:
//
// x² - 5x + 6 = 0
// x^2 - 5x + 6 = 0
//
// Formula:
//
// x = (-b ± √(b² - 4ac)) / 2a
// ============================================================

function solveQuadraticEquation(text) {
  let equation =
    text
      .replace(/\s+/g, "")
      .replace(/×/g, "*")
      .replace(/−/g, "-");

  equation =
    superscriptToNormal(
      equation
    );

  if (
    !equation.includes("=") ||
    !/[xX]\^2/i.test(equation)
  ) {
    return null;
  }

  const parts =
    equation.split("=");

  if (parts.length !== 2) {
    return null;
  }

  if (parts[1] !== "0") {
    return null;
  }

  const left = parts[0];

  const match =
    left.match(
      /^([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*x)?([+-]\d+(?:\.\d+)?)?$/i
    );

  if (!match) {
    return null;
  }

  const a =
    parseCoefficient(
      match[1]
    );

  let b = 0;

  if (match[2]) {
    const coefficient =
      match[2].replace(/x$/i, "");

    b =
      parseCoefficient(
        coefficient
      );
  }

  const c =
    match[3]
      ? Number(match[3])
      : 0;

  const discriminant =
    b * b - 4 * a * c;

  const formula =
    "x = (−b ± √(b² − 4ac)) / 2a";

  if (discriminant < 0) {
    return {
      matched: true,
      kind: "quadratic-no-real",

      expression: equation,

      formula,

      explanation:
        "The discriminant is negative, so this equation has no real solutions.",

      steps: [
        `D = b² − 4ac`,
        `D = (${b})² − 4(${a})(${c})`,
        `D = ${formatValue(discriminant)}`
      ]
    };
  }

  const sqrtD =
    Math.sqrt(discriminant);

  const x1 =
    (-b + sqrtD) /
    (2 * a);

  const x2 =
    (-b - sqrtD) /
    (2 * a);

  const steps = [
    `a = ${formatValue(a)}, b = ${formatValue(b)}, c = ${formatValue(c)}`,
    `D = b² − 4ac`,
    `D = (${b})² − 4(${a})(${c})`,
    `D = ${formatValue(discriminant)}`,
    `x = (−b ± √D) / 2a`,
    `x₁ = ${formatValue(x1)}`,
    `x₂ = ${formatValue(x2)}`
  ];

  return {
    matched: true,
    kind: "quadratic-equation",

    expression: equation,

    result: [x1, x2],

    formattedResult:
      `x₁ = ${formatValue(x1)}, x₂ = ${formatValue(x2)}`,

    formula,

    explanation:
      "This is a quadratic equation. We use the quadratic formula to find its two possible solutions.",

    steps
  };
}


// ============================================================
// MAIN MATH SOLVER
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

  const cleaned =
    extractMathExpression(
      text
    );

  if (!cleaned) {
    return null;
  }

  // ----------------------------------------------------------
  // SPECIAL MATH TYPES FIRST
  // ----------------------------------------------------------

  const square =
    solveSquare(cleaned);

  if (square) {
    return square;
  }

  const squareRoot =
    solveSquareRoot(cleaned);

  if (squareRoot) {
    return squareRoot;
  }

  const circle =
    solveCircle(cleaned);

  if (circle) {
    return circle;
  }

  // Equations containing x.
  if (
    /[xX]/.test(cleaned) &&
    cleaned.includes("=")
  ) {
    const quadratic =
      solveQuadraticEquation(
        cleaned
      );

    if (quadratic) {
      return quadratic;
    }

    const linear =
      solveLinearEquation(
        cleaned
      );

    if (linear) {
      return linear;
    }
  }

  // ----------------------------------------------------------
  // NORMAL ARITHMETIC
  // ----------------------------------------------------------

  let expression =
    cleaned
      .replace(/\bpi\b/gi, "pi")
      .trim();

  // sqrt isn't handled by the general parser.
  if (
    /\bsqrt\b/i.test(expression)
  ) {
    return null;
  }

  // Convert pi into a token-compatible
  // numeric constant.
  expression =
    expression.replace(
      /\bpi\b/gi,
      String(Math.PI)
    );

  if (
    !/\d/.test(expression)
  ) {
    return null;
  }

  if (
    !/[+\-*/^]/.test(expression)
  ) {
    return null;
  }

  if (
    !/^[\d+\-*/^().eE\s]+$/.test(
      expression
    )
  ) {
    return null;
  }

  try {
    const tokens =
      tokenize(expression);

    if (
      !tokens ||
      !tokens.length
    ) {
      return null;
    }

    const ast =
      parseExpression(tokens);

    const steps = [];

    const result =
      evaluate(
        ast,
        steps
      );

    return {
      matched: true,
      kind: "arithmetic",

      expression:
        nodeToText(ast),

      result,

      formattedResult:
        formatValue(result),

      steps,

      exact:
        typeof result === "bigint",

      formula: null,
      explanation: null
    };

  } catch (error) {
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

  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  if (solved.error) {
    lines.push(
      `**${solved.error}**`
    );

    return lines.join("\n");
  }

  // ----------------------------------------------------------
  // SQUARE ROOT
  // ----------------------------------------------------------

  if (
    solved.kind ===
    "square-root"
  ) {
    lines.push(
      `**${solved.expression} = ${solved.formattedResult}**`
    );

    lines.push("");

    lines.push(
      `**Formula:** ${solved.formula}`
    );

    lines.push("");

    lines.push(
      solved.explanation
    );

    lines.push("");

    solved.steps.forEach(
      (step, index) => {
        lines.push(
          `${index + 1}. ${step}`
        );
      }
    );

    return lines.join("\n");
  }

  // ----------------------------------------------------------
  // SQUARE
  // ----------------------------------------------------------

  if (
    solved.kind === "square"
  ) {
    lines.push(
      `**${solved.expression} = ${solved.formattedResult}**`
    );

    lines.push("");

    lines.push(
      `**Formula:** ${solved.formula}`
    );

    lines.push("");

    lines.push(
      solved.explanation
    );

    lines.push("");

    solved.steps.forEach(
      (step, index) => {
        lines.push(
          `${index + 1}. ${step}`
        );
      }
    );

    return lines.join("\n");
  }

  // ----------------------------------------------------------
  // CIRCLE / PI
  // ----------------------------------------------------------

  if (
    solved.kind ===
      "circle-area" ||
    solved.kind ===
      "circle-circumference"
  ) {
    lines.push(
      `**Answer: ${solved.formattedResult}**`
    );

    lines.push("");

    lines.push(
      `**Formula:** ${solved.formula}`
    );

    lines.push("");

    lines.push(
      solved.explanation
    );

    lines.push("");

    solved.steps.forEach(
      (step, index) => {
        lines.push(
          `${index + 1}. ${step}`
        );
      }
    );

    return lines.join("\n");
  }

  // ----------------------------------------------------------
  // LINEAR EQUATION
  // ----------------------------------------------------------

  if (
    solved.kind ===
    "linear-equation"
  ) {
    lines.push(
      `**Answer: x = ${solved.formattedResult}**`
    );

    lines.push("");

    lines.push(
      `**Formula:** ${solved.formula}`
    );

    lines.push("");

    lines.push(
      solved.explanation
    );

    lines.push("");

    lines.push("**Working:**");

    solved.steps.forEach(
      (step, index) => {
        lines.push(
          `${index + 1}. ${step}`
        );
      }
    );

    return lines.join("\n");
  }

  // ----------------------------------------------------------
  // QUADRATIC
  // ----------------------------------------------------------

  if (
    solved.kind ===
      "quadratic-equation" ||
    solved.kind ===
      "quadratic-no-real"
  ) {
    lines.push(
      `**${solved.formattedResult ?? "No real solution"}**`
    );

    lines.push("");

    lines.push(
      `**Formula:** ${solved.formula}`
    );

    lines.push("");

    lines.push(
      solved.explanation
    );

    lines.push("");

    lines.push("**Working:**");

    solved.steps.forEach(
      (step, index) => {
        lines.push(
          `${index + 1}. ${step}`
        );
      }
    );

    return lines.join("\n");
  }

  // ----------------------------------------------------------
  // NORMAL ARITHMETIC
  // ----------------------------------------------------------

  lines.push(
    `**${solved.expression} = ${solved.formattedResult}**`
  );

  if (
    solved.steps &&
    solved.steps.length
  ) {
    lines.push("");

    solved.steps.forEach(
      (step, index) => {
        lines.push(
          `${index + 1}. **${step.text}**`
        );
      }
    );
  }

  return lines.join("\n");
}


// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  trySolveMath,
  explainMathSolution
};