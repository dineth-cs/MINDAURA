# =============================================================================
#  MindAura AI Backend — Multimodal Emotion Engine
#  Endpoints:
#    GET  /              → health check
#    POST /predict/face  → VGG16 face emotion (image upload)
#    POST /predict/voice → Multimodal voice emotion (acoustic + linguistic fusion)
#    POST /predict/text  → RoBERTa text emotion (JSON body)
# =============================================================================

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import tempfile

# pyrefly: ignore [missing-import]
import numpy as np
import cv2
import librosa
import soundfile as sf
import speech_recognition as sr
import threading
import time

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="MindAura Multimodal AI Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global model handles ──────────────────────────────────────────────────────
face_model      = None   # VGG16 face emotion model (.h5)
voice_model     = None   # VGG16 acoustic voice model (.h5)
text_tokenizer  = None   # RoBERTa tokenizer (HuggingFace)
text_model      = None   # RoBERTa sequence classifier (HuggingFace, PyTorch)
models_ready    = False

# ── Label maps ────────────────────────────────────────────────────────────────
MOOD_LABELS    = ['Stressed', 'Happy', 'Sad', 'Bored', 'Energized']
TEXT_LABEL_MAP = {0: "Stressed", 1: "Happy", 2: "Sad", 3: "Bored", 4: "Energized"}


# ── Background model loader ───────────────────────────────────────────────────
def load_models_in_background():
    global face_model, voice_model, text_tokenizer, text_model, models_ready
    print("⏳ Waiting 10 seconds for Uvicorn to bind port...")
    time.sleep(10)

    try:
        print("📦 Importing heavy ML libraries...")
        from tensorflow.keras.models import load_model
        from transformers import AutoTokenizer, AutoModelForSequenceClassification

        # ── Face Model (VGG16, 224×224 RGB) ──────────────────────────────────
        print("🧠 Loading Face Model (VGG16)...")
        face_model = load_model("Models/mindaura_vgg16_perfect.h5")
        print("✅ Face model loaded.")

        # ── Voice / Acoustic Model (VGG16 Mel-Spectrogram, 224×224 RGB) ──────
        print("🎙️ Loading Voice/Acoustic Model (VGG16)...")
        voice_model = load_model("Models/mindaura_audio_vgg16_final.h5")
        print("✅ Voice model loaded.")

        # ── Text / Linguistic Model (RoBERTa via HuggingFace, PyTorch) ───────
        print("📝 Loading Text/Linguistic Model (RoBERTa)...")
        text_tokenizer = AutoTokenizer.from_pretrained(
            "./Models/mindaura_text_final_85_model"
        )
        text_model = AutoModelForSequenceClassification.from_pretrained(
            "./Models/mindaura_text_final_85_model"
        )
        text_model.eval()
        print("✅ Text model loaded.")

        models_ready = True
        print("🚀 All Models Loaded — Multimodal AI is Ready!")
    except Exception as e:
        print(f"❌ Model loading error: {e}")


@app.on_event("startup")
def startup_event():
    threading.Thread(target=load_models_in_background, daemon=True).start()


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    if models_ready:
        return {"status": "ready", "message": "MindAura Multimodal AI is Ready! 🚀"}
    return {"status": "warming_up", "message": "Warming up models... ⏳"}


