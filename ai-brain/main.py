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

face_model, voice_model, voice_classes, text_tokenizer, text_model = None, None, None, None, None
models_ready = False

face_mood_names = ['Stressed', 'Happy', 'Sad', 'Bored', 'Energized']
TEXT_LABEL_MAP = {0: "Stressed", 1: "Happy", 2: "Sad", 3: "Bored", 4: "Energized"}

def load_models_in_background():
    global face_model, voice_model, voice_classes, text_tokenizer, text_model, models_ready
    print("⏳ Waiting 10 seconds for Uvicorn to bind port...")
    time.sleep(10)
    
    try:
        print("📦 Importing heavy ML libraries...")
        from tensorflow.keras.models import load_model
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        
        print("🧠 Loading Face Model...")
        face_model = load_model("Models/MindAura_Face_Model_5_Moods/mindaura_face_model_5_moods.keras")
        print("🎙️ Loading Voice Model...")
        voice_model = load_model("Models/MindAura_Voice_Sniper_Model/mindaura_voice_sniper_model.h5")
        voice_classes = np.load("Models/MindAura_Voice_Sniper_Model/mindaura_voice_classes.npy", allow_pickle=True)
        print("📝 Loading Text Model...")
        text_tokenizer = AutoTokenizer.from_pretrained("Models/mindaura_text_final_85_model")
        text_model = AutoModelForSequenceClassification.from_pretrained("Models/mindaura_text_final_85_model")
        text_model.eval()
        
        models_ready = True
        print("✅ All Models Loaded Successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")

@app.on_event("startup")
def startup_event():
    threading.Thread(target=load_models_in_background).start()

class TextRequest(BaseModel):
    text: str

@app.get("/")
def read_root():
    if models_ready: return {"status": "ready", "message": "MindAura AI is Ready! 🚀"}
    return {"status": "warming_up", "message": "Warming up models... ⏳"}

@app.post("/predict-face")
async def predict_face(file: UploadFile = File(...)):
    if not models_ready: raise HTTPException(status_code=503, detail="Warming up")
    contents = await file.read()
    img = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_GRAYSCALE)
    img_reshaped = np.reshape(np.array(cv2.resize(img, (48, 48)), "float32") / 255.0, (1, 48, 48, 1))
    pred = face_model.predict(img_reshaped)
    max_idx = int(np.argmax(pred))
    return {"emotion": face_mood_names[max_idx], "confidence": f"{float(pred[0][max_idx])*100:.1f}%"}

@app.post("/predict-voice")
async def predict_voice(file: UploadFile = File(...)):
    if not models_ready: raise HTTPException(status_code=503, detail="Warming up")
    contents = await file.read()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name
    audio, sr = librosa.load(tmp_path, sr=None)
    mfccs_mean = np.mean(librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=40).T, axis=0)
    os.remove(tmp_path)
    pred = voice_model.predict(mfccs_mean.reshape(1, 40, 1))
    max_idx = int(np.argmax(pred))
    return {"emotion": str(voice_classes[max_idx]), "confidence": f"{float(pred[0][max_idx])*100:.1f}%"}

@app.post("/predict-text")
async def predict_text(request: TextRequest):
    if not models_ready: raise HTTPException(status_code=503, detail="Warming up")
    import torch
    inputs = text_tokenizer(request.text, return_tensors="pt", truncation=True, max_length=512, padding=True)
    with torch.no_grad(): outputs = text_model(**inputs)
    probs = torch.softmax(outputs.logits, dim=-1).squeeze().tolist()
    max_idx = int(torch.argmax(outputs.logits).item())
    return {"emotion": TEXT_LABEL_MAP.get(max_idx, "Unknown"), "confidence": f"{probs[max_idx]*100:.1f}%"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))