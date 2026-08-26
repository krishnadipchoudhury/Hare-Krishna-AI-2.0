// knowledge/math.js
// Hare Krishna AI 2.0 — Mathematics Engine
// Supports arithmetic, powers, squares, square roots, pi/circles,
// fractions, mixed fractions, linear equations and quadratics.

const MAX_INPUT_LENGTH = 1000;
const MAX_TOKENS = 300;
const MAX_BIGINT_EXPONENT = 100000;

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
    (match) =>
      match
        .split("")
        .map((char) => SUPERSCRIPT_MAP[char] ?? char)
        .join("")
  );
}

function formatBigInt(value) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
    Math.round((value + Number.EPSILON) * 1e12) / 1e12;

  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function formatValue(value) {
  return formatNumber(value);
}

function cleanNumber(value) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return String(value);
  }

  return formatNumber(value);
}

function opSymbol(op) {
  return {
    "+": "+",
    "-": "−",
    "*": "×",
    "/": "÷",
    "^": "^"
  }[op] || op;
}

function extractMathExpression(raw) {
  let text = String(raw ?? "").trim();

  if (!text) {
    return null;
  }

  text = superscriptToNormal(text)
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–—]/g, "-")
    .replace(/π/gi, "pi")
    .replace(/√/g, "sqrt ");

  text = text
    .replace(
      /\b(raised to the power of|raised to the power|to the power of|to the power)\b/gi,
      "^"
    )
    .replace(/\bsquared\b/gi, "^2")
    .replace(/\bcubed\b/gi, "^3")
    .replace(/\bmultiplied by\b/gi, "*")
    .replace(/\bdivided by\b/gi, "/");

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
    .replace(/^\s*(what is|what's|whats)\s*:?\s*/i, "")
    .replace(
      /^\s*find\s+(the\s+)?(value|answer)\s+(of|for)\s+/i,
      ""
    )
    .replace(
      /^\s*tell\s+me\s+(the\s+)?(answer|value)\s+(of|for)\s+/i,
      ""
    )
    .replace(/[?!.]+\s*$/g, "")
    .trim();

  return text || null;
}

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

  if (exponent > BigInt(MAX_BIGINT_EXPONENT)) {
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
      const start = i;
      let hasDigit = false;
      let hasDot = false;

      while (i < expr.length) {
        const current = expr[i];

        if (/[0-9]/.test(current)) {
          hasDigit = true;
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

    if ("+-*/^()".includes(ch)) {
      tokens.push({
        type: ch
      });

      i++;
      continue;
    }

    throw new Error("Unknown character: " + ch);
  }

  if (tokens.length > MAX_TOKENS) {
    throw new Error("Too many tokens");
  }

  return tokens;
}

function parseExpression(tokens) {
  let position = 0;

  const peek = () => tokens[position];

  const consume = () => tokens[position++];

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
        throw new Error("Missing closing parenthesis");
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

    if (peek() && peek().type === "^") {
      consume();

      return {
        type: "binary",
        op: "^",
        left,
        right: parseUnary()
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
      (peek().type === "*" ||
        peek().type === "/")
    ) {
      const operator = consume();

      node = {
        type: "binary",
        op: operator.type,
        left: node,
        right: parseUnary()
      };
    }

    return node;
  }

  function parseAddSub() {
    let node = parseMulDiv();

    while (
      peek() &&
      (peek().type === "+" ||
        peek().type === "-")
    ) {
      const operator = consume();

      node = {
        type: "binary",
        op: operator.type,
        left: node,
        right: parseMulDiv()
      };
    }

    return node;
  }

  const ast = parseAddSub();

  if (position !== tokens.length) {
    throw new Error("Unexpected trailing tokens");
  }

  return ast;
}

function precedenceOf(op) {
  if (op === "+" || op === "-") {
    return 1;
  }

  if (op === "*" || op === "/") {
    return 2;
  }

  if (op === "^") {
    return 3;
  }

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
    return "(" + nodeToText(node.child) + ")";
  }

  if (node.type === "unary") {
    return (
      node.op +
      nodeToText(node.operand, 4, false)
    );
  }

  if (node.type === "binary") {
    const precedence = precedenceOf(node.op);

    const leftText = nodeToText(
      node.left,
      precedence,
      false
    );

    const rightText = nodeToText(
      node.right,
      precedence,
      true
    );

    let text =
      leftText +
      " " +
      opSymbol(node.op) +
      " " +
      rightText;

    const needsParentheses =
      precedence < parentPrecedence ||
      (
        precedence === parentPrecedence &&
        rightChild &&
        (node.op === "-" ||
          node.op === "/")
      );

    if (needsParentheses) {
      text = "(" + text + ")";
    }

    return text;
  }

  return "";
}

function calculateBinary(op, left, right) {
  const leftBigInt = toBigIntExact(left);
  const rightBigInt = toBigIntExact(right);

  if (
    leftBigInt !== null &&
    rightBigInt !== null
  ) {
    if (op === "+") {
      return leftBigInt + rightBigInt;
    }

    if (op === "-") {
      return leftBigInt - rightBigInt;
    }

    if (op === "*") {
      return leftBigInt * rightBigInt;
    }

    if (op === "/") {
      if (rightBigInt === 0n) {
        throw new Error("Division by zero");
      }

      if (leftBigInt % rightBigInt === 0n) {
        return leftBigInt / rightBigInt;
      }
    }

    if (op === "^" && rightBigInt >= 0n) {
      return bigIntPower(
        leftBigInt,
        rightBigInt
      );
    }
  }

  const x =
    typeof left === "bigint"
      ? Number(left)
      : left;

  const y =
    typeof right === "bigint"
      ? Number(right)
      : right;

  let result;

  switch (op) {
    case "+":
      result = x + y;
      break;

    case "-":
      result = x - y;
      break;

    case "*":
      result = x * y;
      break;

    case "/":
      if (y === 0) {
        throw new Error("Division by zero");
      }

      result = x / y;
      break;

    case "^":
      result = Math.pow(x, y);
      break;

    default:
      throw new Error("Unknown operator");
  }

  if (!Number.isFinite(result)) {
    throw new Error("Invalid result");
  }

  return result;
}

function evaluate(node, steps) {
  if (node.type === "number") {
    if (Number.isSafeInteger(node.value)) {
      return BigInt(node.value);
    }

    return node.value;
  }

  if (node.type === "group") {
    return evaluate(node.child, steps);
  }

  if (node.type === "unary") {
    const value = evaluate(
      node.operand,
      steps
    );

    return node.op === "-"
      ? -value
      : value;
  }

  if (node.type === "binary") {
    const left = evaluate(
      node.left,
      steps
    );

    const right = evaluate(
      node.right,
      steps
    );

    const result = calculateBinary(
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

  throw new Error("Unknown AST node");
}

// ---------------- FRACTIONS ----------------

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);

  while (b !== 0) {
    const temp = a;
    a = b;
    b = temp % b;
  }

  return a;
}

function lcm(a, b) {
  if (a === 0 || b === 0) {
    return 0;
  }

  return Math.abs(
    (a / gcd(a, b)) * b
  );
}

function simplifyFraction(
  numerator,
  denominator
) {
  if (denominator === 0) {
    throw new Error("Division by zero");
  }

  if (denominator < 0) {
    numerator = -numerator;
    denominator = -denominator;
  }

  const divisor = gcd(
    Math.abs(numerator),
    Math.abs(denominator)
  );

  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor
  };
}

