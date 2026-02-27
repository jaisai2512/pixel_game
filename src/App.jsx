import { useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { PhaserGame } from './PhaserGame';

function App() {
    const phaserRef = useRef();
    const { isAuthenticated, isLoading, loginWithRedirect, logout, user, getAccessTokenSilently } = useAuth0();

    const currentScene = (scene) => {
        // Optionally handle scene changes
    };

    if (isLoading) {
        return (
            <div style={styles.centered}>
                <p style={styles.loadingText}>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div style={styles.centered}>
                <div style={styles.loginCard}>
                    <h1 style={styles.title}>🎮 Multiplayer Game</h1>
                    <p style={styles.subtitle}>Sign in to play with others</p>
                    <button
                        style={styles.loginBtn}
                        onClick={() => loginWithRedirect()}
                    >
                        Log In with Auth0
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div id="app" style={styles.appContainer}>
            {/* HUD overlay */}
            <div style={styles.hud}>
                <span style={styles.userInfo}>👤 {user.name || user.email}</span>
                <button
                    style={styles.logoutBtn}
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                >
                    Log Out
                </button>
            </div>

            {/* Pass getAccessTokenSilently so PhaserGame/NetworkManager can attach the token */}
            <PhaserGame
                ref={phaserRef}
                currentActiveScene={currentScene}
                getAccessToken={getAccessTokenSilently}
            />
        </div>
    );
}

const styles = {
    centered: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0f0f1a',
    },
    loginCard: {
        background: '#1a1a2e', padding: '48px 64px', borderRadius: '16px',
        textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '1px solid #2a2a4a',
    },
    title: { color: '#fff', fontSize: '2rem', marginBottom: '8px' },
    subtitle: { color: '#888', marginBottom: '32px' },
    loginBtn: {
        background: '#635dff', color: '#fff', border: 'none',
        padding: '14px 32px', borderRadius: '8px', fontSize: '1rem',
        cursor: 'pointer', fontWeight: 'bold',
    },
    loadingText: { color: '#fff', fontSize: '1.2rem' },
    appContainer: { position: 'relative' },
    hud: {
        position: 'fixed', top: 12, right: 16, zIndex: 1000,
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'rgba(0,0,0,0.6)', padding: '8px 16px',
        borderRadius: '8px', backdropFilter: 'blur(4px)',
    },
    userInfo: { color: '#fff', fontSize: '0.9rem' },
    logoutBtn: {
        background: '#e53e3e', color: '#fff', border: 'none',
        padding: '6px 14px', borderRadius: '6px', fontSize: '0.85rem',
        cursor: 'pointer',
    },
};

export default App;
