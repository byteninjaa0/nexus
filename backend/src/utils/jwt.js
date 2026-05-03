import jwt from "jsonwebtoken";

const accessSecret = process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;
const accessExpires = process.env.JWT_ACCESS_EXPIRES || "15m";
const refreshExpires = process.env.JWT_REFRESH_EXPIRES || "7d";

function parseRefreshMs() {
  const m = String(refreshExpires).match(/^(\d+)([dhms])$/);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const u = m[2];
  if (u === "d") return n * 24 * 60 * 60 * 1000;
  if (u === "h") return n * 60 * 60 * 1000;
  if (u === "m") return n * 60 * 1000;
  if (u === "s") return n * 1000;
  return 7 * 24 * 60 * 60 * 1000;
}

export function signAccessToken(payload) {
  if (!accessSecret) throw new Error("JWT_SECRET missing");
  return jwt.sign(payload, accessSecret, { expiresIn: accessExpires });
}

export function signRefreshToken(payload) {
  if (!refreshSecret) throw new Error("JWT_REFRESH_SECRET missing");
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshExpires });
}

export function verifyAccessToken(token) {
  if (!accessSecret) throw new Error("JWT_SECRET missing");
  return jwt.verify(token, accessSecret);
}

export function verifyRefreshToken(token) {
  if (!refreshSecret) throw new Error("JWT_REFRESH_SECRET missing");
  return jwt.verify(token, refreshSecret);
}

export function getRefreshExpiryDate() {
  return new Date(Date.now() + parseRefreshMs());
}
