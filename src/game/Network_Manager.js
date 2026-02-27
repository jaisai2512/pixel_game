import { io } from "socket.io-client";
import { EventBus } from "./EventBus.js";

export class NetworkManager {
    constructor() {
        this.socket = null;
        this.token = null;

        if (NetworkManager.cachedToken) {
            this.token = NetworkManager.cachedToken;
            this.connect();
        } else {
            EventBus.once("auth:token", (token) => {
                console.log("Token received in NetworkManager:", token ? "YES" : "NO");
                NetworkManager.cachedToken = token;
                this.token = token;
                this.connect();
            });
        }
    }

    connect() {
        console.log("Connecting to server...");
        this.socket = io(import.meta.env.VITE_SERVER_URL, {
            auth: {
                token: this.token,
            },
        });

        this.socket.on("connect", () => {
            console.log("Socket connected ✅");
            NetworkManager.myId = this.socket.id;
        });

        this.socket.on("connect_error", (err) => {
            console.error("Socket connection error ❌:", err.message);
        });

        this.registerHandlers();
    }

    registerHandlers() {
        // Game → Server
        EventBus.on("addspirit", () => {
            this.socket?.emit("addspirit");
        });

        // Send movement to server (throttled to ~20 times per second)
        let lastMove = 0;
        EventBus.on("player:moved", (data) => {
            const now = Date.now();
            if (now - lastMove > 50) { // 50ms = 20 updates/sec
                lastMove = now;
                this.socket?.emit("playermove", data);
            }
        });

        // Server → Game
        this.socket.on("allplayers", (data) => {
            console.log("allplayers received:", data);
            NetworkManager.cachedPlayers = data;
            EventBus.emit("allplayers", data);
        });

        this.socket.on("addspirit", (data) => {
            console.log("player:add received:", data);
            EventBus.emit("player:add", data);
        });

        this.socket.on("removespirit", (data) => {
            EventBus.emit("removespirit", data);
        });

        this.socket.on("playermove", (data) => {
            EventBus.emit("player:move", data);
        });
    }
}

NetworkManager.cachedToken = null;
NetworkManager.cachedPlayers = null;
NetworkManager.myId = null;

export const networkManager = new NetworkManager();