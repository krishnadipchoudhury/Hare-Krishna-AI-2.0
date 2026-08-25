// knowledge/math.js
//
// Hare Krishna AI 2.0 — Professional Math Engine
//
// Supports:
//   +  -  *  /  ^
//   ×  ÷
//   parentheses
//   decimals
//   negative numbers
//   scientific notation
//   multiline expressions
//
// The goal is:
//   1. Always calculate deterministically.
//   2. Give short, natural explanations.
//   3. Bold important mathematical information.
//   4. Avoid unnecessary repeated explanations.
//   5. Return null for non-mathematical messages.
//
// Examples:
//
//   6 + 7 + 2
//   15 + 8 × 2
//   (15 + 8) × 2
//   2 ^ 5
//   -2 ^ 2
//   2 ^ -2
//   2.5 × 4
//   1.2e3 / 3
//
// No external dependencies.


// ============================================================
// CONFIGURATION
// ============================================================

const MAX_INPUT_LENGTH = 500;
const MAX_TOKENS = 200;


// ============================================================
// NORMALIZE INPUT
// ============================================================

function normalizeExpression(raw) {
  return String(raw ?? "")
    // Multiplication / division symbols
    .replace(/×/g, "*")
    .replace(/÷/g, "/")

    // Different Unicode minus characters
    .replace(/[−–—]/g, "-")

    // Other multiplication symbols
    .replace(/[·∙⋅]/g, "*")

    // Normalize whitespace and line breaks
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

  // Reduce normal floating-point noise.
  const rounded =
    Math.round((value + Number.EPSILON) * 1e12) / 1e12;

  if (Object.is(rounded, -0)) {
    return "0";
  }

  if (!Number.isFinite(rounded)) {
    return String(value);
  }

  // Normal decimal representation.
  if (
    Math.abs(rounded) >= 1e-6 &&
    Math.abs(rounded) < 1e15
  ) {
    return String(rounded);
  }

  // Scientific notation for very large/small values.
  return Number(rounded.toPrecision(12)).toString();
}


