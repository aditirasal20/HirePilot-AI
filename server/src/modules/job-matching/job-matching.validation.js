import { z } from "zod";

const cuidSchema = z.string().cuid("Invalid ID format.");

export const analyzeJobMatchSchema = {
  params: z.object({
    jobId: cuidSchema,
  }),

  body: z.object({
    resumeId: cuidSchema,
    refresh: z.boolean().optional().default(false),
  }),
};

export const getJobMatchReportSchema = {
  params: z.object({
    jobId: cuidSchema,
  }),

  query: z.object({
    resumeId: cuidSchema,
  }),
};

export const deleteJobMatchSchema = {
  params: z.object({
    matchId: cuidSchema,
  }),
};