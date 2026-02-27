import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { networkManager, NetworkManager } from "../Network_Manager.js";

export class MainMenu extends Scene {

    constructor() {
        super('MainMenu');
    }

    preload() {
        this.load.image("player", "assets/sprite.png");
        this.players = {};
        this.mySprite = null;
        this.cursors = null;
        this.wasd = null;
        this.moveSpeed = 200;
    }

    init() {
        console.log("MainMenu init called");
        EventBus.on("removespirit", this.removespirit, this);
        EventBus.on("player:add", this.addspirit, this);
        EventBus.on("allplayers", this.allspirit, this);
        EventBus.on("player:move", this.movespirit, this);
    }

    create() {
        const map = this.make.tilemap({ key: 'map' });

        const tileset = map.addTilesetImage('tilesheet', 'tiles');

        map.layers.forEach(layerData => {
            map.createLayer(layerData.name, tileset, 0, 0);
        });

        // Arrow keys
        this.cursors = this.input.keyboard.createCursorKeys();

        // WASD keys
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
        });

        // emit addspirit after scene is ready
        EventBus.emit("addspirit");

        // if allplayers data already arrived before scene was ready, use it now
        if (NetworkManager.cachedPlayers) {
            console.log("Using cached players:", NetworkManager.cachedPlayers);
            this.allspirit(NetworkManager.cachedPlayers);
        }

        EventBus.emit('current-scene-ready', this);
    }

    update() {
        if (!this.mySprite) return;

        const speed = this.moveSpeed;
        let moved = false;
        let vx = 0;
        let vy = 0;

        // Horizontal
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            vx = -speed;
            moved = true;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            vx = speed;
            moved = true;
        }

        // Vertical
        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            vy = -speed;
            moved = true;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            vy = speed;
            moved = true;
        }

        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.mySprite.x += vx * (1 / 60);
        this.mySprite.y += vy * (1 / 60);

        // Emit position to server if moved
        if (moved) {
            EventBus.emit("player:moved", {
                x: this.mySprite.x,
                y: this.mySprite.y,
            });
        }
    }

    addspirit(data) {
        console.log("Adding spirit:", data);
        this.players[data.id] = this.add.sprite(data.x, data.y, "player");
    }

    allspirit(data) {
        console.log("allspirit called with:", data);
        for (let i in data) {
            console.log("Adding sprite for:", i, data[i].x, data[i].y);
            const sprite = this.add.sprite(data[i].x, data[i].y, "player");
            this.players[i] = sprite;

            // my own sprite is the one matching my socket id
            if (i === NetworkManager.myId) {
                this.mySprite = sprite;
            }
        }
    }

    movespirit(data) {
        if (this.players[data.id]) {
            this.players[data.id].x = data.x;
            this.players[data.id].y = data.y;
        }
    }

    removespirit(data) {
        if (this.players[data]) {
            this.players[data].destroy();
            delete this.players[data];
        }
    }
}