function fractionToText(fraction) {
  if (fraction.denominator === 1) {
    return String(fraction.numerator);
  }

  return (
    fraction.numerator +
    "/" +
    fraction.denominator
  );
}

function fractionToLatex(fraction) {
  if (fraction.denominator === 1) {
    return String(fraction.numerator);
  }

  return (
    "\\frac{" +
    fraction.numerator +
    "}{" +
    fraction.denominator +
    "}"
  );
}

function fractionToMixed(fraction) {
  const numerator = fraction.numerator;
  const denominator = fraction.denominator;

  if (denominator === 1) {
    return {
      whole: numerator,
      numerator: 0,
      denominator: 1,
      isMixed: false
    };
  }

  const sign = numerator < 0 ? -1 : 1;
  const absoluteNumerator =
    Math.abs(numerator);

  const whole = Math.floor(
    absoluteNumerator / denominator
  );

  const remainder =
    absoluteNumerator % denominator;

  if (remainder === 0) {
    return {
      whole: sign * whole,
      numerator: 0,
      denominator,
      isMixed: false
    };
  }

  return {
    whole: sign * whole,
    numerator: remainder,
    denominator,
    isMixed: whole !== 0
  };
}

function mixedFractionToImproper(
  whole,
  numerator,
  denominator
) {
  if (denominator === 0) {
    throw new Error("Division by zero");
  }

  const sign = whole < 0 ? -1 : 1;

  return {
    numerator:
      sign *
      (Math.abs(whole) * denominator +
        numerator),
    denominator
  };
}

