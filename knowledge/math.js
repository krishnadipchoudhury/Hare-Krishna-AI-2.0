// knowledge/math.js
//
// Professional, dependency-free arithmetic solver.
//
// Supports:
//   +  -  *  /
//   ×  ÷
//   ^  (powers)
//   ( )
//   decimals
//   negative numbers
//   scientific notation
//   whitespace / line breaks
//
// Examples:
//   6 + 7 + 2
//   6 + 7
//   10 - 3 * 2
//   (10 - 3) * 2
//   -5 + 8
//   2 ^ 3
//   2.5 × 4
//   1.2e3 / 3
//
// trySolveMath(text)
//   -> null when the input is not a pure arithmetic expression
//   -> result object when successfully solved
//
// explainMathSolution(result)
//   -> Markdown explanation suitable for the AI chat UI


// ============================================================
// CONSTANTS
// ============================================================

const MAX_INPUT_LENGTH = 500;
const MAX_TOKENS = 200;
const MAX_ABS_RESULT = Number.MAX_SAFE_INTEGER * 1000;


// ============================================================
// NORMALIZATION
// ============================================================

function normalizeExpression(raw) {
  return String(raw ?? "")
    // Unicode multiplication/division
    .replace(/×/g, "*")
    .replace(/÷/g, "/")

    // Unicode minus variants
    .replace(/[−–—]/g, "-")

    // Unicode plus variant
    .replace(/﹢/g, "+")

    // Common multiplication words/symbols
    .replace(/\u00B7/g, "*") // middle dot ·
    .replace(/\u2219/g, "*") // bullet operator

    // Remove ordinary thousands separators only when
    // they occur between digits.
    .replace(/(\d),(?=\d{3}(?:\D|$))/g, "$1")

    // Normalize line breaks/tabs into spaces.
    .replace(/\s+/g, " ")

    .trim();
}


// ============================================================
// NUMBER FORMATTING
// ============================================================

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return String(value);
  }

  // Remove negative zero.
  if (Object.is(value, -0)) {
    return "0";
  }

  // Small floating-point correction.
  const rounded = Math.round((value + Number.EPSILON) * 1e12) / 1e12;

  if (!Number.isFinite(rounded)) {
    return String(value);
  }

  // Prevent ugly floating-point artifacts.
  if (Math.abs(rounded) < 1e-12 && rounded !== 0) {
    return "0";
  }

  // Use normal decimal notation for reasonable values.
  if (
    Math.abs(rounded) >= 1e-6 &&
    Math.abs(rounded) < 1e15
  ) {
    return String(rounded);
  }

  // Scientific notation for extremely large/small numbers.
  return Number(rounded.toPrecision(12)).toString();
}


// ============================================================
// OPERATOR SYMBOLS
// ============================================================

function opSymbol(op) {
  const symbols = {
    "+": "+",
    "-": "−",
    "*": "×",
    "/": "÷",
    "^": "^"
  };

  return symbols[op] || op;
}


// ============================================================
// TOKENIZER
// ============================================================

