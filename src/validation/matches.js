import { z } from "zod";

// Match status enum aligned with DB enum
export const matchStatusEnum = z.enum(["scheduled", "live", "finished"]);

// Accept scores as either number or string (DB stores as text)
const scoreSchema = z.coerce.number().int().nonnegative().optional();

// Timestamps are accepted as ISO strings (or left undefined/null)
const isoTimestamp = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: "Invalid ISO timestamp",
});

// Schema for creating a match
export const createMatchSchema = z
  .object({
    sport: z.string().min(1),
    homeTeam: z.string().min(1),
    awayTeam: z.string().min(1),
    status: matchStatusEnum.optional().default("scheduled"),
    startTime: isoTimestamp,
    endTime: isoTimestamp,
    homeScore: scoreSchema.optional().default("0"),
    awayScore: scoreSchema.optional().default("0"),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time",
      });
    }
  });

export const listMatchesSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// // Schema for updating a match (all fields optional except id when provided separately)
// export const updateMatchSchema = createMatchSchema.partial();

// // Schema representing a match returned from DB (includes id and timestamps)
// export const matchResponseSchema = createMatchSchema.extend({
//   id: z.number(),
//   createdAt: z.string().datetime(),
//   updatedAt: z.string().datetime(),
// });

// // Commentary schema
// export const createCommentarySchema = z.object({
//   matchId: z.number(),
//   minute: z.number().optional(),
//   sequence: z.number().optional(),
//   period: z.string().optional(),
//   eventType: z.string().optional(),
//   actor: z.string().optional(),
//   team: z.string().optional(),
//   message: z.string().min(1),
//   metadata: z.any().optional(),
//   tags: z.array(z.string()).optional(),
// });

// export const commentaryResponseSchema = createCommentarySchema.extend({
//   id: z.number(),
//   createdAt: z.iso.datetime(),
// });

export default {
  matchStatusEnum,
  createMatchSchema,
  listMatchesSchema,
  matchIdParamSchema,
  //   updateMatchSchema,
  //   matchResponseSchema,
  //   createCommentarySchema,
  //   commentaryResponseSchema,
};
