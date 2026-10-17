import { z } from "zod";

const companySizeSchema = z.coerce
  .number()
  .int("Company size must be an integer")
  .positive("Company size must be greater than 0")
  .optional();

const legacySizeSchema = z.union([
  z
    .string()
    .trim()
    .min(1, "Size cannot be empty"),
  z.number().int().positive(),
]);

const normalizeSize = (data) => {
  const normalized = { ...data };

  if (
    normalized.companySize === undefined &&
    normalized.size !== undefined
  ) {
    const parsedSize = Number(normalized.size);

    if (Number.isFinite(parsedSize) && parsedSize > 0) {
      normalized.companySize = Math.trunc(parsedSize);
    }
  }

  delete normalized.size;

  return normalized;
};

export const createCompanySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(1000)
    .optional(),

  website: z
    .string()
    .trim()
    .url("Invalid website URL")
    .optional(),

  logo: z
    .string()
    .trim()
    .url("Invalid logo URL")
    .optional(),

  industry: z
    .string()
    .trim()
    .max(100)
    .optional(),

  companySize: companySizeSchema,

  size: legacySizeSchema.optional(),

  location: z
    .string()
    .trim()
    .max(100)
    .optional(),
})
  .transform(normalizeSize);

export const updateCompanySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Company name must be at least 2 characters")
      .max(100, "Company name cannot exceed 100 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000)
      .nullable().optional(),

    website: z
      .string()
      .trim()
      .url("Invalid website URL")
      .nullable().optional(),

    logo: z
      .string()
      .trim()
      .url("Invalid logo URL")
      .nullable().optional(),

    industry: z
      .string()
      .trim()
      .max(100)
      .nullable().optional(),

    companySize: companySizeSchema.nullable(),

    size: legacySizeSchema.optional(),

    location: z
      .string()
      .trim()
      .max(100)
      .nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required to update company",
  })
  .transform(normalizeSize);