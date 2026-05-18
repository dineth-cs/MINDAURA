# =============================================================================
#  MindAura — Emotion Router
#  Ported from: mindaura-backend/routes/emotion.js
#
#  Collection: moodentries  (matches Mongoose auto-pluralisation of 'MoodEntry')
#
#  Endpoints:
#    POST /api/v1/emotion/save    → Save a new mood entry for the logged-in user
#    GET  /api/v1/emotion/history → Fetch all mood entries for the logged-in user
# =============================================================================

import os
from datetime import datetime
from urllib.parse import urlparse


import jwt
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Header
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

emotion_router = APIRouter()

# ── MongoDB connection (reuses the same URI as auth.py) ───────────────────────
MONGO_URI  = os.getenv("MONGO_URI", "")
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-replace-me")

_client = AsyncIOMotorClient(MONGO_URI)

# Derive database name the same bulletproof way as auth.py
_db_name = "mindaura"
try:
    if MONGO_URI:
        _parsed  = urlparse(MONGO_URI)
        _path    = _parsed.path.strip("/")
        if _path:
            _db_name = _path
except Exception:
    pass

_db                  = _client[_db_name]
mood_collection      = _db["moodentries"]   # Mongoose pluralises MoodEntry → moodentries
users_collection_em  = _db["users"]

# Valid values — mirrors the Mongoose enum exactly
VALID_MOODS   = {"Happy", "Sad", "Stress", "Anxious", "Energy", "Bored", "Neutral"}
VALID_SOURCES = {"face", "voice", "journal"}


# ── Pydantic request body ─────────────────────────────────────────────────────
class SaveMoodRequest(BaseModel):
    mood:   str
    source: str = "face"
    text:   str = ""          # Optional — forwarded from journal entries


# ── Shared auth helper ────────────────────────────────────────────────────────
async def _get_current_user(authorization: str | None):
    """
    Decode the Bearer JWT and return the user document.
    Raises HTTPException 401/403 on any failure (mirrors Node.js authMiddleware).
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

    user_id = payload.get("userId") or payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authorized, invalid token payload")

    user = await users_collection_em.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="Not authorized, user not found or deleted")

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
    """
    Saves a new mood entry to the `moodentries` collection.
    Requires a valid Bearer JWT in the Authorization header.

    Body:
      { "mood": "Happy", "source": "voice" }
      { "mood": "Sad",   "source": "journal", "text": "..." }
    """
    user = await _get_current_user(authorization)

    # ── Validate mood value ───────────────────────────────────────────────────
    if not request.mood:
        raise HTTPException(status_code=400, detail="mood is required")

    # Normalize capitalisation (e.g. "happy" → "Happy") before enum check
    normalized_mood = request.mood.strip().capitalize()
    # Special case: multi-word moods that capitalize() would mangle
    # None in our set, but kept for future safety
    if normalized_mood not in VALID_MOODS:
        # Fallback: keep original case and re-check
        if request.mood.strip() not in VALID_MOODS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid mood '{request.mood}'. Must be one of: {', '.join(sorted(VALID_MOODS))}"
            )
        normalized_mood = request.mood.strip()

    # ── Validate source value ─────────────────────────────────────────────────
    normalized_source = request.source.strip().lower() if request.source else "face"
    if normalized_source not in VALID_SOURCES:
        normalized_source = "face"

    # ── Build and insert the document ────────────────────────────────────────
    now = datetime.utcnow()
    entry = {
        "user":      user["_id"],          # ObjectId — matches Mongoose schema ref
        "mood":      normalized_mood,
        "source":    normalized_source,
        "date":      now,
        "createdAt": now,                  # Mongoose timestamps: true
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
#  GET /history  —  Fetch mood history for the logged-in user
# =============================================================================
@emotion_router.get("/history")
async def get_mood_history(authorization: str = Header(None)):
    """
    Returns all mood entries for the authenticated user, newest first.
    Mirrors: MoodEntry.find({ user: req.user._id }).sort({ date: -1 }).lean()
    """
    user = await _get_current_user(authorization)

    cursor = mood_collection.find({"user": user["_id"]}).sort("date", -1)
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