# =============================================================================
#  /predict/face  —  VGG16 Face Emotion
# =============================================================================
@app.post("/predict/face")
async def predict_face(file: UploadFile = File(...)):
    """
    Accepts a JPEG/PNG image upload.
    Pipeline: BGR decode → resize 224×224 → BGR→RGB → VGG16 preprocess_input.
    Returns: { type, emotion, confidence }
    """
    if not models_ready:
        raise HTTPException(
            status_code=503,
            detail="Models are still warming up. Please try again shortly.",
        )
    try:
        from tensorflow.keras.applications.vgg16 import preprocess_input

        contents = await file.read()
        np_arr   = np.frombuffer(contents, np.uint8)
        img      = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)  # BGR

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file. Could not decode.")

        img_resized     = cv2.resize(img, (224, 224))
        img_rgb         = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
        img_array       = np.expand_dims(img_rgb.astype("float32"), axis=0)
        img_preprocessed = preprocess_input(img_array)

        pred       = face_model.predict(img_preprocessed, verbose=0)
        max_idx    = int(np.argmax(pred[0]))
        confidence = float(pred[0][max_idx]) * 100

        return {
            "type":       "face",
            "emotion":    MOOD_LABELS[max_idx],
            "confidence": f"{confidence:.1f}%",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face prediction failed: {str(e)}")


# =============================================================================
#  /predict/voice  —  Multimodal Voice Emotion (Acoustic + Linguistic Fusion)
# =============================================================================
@app.post("/predict/voice")
async def predict_voice(file: UploadFile = File(...)):
    """
    Multimodal pipeline that fuses two independent branches:

    ┌─────────────────────────────────────────────────────────────────┐
    │  BRANCH A — Acoustic (VGG16 Mel-Spectrogram)                    │
    │    Load audio → trim silence → pad/truncate to 3 s →            │
    │    Mel-Spectrogram dB → Viridis colormap → resize 224×224 →     │
    │    VGG16 preprocess_input → softmax probability vector          │
    ├─────────────────────────────────────────────────────────────────┤
    │  BRANCH B — Linguistic (Google STT → RoBERTa)                   │
    │    Resample to 16 kHz → Google Web Speech API → transcribed     │
    │    text → RoBERTa tokenizer → softmax probability vector        │
    └─────────────────────────────────────────────────────────────────┘
    FUSION:
      • Text found  → fused_probs = (voice_probs + text_probs) / 2
      • No text     → fused_probs = voice_probs  (acoustic only)

    Returns detailed JSON with per-branch predictions + fused result.
    """
    if not models_ready:
        raise HTTPException(
            status_code=503,
            detail="Models are still warming up. Please try again shortly.",
        )

    tmp_audio_path = None   # original audio temp file
    tmp_stt_path   = None   # 16 kHz WAV for Speech Recognition

    try:
        import torch
        from tensorflow.keras.applications.vgg16 import preprocess_input

        # ── Save uploaded bytes to a temp file ───────────────────────────────
        contents = await file.read()
        suffix   = os.path.splitext(file.filename or "audio.wav")[1] or ".wav"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(contents)
            tmp_audio_path = tmp.name

        # ── Load raw audio (keep native sample rate for STT resampling) ──────
        audio_raw, sr_raw = librosa.load(tmp_audio_path, sr=None, mono=True)

        # =====================================================================
        #  BRANCH A — Acoustic: VGG16 Mel-Spectrogram Pipeline
        # =====================================================================

        # A-1: Resample to 22050 Hz (training sample rate)
        audio_22k = librosa.resample(audio_raw, orig_sr=sr_raw, target_sr=22050)

        # A-2: Trim silence (matches Kaggle training: top_db=20)
        audio_trimmed, _ = librosa.effects.trim(audio_22k, top_db=20)

        # A-3: Enforce exactly 3 seconds (66 150 samples @ 22050 Hz)
        target_len = 3 * 22050
        if len(audio_trimmed) < target_len:
            audio_padded = np.pad(audio_trimmed, (0, target_len - len(audio_trimmed)), mode="constant")
        else:
            audio_padded = audio_trimmed[:target_len]

        # A-4: Mel-Spectrogram → power to dB
        mel_spec = librosa.feature.melspectrogram(
            y=audio_padded, sr=22050, n_mels=128, hop_length=512
        )
        mel_db = librosa.power_to_db(mel_spec, ref=np.max)

        # A-5: Normalise to [0, 255] uint8
        mel_norm = (
            (mel_db - mel_db.min()) / (mel_db.max() - mel_db.min() + 1e-8) * 255
        ).astype(np.uint8)

        # A-6: Apply Viridis colormap (OpenCV returns BGR)
        mel_viridis_bgr = cv2.applyColorMap(mel_norm, cv2.COLORMAP_VIRIDIS)

        # A-7: BGR → RGB (matches matplotlib Viridis used in Kaggle training)
        mel_rgb = cv2.cvtColor(mel_viridis_bgr, cv2.COLOR_BGR2RGB)

        # A-8: Resize to 224×224 for VGG16
        mel_resized = cv2.resize(mel_rgb, (224, 224))

        # A-9: VGG16 preprocess_input → predict → softmax probabilities
        img_array        = np.expand_dims(mel_resized.astype("float32"), axis=0)
        img_preprocessed = preprocess_input(img_array)
        voice_raw_pred   = voice_model.predict(img_preprocessed, verbose=0)

        # Convert logits to proper softmax probabilities (sum to 1)
        voice_probs      = np.exp(voice_raw_pred[0]) / np.sum(np.exp(voice_raw_pred[0]))
        voice_max_idx    = int(np.argmax(voice_probs))
        voice_emotion    = MOOD_LABELS[voice_max_idx]

        # =====================================================================
        #  BRANCH B — Linguistic: Google STT → RoBERTa
        # =====================================================================

        transcribed_text  = ""
        text_emotion      = None
        text_probs        = None

        try:
            # B-1: Resample to 16 kHz — required by Google Speech Recognition
            audio_16k = librosa.resample(audio_raw, orig_sr=sr_raw, target_sr=16000)

            # B-2: Write 16 kHz WAV to a temp file for speech_recognition
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_stt:
                sf.write(tmp_stt.name, audio_16k, 16000, subtype="PCM_16")
                tmp_stt_path = tmp_stt.name

            # B-3: Transcribe with Google Web Speech API
            recognizer = sr.Recognizer()
            with sr.AudioFile(tmp_stt_path) as source:
                audio_data = recognizer.record(source)

            try:
                transcribed_text = recognizer.recognize_google(audio_data)
                print(f"🗣️  STT transcription: '{transcribed_text}'")
            except sr.UnknownValueError:
                # Google could not understand the audio — graceful fallback
                transcribed_text = ""
                print("🔇 STT: No speech recognized. Falling back to acoustic only.")
            except sr.RequestError as e:
                # Network error — graceful fallback
                transcribed_text = ""
                print(f"🌐 STT request failed (network?): {e}. Falling back to acoustic only.")

            # B-4: Run RoBERTa only if we have transcribed text
            if transcribed_text.strip():
                inputs = text_tokenizer(
                    transcribed_text,
                    return_tensors="pt",
                    truncation=True,
                    max_length=512,
                    padding=True,
                )
                with torch.no_grad():
                    outputs = text_model(**inputs)

                # Softmax over logits → probability vector (5 classes)
                text_probs_tensor = torch.softmax(outputs.logits, dim=-1).squeeze()
                text_probs        = text_probs_tensor.numpy()          # shape: (5,)
                text_max_idx      = int(torch.argmax(text_probs_tensor).item())
                text_emotion      = MOOD_LABELS[text_max_idx]
                print(f"📝 RoBERTa prediction: {text_emotion} ({text_probs[text_max_idx]*100:.1f}%)")

        except Exception as branch_b_err:
            # Non-fatal — Branch B failure should never block Branch A result
            print(f"⚠️  Branch B (linguistic) failed non-fatally: {branch_b_err}")
            transcribed_text = ""
            text_probs       = None
            text_emotion     = None

        # =====================================================================
        #  FUSION — Average probability vectors when text is available
        # =====================================================================

        if text_probs is not None and len(transcribed_text.strip()) > 0:
            # Both branches succeeded → late-fusion by probability averaging
            fused_probs = (voice_probs + text_probs) / 2.0
            fusion_mode = "multimodal (acoustic + linguistic)"
            print("🔀 Fusion: averaging acoustic + linguistic probability vectors.")
        else:
            # No text transcribed → trust the acoustic model alone
            fused_probs = voice_probs
            fusion_mode = "acoustic only (no speech detected)"
            print("🔊 Fusion: using acoustic model only (no linguistic signal).")

        fused_max_idx   = int(np.argmax(fused_probs))
        fused_emotion   = MOOD_LABELS[fused_max_idx]
        fused_confidence = float(fused_probs[fused_max_idx]) * 100

        print(f"✅ Final fused emotion: {fused_emotion} ({fused_confidence:.1f}%) via {fusion_mode}")

        return {
            "type":                  "multimodal_voice",
            "transcribed_text":      transcribed_text,
            "final_emotion":         fused_emotion,
            "confidence":            f"{fused_confidence:.1f}%",
            "voice_only_prediction": voice_emotion,
            "text_only_prediction":  text_emotion if text_emotion else "N/A (no speech)",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multimodal voice prediction failed: {str(e)}")
    finally:
        # Always clean up temp files
        for path in [tmp_audio_path, tmp_stt_path]:
            if path and os.path.exists(path):
                os.remove(path)


# =============================================================================
#  /predict/text  —  RoBERTa Standalone Text Emotion
# =============================================================================
class TextRequest(BaseModel):
    text: str


@app.post("/predict/text")
async def predict_text(request: TextRequest):
    """
    Accepts a JSON body with a 'text' field.
    Runs the RoBERTa sequence classifier directly.
    Returns: { type, emotion, confidence }
    """
    if not models_ready:
        raise HTTPException(
            status_code=503,
            detail="Models are still warming up. Please try again shortly.",
        )
    try:
        import torch
        inputs = text_tokenizer(
            request.text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True,
        )
        with torch.no_grad():
            outputs = text_model(**inputs)

        probs   = torch.softmax(outputs.logits, dim=-1).squeeze().tolist()
        max_idx = int(torch.argmax(outputs.logits).item())
        return {
            "type":       "text",
            "emotion":    TEXT_LABEL_MAP.get(max_idx, "Unknown"),
            "confidence": f"{probs[max_idx] * 100:.1f}%",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text prediction failed: {str(e)}")


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))