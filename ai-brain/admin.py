# =============================================================================
#  MindAura — Admin Router
#  Ported from: mindaura-backend/routes/admin.js
#               mindaura-backend/controllers/adminController.js
#
#  All routes require:   Authorization: Bearer <JWT>  +  isAdmin: true
#
#  Endpoints:
#    GET  /api/v1/admin/stats                      → Dashboard telemetry counters
#    GET  /api/v1/admin/users                      → All users (no passwords)
#    GET  /api/v1/admin/users/{id}/profile-stats   → Per-user analytics modal data
#    PUT  /api/v1/admin/users/{id}/suspend         → Toggle suspend/active
#    DELETE /api/v1/admin/users/{id}               → Cascade delete user + data
#    GET  /api/v1/admin/analytics/user-growth      → User growth data (static)
#    GET  /api/v1/admin/analytics/mood-distribution → Live mood breakdown
#    GET  /api/v1/admin/model-telemetry            → AI model metrics (live simulated)
#    GET  /api/v1/admin/audit-logs                 → Last 100 audit log entries
#    POST /api/v1/admin/firewall/toggle            → Log a firewall toggle action
#    POST /api/v1/admin/rotate-keys                → Log a key rotation action
#    DELETE /api/v1/admin/audit-logs/purge         → Purge all audit logs
#    GET  /api/v1/admin/profile                    → Get admin profile
#    PUT  /api/v1/admin/profile                    → Update admin name
# =============================================================================

import os
import random
import time
from datetime import datetime, timedelta
from urllib.parse import urlparse
import jwt
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Header, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional  # මේක තමයි අඩුවෙලා තිබුණේ

load_dotenv()

admin_router = APIRouter()
support_router = APIRouter()

# ── MongoDB ───────────────────────────────────────────────────────────────────
MONGO_URI  = os.getenv("MONGO_URI", "")
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-replace-me")

_client = AsyncIOMotorClient(MONGO_URI)
_db_name = "mindaura"

try:
    if MONGO_URI:
        _parsed = urlparse(MONGO_URI)
        _path   = _parsed.path.strip("/")
        if _path:
            _db_name = _path
except Exception:
    pass

_db                  = _client[_db_name]
users_col            = _db["users"]
mood_col             = _db["moodentries"]
support_col          = _db["supporttickets"]  # Mongoose pluralises SupportTicket
audit_col            = _db["auditlogs"]       # Mongoose pluralises AuditLog

# ── Pydantic models ───────────────────────────────────────────────────────────
class FirewallToggleRequest(BaseModel):
    setting: str
    enabled: bool

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None

# ── Shared auth helpers ───────────────────────────────────────────────────────
async def _require_admin(authorization: Optional[str] = None):
    """Decode JWT, verify user exists, verify isAdmin=True."""
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
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = await users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found or deleted")

    if not user.get("isAdmin", False):
        raise HTTPException(status_code=403, detail="Access denied. Admins only.")

    return user

def _serialize_user(doc: dict) -> dict:
    """Convert a MongoDB user document to a JSON-safe dict (no password)."""
    doc.pop("password", None)
    return {
        "_id":            str(doc["_id"]),
        "name":           doc.get("name"),
        "email":          doc.get("email"),
        "profilePicture": doc.get("profilePicture", ""),
        "isAdmin":        doc.get("isAdmin", False),
        "status":         doc.get("status", "ACTIVE"),
        "tier":           doc.get("tier", "TIER 1"),
        "createdAt":      doc["createdAt"].isoformat() if isinstance(doc.get("createdAt"), datetime) else doc.get("createdAt"),
    }

async def _write_audit(action: str, target: str, request: Optional[Request] = None):
    """Helper: insert an audit log document."""
    ip = "0.0.0.0"
    if request:
        forwarded = request.headers.get("x-forwarded-for")
        ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "0.0.0.0")

    await audit_col.insert_one({
        "action":    action,
        "user":      "Root Admin",
        "target":    target,
        "status":    "Success",
        "ip":        ip,
        "timestamp": datetime.utcnow(),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    })

