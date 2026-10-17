import { z } from "zod";
import ApiError from "../utils/ApiError.js";

const validate = (schema, property = "body") => {
  return (req, res, next) => {
    try {
      const parsedData = schema.parse(req[property]);

      // Express defines req.query and req.params as getter-only properties,
      // so they must be redefined before reassignment.
      if (property === "query" || property === "params") {
        Object.defineProperty(req, property, {
          value: parsedData,
          enumerable: true,
          configurable: true,
          writable: true,
        });
      } else {
        req[property] = parsedData;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Zod v4 exposes issues via `error.issues` (the legacy `errors` alias was removed)
        const errorMessage = error.issues.map((e) => e.message).join(", ");
        return next(new ApiError(400, errorMessage));
      }
      next(error);
    }
  };
};
export default validate;