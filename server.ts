import path from "path";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";

//Rooms
import { MyRoom } from "./src/rooms/MyRoom";

const port = Number(process.env.PORT || 8000);
const app = express();

app.use(cors());
// app.use(helmet());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public', 'dist')));

// Routing

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dist', 'index.html'));
});

const server = http.createServer(app);
const gameServer = new Server({
  server,
});

const CHAT_ROOM: string = 'chat-room';

// register your room handlers
gameServer.define(CHAT_ROOM, MyRoom);

/**
 * Register @colyseus/social routes
 *
 * - uncomment if you want to use default authentication (https://docs.colyseus.io/server/authentication/)
 * - also uncomment the import statement
 */
// app.use("/", socialRoutes);

// register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor());

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`)