# =============================================================================
#  GET /stats  —  Dashboard telemetry counters
# =============================================================================
@admin_router.get("/stats")
async def get_stats(authorization: str = Header(None)):
    """
    Returns total user count, support ticket breakdown, uptime, and latency.
    Mirrors: adminController.getStats
    """
    await _require_admin(authorization)
    
    user_count        = await users_col.count_documents({})
    pending_tickets   = await support_col.count_documents({"status": "pending"})
    inprogress_tickets = await support_col.count_documents({"status": "in-progress"})
    resolved_tickets  = await support_col.count_documents({"status": "resolved"})
    
    return {
        "userCount": user_count,
        "tickets": {
            "pending":    pending_tickets,
            "inProgress": inprogress_tickets,
            "resolved":   resolved_tickets,
        },
        "uptime":  time.time(),           # seconds since epoch — same idea as process.uptime()
        "latency": random.randint(10, 30),
    }

# =============================================================================
#  GET /users  —  All users (no passwords)
# =============================================================================
@admin_router.get("/users")
async def get_users(authorization: str = Header(None)):
    """
    Returns all users sorted by createdAt descending, passwords excluded.
    Mirrors: User.find().select('-password').sort({ createdAt: -1 })
    """
    await _require_admin(authorization)
    cursor = users_col.find({}).sort("createdAt", -1)
    users  = []
    async for doc in cursor:
        users.append(_serialize_user(doc))
    return users

