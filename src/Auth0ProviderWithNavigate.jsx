import { Auth0Provider } from "@auth0/auth0-react";

const Auth0ProviderWithNavigate = ({ children }) => {
    const domain = import.meta.env.VITE_AUTH0_DOMAIN;
    const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
    const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
    const redirectUri = window.location.origin;

    return (
        <Auth0Provider
            domain={domain}
            clientId={clientId}
            authorizationParams={{
                redirect_uri: redirectUri,
                audience: audience,
                scope: "openid profile email",
            }}
        >
            {children}
        </Auth0Provider>
    );
};

export default Auth0ProviderWithNavigate;
