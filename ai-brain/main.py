# =============================================================================
#  MindAura AI Backend — Multimodal Emotion Recognition Engine
#  Version: 3.0 — Full Rewrite (RoBERTa + VGG16 Fusion)
#
#  Endpoints:
#    GET  /          → Health check (model warm-up status)
#    POST /predict   → Multimodal voice emotion (acoustic VGG16 + linguistic RoBERTa)
#    POST /predict/face → VGG16 face emotion (image upload, standalone)
#    POST /predict/text → RoBERTa standalone text emotion (JSON body)
#
#  Fusion Strategy:
#    • STT success  → fused_probs = 0.5 * text_probs + 0.5 * voice_probs
#    • STT failure  → fused_probs = voice_probs  (acoustic-only fallback)
#
#  Emotion Classes (MUST match model training order, index 0–4):
#    0: Neutral  1: Happy  2: Sad  3: Angry  4: Surprise
# =============================================================================

# ── Standard library ──────────────────────────────────────────────────────────
import os
import tempfile
import threading
import time

# ── FastAPI / server ──────────────────────────────────────────────────────────
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from contextlib import asynccontextmanager

# ── Audio / signal processing ─────────────────────────────────────────────────
import speech_recognition as sr
import librosa
import soundfile as sf

# ── Numerical / image ─────────────────────────────────────────────────────────
import numpy as np
import cv2

# ── Deep-learning frameworks ──────────────────────────────────────────────────
#  NOTE: PyTorch and TensorFlow can coexist when each is imported in the
#  correct order and inside the correct function scope.  We import torch at
#  the top level so the JIT cache is initialised once.  TensorFlow is
#  deferred to the background loader to avoid collision with PyTorch's
#  memory allocator during the startup phase.
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification


# =============================================================================
#  FastAPI Application
# =============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Launch the background model-loading thread when the app starts."""
    threading.Thread(target=load_models_in_background, daemon=True).start()
    yield