# =============================================================================
#  GET /users/{id}/profile-stats  —  Per-user analytics modal
# =============================================================================
@admin_router.get("/users/{user_id}/profile-stats")
async def get_user_profile_stats(user_id: str, authorization: str = Header(None)):
    """
    Returns aggregated analytics for a specific user:
    totalJournals, joinDate, topEmotion, modalityUsage, moodTrend (last 30 days).
    Mirrors: adminController.getUserProfileStats
    """
    await _require_admin(authorization)
    
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    user = await users_col.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ── Total journals (source == 'journal') ──────────────────────────────────
    total_journals = await mood_col.count_documents({"user": oid, "source": "journal"})

    # ── Top emotion ───────────────────────────────────────────────────────────
    top_emotion_agg = await mood_col.aggregate([
        {"$match": {"user": oid}},
        {"$group": {"_id": "$mood", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1},
    ]).to_list(length=1)
    top_emotion = top_emotion_agg[0]["_id"] if top_emotion_agg else "N/A"

    # ── Modality usage ────────────────────────────────────────────────────────
    modality_agg = await mood_col.aggregate([
        {"$match": {"user": oid}},
        {"$group": {"_id": "$source", "count": {"$sum": 1}}},
    ]).to_list(length=10)
    
    modality_colors = {"face": "#a855f7", "voice": "#6366f1", "journal": "#3b82f6"}
    modality_usage  = [
        {
            "name":  item["_id"].capitalize(),
            "value": item["count"],
            "color": modality_colors.get(item["_id"], "#cbd5e1"),
        }
        for item in modality_agg
    ]

    # ── Mood trend — last 30 days ─────────────────────────────────────────────
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    trend_agg = await mood_col.aggregate([
        {"$match": {"user": oid, "createdAt": {"$gte": thirty_days_ago}}},
        {
            "$group": {
                "_id":   {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]).to_list(length=100)
    
    mood_trend = [
        {"day": item["_id"].split("-")[2], "score": item["count"]}
        for item in trend_agg
    ]

    return {
        "journals":      total_journals,
        "joinDate":      user["createdAt"].isoformat() if isinstance(user.get("createdAt"), datetime) else user.get("createdAt"),
        "topEmotion":    top_emotion,
        "modalityUsage": modality_usage,
        "moodTrend":     mood_trend,
    }

# =============================================================================
#  PUT /users/{id}/suspend  —  Toggle user suspend/active
# =============================================================================
@admin_router.put("/users/{user_id}/suspend")
async def suspend_user(user_id: str, request: Request, authorization: str = Header(None)):
    """
    Toggles a user's status between ACTIVE and SUSPENDED.
    Mirrors: adminController.suspendUser
    """
    await _require_admin(authorization)
    
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    user = await users_col.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_status = "SUSPENDED" if user.get("status", "ACTIVE") == "ACTIVE" else "ACTIVE"
    await users_col.update_one(
        {"_id": oid},
        {"$set": {"status": new_status, "updatedAt": datetime.utcnow()}}
    )
    
    await _write_audit(
        action=f"User {user['email']} status toggled to {new_status}",
        target="User Management",
        request=request,
    )
    return {**_serialize_user(user), "status": new_status}

# =============================================================================
#  DELETE /users/{id}  —  Cascade delete user + all associated data
# =============================================================================
@admin_router.delete("/users/{user_id}")
async def delete_user(user_id: str, request: Request, authorization: str = Header(None)):
    """
    Permanently removes a user document plus all their moodentries and supporttickets.
    Mirrors: adminController.deleteUser (cascade delete via Promise.all)
    """
    await _require_admin(authorization)
    
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    user = await users_col.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Cascade delete — mirrors Promise.all([User.findByIdAndDelete, MoodEntry.deleteMany, SupportTicket.deleteMany])
    await users_col.delete_one({"_id": oid})
    await mood_col.delete_many({"user": oid})
    await support_col.delete_many({"user": oid})
    
    await _write_audit(
        action=f"User {user['email']} and all associated data deleted",
        target="User Management",
        request=request,
    )
    return {"msg": "User and all associated records removed"}

# =============================================================================
#  GET /analytics/user-growth  —  Static growth data (matches Node.js exactly)
# =============================================================================
@admin_router.get("/analytics/user-growth")
async def get_user_growth(authorization: str = Header(None)):
    """Static user growth dataset — mirrors adminController.getUserGrowth exactly."""
    await _require_admin(authorization)
    return {
        "daily": [
            {"name": "Mon", "users": 12}, {"name": "Tue", "users": 19},
            {"name": "Wed", "users": 24}, {"name": "Thu", "users": 38},
            {"name": "Fri", "users": 45}, {"name": "Sat", "users": 60},
            {"name": "Sun", "users": 84},
        ],
        "weekly": [
            {"name": "Week 1", "users": 40},  {"name": "Week 2", "users": 95},
            {"name": "Week 3", "users": 150}, {"name": "Week 4", "users": 245},
        ],
        "monthly": [
            {"name": "Jan", "users": 45},  {"name": "Feb", "users": 120},
            {"name": "Mar", "users": 250}, {"name": "Apr", "users": 410},
            {"name": "May", "users": 580}, {"name": "Jun", "users": 720},
            {"name": "Jul", "users": 950},
        ],
        "yearly": [
            {"name": "2023", "users": 340},  {"name": "2024", "users": 1250},
            {"name": "2025", "users": 3400}, {"name": "2026", "users": 7120},
        ],
    }

# =============================================================================
#  GET /analytics/mood-distribution  —  Live mood breakdown from moodentries
# =============================================================================
@admin_router.get("/analytics/mood-distribution")
async def get_mood_distribution(authorization: str = Header(None)):
    """
    Aggregates the moodentries collection to produce a percentage breakdown.
    Mirrors: adminController.getMoodDistribution
    """
    await _require_admin(authorization)
    pipeline = [{"$group": {"_id": "$mood", "count": {"$sum": 1}}}]
    mood_counts = await mood_col.aggregate(pipeline).to_list(length=20)
    
    total = sum(item["count"] for item in mood_counts)
    if total == 0:
        return []
        
    colors = {
        "Happy":   "#3b82f6",
        "Stress":  "#9333ea",
        "Sad":     "#f43f5e",
        "Energy":  "#10b981",
        "Bored":   "#f59e0b",
        "Neutral": "#64748b",
        "Anxious": "#ec4899",
    }
    return [
        {
            "name":  item["_id"],
            "value": round((item["count"] / total) * 100),
            "fill":  colors.get(item["_id"], "#cbd5e1"),
        }
        for item in mood_counts
    ]

# =============================================================================
#  GET /model-telemetry  —  Simulated AI model metrics
# =============================================================================
@admin_router.get("/model-telemetry")
async def get_model_telemetry(authorization: str = Header(None)):
    """
    Returns simulated but realistic AI model performance metrics.
    Mirrors: adminController.getModelTelemetry (random ranges identical).
    """
    await _require_admin(authorization)
    
    face_inference  = random.randint(400, 500)
    voice_inference = random.randint(800, 900)
    text_inference  = random.randint(500, 700)
    
    compute_load    = round(random.uniform(40.0, 75.0), 1)
    cross_modal     = round(random.uniform(0.08, 0.19), 2)
    
    return {
        "computeLoad": compute_load,
        "models": {
            "face":  {"accuracy": 79.0,  "valLoss": 0.65, "inferenceTime": face_inference},
            "voice": {"accuracy": 86.4,  "valLoss": 0.42, "inferenceTime": voice_inference},
            "text":  {"accuracy": 88.7,  "valLoss": 0.35, "inferenceTime": text_inference},
        },
        "systemMetrics": {
            "crossModalSync": str(cross_modal),
            "globalSharding": "100%",
            "encryption":     "TLS 1.3",
            "coreVersion":    "2.4.0",
        },
    }

# =============================================================================
#  GET /audit-logs  —  Last 100 audit log entries
# =============================================================================
@admin_router.get("/audit-logs")
async def get_audit_logs(authorization: str = Header(None)):
    """
    Returns the 100 most recent audit log entries.
    Mirrors: AuditLog.find().sort({ createdAt: -1 }).limit(100)
    """
    await _require_admin(authorization)
    cursor = audit_col.find({}).sort("createdAt", -1).limit(100)
    logs   = []
    async for doc in cursor:
        logs.append({
            "_id":       str(doc["_id"]),
            "action":    doc.get("action"),
            "user":      doc.get("user"),
            "target":    doc.get("target", "N/A"),
            "status":    doc.get("status", "Success"),
            "ip":        doc.get("ip", "0.0.0.0"),
            "timestamp": doc["timestamp"].isoformat() if isinstance(doc.get("timestamp"), datetime) else doc.get("timestamp"),
            "createdAt": doc["createdAt"].isoformat() if isinstance(doc.get("createdAt"), datetime) else doc.get("createdAt"),
        })
    return logs

# =============================================================================
#  POST /firewall/toggle  —  Log a firewall toggle action
# =============================================================================
@admin_router.post("/firewall/toggle")
async def toggle_firewall(
    body: FirewallToggleRequest,
    request: Request,
    authorization: str = Header(None),
):
    """Mirrors: adminController.toggleFirewall"""
    await _require_admin(authorization)
    state = "ON" if body.enabled else "OFF"
    
    await _write_audit(
        action=f"Firewall setting '{body.setting}' turned {state}",
        target="System Firewall",
        request=request,
    )
    return {"msg": "Firewall setting updated", "setting": body.setting, "enabled": body.enabled}

# =============================================================================
#  POST /rotate-keys  —  Log a key rotation action
# =============================================================================
@admin_router.post("/rotate-keys")
async def rotate_keys(request: Request, authorization: str = Header(None)):
    """Mirrors: adminController.rotateKeys"""
    await _require_admin(authorization)
    await _write_audit(
        action="Access keys rotated successfully",
        target="Authentication Service",
        request=request,
    )
    return {"msg": "Keys rotated successfully"}

# =============================================================================
#  DELETE /audit-logs/purge  —  Purge all audit logs
# =============================================================================
@admin_router.delete("/audit-logs/purge")
async def purge_audit_logs(request: Request, authorization: str = Header(None)):
    """
    Deletes ALL audit log documents, then writes one confirming entry.
    Mirrors: adminController.purgeLogs
    """
    await _require_admin(authorization)
    await audit_col.delete_many({})
    await _write_audit(
        action="Audit logs purged",
        target="System Logs",
        request=request,
    )
    return {"msg": "Audit logs purged successfully"}

# =============================================================================
#  GET /profile  —  Get the admin user document
# =============================================================================
@admin_router.get("/profile")
async def get_admin_profile(authorization: str = Header(None)):
    """
    Returns the first admin user document (isAdmin: true), no password.
    Mirrors: User.findOne({ isAdmin: true }).select('-password')
    """
    await _require_admin(authorization)
    admin = await users_col.find_one({"isAdmin": True})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin profile not found")
    return _serialize_user(admin)

# =============================================================================
#  PUT /profile  —  Update admin name
# =============================================================================
@admin_router.put("/profile")
async def update_admin_profile(
    body: UpdateProfileRequest,
    authorization: str = Header(None),
):
    """
    Updates the admin user's name field.
    Mirrors: adminController.updateProfile
    """
    await _require_admin(authorization)
    admin = await users_col.find_one({"isAdmin": True})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin profile not found")
        
    update_fields: dict = {"updatedAt": datetime.utcnow()}
    if body.name:
        update_fields["name"] = body.name.strip()
        
    await users_col.update_one({"_id": admin["_id"]}, {"$set": update_fields})
    updated = await users_col.find_one({"_id": admin["_id"]})
    return _serialize_user(updated)

# =============================================================================
#  Support Tickets Administration Routes
# =============================================================================
class SupportStatusUpdateRequest(BaseModel):
    status: str

class SupportReplyRequest(BaseModel):
    text: str

@support_router.get("/admin")
async def get_support_tickets_admin(authorization: str = Header(None)):
    """
    Returns all support tickets sorted by createdAt descending.
    Populates user profile information using aggregation lookup.
    """
    await _require_admin(authorization)
    pipeline = [
        {
            "$lookup": {
                "from": "users",
                "localField": "user",
                "foreignField": "_id",
                "as": "user_docs"
            }
        },
        {
            "$unwind": {
                "path": "$user_docs",
                "preserveNullAndEmptyArrays": True
            }
        },
        {
            "$sort": {"createdAt": -1}
        }
    ]
    cursor = support_col.aggregate(pipeline)
    tickets = []
    async for doc in cursor:
        user_info = None
        if "user_docs" in doc and doc["user_docs"]:
            user_doc = doc["user_docs"]
            user_info = {
                "_id":            str(user_doc["_id"]),
                "name":           user_doc.get("name", "Anonymous"),
                "email":          user_doc.get("email", "N/A"),
                "profilePicture": user_doc.get("profilePicture", ""),
            }
        tickets.append({
            "_id":      str(doc["_id"]),
            "user":     user_info,
            "message":  doc.get("message"),
            "status":   doc.get("status", "pending"),
            "priority": doc.get("priority", "Medium"),
            "history": [
                {
                    "sender": item.get("sender"),
                    "text":   item.get("text"),
                    "time":   item["time"].isoformat() if isinstance(item.get("time"), datetime) else item.get("time")
                }
                for item in doc.get("history", [])
            ],
            "createdAt": doc["createdAt"].isoformat() if isinstance(doc.get("createdAt"), datetime) else doc.get("createdAt"),
            "updatedAt": doc["updatedAt"].isoformat() if isinstance(doc.get("updatedAt"), datetime) else doc.get("updatedAt"),
        })
    return tickets

@support_router.put("/admin/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: str,
    body: SupportStatusUpdateRequest,
    request: Request,
    authorization: str = Header(None),
):
    """
    Updates the status of a specific support ticket.
    """
    await _require_admin(authorization)
    try:
        oid = ObjectId(ticket_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ticket ID")
        
    ticket = await support_col.find_one({"_id": oid})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    new_status = body.status.lower()
    await support_col.update_one(
        {"_id": oid},
        {"$set": {"status": new_status, "updatedAt": datetime.utcnow()}}
    )
    
    # Log this action
    if new_status == "resolved":
        await _write_audit(
            action=f"Support ticket #{ticket_id[-6:].upper()} resolved",
            target="Support Center",
            request=request
        )
    else:
        await _write_audit(
            action=f"Support ticket #{ticket_id[-6:].upper()} status changed to {new_status}",
            target="Support Center",
            request=request
        )
        
    # Resolve fully populated ticket response to prevent frontend state anomalies
    pipeline = [
        {"$match": {"_id": oid}},
        {
            "$lookup": {
                "from": "users",
                "localField": "user",
                "foreignField": "_id",
                "as": "user_docs"
            }
        },
        {
            "$unwind": {
                "path": "$user_docs",
                "preserveNullAndEmptyArrays": True
            }
        }
    ]
        
    updated_cursor = support_col.aggregate(pipeline)
    updated_doc = None
    async for doc in updated_cursor:
        updated_doc = doc
        break
        
    if not updated_doc:
        raise HTTPException(status_code=500, detail="Error fetching updated ticket")
        
    user_info = None
    if "user_docs" in updated_doc and updated_doc["user_docs"]:
        user_doc = updated_doc["user_docs"]
        user_info = {
            "_id":            str(user_doc["_id"]),
            "name":           user_doc.get("name", "Anonymous"),
            "email":          user_doc.get("email", "N/A"),
            "profilePicture": user_doc.get("profilePicture", ""),
        }
        
    return {
        "_id":      str(updated_doc["_id"]),
        "user":     user_info,        "message":  updated_doc.get("message"),
        "status":   updated_doc.get("status", "pending"),
        "priority": updated_doc.get("priority", "Medium"),
        "history": [
            {
                "sender": item.get("sender"),
                "text":   item.get("text"),
                "time":   item["time"].isoformat() if isinstance(item.get("time"), datetime) else item.get("time")
            }
            for item in updated_doc.get("history", [])
        ],
        "createdAt": updated_doc["createdAt"].isoformat() if isinstance(updated_doc.get("createdAt"), datetime) else updated_doc.get("createdAt"),
        "updatedAt": updated_doc["updatedAt"].isoformat() if isinstance(updated_doc.get("updatedAt"), datetime) else updated_doc.get("updatedAt"),
    }

@support_router.post("/admin/{ticket_id}/reply")
async def reply_to_ticket(
    ticket_id: str,
    body: SupportReplyRequest,
    authorization: str = Header(None),
):
    """
    Appends an administrator reply to a support ticket chat history.
    """
    await _require_admin(authorization)
    try:
        oid = ObjectId(ticket_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ticket ID")
        
    ticket = await support_col.find_one({"_id": oid})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    new_message = {
        "sender": "admin",
        "text":   body.text,
        "time":   datetime.utcnow()
    }
    
    await support_col.update_one(
        {"_id": oid},
        {
            "$push": {"history": new_message},
            "$set": {"updatedAt": datetime.utcnow()}
        }
    )
    
    # Resolve fully populated ticket response to prevent frontend state anomalies
    pipeline = [
        {"$match": {"_id": oid}},
        {
            "$lookup": {
                "from": "users",
                "localField": "user",
                "foreignField": "_id",
                "as": "user_docs"
            }
        },
        {
            "$unwind": {
                "path": "$user_docs",
                "preserveNullAndEmptyArrays": True
            }
        }
    ]
        
    updated_cursor = support_col.aggregate(pipeline)
    updated_doc = None
    async for doc in updated_cursor:
        updated_doc = doc
        break
        
    if not updated_doc:
        raise HTTPException(status_code=500, detail="Error fetching updated ticket")
        
    user_info = None
    if "user_docs" in updated_doc and updated_doc["user_docs"]:
        u_doc = updated_doc["user_docs"]
        user_info = {
            "_id":            str(u_doc["_id"]),
            "name":           u_doc.get("name", "Anonymous"),
            "email":          u_doc.get("email", "N/A"),
            "profilePicture": u_doc.get("profilePicture", ""),
        }
        
    # Log push notification event (in production, we can integrate native FCM/Expo push)
    if user_info and "expoPushToken" in updated_doc["user_docs"] and updated_doc["user_docs"]["expoPushToken"]:
        print(f"📡 Sending push notification to {user_info['name']} via Expo: {body.text}")
        
    return {
        "_id":      str(updated_doc["_id"]),
        "user":     user_info,
        "message":  updated_doc.get("message"),
        "status":   updated_doc.get("status", "pending"),
        "priority": updated_doc.get("priority", "Medium"),
        "history": [
            {
                "sender": item.get("sender"),
                "text":   item.get("text"),
                "time":   item["time"].isoformat() if isinstance(item.get("time"), datetime) else item.get("time")
            }
            for item in updated_doc.get("history", [])
        ],
        "createdAt": updated_doc["createdAt"].isoformat() if isinstance(updated_doc.get("createdAt"), datetime) else updated_doc.get("createdAt"),
        "updatedAt": updated_doc["updatedAt"].isoformat() if isinstance(updated_doc.get("updatedAt"), datetime) else updated_doc.get("updatedAt"),
    }