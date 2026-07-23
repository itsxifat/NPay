// Wrap an async route so thrown errors reach Express' error handler.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Validate req.body against a zod schema, returning parsed data or 400.
export function validate(schema, data, res) {
  const result = schema.safeParse(data);
  if (!result.success) {
    res.status(400).json({ error: 'validation failed', issues: result.error.flatten() });
    return null;
  }
  return result.data;
}