function parseFractionValue(text) {
  text = text.trim();

  let match = text.match(
    /^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/
  );

  if (match) {
    const fraction =
      mixedFractionToImproper(
        Number(match[1]),
        Number(match[2]),
        Number(match[3])
      );

    return simplifyFraction(
      fraction.numerator,
      fraction.denominator
    );
  }

  match = text.match(
    /^([+-]?\d+)\s*\/\s*(\d+)$/
  );

  if (match) {
    return simplifyFraction(
      Number(match[1]),
      Number(match[2])
    );
  }

  if (/^[+-]?\d+$/.test(text)) {
    return {
      numerator: Number(text),
      denominator: 1
    };
  }

  return null;
}

function getFractionFormula(op) {
  if (op === "+") {
    return "a/b + c/d = (ad + bc) / bd";
  }

  if (op === "-") {
    return "a/b − c/d = (ad − bc) / bd";
  }

  if (op === "*") {
    return "a/b × c/d = ac / bd";
  }

  if (op === "/") {
    return "a/b ÷ c/d = a/b × d/c";
  }

  return "";
}

function solveFractionExpression(text) {
  let input = String(text)
    .trim()
    .replace(/−/g, "-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/");

  input = input
    .replace(/\bplus\b/gi, "+")
    .replace(/\bminus\b/gi, "-")
    .replace(
      /\bmultiplied\s+by\b/gi,
      "*"
    )
    .replace(/\btimes\b/gi, "*")
    .replace(
      /\bdivided\s+by\b/gi,
      "/"
    );

  const match = input.match(
    /^(.+?)\s*([+\-*/])\s*(.+)$/
  );

  if (!match) {
    return null;
  }

  const left = parseFractionValue(
    match[1].trim()
  );

  const right = parseFractionValue(
    match[3].trim()
  );

  const operator = match[2];

  if (!left || !right) {
    return null;
  }

  const a = left.numerator;
  const b = left.denominator;
  const c = right.numerator;
  const d = right.denominator;

  let numerator;
  let denominator;

  const steps = [];

  if (
    operator === "+" ||
    operator === "-"
  ) {
    const common = lcm(b, d);

    const newLeft =
      a * (common / b);

    const newRight =
      c * (common / d);

    numerator =
      operator === "+"
        ? newLeft + newRight
        : newLeft - newRight;

    denominator = common;

    steps.push({
      text:
        "LCM of " +
        b +
        " and " +
        d +
        " = " +
        common
    });

    steps.push({
      text:
        fractionToText(left) +
        " = " +
        newLeft +
        "/" +
        common
    });

    steps.push({
      text:
        fractionToText(right) +
        " = " +
        newRight +
        "/" +
        common
    });

    steps.push({
      text:
        newLeft +
        "/" +
        common +
        " " +
        (operator === "+" ? "+" : "−") +
        " " +
        newRight +
        "/" +
        common +
        " = " +
        numerator +
        "/" +
        denominator
    });
  } else if (operator === "*") {
    numerator = a * c;
    denominator = b * d;

    steps.push({
      text:
        a +
        "/" +
        b +
        " × " +
        c +
        "/" +
        d +
        " = (" +
        a +
        " × " +
        c +
        ")/(" +
        b +
        " × " +
        d +
        ")"
    });

    steps.push({
      text:
        "= " +
        numerator +
        "/" +
        denominator
    });
  } else {
    if (c === 0) {
      return {
        matched: true,
        kind: "fraction-error",
        error:
          "A fraction cannot be divided by zero."
      };
    }

    numerator = a * d;
    denominator = b * c;

    steps.push({
      text:
        "Keep the first fraction and multiply by the reciprocal of the second."
    });

    steps.push({
      text:
        a +
        "/" +
        b +
        " ÷ " +
        c +
        "/" +
        d +
        " = " +
        a +
        "/" +
        b +
        " × " +
        d +
        "/" +
        c
    });

    steps.push({
      text:
        "= " +
        numerator +
        "/" +
        denominator
    });
  }

  const simplified =
    simplifyFraction(
      numerator,
      denominator
    );

  if (
    simplified.numerator !== numerator ||
    simplified.denominator !== denominator
  ) {
    steps.push({
      text:
        numerator +
        "/" +
        denominator +
        " simplifies to " +
        fractionToText(simplified)
    });
  }

  const mixed =
    fractionToMixed(simplified);

  let mixedText = null;

  if (mixed.isMixed) {
    mixedText =
      mixed.whole +
      " " +
      mixed.numerator +
      "/" +
      mixed.denominator;

    steps.push({
      text:
        fractionToText(simplified) +
        " = " +
        mixedText
    });
  }

  return {
    matched: true,
    kind: "fraction",
    expression:
      fractionToText(left) +
      " " +
      operator +
      " " +
      fractionToText(right),
    operator,
    left,
    right,
    result: simplified,
    formattedResult:
      fractionToText(simplified),
    latexResult:
      fractionToLatex(simplified),
    mixedResult: mixedText,
    formula:
      getFractionFormula(operator),
    steps
  };
}