function tokenize(expr) {
  const tokens = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    // Ignore whitespace.
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

      // Integer/decimal part.
      while (i < expr.length) {
        const current = expr[i];

        if (/[0-9]/.test(current)) {
          hasDigits = true;
          i++;
          continue;
        }

        if (current === ".") {
          if (hasDot) {
            throw new Error("Invalid decimal number");
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

      // ------------------------------------------------------
      // Scientific notation
      // Example: 2.5e3
      // ------------------------------------------------------

      if (expr[i] === "e" || expr[i] === "E") {
        i++;

        if (expr[i] === "+" || expr[i] === "-") {
          i++;
        }

        const exponentStart = i;

        while (i < expr.length && /[0-9]/.test(expr[i])) {
          i++;
        }

        if (i === exponentStart) {
          throw new Error("Invalid scientific notation");
        }
      }

      const numberText = expr.slice(start, i);
      const value = Number(numberText);

      if (!Number.isFinite(value)) {
        throw new Error("Invalid number");
      }

      tokens.push({
        type: "number",
        value,
        raw: numberText
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

    // Unknown character.
    throw new Error("Unknown character");
  }

  return tokens;
}


// ============================================================
// PARSER
// ============================================================
//
// Grammar:
//
// expression
//   -> addSub
//
// addSub
//   -> mulDiv (("+" | "-") mulDiv)*
//
// mulDiv
//   -> power (("*" | "/") power)*
//
// power
//   -> unary ("^" power)?
//
// unary
//   -> ("+" | "-") unary
//   -> primary
//
// primary
//   -> number
//   -> "(" expression ")"
//

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
      throw new Error("Unexpected end of expression");
    }

    // Number
    if (token.type === "number") {
      consume();

      return {
        type: "number",
        value: token.value
      };
    }

    // Parentheses
    if (token.type === "(") {
      consume();

      const node = parseAddSub();

      const closing = peek();

      if (!closing || closing.type !== ")") {
        throw new Error("Missing closing parenthesis");
      }

      consume();

      return node;
    }

    throw new Error("Expected a number or parenthesis");
  }

  function parseUnary() {
    const token = peek();

    if (!token) {
      throw new Error("Unexpected end of expression");
    }

    if (token.type === "+") {
      consume();

      return {
        type: "unary",
        op: "+",
        operand: parseUnary()
      };
    }

    if (token.type === "-") {
      consume();

      return {
        type: "unary",
        op: "-",
        operand: parseUnary()
      };
    }

    return parsePrimary();
  }

  function parsePower() {
    const left = parseUnary();

    // Power is right-associative:
    // 2 ^ 3 ^ 2 = 2 ^ (3 ^ 2)
    if (peek() && peek().type === "^") {
      const op = consume();

      const right = parsePower();

      return {
        type: "binary",
        op: op.type,
        left,
        right
      };
    }

    return left;
  }

  function parseMulDiv() {
    let node = parsePower();

    while (
      peek() &&
      (peek().type === "*" || peek().type === "/")
    ) {
      const op = consume();

      const right = parsePower();

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
      (peek().type === "+" || peek().type === "-")
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
    throw new Error("Unexpected trailing tokens");
  }

  return ast;
}


// ============================================================
// PRECEDENCE
// ============================================================

function precedenceOf(op) {
  switch (op) {
    case "+":
    case "-":
      return 1;

    case "*":
    case "/":
      return 2;

    case "^":
      return 3;

    default:
      return 0;
  }
}


// ============================================================
// AST -> HUMAN READABLE EXPRESSION
// ============================================================

function nodeToText(node, parentPrecedence = 0, isRightChild = false) {
  if (!node) return "";

  // Number
  if (node.type === "number") {
    return formatNumber(node.value);
  }

  // Unary
  if (node.type === "unary") {
    const operandText = nodeToText(node.operand, 4, false);

    if (node.op === "+") {
      return "+" + operandText;
    }

    return "−" + operandText;
  }

  // Binary
  if (node.type === "binary") {
    const myPrecedence = precedenceOf(node.op);

    const leftText = nodeToText(
      node.left,
      myPrecedence,
      false
    );

    const rightText = nodeToText(
      node.right,
      myPrecedence,
      true
    );

    let text =
      leftText +
      " " +
      opSymbol(node.op) +
      " " +
      rightText;

    let needsParentheses =
      myPrecedence < parentPrecedence;

    // Same precedence on right side needs special handling.
    if (myPrecedence === parentPrecedence && isRightChild) {
      // Addition and multiplication are associative,
      // so parentheses are unnecessary in cases like:
      // 5 + (4 + 2)
      //
      // But subtraction/division are not:
      // 5 - (4 - 2)
      // 5 ÷ (4 ÷ 2)

      if (node.op === "-" || node.op === "/") {
        needsParentheses = true;
      }
    }

    // Powers need parentheses around their base where needed.
    if (
      parentPrecedence === 3 &&
      node.type === "binary" &&
      node.op !== "^"
    ) {
      needsParentheses = true;
    }

    if (needsParentheses) {
      text = "(" + text + ")";
    }

    return text;
  }

  return "";
}


// ============================================================
// SIMPLE NODE EVALUATION
// ============================================================

function evaluateNode(node) {
  if (node.type === "number") {
    return node.value;
  }

  if (node.type === "unary") {
    const value = evaluateNode(node.operand);

    if (node.op === "-") {
      return -value;
    }

    return value;
  }

  if (node.type === "binary") {
    const left = evaluateNode(node.left);
    const right = evaluateNode(node.right);

    let result;

    switch (node.op) {
      case "+":
        result = left + right;
        break;

      case "-":
        result = left - right;
        break;

      case "*":
        result = left * right;
        break;

      case "/":
        if (right === 0) {
          throw new Error("Division by zero");
        }

        result = left / right;
        break;

      case "^":
        result = Math.pow(left, right);
        break;

      default:
        throw new Error("Unknown operator");
    }

    if (!Number.isFinite(result)) {
      throw new Error("Result is outside supported range");
    }

    return result;
  }

  throw new Error("Unknown expression node");
}


// ============================================================
// STEP GENERATION
// ============================================================
//
// This evaluates the tree from the bottom up and records
// meaningful operations.
//
// Example:
//   6 + 7 + 2
//
// Steps:
//   1. 6 + 7 = 13
//   2. 13 + 2 = 15
//

function evaluateWithSteps(node, steps) {
  if (node.type === "number") {
    return node.value;
  }

  if (node.type === "unary") {
    const value = evaluateWithSteps(node.operand, steps);

    const result =
      node.op === "-" ? -value : value;

    return formatNumber(result);
  }

  if (node.type === "binary") {
    const left = evaluateWithSteps(node.left, steps);
    const right = evaluateWithSteps(node.right, steps);

    let result;

    switch (node.op) {
      case "+":
        result = left + right;
        break;

      case "-":
        result = left - right;
        break;

      case "*":
        result = left * right;
        break;

      case "/":
        if (right === 0) {
          throw new Error("Division by zero");
        }

        result = left / right;
        break;

      case "^":
        result = Math.pow(left, right);
        break;

      default:
        throw new Error("Unknown operator");
    }

    if (!Number.isFinite(result)) {
      throw new Error("Invalid result");
    }

    result = formatNumber(result);

    steps.push({
      expression:
        formatNumber(left) +
        " " +
        opSymbol(node.op) +
        " " +
        formatNumber(right),

      result
    });

    return Number(result);
  }

  throw new Error("Unknown node");
}


// ============================================================
// VALIDATE RESULT
// ============================================================

function validateResult(result) {
  if (!Number.isFinite(result)) {
    throw new Error("Invalid result");
  }

  if (Math.abs(result) > MAX_ABS_RESULT) {
    throw new Error("Result too large");
  }

  return result;
}


// ============================================================
// MAIN SOLVER
// ============================================================

export function trySolveMath(rawInput) {
  if (rawInput === null || rawInput === undefined) {
    return null;
  }

  let text = String(rawInput).trim();

  if (!text || text.length > MAX_INPUT_LENGTH) {
    return null;
  }

  // ----------------------------------------------------------
  // Remove common natural-language prefixes.
  // ----------------------------------------------------------

  text = text.replace(
    /^(what\s+is|what's|calculate|compute|solve|evaluate|find|answer)\s*:?\s*/i,
    ""
  );

  // Remove trailing question marks.
  text = text.replace(/\?+\s*$/, "").trim();

  if (!text) {
    return null;
  }

  // ----------------------------------------------------------
  // Normalize.
  // ----------------------------------------------------------

  const normalized = normalizeExpression(text);

  if (!normalized) {
    return null;
  }

  // ----------------------------------------------------------
  // Security / purity check.
  //
  // Only arithmetic characters are allowed.
  // ----------------------------------------------------------

  if (!/\d/.test(normalized)) {
    return null;
  }

  if (!/[+\-*/^]/.test(normalized)) {
    return null;
  }

  if (!/^[\d+\-*/^().eE\s]+$/.test(normalized)) {
    return null;
  }

  // ----------------------------------------------------------
  // Tokenize + parse.
  // ----------------------------------------------------------

  try {
    const tokens = tokenize(normalized);

    if (!tokens || tokens.length === 0) {
      return null;
    }

    const ast = parseExpression(tokens);

    // --------------------------------------------------------
    // Evaluate.
    // --------------------------------------------------------

    const steps = [];

    const result = evaluateWithSteps(ast, steps);

    const numericResult = Number(result);

    validateResult(numericResult);

    // --------------------------------------------------------
    // Final expression.
    // --------------------------------------------------------

    const expression = nodeToText(ast);

    return {
      matched: true,

      expression,

      result: numericResult,

      formattedResult: formatNumber(numericResult),

      steps,

      operatorCount: tokens.filter(
        token =>
          ["+", "-", "*", "/", "^"].includes(token.type)
      ).length
    };

  } catch (error) {
    // Not valid pure arithmetic.
    // Let the main AI handle it.
    return null;
  }
}


// ============================================================
// PROFESSIONAL EXPLANATION
// ============================================================

export function explainMathSolution(solved) {
  if (!solved || !solved.matched) {
    return "";
  }

  const lines = [];

  // ----------------------------------------------------------
  // Final answer
  // ----------------------------------------------------------

  lines.push(
    `**${solved.expression} = ${solved.formattedResult ?? formatNumber(solved.result)}**`
  );

  // ----------------------------------------------------------
  // No steps
  // ----------------------------------------------------------

  if (!solved.steps || solved.steps.length === 0) {
    return lines.join("\n");
  }

  lines.push("");

  // ----------------------------------------------------------
  // One operation
  // ----------------------------------------------------------

  if (solved.steps.length === 1) {
    const step = solved.steps[0];

    lines.push(
      `**Working:** ${step.expression} = ${step.result}`
    );

    return lines.join("\n");
  }

  // ----------------------------------------------------------
  // Multiple operations
  // ----------------------------------------------------------

  lines.push(
    "Here's the step-by-step working:"
  );

  lines.push("");

  solved.steps.forEach((step, index) => {
    lines.push(
      `${index + 1}. ${step.expression} = ${step.result}`
    );
  });

  lines.push("");

  lines.push(
    "**Order of operations:** parentheses → powers → multiplication/division → addition/subtraction."
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