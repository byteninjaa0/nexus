export const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function isStrongPassword(pw) {
  return typeof pw === "string" && passwordRegex.test(pw);
}

export function pagination(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}