function explainFractionSolution(
  solved
) {
  if (solved.kind === "fraction-error") {
    return "**" + solved.error + "**";
  }

  const answer = solved.mixedResult
    ? solved.formattedResult +
      " = " +
      solved.mixedResult
    : solved.formattedResult;

  const lines = [
    "**" +
      solved.expression +
      " = " +
      answer +
      "**",
    "",
    "**Formula:** " +
      solved.formula,
    ""
  ];

  if (
    solved.operator === "+" ||
    solved.operator === "-"
  ) {
    lines.push(
      "**First, make the denominators the same.**"
    );
  } else if (solved.operator === "*") {
    lines.push(
      "**Multiply the numerators and denominators.**"
    );
  } else {
    lines.push(
      "**Keep the first fraction, change ÷ to ×, and flip the second fraction.**"
    );
  }

  lines.push("");

  solved.steps.forEach(
    (step, index) => {
      lines.push(
        index + 1 + ". " + step.text
      );
    }
  );

  lines.push(
    "",
    "**Final answer: " +
      (solved.mixedResult ||
        solved.formattedResult) +
      "**"
  );

  return lines.join("\n");
}

// ---------------- SPECIAL MATH ----------------

function solveSquare(text) {
  const match = text.match(
    /(?:square\s+of|square)\s*(-?\d+(?:\.\d+)?)|(-?\d+(?:\.\d+)?)\s*(?:square|²)/i
  );

  if (!match) {
    return null;
  }

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
    expression:
      cleanNumber(value) + "²",
    result,
    formattedResult:
      formatValue(result),
    formula: "a² = a × a",
    explanation:
      "The square of a number means multiplying the number by itself.",
    steps: [
      cleanNumber(value) +
        "² = " +
        cleanNumber(value) +
        " × " +
        cleanNumber(value),

      cleanNumber(value) +
        " × " +
        cleanNumber(value) +
        " = " +
        formatValue(result)
    ]
  };
}

