import { z } from "zod";
import { EmploymentType } from "@prisma/client";
import { JobStatus } from "@prisma/client";

export const createJobSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(3, "Job title must be at least 3 characters long.")
            .max(100, "Job title cannot exceed 100 characters."),

        description: z
            .string()
            .trim()
            .min(20, "Description must be at least 20 characters long."),

        location: z
            .string()
            .trim()
            .min(2, "Location is required."),

        salaryMin: z
            .number()
            .nonnegative("Minimum salary cannot be negative."),

        salaryMax: z
            .number()
            .nonnegative("Maximum salary cannot be negative."),

        yearsOfExperience: z
            .number()
            .int()
            .min(0, "Years of experience cannot be negative."),

        employmentType: z.nativeEnum(EmploymentType),

        requiredSkills: z
            .array(z.string().trim())
            .min(1, "At least one skill is required."),
    })
    .refine((data) => data.salaryMin <= data.salaryMax, {
        path: ["salaryMax"],
        message: "Maximum salary must be greater than or equal to minimum salary.",
    });

export const updateJobSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(3)
            .max(100)
            .optional(),

        description: z
            .string()
            .trim()
            .min(20)
            .optional(),

        location: z
            .string()
            .trim()
            .min(2)
            .optional(),

        salaryMin: z
            .number()
            .nonnegative()
            .optional(),

        salaryMax: z
            .number()
            .nonnegative()
            .optional(),

        yearsOfExperience: z
            .number()
            .int()
            .min(0)
            .optional(),

        employmentType: z
            .nativeEnum(EmploymentType)
            .optional(),

        requiredSkills: z
            .array(z.string().trim())
            .min(1)
            .optional(),
    })
    .refine(
        (data) =>
            data.salaryMin === undefined ||
            data.salaryMax === undefined ||
            data.salaryMin <= data.salaryMax,
        {
            path: ["salaryMax"],
            message:
                "Maximum salary must be greater than or equal to minimum salary.",
        }
    );

export const updateJobStatusSchema = z.object({
  status: z.nativeEnum(JobStatus),
});

export const getPublicJobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  location: z.string().trim().optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  experience: z.coerce.number().int().min(0).optional(),
  minSalary: z.coerce.number().nonnegative().optional(),
  maxSalary: z.coerce.number().nonnegative().optional(),
  skill: z.union([z.string().trim(), z.array(z.string().trim())]).optional(),
  sort: z.enum(["latest", "oldest", "salaryAsc", "salaryDesc"]).optional().default("latest"),
});

export const getMyJobsQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.nativeEnum(JobStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});