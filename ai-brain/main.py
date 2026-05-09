from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import tempfile
import numpy as np
import cv2
import librosa
import threading
import time

app = FastAPI(title="MindAura AI Backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Global model handles ──────────────────────────────────────────────────────
face_model = None
voice_model = None
text_tokenizer = None
text_model = None
models_ready = False

# ── Label maps ────────────────────────────────────────────────────────────────
MOOD_LABELS = ['Stressed', 'Happy', 'Sad', 'Bored', 'Energized']
TEXT_LABEL_MAP = {0: "Stressed", 1: "Happy", 2: "Sad", 3: "Bored", 4: "Energized"}


def load_models_in_background():
    global face_model, voice_model, text_tokenizer, text_model, models_ready
    print("⏳ Waiting 10 seconds for Uvicorn to bind port...")
    time.sleep(10)

    try:
        print("📦 Importing heavy ML libraries...")
        from tensorflow.keras.models import load_model

        # ── Face Model (VGG16-based, 224x224 RGB) ────────────────────────────
        print("🧠 Loading Face Model (VGG16)...")
        face_model = load_model("Models/mindaura_vgg16_perfect.h5")
        print("✅ Face model loaded.")

        # ── Voice Model (VGG16-based, Mel-Spectrogram 224x224 RGB) ───────────
        print("🎙️ Loading Voice Model (VGG16)...")
        voice_model = load_model("Models/mindaura_audio_vgg16_final.h5")
        print("✅ Voice model loaded.")

        # ── Text Model (HuggingFace Transformer) ─────────────────────────────
        print("📝 Loading Text Model...")
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        text_tokenizer = AutoTokenizer.from_pretrained("Models/mindaura_text_final_85_model")
        text_model = AutoModelForSequenceClassification.from_pretrained("Models/mindaura_text_final_85_model")
        text_model.eval()
        print("✅ Text model loaded.")

        models_ready = True
        print("🚀 All Models Loaded Successfully!")
    except Exception as e:
        print(f"❌ Model loading error: {e}")


@app.on_event("startup")
def startup_event():
    threading.Thread(target=load_models_in_background, daemon=True).start()


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    if models_ready:
        return {"status": "ready", "message": "MindAura AI is Ready! 🚀"}
    return {"status": "warming_up", "message": "Warming up models... ⏳"}


# ── /predict/face ─────────────────────────────────────────────────────────────
@app.post("/predict/face")
async def predict_face(file: UploadFile = File(...)):
    """
    Accepts a JPEG/PNG image upload.
    Resizes to 224x224, applies VGG16 preprocess_input, runs the face model.
    Returns: { type, emotion, confidence }
    """
    if not models_ready:
        raise HTTPException(status_code=503, detail="Models are still warming up. Please try again shortly.")

    try:
        from tensorflow.keras.applications.vgg16 import preprocess_input

        contents = await file.read()
        np_arr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)  # Read as BGR

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file. Could not decode.")

        # Resize to 224x224 and convert BGR → RGB
        img_resized = cv2.resize(img, (224, 224))
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)

        # VGG16 preprocessing: expand dims + preprocess_input (zero-centers on ImageNet mean)
        img_array = np.expand_dims(img_rgb.astype("float32"), axis=0)
        img_preprocessed = preprocess_input(img_array)

        pred = face_model.predict(img_preprocessed, verbose=0)
        max_idx = int(np.argmax(pred[0]))
        confidence = float(pred[0][max_idx]) * 100

        return {
            "type": "face",
            "emotion": MOOD_LABELS[max_idx],
            "confidence": f"{confidence:.1f}%"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face prediction failed: {str(e)}")


# ── /predict/voice ────────────────────────────────────────────────────────────
@app.post("/predict/voice")
async def predict_voice(file: UploadFile = File(...)):
    """
    Accepts an audio file upload (WAV/M4A/any librosa-compatible format).
    Converts to a Mel-Spectrogram image (224x224 RGB), applies VGG16 preprocess_input.
    Returns: { type, emotion, confidence }
    """
    if not models_ready:
        raise HTTPException(status_code=503, detail="Models are still warming up. Please try again shortly.")

    tmp_path = None
    try:
        from tensorflow.keras.applications.vgg16 import preprocess_input

        contents = await file.read()

        # Save to a temp file so librosa can decode it
        suffix = os.path.splitext(file.filename or "audio.wav")[1] or ".wav"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        # Load audio with librosa
        audio, sr = librosa.load(tmp_path, sr=22050, mono=True)

        # Generate Mel-Spectrogram (128 mels, hop 512) → power to dB
        mel_spec = librosa.feature.melspectrogram(y=audio, sr=sr, n_mels=128, hop_length=512)
        mel_db = librosa.power_to_db(mel_spec, ref=np.max)

        # Normalise to [0, 255] and convert to uint8 for image processing
        mel_norm = ((mel_db - mel_db.min()) / (mel_db.max() - mel_db.min() + 1e-8) * 255).astype(np.uint8)

        # Convert single-channel spectrogram to 3-channel RGB image sized 224x224
        mel_rgb = cv2.cvtColor(mel_norm, cv2.COLOR_GRAY2RGB)
        mel_resized = cv2.resize(mel_rgb, (224, 224))

        # VGG16 preprocessing
        img_array = np.expand_dims(mel_resized.astype("float32"), axis=0)
        img_preprocessed = preprocess_input(img_array)

        pred = voice_model.predict(img_preprocessed, verbose=0)
        max_idx = int(np.argmax(pred[0]))
        confidence = float(pred[0][max_idx]) * 100

        return {
            "type": "voice",
            "emotion": MOOD_LABELS[max_idx],
            "confidence": f"{confidence:.1f}%"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice prediction failed: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


# ── /predict/text ─────────────────────────────────────────────────────────────
class TextRequest(BaseModel):
    text: str

@app.post("/predict/text")
async def predict_text(request: TextRequest):
    """
    Accepts a JSON body with a 'text' field.
    Uses the HuggingFace transformer model.
    Returns: { type, emotion, confidence }
    """
    if not models_ready:
        raise HTTPException(status_code=503, detail="Models are still warming up. Please try again shortly.")
    try:
        import torch
        inputs = text_tokenizer(
            request.text, return_tensors="pt",
            truncation=True, max_length=512, padding=True
        )
        with torch.no_grad():
            outputs = text_model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1).squeeze().tolist()
        max_idx = int(torch.argmax(outputs.logits).item())
        return {
            "type": "text",
            "emotion": TEXT_LABEL_MAP.get(max_idx, "Unknown"),
            "confidence": f"{probs[max_idx] * 100:.1f}%"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text prediction failed: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))