# pyrefly: ignore [missing-import]
from fastapi import FastAPI, File, UploadFile, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
# pyrefly: ignore [missing-import]
import uvicorn
import os
import io
import tempfile
import threading
# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
import cv2

# ──────────────────────────────────────────────
# App Setup
# ──────────────────────────────────────────────
app = FastAPI(title="MindAura AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# Model Paths
# ──────────────────────────────────────────────
FACE_MODEL_PATH    = "../Models/MindAura_Face_Model_5_Moods/mindaura_face_model_5_moods.keras"
VOICE_MODEL_PATH   = "../Models/MindAura_Voice_Sniper_Model/mindaura_voice_sniper_model.h5"
VOICE_CLASSES_PATH = "../Models/MindAura_Voice_Sniper_Model/mindaura_voice_classes.npy"
TEXT_MODEL_PATH    = "../Models/mindaura_text_final_85_model"

# ──────────────────────────────────────────────
# Global State — set to True once all models load
# ──────────────────────────────────────────────
models_ready = False

face_model      = None
face_mood_names = ['Stressed', 'Happy', 'Sad', 'Bored', 'Energized']

voice_model   = None
voice_classes = None

text_tokenizer = None
text_model     = None

TEXT_LABEL_MAP = {
    0: "Stressed",
    1: "Happy",
    2: "Sad",
    3: "Bored",
    4: "Energized"
}


# ──────────────────────────────────────────────
# Background Model Loader
# ──────────────────────────────────────────────
def load_all_models():
    global models_ready
    global face_model
    global voice_model, voice_classes
    global text_tokenizer, text_model

    try:
        # Import heavy libraries only inside the thread so the server
        # can bind and respond to the health check before they finish loading.
        from tensorflow.keras.models import load_model as tf_load_model
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        import torch
        import librosa  # noqa: F401 — imported here to avoid slow startup

        # ── Face Model ──────────────────────────────
        print("🧠 Loading Face AI Model...")
        face_model = tf_load_model(FACE_MODEL_PATH)
        print("✅ Face Model Loaded Successfully!")

        # ── Voice Model ─────────────────────────────
        print("🎙️ Loading Voice AI Model...")
        voice_model   = tf_load_model(VOICE_MODEL_PATH)
        voice_classes = np.load(VOICE_CLASSES_PATH, allow_pickle=True)
        print(f"✅ Voice Model Loaded! Classes: {list(voice_classes)}")

        # ── Text Model (RoBERTa) ─────────────────────
        print("📝 Loading Text AI Model (RoBERTa)...")
        text_tokenizer = AutoTokenizer.from_pretrained(TEXT_MODEL_PATH)
        text_model     = AutoModelForSequenceClassification.from_pretrained(TEXT_MODEL_PATH)
        text_model.eval()
        print("✅ Text Model Loaded Successfully!")

        models_ready = True
        print("🚀 All models ready — accepting prediction requests.")

    except Exception as e:
        print(f"❌ Model loading failed: {e}")
        # models_ready stays False; endpoints will continue returning 503


# Start loading in background immediately after app initialisation
threading.Thread(target=load_all_models, daemon=True).start()


# ──────────────────────────────────────────────
# Request Schemas
# ──────────────────────────────────────────────
class TextRequest(BaseModel):
    text: str


# ──────────────────────────────────────────────
# Helper: guard prediction endpoints
# ──────────────────────────────────────────────
def require_models():
    if not models_ready:
        raise HTTPException(
            status_code=503,
            detail="Models are still loading. Please try again in a moment."
        )


# ──────────────────────────────────────────────
# Health Check
# ──────────────────────────────────────────────
@app.get("/")
def read_root():
    if not models_ready:
        return {"message": "MindAura AI Backend is warming up... 🔥 Models loading, please wait."}
    return {"message": "MindAura AI Backend is Running! 🚀"}


# ──────────────────────────────────────────────
# Endpoint: /predict-face
# ──────────────────────────────────────────────
@app.post("/predict-face")
async def predict_face(file: UploadFile = File(...)):
    require_models()
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file. Could not decode.")

        img_resized    = cv2.resize(img, (48, 48))
        img_normalized = np.array(img_resized, "float32") / 255.0
        img_reshaped   = np.reshape(img_normalized, (1, 48, 48, 1))

        prediction = face_model.predict(img_reshaped)
        max_index  = int(np.argmax(prediction))
        confidence = float(prediction[0][max_index]) * 100

        return {
            "status": "success",
            "emotion": face_mood_names[max_index],
            "confidence": f"{confidence:.1f}%",
            "all_scores": {face_mood_names[i]: float(prediction[0][i]) for i in range(5)}
        }

    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ──────────────────────────────────────────────
# Endpoint: /predict-voice
# ──────────────────────────────────────────────
@app.post("/predict-voice")
async def predict_voice(file: UploadFile = File(...)):
    require_models()
    try:
        import librosa  # available after background thread imported it
        contents = await file.read()

        # Write to a temp file so librosa can read it
        suffix = os.path.splitext(file.filename)[-1] if file.filename else ".wav"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            # Load audio and extract 40 MFCC features (matches training)
            audio, sample_rate = librosa.load(tmp_path, sr=None)
            mfccs = librosa.feature.mfcc(y=audio, sr=sample_rate, n_mfcc=40)
            mfccs_mean = np.mean(mfccs.T, axis=0)  # Shape: (40,)
        finally:
            os.remove(tmp_path)  # Clean up temp file

        # Reshape to match model input: (1, 40, 1)
        input_data = mfccs_mean.reshape(1, 40, 1)

        prediction = voice_model.predict(input_data)
        max_index  = int(np.argmax(prediction))
        confidence = float(prediction[0][max_index]) * 100
        emotion    = str(voice_classes[max_index])

        return {
            "status": "success",
            "emotion": emotion,
            "confidence": f"{confidence:.1f}%",
            "all_scores": {str(voice_classes[i]): float(prediction[0][i]) for i in range(len(voice_classes))}
        }

    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ──────────────────────────────────────────────
# Endpoint: /predict-text
# ──────────────────────────────────────────────
@app.post("/predict-text")
async def predict_text(request: TextRequest):
    require_models()
    try:
        import torch  # available after background thread imported it

        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text input cannot be empty.")

        # Tokenize input (max 512 tokens, RoBERTa limit)
        inputs = text_tokenizer(
            request.text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True
        )

        # Inference (no gradient computation needed)
        with torch.no_grad():
            outputs = text_model(**inputs)

        logits     = outputs.logits
        probs      = torch.softmax(logits, dim=-1).squeeze().tolist()
        max_index  = int(torch.argmax(logits).item())
        confidence = probs[max_index] * 100
        emotion    = TEXT_LABEL_MAP.get(max_index, f"LABEL_{max_index}")

        return {
            "status": "success",
            "emotion": emotion,
            "confidence": f"{confidence:.1f}%",
            "all_scores": {TEXT_LABEL_MAP.get(i, f"LABEL_{i}"): round(probs[i], 4) for i in range(len(probs))}
        }

    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ──────────────────────────────────────────────
# Entry Point
# ──────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"🚀 Starting MindAura Server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)