function solveSquareRoot(text) {
  let match = text.match(
    /(?:square\s+root\s+of|sqrt)\s*\(?\s*(-?\d+(?:\.\d+)?)\s*\)?/i
  );

  if (!match) {
    match = text.match(
      /√\s*\(?\s*(-?\d+(?:\.\d+)?)\s*\)?/
    );
  }

  if (!match) {
    return null;
  }

  const value = Number(match[1]);

  if (value < 0) {
    return {
      matched: true,
      kind: "square-root-error",
      expression: "√" + value,
      error:
        "A negative number does not have a real square root.",
      steps: []
    };
  }

  const result = Math.sqrt(value);

  const perfectSquare =
    Number.isInteger(result);

  const steps = [
    "√" +
      cleanNumber(value) +
      " = " +
      formatValue(result)
  ];

  if (perfectSquare) {
    steps.unshift(
      formatValue(result) +
        " × " +
        formatValue(result) +
        " = " +
        cleanNumber(value)
    );
  }

  return {
    matched: true,
    kind: "square-root",
    expression:
      "√" + cleanNumber(value),
    result,
    formattedResult:
      formatValue(result),
    formula:
      "√a = the number that, when multiplied by itself, gives a",
    explanation:
      perfectSquare
        ? "The square root is the number whose square equals " +
          cleanNumber(value) +
          "."
        : "The square root of " +
          cleanNumber(value) +
          " is approximately " +
          formatValue(result) +
          ".",
    steps
  };
}

function solveCircle(text) {
  const lower = text.toLowerCase();

  let match = lower.match(
    /(?:area\s+of\s+(?:a\s+)?circle|circle\s+area).*?(?:radius|r)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)/i
  );

  if (match) {
    const radius = Number(match[1]);
    const area =
      Math.PI * radius * radius;

    return {
      matched: true,
      kind: "circle-area",
      expression:
        "Area of circle, r = " +
        radius,
      result: area,
      formattedResult:
        formatValue(area),
      formula: "A = πr²",
      explanation:
        "The area of a circle is found using **A = πr²**, where r is the radius.",
      steps: [
        "A = π × " +
          radius +
          "²",

        "A = π × " +
          radius * radius,

        "A ≈ " +
          formatValue(area)
      ]
    };
  }

  match = lower.match(
    /(?:circumference|perimeter)\s+(?:of\s+(?:a\s+)?)?circle.*?(?:radius|r)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)/i
  );

  if (match) {
    const radius = Number(match[1]);
    const circumference =
      2 * Math.PI * radius;

    return {
      matched: true,
      kind: "circle-circumference",
      expression:
        "Circumference, r = " +
        radius,
      result: circumference,
      formattedResult:
        formatValue(circumference),
      formula: "C = 2πr",
      explanation:
        "The circumference of a circle is found using **C = 2πr**.",
      steps: [
        "C = 2 × π × " +
          radius,

        "C ≈ " +
          formatValue(circumference)
      ]
    };
  }

  return null;
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
    /^[+-]?\d+(?:\.\d+)?$/.test(value)
  ) {
    return Number(value);
  }

  return null;
}

