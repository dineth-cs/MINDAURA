import os
import random
import httpx  # අලුත් ඊමේල් ක්‍රමයට ඕනේ කරන ලයිබ්‍රරි එක
from datetime import datetime, timedelta
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, BackgroundTasks, Header
from pydantic import BaseModel, EmailStr
import bcrypt  # CRITICAL: Native bcrypt used here (No passlib)
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import jwt
from bson import ObjectId

# Load environment variables
load_dotenv()

# Initialize APIRouter
auth_router = APIRouter()

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    print("Warning: MONGO_URI is not set. Auth routes will fail.")

client = AsyncIOMotorClient(MONGO_URI)

# Bulletproof Database Selection (Matched to your Atlas DB)
db_name = "test"  
try:
    if MONGO_URI:
        parsed_url = urlparse(MONGO_URI)
        path_name = parsed_url.path.strip("/")
        if path_name:
            db_name = path_name
except Exception:
    pass

db = client[db_name]
users_collection = db["users"]

# JWT Secret
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-replace-me")

# --- Pydantic Models ---
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    newPassword: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


# --- Helper Function: Send Email via Google Apps Script ---
def send_otp_email_sync(to_email: str, user_name: str, otp: str):
    script_url = os.getenv("EMAIL_SCRIPT_URL")
    
    if not script_url:
        print("Warning: EMAIL_SCRIPT_URL is not set. Cannot send OTP.")
        return

    html_content = f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB">
        <div style="background:linear-gradient(135deg,#6B8EFE,#A78BFA);padding:32px 24px;text-align:center">
            <p style="font-size:32px;margin:0 0 8px">🧠</p>
            <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0">MindAura</h1>
            <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:4px 0 0">Your Mental Wellness Companion</p>
        </div>
        <div style="padding:32px 24px">
            <h2 style="color:#1F2937;font-size:18px;font-weight:700;margin:0 0 8px">Password Reset Request</h2>
            <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 24px">Hi <strong>{user_name}</strong>, we received a request to reset your MindAura password. Use the OTP below to continue. It expires in <strong>5 minutes</strong>.</p>
            <div style="background:#F0F4FF;border:2px dashed #6B8EFE;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
                <p style="color:#6B7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">Your One-Time Password</p>
                <p style="color:#6B8EFE;font-size:40px;font-weight:800;letter-spacing:10px;margin:0">{otp}</p>
            </div>
            <p style="color:#9CA3AF;font-size:12px;text-align:center;margin:0">If you did not request this, you can safely ignore this email. Your password will not change.</p>
        </div>
        <div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:16px 24px;text-align:center">
            <p style="color:#9CA3AF;font-size:11px;margin:0">© {datetime.now().year} MindAura · All rights reserved</p>
        </div>
    </div>
    """

    payload = {
        "to": to_email,
        "subject": "🔐 Your MindAura Password Reset OTP",
        "body": html_content
    }

    try:
        # HTTPS (Port 443) හරහා යවන නිසා Hugging Face බ්ලොක් කරන්නේ නැහැ
        response = httpx.post(script_url, json=payload, timeout=15.0)
        print(f"✅ OTP successfully sent via Apps Script: {response.text}")
    except Exception as e:
        print(f"❌ Failed to send OTP email: {e}")


# --- Endpoints ---

@auth_router.get("/me")
async def get_me(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("userId")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
            
        return {
            "user": {
                "_id": str(user["_id"]),
                "name": user.get("name"),
                "email": user.get("email"),
                "profilePicture": user.get("profilePicture", ""),
                "dateOfBirth": user.get("dateOfBirth"),
                "age": user.get("age"),
                "isAdmin": user.get("isAdmin", False),
                "status": user.get("status", "ACTIVE")
            }
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@auth_router.post("/register")
async def register(request: RegisterRequest):
    existing_user = await users_collection.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists with this email")

    # Native bcrypt hashing
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(request.password.encode('utf-8'), salt).decode('utf-8')

    new_user = {
        "name": request.name,
        "email": request.email,
        "password": hashed_password,
        "profilePicture": "",
        "isAdmin": False,
        "status": "ACTIVE",
        "tier": "TIER 1",
        "dailyTasks": [],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    result = await users_collection.insert_one(new_user)
    
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode = {
        "userId": str(result.inserted_id),
        "isAdmin": False,
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")

    user_response = {
        "_id": str(result.inserted_id),
        "name": request.name,
        "email": request.email,
        "profilePicture": "",
        "isAdmin": False,
    }

    return {
        "message": "User registered successfully",
        "token": encoded_jwt,
        "user": user_response
    }


@auth_router.post("/login")
async def login(request: LoginRequest):
    user = await users_collection.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid Credentials")

    if user.get("status", "ACTIVE") == "SUSPENDED":
        raise HTTPException(status_code=403, detail="Your account has been suspended...")

    try:
        is_match = bcrypt.checkpw(request.password.encode('utf-8'), user["password"].encode('utf-8'))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Credentials")

    if not is_match:
        raise HTTPException(status_code=400, detail="Invalid Credentials")

    expire = datetime.utcnow() + timedelta(days=7)
    to_encode = {
        "userId": str(user["_id"]),
        "isAdmin": user.get("isAdmin", False),
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")

    return {
        "_id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "profilePicture": user.get("profilePicture", ""),
        "dateOfBirth": user.get("dateOfBirth"),
        "age": user.get("age"),
        "isAdmin": user.get("isAdmin", False),
        "token": encoded_jwt
    }


@auth_router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    user = await users_collection.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    otp = str(random.randint(100000, 999999))
    expire_time = datetime.utcnow() + timedelta(minutes=5)

    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"resetPasswordOtp": otp, "resetPasswordExpire": expire_time}}
    )

    user_name = user.get("name", "User")
    background_tasks.add_task(send_otp_email_sync, request.email, user_name, otp)

    return {"message": "OTP sent to email successfully"}


@auth_router.post("/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    user = await users_collection.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    stored_otp = user.get("resetPasswordOtp")
    expire_time = user.get("resetPasswordExpire")

    if not stored_otp or not expire_time:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    if stored_otp != request.otp or datetime.utcnow() > expire_time:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    return {"message": "OTP verified successfully"}


@auth_router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    user = await users_collection.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    stored_otp = user.get("resetPasswordOtp")
    expire_time = user.get("resetPasswordExpire")

    if not stored_otp or not expire_time:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    if stored_otp != request.otp or datetime.utcnow() > expire_time:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(request.newPassword.encode('utf-8'), salt).decode('utf-8')

    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"password": hashed_password},
            "$unset": {"resetPasswordOtp": "", "resetPasswordExpire": ""}
        }
    )

    return {"message": "Password reset successfully"}


@auth_router.post("/resend-otp")
async def resend_otp(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    user = await users_collection.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # අලුත් OTP කෝඩ් එකක් හදනවා
    otp = str(random.randint(100000, 999999))
    expire_time = datetime.utcnow() + timedelta(minutes=5)

    # ඒක ඩේටාබේස් එකට අප්ඩේට් කරනවා
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"resetPasswordOtp": otp, "resetPasswordExpire": expire_time}}
    )

    # Google Apps Script හරහා අලුත් කෝඩ් එක ඊමේල් කරනවා
    user_name = user.get("name", "User")
    background_tasks.add_task(send_otp_email_sync, request.email, user_name, otp)

    return {"message": "New OTP sent to email successfully"}