app = FastAPI(
    title="MindAura Multimodal Emotion Recognition API",
    description=(
        "Fuses a PyTorch RoBERTa text model and a TensorFlow/Keras VGG16 voice "
        "model for robust, multimodal emotion recognition."
    ),
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
#  Global Model Handles  (populated once by the background loader)
# =============================================================================
voice_model    = None   # TensorFlow / Keras VGG16 acoustic model
text_tokenizer = None   # HuggingFace RoBERTa tokenizer (PyTorch)
text_model_pt  = None   # HuggingFace RoBERTa classifier (PyTorch)
face_model     = None   # TensorFlow / Keras VGG16 face model (optional endpoint)
models_ready   = False


# =============================================================================
#  Emotion Classes
#  CRITICAL: indices MUST align with the label encoding used during training.
#  Index → 0: Neutral | 1: Happy | 2: Sad | 3: Angry | 4: Surprise
# =============================================================================
EMOTION_CLASSES = ['Neutral', 'Happy', 'Sad', 'Angry', 'Surprise']

# Convenience alias kept for the face endpoint
FACE_EMOTION_CLASSES = EMOTION_CLASSES


# =============================================================================
#  Background Model Loader
#  Heavy ML libraries (TF in particular) take several seconds to import.
#  We load them in a background thread so Uvicorn can bind the port and
#  respond to health-checks immediately (important for Render cold-starts).
# =============================================================================
def load_models_in_background():
    """Load all ML models after a short delay to let Uvicorn fully start."""
    global voice_model, text_tokenizer, text_model_pt, face_model, models_ready

    print(" Waiting 10 s for Uvicorn to bind port before loading models …")
    time.sleep(10)

    try:
        # ── TensorFlow (must be imported AFTER PyTorch is already initialised) ──
        print(" Importing TensorFlow …")
        from tensorflow.keras.models import load_model  # type: ignore

        # ── Voice / Acoustic Model (VGG16 trained on Mel-Spectrograms) ──────────
        voice_model_path = "./Models/mindaura_audio_vgg16_final.h5"
        print(f"  Loading Voice Model (VGG16) from {voice_model_path} …")
        voice_model = load_model(voice_model_path)
        print(f" Voice model loaded.  Output shape: {voice_model.output_shape}")

        # ── Face Model (VGG16 trained on face images) — optional endpoint ────────
        face_model_path = "./Models/mindaura_vgg16_perfect_accuracy.h5"
        print(f" Loading Face Model (VGG16) from {face_model_path} …")
        face_model = load_model(face_model_path)
        print(f" Face model loaded.")

        # ── Text / Linguistic Model (RoBERTa via HuggingFace, PyTorch backend) ───
        roberta_path = "./Models/mindaura_roberta_mega_model"
        print(f" Loading RoBERTa Tokenizer from {roberta_path} …")
        text_tokenizer = AutoTokenizer.from_pretrained(roberta_path)
        print(f" Loading RoBERTa Classifier from {roberta_path} …")
        text_model_pt = AutoModelForSequenceClassification.from_pretrained(roberta_path)
        text_model_pt.eval()   # Switch to inference mode (disables dropout)
        print(" RoBERTa model loaded.")

        models_ready = True
        print(" All Models Loaded — MindAura Multimodal AI is Ready!")

    except Exception as exc:
        print(f" Fatal model loading error: {exc}")
        # models_ready remains False → endpoints will return 503





# =============================================================================
#  Helper: Build a 224×224 VGG16-preprocessed Mel-Spectrogram image
# =============================================================================
def audio_to_vgg16_input(audio_raw: np.ndarray, sample_rate: int) -> np.ndarray:
    """
    Convert a raw mono audio waveform into a VGG16-compatible input tensor.

    Pipeline:
      1. Resample to 22 050 Hz (training sample rate)
      2. Trim leading/trailing silence (top_db = 20)
      3. Pad / truncate to exactly 3 seconds
      4. Compute Mel-Spectrogram (128 mels) → power-to-dB
      5. Normalise to uint8 [0, 255]
      6. Apply Viridis colormap (BGR) → convert BGR→RGB
      7. Resize to 224×224
      8. VGG16 preprocess_input (zero-centred per ImageNet channel stats)

    Returns:
      np.ndarray of shape (1, 224, 224, 3), dtype float32 — ready for model.predict()
    """
    from tensorflow.keras.applications.vgg16 import preprocess_input  # type: ignore

    TARGET_SR  = 22_050
    TARGET_LEN = 3 * TARGET_SR  # 66 150 samples

    # Step 1 — Resample
    audio_22k = librosa.resample(audio_raw, orig_sr=sample_rate, target_sr=TARGET_SR)

    # Step 2 — Trim silence
    audio_trimmed, _ = librosa.effects.trim(audio_22k, top_db=20)

    # Step 3 — Pad or truncate to 3 seconds
    if len(audio_trimmed) < TARGET_LEN:
        audio_fixed = np.pad(audio_trimmed, (0, TARGET_LEN - len(audio_trimmed)), mode="constant")
    else:
        audio_fixed = audio_trimmed[:TARGET_LEN]

    # Step 4 — Mel-Spectrogram → dB scale
    mel_spec = librosa.feature.melspectrogram(
        y=audio_fixed, sr=TARGET_SR, n_mels=128, hop_length=512
    )
    mel_db = librosa.power_to_db(mel_spec, ref=np.max)

    # Step 5 — Normalise to [0, 255] uint8
    mel_norm = (
        (mel_db - mel_db.min()) / (mel_db.max() - mel_db.min() + 1e-8) * 255
    ).astype(np.uint8)

    # Step 6 — Viridis colormap (OpenCV outputs BGR) → convert to RGB
    mel_bgr = cv2.applyColorMap(mel_norm, cv2.COLORMAP_VIRIDIS)
    mel_rgb = cv2.cvtColor(mel_bgr, cv2.COLOR_BGR2RGB)

    # Step 7 — Resize to 224×224 (VGG16 input resolution)
    mel_resized = cv2.resize(mel_rgb, (224, 224))

    # Step 8 — VGG16 preprocess_input (subtracts ImageNet channel means)
    img_array = np.expand_dims(mel_resized.astype("float32"), axis=0)  # (1, 224, 224, 3)
    return preprocess_input(img_array)


# =============================================================================
#  Helper: Run VGG16 and return a proper softmax probability vector (5 classes)
# =============================================================================
def vgg16_predict_probs(model, img_array: np.ndarray) -> np.ndarray:
    """
    Run a VGG16 Keras model and return a 5-element probability vector that
    sums to 1.  The model's final layer may already apply softmax, but we
    apply the stable softmax again to be safe (idempotent if already soft).

    Args:
        model:     Loaded Keras model.
        img_array: Preprocessed input of shape (1, 224, 224, 3).

    Returns:
        np.ndarray of shape (5,) — probabilities aligned to EMOTION_CLASSES.
    """
    raw_pred = model.predict(img_array, verbose=0)  # shape: (1, num_classes)
    logits   = raw_pred[0]                          # shape: (num_classes,)

    # Stable softmax (handles both logits and already-softmaxed outputs)
    exp_logits = np.exp(logits - np.max(logits))
    probs      = exp_logits / exp_logits.sum()
    return probs                                    # shape: (5,)


# =============================================================================
#  GET /  —  Health Check
# =============================================================================
@app.get("/")
def health_check():
    """Returns the current warm-up status of all ML models."""
    if models_ready:
        return {
            "status":  "ready",
            "message": "MindAura Multimodal AI is Ready! ",
            "models": {
                "voice_model":  "mindaura_vgg16_perfect.h5 (TensorFlow/Keras)",
                "text_model":   "mindaura_roberta_mega_model (PyTorch/HuggingFace)",
            },
            "emotion_classes": EMOTION_CLASSES,
        }
    return {
        "status":  "warming_up",
        "message": "Models are loading … please retry in ~30 s ",
    }


# =============================================================================
#  POST /predict/voice  —  Multimodal Voice Emotion (Primary Endpoint)
# =============================================================================
@app.post("/predict/voice")
async def predict_voice(file: UploadFile = File(...)):
    """
    PRIMARY multimodal endpoint. Accepts any audio file and returns a fused
    emotion prediction that blends two independent inference branches:

    ┌──────────────────────────────────────────────────────────────────┐
    │  BRANCH A — Acoustic (TensorFlow VGG16 Mel-Spectrogram)          │
    │    Load audio → trim silence → 3 s clip →                        │
    │    Mel-Spectrogram dB → Viridis colormap → resize 224×224 →      │
    │    VGG16 preprocess_input → softmax probability vector (5)       │
    ├──────────────────────────────────────────────────────────────────┤
    │  BRANCH B — Linguistic (Google STT → PyTorch RoBERTa)            │
    │    Resample 16 kHz → Google Web Speech API → transcribed text →  │
    │    RoBERTa tokenizer → softmax probability vector (5)            │
    └──────────────────────────────────────────────────────────────────┘
    Fusion weights (50 / 50 equal weighting):
      • STT succeeded → fused_probs = 0.5 * text_probs + 0.5 * voice_probs
      • STT failed    → fused_probs = voice_probs  (acoustic-only fallback)

    Returns:
      {
        "transcribed_text":       "<text>" | null,
        "final_emotion":          "<emotion string>",
        "confidence_percentage":  <float>,
        "voice_model_prediction": "<emotion>",
        "text_model_prediction":  "<emotion>" | null
      }
    """
    if not models_ready:
        raise HTTPException(
            status_code=503,
            detail="Models are still warming up. Please retry in ~30 seconds.",
        )

    tmp_audio_path = None   # Temporary file for the original upload
    tmp_stt_path   = None   # Temporary 16 kHz WAV for Speech Recognition

    try:
        # ── Save uploaded audio to a temporary file ───────────────────────────
        contents = await file.read()
        ext      = os.path.splitext(file.filename or "audio.wav")[1] or ".wav"

        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(contents)
            tmp_audio_path = tmp.name

        # ── Load the audio once (native sample rate, mono) ────────────────────
        audio_raw, native_sr = librosa.load(tmp_audio_path, sr=None, mono=True)

        # =====================================================================
        #  BRANCH A — Voice Inference (TensorFlow VGG16 Mel-Spectrogram)
        # =====================================================================
        print("  [Branch A] Running VGG16 acoustic inference …")

        # Convert raw audio → VGG16-compatible 224×224 RGB spectrogram image
        vgg_input    = audio_to_vgg16_input(audio_raw, native_sr)
        voice_probs  = vgg16_predict_probs(voice_model, vgg_input)  # shape: (5,)
        voice_max_idx = int(np.argmax(voice_probs))
        voice_emotion = EMOTION_CLASSES[voice_max_idx]

        print(
            f"[Branch A] Voice → {voice_emotion} "
            f"({voice_probs[voice_max_idx] * 100:.1f}%)"
        )

        # =====================================================================
        #  BRANCH B — Text Inference (Google STT → PyTorch RoBERTa)
        # =====================================================================
        transcribed_text = None   # Will be set to a string if STT succeeds
        text_emotion     = None   # Will be set to a string if RoBERTa succeeds
        text_probs       = None   # Will be a np.ndarray (5,) if RoBERTa succeeds

        try:
            print("  [Branch B] Resampling audio to 16 kHz for Google STT …")

            # B-1: Resample to 16 kHz (required by Google Web Speech API)
            audio_16k = librosa.resample(audio_raw, orig_sr=native_sr, target_sr=16_000)

            # B-2: Write 16-bit PCM WAV to a temp file (speech_recognition requires a file)
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_stt:
                sf.write(tmp_stt.name, audio_16k, 16_000, subtype="PCM_16")
                tmp_stt_path = tmp_stt.name

            # B-3: Transcribe with Google Web Speech API
            recognizer = sr.Recognizer()
            with sr.AudioFile(tmp_stt_path) as source:
                audio_data = recognizer.record(source)

            try:
                transcribed_text = recognizer.recognize_google(audio_data)
                print(f" [Branch B] STT transcription: \"{transcribed_text}\"")
            except sr.UnknownValueError:
                # Google could not understand the audio — not an error, just no speech
                transcribed_text = None
                print(" [Branch B] STT: No speech recognized. Falling back to acoustic only.")
            except sr.RequestError as req_err:
                # Network / API error — non-fatal, fall back gracefully
                transcribed_text = None
                print(f" [Branch B] STT request error (network?): {req_err}. Falling back to acoustic only.")

            # B-4: Run RoBERTa only when we have a valid transcription
            if transcribed_text and transcribed_text.strip():
                print(" [Branch B] Running RoBERTa inference on transcribed text …")

                inputs = text_tokenizer(
                    transcribed_text,
                    return_tensors="pt",
                    truncation=True,
                    max_length=512,
                    padding=True,
                )

                with torch.no_grad():
                    outputs = text_model_pt(**inputs)

                # Apply softmax over the 5-class logit vector → probability distribution
                text_probs_tensor = torch.softmax(outputs.logits, dim=-1).squeeze()  # shape: (5,)
                text_probs        = text_probs_tensor.numpy()                         # → np.ndarray
                text_max_idx      = int(torch.argmax(text_probs_tensor).item())
                text_emotion      = EMOTION_CLASSES[text_max_idx]

                print(
                    f" [Branch B] RoBERTa → {text_emotion} "
                    f"({text_probs[text_max_idx] * 100:.1f}%)"
                )

        except Exception as branch_b_err:
            # Branch B failure must NEVER crash the endpoint — acoustic result is preserved
            print(f"  [Branch B] Non-fatal error: {branch_b_err}")
            transcribed_text = None
            text_probs       = None
            text_emotion     = None

        # =====================================================================
        #  MULTIMODAL FUSION  (50 / 50 Equal Weighting)
        # =====================================================================
        if text_probs is not None and transcribed_text and transcribed_text.strip():
            # Both branches succeeded → fuse with equal 0.5 weight
            fused_probs  = (np.array(text_probs) * 0.5) + (np.array(voice_probs) * 0.5)
            fusion_label = "multimodal (acoustic 50% + linguistic 50%)"
            print(" [Fusion] Averaging acoustic + linguistic probability vectors.")
        else:
            # STT failed or produced no text → rely on acoustic model alone
            fused_probs  = np.array(voice_probs)
            fusion_label = "acoustic-only (no speech detected or STT unavailable)"
            print(" [Fusion] Using acoustic-only probabilities (no linguistic signal).")

        # Resolve the final prediction from the fused distribution
        final_idx        = int(np.argmax(fused_probs))
        final_emotion    = EMOTION_CLASSES[final_idx]
        confidence_pct   = float(fused_probs[final_idx]) * 100.0

        print(
            f" [Final] Emotion: {final_emotion} | "
            f"Confidence: {confidence_pct:.1f}% | "
            f"Mode: {fusion_label}"
        )

        # ── Return the exact JSON structure required by the frontend ──────────
        return {
            "transcribed_text":       transcribed_text,           # str or null
            "final_emotion":          final_emotion,              # str
            "confidence_percentage":  round(confidence_pct, 2),  # float
            "voice_model_prediction": voice_emotion,              # str
            "text_model_prediction":  text_emotion,               # str or null
        }

    except HTTPException:
        raise  # Re-raise FastAPI HTTP exceptions unchanged

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Multimodal prediction failed: {str(exc)}",
        )

    finally:
        # Always clean up temporary audio files regardless of success or failure
        for tmp_path in [tmp_audio_path, tmp_stt_path]:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass


