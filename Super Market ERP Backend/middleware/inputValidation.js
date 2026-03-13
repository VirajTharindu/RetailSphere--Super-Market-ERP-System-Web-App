export default function validate(schemas) {
  return (req, res, next) => {
    let validatedData = {};

    for (const { schema, source } of schemas) {
      const parsed = schema.safeParse(req[source]);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          errors: parsed.error.issues,
        });
      }
      validatedData = { ...validatedData, ...parsed.data };
    }

    req.validated = validatedData;
    next();
  };
}
