import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();

/* ─────────────────────────────────────────────── */
/* CORS (important for production)               */
/* ─────────────────────────────────────────────── */
app.use(
    cors({
        origin: process.env.CLIENT_URL || "*",
        credentials: true,
    })
);

/* ─────────────────────────────────────────────── */
/* HTTP Server (required for socket.io)          */
/* ─────────────────────────────────────────────── */
const server = http.createServer(app);

/* ─────────────────────────────────────────────── */
/* Socket.io Setup                               */
/* ─────────────────────────────────────────────── */
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
    },
    transports: ["websocket", "polling"], // important for Railway proxy
});

/* ─────────────────────────────────────────────── */
/* Auth0 Config                                  */
/* ─────────────────────────────────────────────── */
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE) {
    throw new Error(
        "Missing AUTH0_DOMAIN or AUTH0_AUDIENCE environment variables"
    );
}

const JWKS = createRemoteJWKSet(
    new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`)
);

async function verifyToken(token) {
    const { payload } = await jwtVerify(token, JWKS, {
        issuer: `https://${AUTH0_DOMAIN}/`,
        audience: AUTH0_AUDIENCE,
    });
    return payload;
}

/* ─────────────────────────────────────────────── */
/* Socket Auth Middleware                        */
/* ─────────────────────────────────────────────── */
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        const payload = await verifyToken(token);

        socket.user = {
            sub: payload.sub,
            email: payload.email,
            name: payload.name,
        };

        next();
    } catch (err) {
        console.error("JWT verification failed:", err.message);
        next(new Error("Authentication error: Invalid token"));
    }
});

/* ─────────────────────────────────────────────── */
/* Game Logic                                    */
/* ─────────────────────────────────────────────── */
const players = {};

io.on("connection", (socket) => {
    console.log(`Connected: ${socket.id} | User: ${socket.user?.sub}`);

    socket.on("addspirit", () => {
        players[socket.id] = {
            id: socket.id,
            user: socket.user,
            x: Math.random() * 500,
            y: Math.random() * 500,
        };

        socket.emit("allplayers", players);
        socket.broadcast.emit("addspirit", players[socket.id]);
    });

    socket.on("playermove", (data) => {
        if (!players[socket.id]) return;

        players[socket.id].x = data.x;
        players[socket.id].y = data.y;

        socket.broadcast.emit("playermove", {
            id: socket.id,
            x: data.x,
            y: data.y,
        });
    });

    socket.on("disconnect", () => {
        console.log(`Disconnected: ${socket.id}`);
        socket.broadcast.emit("removespirit", socket.id);
        delete players[socket.id];
    });
});

/* ─────────────────────────────────────────────── */
/* Health Check Route (VERY IMPORTANT for Railway) */
/* ─────────────────────────────────────────────── */
app.get("/", (req, res) => {
    res.status(200).send("Server is running 🚀");
});

/* ─────────────────────────────────────────────── */
/* Railway Port Binding                          */
/* ─────────────────────────────────────────────── */
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});