# =============================================================================
#  POST /predict  —  Backward-compatible alias for /predict/voice
# =============================================================================
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Backward-compatible alias — delegates to the primary /predict/voice pipeline.
    """
    return await predict_voice(file)


# =============================================================================
#  POST /predict/face  —  Standalone VGG16 Face Emotion
# =============================================================================
@app.post("/predict/face")
async def predict_face(file: UploadFile = File(...)):
    """
    Accepts a JPEG/PNG image upload and runs the VGG16 face emotion model.

    Pipeline:
      Decode bytes → resize 224×224 → BGR→RGB → VGG16 preprocess_input → predict

    Returns:
      { "type", "emotion", "confidence_percentage" }
    """
    if not models_ready:
        raise HTTPException(
            status_code=503,
            detail="Models are still warming up. Please retry in ~30 seconds.",
        )
    try:
        from tensorflow.keras.applications.vgg16 import preprocess_input  # type: ignore

        contents = await file.read()
        np_arr   = np.frombuffer(contents, np.uint8)
        img      = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)  # BGR

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file. Could not decode.")

        # Resize → BGR→RGB → VGG16 preprocess_input
        img_resized  = cv2.resize(img, (224, 224))
        img_rgb      = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
        img_array    = np.expand_dims(img_rgb.astype("float32"), axis=0)
        img_prepared = preprocess_input(img_array)

        face_probs  = vgg16_predict_probs(face_model, img_prepared)
        max_idx     = int(np.argmax(face_probs))
        confidence  = float(face_probs[max_idx]) * 100.0

        return {
            "type":                   "face",
            "emotion":                FACE_EMOTION_CLASSES[max_idx],
            "confidence_percentage":  round(confidence, 2),
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Face prediction failed: {str(exc)}")


# =============================================================================
#  POST /predict/text  —  Standalone RoBERTa Text Emotion
# =============================================================================
class TextRequest(BaseModel):
    text: str


@app.post("/predict/text")
async def predict_text(request: TextRequest):
    """
    TEXT-ONLY endpoint. Accepts a JSON body { "text": "..." } and runs the
    PyTorch RoBERTa classifier directly — no audio, no STT, no VGG16.

    Pipeline:
      Raw text → RoBERTa tokenizer → model logits → torch.softmax → argmax

    Returns:
      {
        "final_emotion":          "<emotion string>",
        "confidence_percentage":  <float>,
        "text_model_prediction":  "<emotion string>",
        "emotion_classes":        ["Neutral", "Happy", "Sad", "Angry", "Surprise"],
        "all_probabilities":      { "Neutral": <float>, ... }   // each 0.0–100.0
      }
    """
    if not models_ready:
        raise HTTPException(
            status_code=503,
            detail="Models are still warming up. Please retry in ~30 seconds.",
        )
    if not request.text or not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="The 'text' field must be a non-empty string.",
        )
    try:
        # Tokenise the input text for RoBERTa
        inputs = text_tokenizer(
            request.text.strip(),
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True,
        )

        # Forward pass — no gradient tracking needed during inference
        with torch.no_grad():
            outputs = text_model_pt(**inputs)

        # Apply softmax over the 5-class logit vector → probability distribution
        probs_tensor = torch.softmax(outputs.logits, dim=-1).squeeze()  # shape: (5,)
        probs_list   = probs_tensor.tolist()                             # Python list of 5 floats
        max_idx      = int(torch.argmax(probs_tensor).item())
        final_emotion = EMOTION_CLASSES[max_idx]
        confidence    = round(probs_list[max_idx] * 100, 2)

        print(
            f" [/predict/text] RoBERTa → {final_emotion} ({confidence}%) "
            f"| Input: \"{request.text.strip()[:80]}\""
        )

        return {
            "final_emotion":          final_emotion,
            "confidence_percentage":  confidence,
            "text_model_prediction":  final_emotion,
            "emotion_classes":        EMOTION_CLASSES,
            "all_probabilities":      {
                label: round(prob * 100, 2)
                for label, prob in zip(EMOTION_CLASSES, probs_list)
            },
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Text prediction failed: {str(exc)}")


# =============================================================================
#  Entry Point
# =============================================================================
if __name__ == "__main__":
    # PORT env-var is set by Render; defaults to 10000 for local development
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)