# =============================================================================

#  MindAura — Admin Router

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

from typing import Optional



load_dotenv()



admin_router = APIRouter()

support_router = APIRouter()



# Server boot time for correct uptime tracking

BOOT_TIME = time.time()





# ── MongoDB ───────────────────────────────────────────────────────────────────

MONGO_URI  = os.getenv("MONGO_URI", "")

JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-replace-me")



_client = AsyncIOMotorClient(MONGO_URI)





_db = _client.get_database("test")



users_col            = _db["users"]

mood_col             = _db["moodentries"]

support_col          = _db["supporttickets"]  

audit_col            = _db["auditlogs"]       



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

    except Exception as e:

        raise HTTPException(status_code=401, detail=f"Not authorized, token failed: {e}")



    # ID 

    user_id = payload.get("userId") or payload.get("id") or payload.get("_id")

    if not user_id:

        raise HTTPException(status_code=401, detail="Invalid token payload")



    # Object ID 

    try:

        user = await users_col.find_one({"_id": ObjectId(user_id)})

    except:

        user = await users_col.find_one({"_id": user_id})



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

        "uptime":  time.time() - BOOT_TIME,           

        "latency": random.randint(10, 30),

    }



# =============================================================================

#  GET /users  —  All users (no passwords)

# =============================================================================

@admin_router.get("/users")

async def get_users(authorization: str = Header(None)):

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

    await _require_admin(authorization)

    try:

        oid = ObjectId(user_id)

    except Exception:

        raise HTTPException(status_code=400, detail="Invalid user ID")

        

    user = await users_col.find_one({"_id": oid})

    if not user:

        raise HTTPException(status_code=404, detail="User not found")



    total_journals = await mood_col.count_documents({"user": oid, "source": "journal"})



    top_emotion_agg = await mood_col.aggregate([

        {"$match": {"user": oid}},

        {"$group": {"_id": "$mood", "count": {"$sum": 1}}},

        {"$sort": {"count": -1}},

        {"$limit": 1},

    ]).to_list(length=1)

    top_emotion = top_emotion_agg[0]["_id"] if top_emotion_agg else "N/A"



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

    await _require_admin(authorization)

    try:

        oid = ObjectId(user_id)

    except Exception:

        raise HTTPException(status_code=400, detail="Invalid user ID")

        

    user = await users_col.find_one({"_id": oid})

    if not user:

        raise HTTPException(status_code=404, detail="User not found")



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

#  GET /analytics/user-growth  —  Live user growth data from MongoDB

# =============================================================================

@admin_router.get("/analytics/user-growth")

async def get_user_growth(authorization: str = Header(None)):

    """

    Asynchronously aggregates the users collection based on the createdAt field

    to retrieve real live user registration statistics (daily, weekly, monthly, yearly).

    """

    await _require_admin(authorization)

    

    now = datetime.utcnow()

    

    # 1. Daily: Last 7 days registration counts

    daily = []

    for i in range(6, -1, -1):

        day_start = datetime(now.year, now.month, now.day) - timedelta(days=i)

        day_end = day_start + timedelta(days=1)

        count = await users_col.count_documents({"createdAt": {"$gte": day_start, "$lt": day_end}})

        weekday_name = day_start.strftime("%a")  # e.g., "Mon", "Tue"

        daily.append({"name": weekday_name, "users": count})

        

    # 2. Weekly: Group by week of the current month (standard 4 weeks)

    weekly = []

    for w in range(4):

        start_day = w * 7 + 1

        if w == 3:

            if now.month == 12:

                next_month = datetime(now.year + 1, 1, 1)

            else:

                next_month = datetime(now.year, now.month + 1, 1)

            end_date = next_month

        else:

            end_date = datetime(now.year, now.month, start_day + 7)

            

        start_date = datetime(now.year, now.month, start_day)

        count = await users_col.count_documents({"createdAt": {"$gte": start_date, "$lt": end_date}})

        weekly.append({"name": f"Week {w+1}", "users": count})

        

    # 3. Monthly: Registrations per month for the current year

    months_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    monthly = []

    for m in range(12):

        start_date = datetime(now.year, m + 1, 1)

        if m == 11:

            end_date = datetime(now.year + 1, 1, 1)

        else:

            end_date = datetime(now.year, m + 2, 1)

            

        count = await users_col.count_documents({"createdAt": {"$gte": start_date, "$lt": end_date}})

        monthly.append({"name": months_names[m], "users": count})

        

    # 4. Yearly: Total registrations per year for the last 4 years

    yearly = []

    for y in range(now.year - 3, now.year + 1):

        start_date = datetime(y, 1, 1)

        end_date = datetime(y + 1, 1, 1)

        count = await users_col.count_documents({"createdAt": {"$gte": start_date, "$lt": end_date}})

        yearly.append({"name": str(y), "users": count})

        

    return {

        "daily": daily,

        "weekly": weekly,

        "monthly": monthly,

        "yearly": yearly,

    }



# =============================================================================

#  GET /analytics/mood-distribution  —  Live mood breakdown from moodentries

# =============================================================================

@admin_router.get("/analytics/mood-distribution")

async def get_mood_distribution(authorization: str = Header(None)):

    """

    Aggregates the moodentries collection to produce a percentage breakdown.

    Ensures all 5 main MindAura emotions are always returned for UI consistency.

    """

    await _require_admin(authorization)

    pipeline = [{"$group": {"_id": "$mood", "count": {"$sum": 1}}}]

    mood_counts = await mood_col.aggregate(pipeline).to_list(length=100)

    

    actual_counts = {item["_id"]: item["count"] for item in mood_counts if item["_id"]}

    total = sum(actual_counts.values())

    

    colors = {

        "Happy":    "#3b82f6",

        "Sad":      "#f43f5e",

        "Neutral":  "#64748b",

        "Angry":    "#ef4444",

        "Surprise": "#f59e0b",

    }

    

    emotions = ["Happy", "Sad", "Neutral", "Angry", "Surprise"]

    response = []

    

    for emotion in emotions:

        count = actual_counts.get(emotion, 0)

        percentage = round((count / total) * 100) if total > 0 else 0

        response.append({

            "name":  emotion,

            "count": count,

            "value": percentage,

            "fill":  colors[emotion],

        })

        

    return response



# =============================================================================

#  GET /model-telemetry  —  Simulated AI model metrics

# =============================================================================

@admin_router.get("/model-telemetry")

async def get_model_telemetry(authorization: str = Header(None)):

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