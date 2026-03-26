"""Authentication API routes — signup, login, me"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
import bcrypt
from jose import jwt, JWTError
from app.config import settings
from app.utils.database import get_users_collection
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

auth_router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72


# ── Request / Response schemas ──────────────────────────

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: str


# ── Helpers ─────────────────────────────────────────────

def _hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def _verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except ValueError:
        return False


def _create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=JWT_ALGORITHM)


async def _get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    """Dependency: extract user from JWT bearer token"""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(
            credentials.credentials, settings.jwt_secret, algorithms=[JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    users = get_users_collection()
    if users is None:
        raise HTTPException(status_code=503, detail="Database not available")

    from bson import ObjectId

    user = await users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def _check_db():
    """Raise 503 if the database is not connected"""
    users = get_users_collection()
    if users is None:
        raise HTTPException(
            status_code=503,
            detail="Database not configured. Please set MONGODB_URI in .env and restart.",
        )
    return users


# ── Endpoints ───────────────────────────────────────────

@auth_router.post("/signup", response_model=AuthResponse, status_code=201)
async def signup(req: SignupRequest):
    """Create a new user account"""
    users = _check_db()

    # Check for existing user
    existing = await users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user_doc = {
        "name": req.name.strip(),
        "email": req.email.lower(),
        "password_hash": _hash_password(req.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    result = await users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    token = _create_token(user_id, user_doc["email"])

    logger.info(f"New user registered: {user_doc['email']}")

    return AuthResponse(
        token=token,
        user={"id": user_id, "name": user_doc["name"], "email": user_doc["email"]},
    )


@auth_router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Authenticate and get a JWT token"""
    users = _check_db()

    user = await users.find_one({"email": req.email.lower()})
    if not user or not _verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    token = _create_token(user_id, user["email"])

    logger.info(f"User logged in: {user['email']}")

    return AuthResponse(
        token=token,
        user={"id": user_id, "name": user["name"], "email": user["email"]},
    )


@auth_router.get("/me", response_model=UserResponse)
async def get_me(user=Depends(_get_current_user)):
    """Get the current authenticated user"""
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        created_at=user.get("created_at", ""),
    )
