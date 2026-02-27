import 'dotenv/config';
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// ─── Auth0 config ─────────────────────────────────────────────────────────────
const AUTH0_DOMAIN   = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE) {
    throw new Error("Missing AUTH0_DOMAIN or AUTH0_AUDIENCE environment variables");
}

const JWKS = createRemoteJWKSet(
    new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`)
);

async function verifyToken(token) {
    const { payload } = await jwtVerify(token, JWKS, {
        issuer:   `https://${AUTH0_DOMAIN}/`,
        audience: AUTH0_AUDIENCE,
    });
    return payload;
}

// ─── Auth middleware ───────────────────────────────────────────────────────────
io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;

    console.log("Token received:", token ? "YES" : "NO");

    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }

    try {
        const payload = await verifyToken(token);
        console.log("Token verified for user:", payload.sub);
        socket.user = {
            sub:   payload.sub,
            email: payload.email,
            name:  payload.name,
        };
        next();
    } catch (err) {
        console.error("JWT verification failed:", err.message);
        next(new Error("Authentication error: Invalid token"));
    }
});

// ─── Game logic ────────────────────────────────────────────────────────────────
const players = {};

io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id} (user: ${socket.user?.sub})`);

    socket.on("addspirit", () => {
        players[socket.id] = {
            id:   socket.id,
            user: socket.user,
            x:    Math.random() * 500,
            y:    Math.random() * 500,
        };

        // Send all existing players to the new client
        socket.emit("allplayers", players);

        // Notify everyone else about the new player
        socket.broadcast.emit("addspirit", players[socket.id]);
    });

    // Handle movement — update position and broadcast to everyone else
    socket.on("playermove", (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;

            socket.broadcast.emit("playermove", {
                id: socket.id,
                x:  data.x,
                y:  data.y,
            });
        }
    });

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
        socket.broadcast.emit("removespirit", socket.id);
        delete players[socket.id];
    });
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});