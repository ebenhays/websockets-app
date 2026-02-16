import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetEnv = process.env.ARCJET_ENV || "development";
const arcjetModes = process.env.ARCJET_MODES === "DRY_RUN" ? "DRY_RUN" : "LIVE";

if (!arcjetKey) {
  throw new Error(
    "Error: ARCJET_KEY is not set. Please set the ARCJET_KEY environment variable.",
  );
}

export const httpArcJet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      env: arcjetEnv,
      rules: [
        shield({ mode: arcjetModes }),
        detectBot({
          mode: arcjetModes,
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        slidingWindow({ mode: arcjetModes, interval: "10s", max: 60 }),
      ],
    })
  : null;

export const wsArcJet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      env: arcjetEnv,
      rules: [
        shield({ mode: arcjetModes }),
        detectBot({
          mode: arcjetModes,
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        slidingWindow({ mode: arcjetModes, interval: "2s", max: 5 }),
      ],
    })
  : null;

export function securityMiddleWare() {
  return async (req, res, next) => {
    if (!httpArcJet) {
      return next();
    }
    try {
      const decision = await httpArcJet.protect(req);
      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return res.status(429).json({ error: "Too Many Requests" });
        }
        return res.status(403).json({ error: "Forbidden" });
      }
    } catch (error) {
      console.error("ArcJet error:", error);
      return res.status(503).json({ error: "Service Unavailable" });
    }
    next();
  };
}
