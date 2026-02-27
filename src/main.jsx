import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import Auth0ProviderWithNavigate from './Auth0ProviderWithNavigate.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Auth0ProviderWithNavigate>
            <App />
        </Auth0ProviderWithNavigate>
    </React.StrictMode>,
)
