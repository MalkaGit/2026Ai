import { ZodSchema } from "zod";

export function parseAndValidate<T>(
  text: string,
  schema: ZodSchema<T>
): {
  success: boolean;
  data?: T;
  error?: unknown;
} {
  try {
    const parsed = JSON.parse(text);
    const validated = schema.parse(parsed);

    return {
      success: true,
      data: validated
    };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
}