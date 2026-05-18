import os
import random
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import jwt

# Load environment variables (for local testing; in HF Spaces, they are set in the UI)
load_dotenv()

# Initialize APIRouter
auth_router = APIRouter()

# Password hashing context (matching Node.js bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    print("Warning: MONGO_URI is not set. Auth routes will fail.")

client = AsyncIOMotorClient(MONGO_URI)
db = client.get_default_database() if MONGO_URI and client.get_default_database().name else client["mindaura"]
users_collection = db["users"]

# Email settings
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
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


# --- Helper Function: Send Email ---
def send_otp_email_sync(to_email: str, user_name: str, otp: str):
    """Synchronous function to send email via SMTP. Runs in BackgroundTask."""
    if not EMAIL_USER or not EMAIL_PASS:
        print("Warning: EMAIL_USER or EMAIL_PASS not set. Cannot send OTP.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = f'"MindAura" <{EMAIL_USER}>'
        msg['To'] = to_email
        msg['Subject'] = '🔐 Your MindAura Password Reset OTP'

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
        msg.attach(MIMEText(html_content, 'html'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent OTP to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")


# --- Endpoints ---

@auth_router.post("/login")
async def login(request: LoginRequest):
    user = await users_collection.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid Credentials")

    # Verify password (passlib automatically handles $2b$ and Node.js $2a$ bcrypt prefixes)
    is_match = pwd_context.verify(request.password, user["password"])
    if not is_match:
        raise HTTPException(status_code=400, detail="Invalid Credentials")

    # Create JWT token matching the Node.js payload
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

    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    expire_time = datetime.utcnow() + timedelta(minutes=5)

    # Save to MongoDB
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"resetPasswordOtp": otp, "resetPasswordExpire": expire_time}}
    )

    # Dispatch email in background so the UI doesn't hang
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
    
    # Check if OTP matches and hasn't expired
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

    # Hash the new password
    hashed_password = pwd_context.hash(request.newPassword)

    # Update the password and clear the OTP fields
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"password": hashed_password},
            "$unset": {"resetPasswordOtp": "", "resetPasswordExpire": ""}
        }
    )

    return {"message": "Password reset successfully"}
