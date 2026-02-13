import { MATCH_STATUS } from "./match-status.js";

export function getMatchStatus(startTime, endTime) {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) {
    return MATCH_STATUS.SCHEDULED;
  } else if (now >= end) {
    return MATCH_STATUS.FINISHED;
  } else {
    return MATCH_STATUS.LIVE;
  }
}