function solveLinearEquation(text) {
  const equation = text
    .replace(/\s+/g, "")
    .replace(/×/g, "*")
    .replace(/−/g, "-");

  if (
    !equation.includes("=") ||
    !/[xX]/.test(equation)
  ) {
    return null;
  }

  const parts = equation.split("=");

  if (parts.length !== 2) {
    return null;
  }

  const left = parts[0];
  const right = parts[1];

  if (!left || !right) {
    return null;
  }

  const pattern =
    /^([+-]?\d*\.?\d*)x(?:([+-]\d+(?:\.\d+)?))?$/i;

  const leftMatch =
    left.match(pattern);

  const rightMatch =
    right.match(pattern);

  const leftNumber =
    parseConstantSide(left);

  const rightNumber =
    parseConstantSide(right);

  let a = 0;
  let b = 0;
  let c = 0;
  let d = 0;

  if (leftMatch) {
    a = parseCoefficient(
      leftMatch[1]
    );

    b = leftMatch[2]
      ? Number(leftMatch[2])
      : 0;
  } else if (leftNumber !== null) {
    b = leftNumber;
  } else {
    return null;
  }

  if (rightMatch) {
    d = parseCoefficient(
      rightMatch[1]
    );

    c = rightMatch[2]
      ? Number(rightMatch[2])
      : 0;
  } else if (rightNumber !== null) {
    c = rightNumber;
  } else {
    return null;
  }

  const coefficient = a - d;
  const constant = c - b;

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
      formatValue(a) +
        "x + " +
        formatValue(b) +
        " = " +
        formatValue(c),

      formatValue(a) +
        "x = " +
        formatValue(c) +
        " − " +
        formatValue(b),

      formatValue(a) +
        "x = " +
        formatValue(constant),

      "x = " +
        formatValue(constant) +
        " ÷ " +
        formatValue(coefficient),

      "x = " +
        formatValue(x)
    ]
  };
}

function solveQuadraticEquation(text) {
  const equation =
    superscriptToNormal(
      text
        .replace(/\s+/g, "")
        .replace(/×/g, "*")
        .replace(/−/g, "-")
    );

  if (
    !equation.includes("=") ||
    !/[xX]\^2/i.test(equation)
  ) {
    return null;
  }

  const parts = equation.split("=");

  if (
    parts.length !== 2 ||
    parts[1] !== "0"
  ) {
    return null;
  }

  const match = parts[0].match(
    /^([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*x)?([+-]\d+(?:\.\d+)?)?$/i
  );

  if (!match) {
    return null;
  }

  const a = parseCoefficient(
    match[1]
  );

  let b = 0;

  if (match[2]) {
    b = parseCoefficient(
      match[2].replace(/x$/i, "")
    );
  }

  const c = match[3]
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
      formattedResult:
        "No real solution",
      explanation:
        "The discriminant is negative, so this equation has no real solutions.",
      steps: [
        "D = b² − 4ac",

        "D = (" +
          b +
          ")² − 4(" +
          a +
          ")(" +
          c +
          ")",

        "D = " +
          formatValue(discriminant)
      ]
    };
  }

  const squareRoot =
    Math.sqrt(discriminant);

  const x1 =
    (-b + squareRoot) /
    (2 * a);

  const x2 =
    (-b - squareRoot) /
    (2 * a);

  return {
    matched: true,
    kind: "quadratic-equation",
    expression: equation,
    result: [x1, x2],
    formattedResult:
      "x₁ = " +
      formatValue(x1) +
      ", x₂ = " +
      formatValue(x2),
    formula,
    explanation:
      "This is a quadratic equation. We use the quadratic formula to find its possible solutions.",
    steps: [
      "a = " +
        formatValue(a) +
        ", b = " +
        formatValue(b) +
        ", c = " +
        formatValue(c),

      "D = b² − 4ac",

      "D = (" +
        b +
        ")² − 4(" +
        a +
        ")(" +
        c +
        ")",

      "D = " +
        formatValue(discriminant),

      "x = (−b ± √D) / 2a",

      "x₁ = " +
        formatValue(x1),

      "x₂ = " +
        formatValue(x2)
    ]
  };
}

// ---------------- MAIN ----------------

