import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import StartGame from './game/main';
import { EventBus } from './game/EventBus';

export const PhaserGame = forwardRef(function PhaserGame({ currentActiveScene, getAccessToken }, ref) {
    const game = useRef();

    useLayoutEffect(() => {
        if (game.current === undefined) {
            game.current = StartGame("game-container");

            if (ref !== null) {
                ref.current = { game: game.current, scene: null };
            }
        }

        return () => {
            if (game.current) {
                game.current.destroy(true);
                game.current = undefined;
            }
        };
    }, [ref]);

    useEffect(() => {
        // Fetch the Auth0 access token and emit it over the EventBus
        // so the NetworkManager can attach it to socket handshake auth
        if (getAccessToken) {
            getAccessToken().then((token) => {
                EventBus.emit('auth:token', token);
            }).catch(console.error);
        }
    }, [getAccessToken]);

    useEffect(() => {
        EventBus.on('current-scene-ready', (currentScene) => {
            if (currentActiveScene instanceof Function) {
                currentActiveScene(currentScene);
            }
            ref.current.scene = currentScene;
        });

        return () => {
            EventBus.removeListener('current-scene-ready');
        };
    }, [currentActiveScene, ref]);

    return <div id="game-container"></div>;
});
