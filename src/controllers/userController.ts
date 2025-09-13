import type { Request, Response } from "express";
import { prisma } from "../index.js";
import bcrypt from "bcryptjs";

export const createUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: "Name, email and password are required",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });
    res.status(201).json(user);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Could not create user." });
  }
};

export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "User ID is required." });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Could not retrieve user." });
  }
};
