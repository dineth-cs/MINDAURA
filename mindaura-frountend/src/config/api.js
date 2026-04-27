// ✅ Production backend (Render)
// For local development (Android Emulator): http://10.0.2.2:5000
// For local development (iOS Simulator): http://localhost:5000
export const API_URL = 'https://mindaura-wfut.onrender.com';

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: `${API_URL}/api/auth/login`,
        REGISTER: `${API_URL}/api/auth/register`,
        PROFILE: `${API_URL}/api/auth/profile`,
        ME: `${API_URL}/api/auth/me`,
        UPDATE_EMAIL: `${API_URL}/api/auth/update-email`,
        UPDATE_PASSWORD: `${API_URL}/api/auth/update-password`,
        DELETE_ACCOUNT: `${API_URL}/api/auth/delete-account`,
        CLEAR_DATA: `${API_URL}/api/auth/clear-data`,
        UPDATE_PUSH_TOKEN: `${API_URL}/api/auth/update-push-token`,
        UPDATE_PROFILE_PICTURE: `${API_URL}/api/auth/update-profile-picture`,
        UPDATE_PROFILE: `${API_URL}/api/auth/update-profile`,
    },
    EMOTION: {
        SAVE: `${API_URL}/api/emotion/save`,
        HISTORY: `${API_URL}/api/emotion/history`,
    },
    JOURNAL: {
        BASE: `${API_URL}/api/journal`,
    },
    SUPPORT: {
        BASE: `${API_URL}/api/support`,
    }
};
