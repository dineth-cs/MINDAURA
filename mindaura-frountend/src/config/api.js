// ─────────────────────────────────────────────────────────────────────────────
// MindAura API Configuration
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth & Data Backend ──────────────────────────────────────────────────────
// FastAPI on Hugging Face Spaces — handles user auth, emotion history, journal.
// Auth routes: /api/v1/auth/*  |  Emotion routes: /api/v1/emotion/*
export const API_URL = 'https://dinethhasaranga-mindaura-api.hf.space';

// ── AI Prediction Backend (Hugging Face Spaces — Live 🟢) ────────────────────
// Multimodal emotion recognition: VGG16 (face/voice acoustic) + RoBERTa (text/linguistic).
// Endpoints: GET /  |  POST /predict/voice  |  POST /predict/text  |  POST /predict/face
export const AI_BASE_URL = 'https://dinethhasaranga-mindaura-api.hf.space';

export const API_ENDPOINTS = {
    // ── User Authentication (FastAPI / MongoDB) ──────────────────────────────
    AUTH: {
        LOGIN:                  `${API_URL}/api/v1/auth/login`,
        REGISTER:               `${API_URL}/api/v1/auth/register`,
        PROFILE:                `${API_URL}/api/v1/auth/profile`,
        ME:                     `${API_URL}/api/v1/auth/me`,
        UPDATE_EMAIL:           `${API_URL}/api/v1/auth/update-email`,
        UPDATE_PASSWORD:        `${API_URL}/api/v1/auth/update-password`,
        DELETE_ACCOUNT:         `${API_URL}/api/v1/auth/delete-account`,
        CLEAR_DATA:             `${API_URL}/api/v1/auth/clear-data`,
        UPDATE_PUSH_TOKEN:      `${API_URL}/api/v1/auth/update-push-token`,
        UPDATE_PROFILE_PICTURE: `${API_URL}/api/v1/auth/update-profile-picture`,
        UPDATE_PROFILE:         `${API_URL}/api/v1/auth/update-profile`,
    },

    // ── Emotion History (FastAPI / MongoDB) ──────────────────────────────────
    EMOTION: {
        SAVE:    `${API_URL}/api/v1/emotion/save`,
        HISTORY: `${API_URL}/api/v1/emotion/history`,
    },

    // ── Journal (FastAPI / MongoDB) ──────────────────────────────────────────
    JOURNAL: {
        BASE: `${API_URL}/api/v1/journal`,
    },

    // ── Support (FastAPI / MongoDB) ──────────────────────────────────────────
    SUPPORT: {
        BASE: `${API_URL}/api/v1/support`,
    },

    // ── AI Prediction (Hugging Face Space — Live 🟢) ─────────────────────────
    // All three endpoints accept multipart/form-data (file) or JSON depending on modality.
    AI: {
        // GET  /           → Health check — returns model readiness status
        HEALTH_CHECK:   `${AI_BASE_URL}/`,
        // POST /predict/face   → form-data { file: <image> } → VGG16 face emotion
        FACE_EMOTION:   `${AI_BASE_URL}/predict/face`,
        // POST /predict/voice  → form-data { file: <audio> } → VGG16 acoustic + RoBERTa linguistic fusion
        VOICE_EMOTION:  `${AI_BASE_URL}/predict/voice`,
        // POST /predict/text   → JSON { text: "..." }        → RoBERTa text emotion
        TEXT_EMOTION:   `${AI_BASE_URL}/predict/text`,
    },
};