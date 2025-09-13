import { Router } from "express";
import { createUser, getUser } from "../controllers/userController.js";

export const UserRouter = Router();

UserRouter.post("/", createUser)
UserRouter.get("/:id", getUser)
