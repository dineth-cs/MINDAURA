// Production backend (Render) for Auth, DB, etc.
// For local development (Android Emulator): http://10.0.2.2:5000
// For local development (iOS Simulator): http://localhost:5000
export const API_URL = 'https://dinethhasaranga-mindaura-api.hf.space';

// AntiGravity Engine - AI Model Backend (Hugging Face Spaces - Production)
export const AI_BASE_URL = 'https://dinethhasaranga-mindaura-api.hf.space';

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: `${API_URL}/api/v1/auth/login`,
        REGISTER: `${API_URL}/api/v1/auth/register`,
        PROFILE: `${API_URL}/api/v1/auth/profile`,
        ME: `${API_URL}/api/v1/auth/me`,
        UPDATE_EMAIL: `${API_URL}/api/v1/auth/update-email`,
        UPDATE_PASSWORD: `${API_URL}/api/v1/auth/update-password`,
        DELETE_ACCOUNT: `${API_URL}/api/v1/auth/delete-account`,
        CLEAR_DATA: `${API_URL}/api/v1/auth/clear-data`,
        UPDATE_PUSH_TOKEN: `${API_URL}/api/v1/auth/update-push-token`,
        UPDATE_PROFILE_PICTURE: `${API_URL}/api/v1/auth/update-profile-picture`,
        UPDATE_PROFILE: `${API_URL}/api/v1/auth/update-profile`,
    },
    EMOTION: {
        SAVE: `${API_URL}/api/v1/emotion/save`,
        HISTORY: `${API_URL}/api/v1/emotion/history`,
    },
    JOURNAL: {
        BASE: `${API_URL}/api/v1/journal`,
    },
    SUPPORT: {
        BASE: `${API_URL}/api/v1/support`,
    },
    AI: {
        FACE_EMOTION: `${AI_BASE_URL}/predict/face`,
        VOICE_EMOTION: `${AI_BASE_URL}/predict/voice`,
        TEXT_EMOTION: `${AI_BASE_URL}/predict/text`, 
    }
};