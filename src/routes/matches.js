import express from "express";
import { createMatchSchema, listMatchesSchema } from "../validation/matches.js";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/getMatchStatus.js";
import { desc } from "drizzle-orm";

const matchRouter = express.Router();
const MAX_LIMIT = 100;
const MIN_LIMIT = 1;

matchRouter.get("/", async (req, res) => {
  const parsedQuery = listMatchesSchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).send({
      error: "Invalid Query Parameters",
      details: JSON.stringify(parsedQuery.error),
    });
  }
  const { limit = MIN_LIMIT } = parsedQuery.data;
  const clampedLimit = Math.min(limit, MAX_LIMIT);
  const results = await db
    .select()
    .from(matches)
    .orderBy(desc(matches.createdAt))
    .limit(clampedLimit);

  res.send({ data: results });
});

matchRouter.post("/", async (req, res) => {
  const parsedData = createMatchSchema.safeParse(req.body);
  const {
    data: { startTime, endTime, homeScore, awayScore },
  } = parsedData;
  if (!parsedData.success) {
    return res.status(400).send({
      error: "Invalid Payload",
      details: JSON.stringify(parsedData.error),
    });
  }
  try {
    const [match] = await db
      .insert(matches)
      .values({
        ...parsedData.data,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime),
      })
      .returning();
    res.status(201).send({ message: "Match created", data: match });
  } catch (error) {
    return res.status(500).send({ error: "Internal Server Error" });
  }
});

export default matchRouter;
