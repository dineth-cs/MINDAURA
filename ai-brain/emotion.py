# =============================================================================
#  MindAura — Emotion Router
# =============================================================================

import os
from datetime import datetime
from urllib.parse import urlparse
from typing import Optional

import jwt
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Header
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

emotion_router = APIRouter()

# ── MongoDB connection ───────────────────────────────────────────────────────
MONGO_URI  = os.getenv("MONGO_URI", "")
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-replace-me")

_client = AsyncIOMotorClient(MONGO_URI)
_db = _client.get_database("test")

mood_collection     = _db["moodentries"]
users_collection_em = _db["users"]

# Valid values
VALID_MOODS   = {"Happy", "Sad", "Stress", "Anxious", "Energy", "Bored", "Neutral", "Angry", "Surprise"}
VALID_SOURCES = {"face", "voice", "journal"}

# ── Pydantic request body ─────────────────────────────────────────────────────
class SaveMoodRequest(BaseModel):
    mood:   str
    source: str = "face"
    text:   str = ""

# ── Shared auth helper ────────────────────────────────────────────────────────
async def _get_current_user(authorization: Optional[str] = None):
    """
    Decode the Bearer JWT and return the user document.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authorized, no token")

    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Not authorized, token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Not authorized, token failed")

    user_id = payload.get("userId") or payload.get("id") or payload.get("_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    try:
        user = await users_collection_em.find_one({"_id": ObjectId(user_id)})
    except:
        user = await users_collection_em.find_one({"_id": user_id})

    if not user:
        raise HTTPException(status_code=401, detail="User not found or deleted")

    if user.get("status", "ACTIVE") == "SUSPENDED":
        raise HTTPException(status_code=403, detail="Account suspended")

    return user

# =============================================================================
#  POST /save  —  Save a new mood entry
# =============================================================================
@emotion_router.post("/save", status_code=201)
async def save_mood(
    request: SaveMoodRequest,
    authorization: str = Header(None),
):
    user = await _get_current_user(authorization)

    if not request.mood:
        raise HTTPException(status_code=400, detail="mood is required")

    normalized_mood = request.mood.strip().capitalize()
    if normalized_mood not in VALID_MOODS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid mood '{request.mood}'. Must be one of: {', '.join(sorted(VALID_MOODS))}"
        )

    normalized_source = request.source.strip().lower() if request.source else "face"
    if normalized_source not in VALID_SOURCES:
        normalized_source = "face"

    now = datetime.utcnow()
    entry = {
        "user":      user["_id"],
        "mood":      normalized_mood,
        "source":    normalized_source,
        "text":      request.text, 
        "date":      now,
        "createdAt": now,
        "updatedAt": now,
    }

    result = await mood_collection.insert_one(entry)

    return {
        "_id":       str(result.inserted_id),
        "user":      str(user["_id"]),
        "mood":      normalized_mood,
        "source":    normalized_source,
        "date":      now.isoformat(),
        "createdAt": now.isoformat(),
        "updatedAt": now.isoformat(),
    }

# =============================================================================
#  GET /history  —  Fetch mood history
# =============================================================================
@emotion_router.get("/history")
async def get_mood_history(authorization: str = Header(None)):
    user = await _get_current_user(authorization)

    cursor = mood_collection.find({"user": user["_id"], "clearedByUser": {"$ne": True}}).sort("date", -1)
    entries = []
    async for doc in cursor:
        entries.append({
            "_id":       str(doc["_id"]),
            "user":      str(doc["user"]),
            "mood":      doc.get("mood"),
            "source":    doc.get("source"),
            "date":      doc["date"].isoformat() if isinstance(doc.get("date"), datetime) else doc.get("date"),
            "createdAt": doc["createdAt"].isoformat() if isinstance(doc.get("createdAt"), datetime) else doc.get("createdAt"),
        })

    return entries