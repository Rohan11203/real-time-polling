import express from "express";
import dotenv from 'dotenv'
import cors from "cors";
import { UserRouter } from "./routes/userRouter.js";
import { PollRouter } from "./routes/pollRouter.js";
import http from 'http'
import { PrismaClient } from "@prisma/client";
import { setupWebSocketServer } from "./services/websocket.service.js";
dotenv.config()

const app = express();
const server = http.createServer(app)
const PORT = process.env.PORT || 3000;

export const prisma = new PrismaClient()

app.use(cors());

app.use(express.json());

app.use("/api/users", UserRouter);
app.use("/api/polls", PollRouter);

const wss = setupWebSocketServer(server)

export function broadcastPollUpdate(pollId: string, results:any) {
  wss.broadcast(pollId, results);
}

app.get("/", (req, res) => {
  res.send("Testing the server");
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`WebSocket is listening on the same port.`);
});