// ============================================================
// OPERATOR DISPLAY
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

    // Ignore spaces.
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

      // Integer / decimal part.
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

        while (
          i < expr.length &&
          /[0-9]/.test(expr[i])
        ) {
          i++;
        }

        if (i === exponentStart) {
          throw new Error("Invalid scientific notation");
        }
      }

      const rawNumber = expr.slice(start, i);
      const value = Number(rawNumber);

      if (!Number.isFinite(value)) {
        throw new Error("Invalid number");
      }

      tokens.push({
        type: "number",
        value
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

    // Anything else is not pure arithmetic.
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
//   → addition/subtraction
//
// addition/subtraction
//   → multiplication/division
//
// multiplication/division
//   → unary
//
// unary
//   → + unary
//   → - unary
//   → power
//
// power
//   → primary ^ unary
//   → primary
//
// primary
//   → number
//   → ( expression )
//
// This gives normal mathematical precedence:
//
//   -2^2 = -4
//   2^-2 = 0.25
//

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
        value: token.value
      };
    }

    if (token.type === "(") {
      consume();

      const node = parseAddSub();

      if (!peek() || peek().type !== ")") {
        throw new Error("Missing closing parenthesis");
      }

      consume();

      return {
        type: "group",
        child: node
      };
    }

    throw new Error("Expected number or parenthesis");
  }


  // ----------------------------------------------------------
  // POWER
  // ----------------------------------------------------------

  function parsePower() {
    const left = parsePrimary();

    if (peek() && peek().type === "^") {
      consume();

      // Right side uses unary so:
      // 2^-2 works correctly.
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

    return parsePower();
  }


  // ----------------------------------------------------------
  // MULTIPLICATION / DIVISION
  // ----------------------------------------------------------

  function parseMulDiv() {
    let node = parseUnary();

    while (
      peek() &&
      (peek().type === "*" ||
        peek().type === "/")
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
      (peek().type === "+" ||
        peek().type === "-")
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
    throw new Error("Unexpected trailing expression");
  }

  return ast;
}


// ============================================================
// PRECEDENCE
// ============================================================

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

  // Number
  if (node.type === "number") {
    return formatNumber(node.value);
  }

  // Group
  if (node.type === "group") {
    return "(" + nodeToText(node.child) + ")";
  }

  // Unary
  if (node.type === "unary") {
    const operand = nodeToText(
      node.operand,
      4,
      false
    );

    return node.op === "-"
      ? "−" + operand
      : "+" + operand;
  }

  // Binary
  if (node.type === "binary") {
    const currentPrecedence =
      precedenceOf(node.op);

    let left = nodeToText(
      node.left,
      currentPrecedence,
      false
    );

    let right = nodeToText(
      node.right,
      currentPrecedence,
      true
    );

    let text =
      left +
      " " +
      opSymbol(node.op) +
      " " +
      right;

    let needsParentheses =
      currentPrecedence < parentPrecedence;

    // Preserve meaning for subtraction/division.
    if (
      currentPrecedence === parentPrecedence &&
      isRightChild &&
      (node.op === "-" ||
        node.op === "/")
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
// EVALUATION
// ============================================================

function calculateBinary(op, left, right) {
  let result;

  switch (op) {
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

  return result;
}


// ============================================================
// EVALUATE + CREATE USEFUL STEPS
// ============================================================

function evaluateWithSteps(node, steps) {
  // Number
  if (node.type === "number") {
    return node.value;
  }

  // Group
  if (node.type === "group") {
    return evaluateWithSteps(
      node.child,
      steps
    );
  }

  // Unary
  if (node.type === "unary") {
    const value = evaluateWithSteps(
      node.operand,
      steps
    );

    return node.op === "-"
      ? -value
      : value;
  }

  // Binary
  if (node.type === "binary") {
    const left = evaluateWithSteps(
      node.left,
      steps
    );

    const right = evaluateWithSteps(
      node.right,
      steps
    );

    const result = calculateBinary(
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
        formatNumber(left) +
        " " +
        opSymbol(node.op) +
        " " +
        formatNumber(right) +
        " = " +
        formatNumber(result)
    });

    return result;
  }

  throw new Error("Unknown node");
}


// ============================================================
// FIND OPERATORS IN AST
// ============================================================

function collectOperators(node, list = []) {
  if (!node) {
    return list;
  }

  if (node.type === "group") {
    collectOperators(node.child, list);
    return list;
  }

  if (node.type === "unary") {
    collectOperators(node.operand, list);
    return list;
  }

  if (node.type === "binary") {
    collectOperators(node.left, list);
    list.push(node.op);
    collectOperators(node.right, list);
  }

  return list;
}


// ============================================================
// CHOOSE A SHORT, NATURAL EXPLANATION
// ============================================================

function getExplanationHint(
  expression,
  ast,
  steps
) {
  if (!steps || steps.length <= 1) {
    return "";
  }

  const operators = collectOperators(ast);

  // Parentheses are visibly important.
  if (expression.includes("(")) {
    return "The parentheses are solved first.";
  }

  // Powers should be handled before normal arithmetic.
  if (operators.includes("^")) {
    return "The power is evaluated first.";
  }

  // Multiplication/division before addition/subtraction.
  const hasMultiplyOrDivide =
    operators.includes("*") ||
    operators.includes("/");

  const hasAddOrSubtract =
    operators.includes("+") ||
    operators.includes("-");

  if (
    hasMultiplyOrDivide &&
    hasAddOrSubtract
  ) {
    return "Multiplication and division come before addition and subtraction.";
  }

  // Only addition/subtraction.
  if (
    operators.every(
      op => op === "+" || op === "-"
    )
  ) {
    return "Work from left to right.";
  }

  return "";
}


// ============================================================
// MAIN SOLVER
// ============================================================

export function trySolveMath(rawInput) {
  if (
    rawInput === null ||
    rawInput === undefined
  ) {
    return null;
  }

  let text = String(rawInput).trim();

  if (
    !text ||
    text.length > MAX_INPUT_LENGTH
  ) {
    return null;
  }

  // ----------------------------------------------------------
  // Common natural-language prefixes
  // ----------------------------------------------------------

  text = text.replace(
    /^(what\s+is|what's|calculate|compute|solve|evaluate|find|answer)\s*:?\s*/i,
    ""
  );

  // Remove trailing question marks.
  text = text
    .replace(/\?+\s*$/, "")
    .trim();

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
  // Must contain a number and an operator.
  // ----------------------------------------------------------

  if (!/\d/.test(normalized)) {
    return null;
  }

  if (!/[+\-*/^]/.test(normalized)) {
    return null;
  }

  // Only arithmetic characters.
  //
  // e/E are allowed for scientific notation.
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

    if (!Number.isFinite(result)) {
      return null;
    }

    // --------------------------------------------------------
    // Display expression
    // --------------------------------------------------------

    const expression =
      nodeToText(ast);

    // --------------------------------------------------------
    // Explanation hint
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
        formatNumber(result),

      steps,

      hint,

      operatorCount:
        tokens.filter(token =>
          ["+", "-", "*", "/", "^"]
            .includes(token.type)
        ).length
    };

  } catch (error) {
    // Invalid/malformed arithmetic:
    // allow the normal AI to handle it.
    return null;
  }
}


// ============================================================
// PROFESSIONAL EXPLANATION
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
    formatNumber(solved.result);

  // ----------------------------------------------------------
  // Main answer
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
    lines.push(solved.hint);
  }

  lines.push("");

  steps.forEach((step, index) => {
    lines.push(
      `${index + 1}. **${step.text}**`
    );
  });

  // ----------------------------------------------------------
  // Final answer
  // ----------------------------------------------------------

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