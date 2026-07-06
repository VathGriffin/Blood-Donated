'use client';
import React, { useEffect } from "react";
import { Box, Button, Divider, Typography } from "@mui/material";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useUserAuth } from "@/store/UserAuthContext";
import { useRouter } from "next/navigation";
import API_BASE from "@/lib/config";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const FacebookIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

let fbSDKLoaded = false;
const loadFacebookSDK = (appId) => {
    if (fbSDKLoaded || !appId) return;
    fbSDKLoaded = true;
    window.fbAsyncInit = () => {
        window.FB.init({ appId, cookie: true, xfbml: false, version: "v19.0" });
    };
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true; script.defer = true;
    document.body.appendChild(script);
};

const GoogleLoginButton = ({ onError }) => {
    const { login } = useUserAuth();
    const router = useRouter();

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const { data } = await axios.post(`${API_BASE}/api/user/google`, { accessToken: tokenResponse.access_token });
                login(data.token, data.user);
                router.push("/notification");
            } catch (err) {
                onError(err.response?.data?.message || "Google sign-in failed. Please try again.");
            }
        },
        onError: () => onError("Google sign-in was cancelled or failed."),
    });

    return (
        <Button fullWidth variant="outlined" onClick={() => googleLogin()} startIcon={<GoogleIcon />}
            sx={{ py: 1.3, borderRadius: 3, textTransform: "none", fontWeight: 600, fontSize: "0.92rem", borderColor: "#dadce0", color: "text.primary", "&:hover": { borderColor: "#bbb", bgcolor: "rgba(0,0,0,0.03)" } }}>
            Continue with Google
        </Button>
    );
};

const FacebookLoginButton = ({ onError }) => {
    const { login } = useUserAuth();
    const router = useRouter();

    useEffect(() => { loadFacebookSDK(FACEBOOK_APP_ID); }, []);

    const handleFacebookLogin = () => {
        if (!window.FB) { onError("Facebook is loading — please try again in a moment."); return; }
        window.FB.login((response) => {
            if (!response.authResponse) { onError("Facebook sign-in was cancelled."); return; }
            axios.post(`${API_BASE}/api/user/facebook`, { accessToken: response.authResponse.accessToken })
                .then(({ data }) => { login(data.token, data.user); router.push("/notification"); })
                .catch((err) => { onError(err.response?.data?.message || "Facebook sign-in failed. Please try again."); });
        }, { scope: "public_profile,email" });
    };

    return (
        <Button fullWidth variant="outlined" onClick={handleFacebookLogin} startIcon={<FacebookIcon />}
            sx={{ py: 1.3, borderRadius: 3, textTransform: "none", fontWeight: 600, fontSize: "0.92rem", borderColor: "#1877F2", color: "#1877F2", "&:hover": { borderColor: "#1877F2", bgcolor: "rgba(24,119,242,0.05)" } }}>
            Continue with Facebook
        </Button>
    );
};

const SocialButtons = ({ onError }) => {
    if (!GOOGLE_CLIENT_ID && !FACEBOOK_APP_ID) return null;
    return (
        <>
            <Divider sx={{ my: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing="0.08em">
                    OR CONTINUE WITH
                </Typography>
            </Divider>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {GOOGLE_CLIENT_ID && <GoogleLoginButton onError={onError} />}
                {FACEBOOK_APP_ID && <FacebookLoginButton onError={onError} />}
            </Box>
        </>
    );
};

export default SocialButtons;
