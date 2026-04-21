const path = require("path");
const fs = require("fs");

/**
 * Allowed upload directories (relative to process.cwd()).
 * Used to prevent path traversal attacks.
 */
const ALLOWED_UPLOAD_DIRS = [
  "uploads",
  "paymentSlipImages",
  "custompcbImages",
  "custompcbZipFiles",
  "copypcbImages",
  "copypcbZipFiles",
  "assemblypcbImages",
  "assemblypcbZipFiles",
  "gerbers",
  "tempZip",
];

/**
 * Sanitizes a file path from user input and resolves it safely.
 * Returns the absolute path if valid, or null if the path is unsafe
 * (e.g., contains path traversal like ../ or points outside allowed dirs).
 */
const sanitizeFilePath = (userInputPath) => {
  if (!userInputPath || typeof userInputPath !== "string") return null;

  let clean = userInputPath.replace(/\\/g, "/");

  // Strip path traversal sequences
  while (clean.includes("../")) {
    clean = clean.replace(/\.\.\//g, "");
  }
  while (clean.includes("..\\")) {
    clean = clean.replace(/\.\.\\/g, "");
  }

  clean = path.normalize(clean);

  if (!clean.startsWith("/")) {
    clean = "/" + clean;
  }

  const relativePath = clean.slice(1);
  const absolutePath = path.resolve(process.cwd(), relativePath);
  const cwd = process.cwd();

  if (!absolutePath.startsWith(cwd)) {
    return null;
  }

  const resolvedRelative = path.relative(cwd, absolutePath);
  const sep = path.sep;
  const isAllowed = ALLOWED_UPLOAD_DIRS.some(
    (dir) =>
      resolvedRelative.startsWith(dir + sep) || resolvedRelative === dir,
  );

  if (!isAllowed) {
    return null;
  }

  return absolutePath;
};

/**
 * Safely resolves a payment slip path for QR code scanning or file operations.
 * Returns the absolute path or null if the path is unsafe.
 */
const resolvePaymentSlipPath = (rawPath) => {
  if (!rawPath || typeof rawPath !== "string") return null;

  let clean = rawPath.replace(/\\/g, "/");
  if (!clean.startsWith("/")) {
    clean = "/" + clean;
  }

  const absolute = path.resolve(process.cwd(), clean.slice(1));
  const cwd = process.cwd();

  if (!absolute.startsWith(cwd)) return null;

  const rel = path.relative(cwd, absolute);
  const sep = path.sep;
  const allowed = [
    "uploads",
    "paymentSlipImages",
    "custompcbImages",
    "copypcbImages",
    "assemblypcbImages",
  ];
  const isAllowed = allowed.some(
    (dir) => rel.startsWith(dir + sep) || rel === dir,
  );
  if (!isAllowed) return null;

  return absolute;
};

module.exports = {
  sanitizeFilePath,
  resolvePaymentSlipPath,
  ALLOWED_UPLOAD_DIRS,
};
