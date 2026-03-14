import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

interface ValidationSchema {
  schema: ZodSchema;
  source: "body" | "query" | "params";
}

export default function validate(schemas: ValidationSchema[] | ValidationSchema[][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    let validatedData: Record<string, unknown> = {};

    // Flatten in case an array of arrays is passed
    const flatSchemas = Array.isArray(schemas[0]) 
      ? schemas.flat() as ValidationSchema[] 
      : schemas as ValidationSchema[];

    for (const { schema, source } of flatSchemas) {
      const parsed = schema.safeParse(req[source]);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          errors: (parsed as any).error.issues,
        });
      }
      validatedData = { ...validatedData, ...(parsed.data as any) };
    }

    req.validated = validatedData;
    next();
  };
}
