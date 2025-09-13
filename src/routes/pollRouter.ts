import { Router } from "express";
import { createPoll, getPoll, voteOnPoll } from "../controllers/pollController.js";

export const PollRouter = Router();

PollRouter.post("/", createPoll);
PollRouter.get("/:id", getPoll);
PollRouter.post("/:id/vote", voteOnPoll)

