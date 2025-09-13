import type { Request, Response } from "express";
import { broadcastPollUpdate, prisma } from "../index.js";

interface CreatePollBody {
  question: string;
  options: string[];
  creatorId: string;
}

interface VoteBody {
  userId: string;
  pollOptionId: string;
}

async function getPollResults(pollId: string) {
  const results = await prisma.pollOption.findMany({
    where: { pollId: pollId },
    select: {
      id: true,
      text: true,
      _count: { select: { votes: true } },
    },
  });

  return results.map((option) => ({
    id: option.id,
    text: option.text,
    votes: option._count.votes,
  }));
}

export const createPoll = async (
  req: Request<{}, {}, CreatePollBody>,
  res: Response
) => {
  const { question, options, creatorId } = req.body;
  if (!question || !options || !creatorId || options.length < 2) {
    return res
      .status(400)
      .json({ error: "Missing required fields or not enough options." });
  }

  try {
    const poll = await prisma.poll.create({
      data: {
        question,
        creatorId,
        options: { create: options.map((text) => ({ text })) },
      },
      include: { options: true },
    });
    res.status(201).json(poll);
  } catch (error) {
    res.status(500).json({ error: "Could not create poll." });
  }
};

export const getPoll = async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  try {
    const poll = await prisma.poll.findUnique({
      where: { id },
      include: { options: { select: { id: true, text: true } } },
    });

    if (!poll) return res.status(404).json({ error: "Poll not found." });

    const results = await getPollResults(id);
    res.status(200).json({ ...poll, results });
  } catch (error) {
    res.status(500).json({ error: "Could not retrieve poll." });
  }
};


export const voteOnPoll = async (req: Request<{ id: string }, {}, VoteBody>, res: Response) => {
    const pollId = req.params.id;
    const { userId, pollOptionId } = req.body;

    if (!userId || !pollOptionId) {
        return res.status(400).json({ error: 'userId and pollOptionId are required.' });
    }
    try {
        const option = await prisma.pollOption.findUnique({ where: { id: pollOptionId } });
        if (!option || option.pollId !== pollId) {
            return res.status(400).json({ error: 'Poll option not valid for this poll.' });
        }

        await prisma.vote.create({ data: { userId, pollOptionId } });

        const updatedResults = await getPollResults(pollId);
        broadcastPollUpdate(pollId, updatedResults); 
        res.status(201).json({ message: 'Vote cast successfully.', results: updatedResults });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'You have already voted for this option.' });
        }
        res.status(500).json({ error: 'Could not cast vote.' });
    }
};