export function trySolveMath(rawInput) {
  if (
    rawInput === null ||
    rawInput === undefined
  ) {
    return null;
  }

  const text =
    String(rawInput).trim();

  if (
    !text ||
    text.length > MAX_INPUT_LENGTH
  ) {
    return null;
  }

  const cleaned =
    extractMathExpression(text);

  if (!cleaned) {
    return null;
  }

  const square =
    solveSquare(cleaned);

  if (square) {
    return square;
  }

  const root =
    solveSquareRoot(cleaned);

  if (root) {
    return root;
  }

  const circle =
    solveCircle(cleaned);

  if (circle) {
    return circle;
  }

  const fraction =
    solveFractionExpression(cleaned);

  if (fraction) {
    return fraction;
  }

  if (
    /[xX]/.test(cleaned) &&
    cleaned.includes("=")
  ) {
    const quadratic =
      solveQuadraticEquation(cleaned);

    if (quadratic) {
      return quadratic;
    }

    const linear =
      solveLinearEquation(cleaned);

    if (linear) {
      return linear;
    }
  }

  let expression = cleaned
    .replace(
      /\bpi\b/gi,
      String(Math.PI)
    )
    .trim();

  if (
    /\bsqrt\b/i.test(expression) ||
    !/\d/.test(expression) ||
    !/[+\-*/^]/.test(expression) ||
    !/^[\d+\-*/^().eE\s]+$/.test(
      expression
    )
  ) {
    return null;
  }

  try {
    const tokens =
      tokenize(expression);

    if (!tokens.length) {
      return null;
    }

    const ast =
      parseExpression(tokens);

    const steps = [];

    const result =
      evaluate(ast, steps);

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

export function explainMathSolution(
  solved
) {
  if (
    !solved ||
    !solved.matched
  ) {
    return "";
  }

  if (solved.error) {
    return (
      "**" +
      solved.error +
      "**"
    );
  }

  if (
    solved.kind === "fraction" ||
    solved.kind === "fraction-error"
  ) {
    return explainFractionSolution(
      solved
    );
  }

  if (
    solved.kind === "square-root-error"
  ) {
    return (
      "**" +
      solved.error +
      "**"
    );
  }

  if (
    solved.kind === "square-root" ||
    solved.kind === "square"
  ) {
    const lines = [
      "**" +
        solved.expression +
        " = " +
        solved.formattedResult +
        "**",

      "",

      "**Formula:** " +
        solved.formula,

      "",

      solved.explanation,

      ""
    ];

    solved.steps.forEach(
      (step, index) => {
        lines.push(
          index + 1 +
            ". " +
            step
        );
      }
    );

    return lines.join("\n");
  }

  if (
    solved.kind === "circle-area" ||
    solved.kind ===
      "circle-circumference"
  ) {
    const lines = [
      "**Answer: " +
        solved.formattedResult +
        "**",

      "",

      "**Formula:** " +
        solved.formula,

      "",

      solved.explanation,

      ""
    ];

    solved.steps.forEach(
      (step, index) => {
        lines.push(
          index + 1 +
            ". " +
            step
        );
      }
    );

    return lines.join("\n");
  }

  if (
    solved.kind ===
    "linear-equation"
  ) {
    const lines = [
      "**Answer: x = " +
        solved.formattedResult +
        "**",

      "",

      "**Formula:** " +
        solved.formula,

      "",

      solved.explanation,

      "",

      "**Working:**"
    ];

    solved.steps.forEach(
      (step, index) => {
        lines.push(
          index + 1 +
            ". " +
            step
        );
      }
    );

    return lines.join("\n");
  }

  if (
    solved.kind ===
      "quadratic-equation" ||
    solved.kind ===
      "quadratic-no-real"
  ) {
    const lines = [
      "**" +
        solved.formattedResult +
        "**",

      "",

      "**Formula:** " +
        solved.formula,

      "",

      solved.explanation,

      "",

      "**Working:**"
    ];

    solved.steps.forEach(
      (step, index) => {
        lines.push(
          index + 1 +
            ". " +
            step
        );
      }
    );

    return lines.join("\n");
  }

  const lines = [
    "**" +
      solved.expression +
      " = " +
      solved.formattedResult +
      "**"
  ];

  if (
    solved.steps &&
    solved.steps.length
  ) {
    lines.push("");

    solved.steps.forEach(
      (step, index) => {
        lines.push(
          index + 1 +
            ". " +
            step.text
        );
      }
    );
  }

  return lines.join("\n");
}

export default {
  trySolveMath,
  explainMathSolution
};