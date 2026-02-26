import crypto from "node:crypto";

export const getBearerToken = (authorizationHeader = "") =>
  authorizationHeader.startsWith("Bearer ") ? authorizationHeader.slice(7).trim() : "";

export const secureEqual = (left = "", right = "") => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};
