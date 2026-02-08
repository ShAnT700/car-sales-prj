from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Query, Header
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import shutil
from PIL import Image
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'nextriders-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Maximum image size after compression (0.5MB = 512KB)
MAX_IMAGE_SIZE_BYTES = 500 * 1024

def compress_image(image_bytes: bytes, max_size: int = MAX_IMAGE_SIZE_BYTES) -> bytes:
    """Compress image to JPEG format with size limit."""
    img = Image.open(io.BytesIO(image_bytes))
    
    # Convert to RGB if necessary (for PNG with transparency, etc.)
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Resize if image is very large (max 1600px on longest side for better compression)
    max_dimension = 1600
    if max(img.size) > max_dimension:
        ratio = max_dimension / max(img.size)
        new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
        img = img.resize(new_size, Image.LANCZOS)
    
    # Start with quality 80 and reduce until under max_size
    quality = 80
    output = io.BytesIO()
    img.save(output, format='JPEG', quality=quality, optimize=True)
    
    while output.tell() > max_size and quality > 10:
        quality -= 5
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=quality, optimize=True)
        
        # If still too large at quality 20, resize the image
        if quality <= 20 and output.tell() > max_size:
            ratio = 0.8
            new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
            img = img.resize(new_size, Image.LANCZOS)
            quality = 50  # Reset quality after resize
    
    return output.getvalue()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Serve images via API instead of static mount for cross-origin support
from fastapi.responses import FileResponse

@api_router.get("/images/{listing_id}/{filename}")
async def get_image(listing_id: str, filename: str):
    file_path = UPLOAD_DIR / listing_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path, media_type="image/jpeg")

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CarListingCreate(BaseModel):
    make: str
    model: str
    year: int
    mileage: int
    price: int
    drive_type: str
    city: str
    zip_code: str
    phone: str
    vin: str
    description: str
    clean_title: bool = False

class CarListingResponse(BaseModel):
    id: str
    user_id: str
    make: str
    model: str
    year: int
    mileage: int
    price: int
    drive_type: str
    city: str
    zip_code: str
    phone: str
    vin: str
    description: str
    images: List[str]
    created_at: str
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    favorite_count: int = 0
    clean_title: bool = False

class CarListingUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    mileage: Optional[int] = None
    price: Optional[int] = None
    drive_type: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    vin: Optional[str] = None
    description: Optional[str] = None
    clean_title: Optional[bool] = None
    images: Optional[List[str]] = None

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(token: str = None):
    if not token:
        return None
    try:
        if token.startswith("Bearer "):
            token = token[7:]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        return user
    except:
        return None

async def require_auth(authorization: str = None):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

async def get_auth_from_header(authorization: str = Header(None)):
    return await require_auth(authorization)

# Auth Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "phone": user_data.phone,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            phone=user_data.phone,
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            phone=user.get("phone"),
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(authorization: str = Header(None)):
    user = await require_auth(authorization)
    return UserResponse(**user)

# Car Listings Routes
@api_router.post("/listings", response_model=CarListingResponse)
async def create_listing(
    make: str = Form(...),
    model: str = Form(...),
    year: int = Form(...),
    mileage: int = Form(...),
    price: int = Form(...),
    drive_type: str = Form(...),
    city: str = Form(...),
    zip_code: str = Form(...),
    phone: str = Form(...),
    vin: str = Form(...),
    description: str = Form(...),
    clean_title: str = Form("false"),
    images: List[UploadFile] = File(...),
    authorization: str = Form(...)
):
    user = await require_auth(authorization)
    
    if len(images) < 1:
        raise HTTPException(status_code=400, detail="At least 1 image required")
    
    if len(description) < 10:
        raise HTTPException(status_code=400, detail="Description must be at least 10 characters")
    
    # Save images with compression
    image_paths = []
    listing_id = str(uuid.uuid4())
    listing_dir = UPLOAD_DIR / listing_id
    listing_dir.mkdir(exist_ok=True)
    
    for i, img in enumerate(images):
        content = await img.read()
        # Compress image to JPEG under 0.5MB
        compressed = compress_image(content)
        filename = f"{i}.jpg"
        file_path = listing_dir / filename
        with open(file_path, "wb") as f:
            f.write(compressed)
        image_paths.append(f"/api/images/{listing_id}/{filename}")
    
    clean_title_bool = clean_title.lower() == "true"
    
    listing_doc = {
        "id": listing_id,
        "user_id": user["id"],
        "make": make,
        "model": model,
        "year": year,
        "mileage": mileage,
        "price": price,
        "drive_type": drive_type,
        "city": city,
        "zip_code": zip_code,
        "phone": phone,
        "vin": vin,
        "description": description,
        "images": image_paths,
        "clean_title": clean_title_bool,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.listings.insert_one(listing_doc)
    
    return CarListingResponse(**listing_doc, user_name=user["name"])

@api_router.get("/listings", response_model=List[CarListingResponse])
async def get_listings(
    make: Optional[str] = None,
    model: Optional[str] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    mileage_from: Optional[int] = None,
    mileage_to: Optional[int] = None,
    price_from: Optional[int] = None,
    price_to: Optional[int] = None,
    drive_type: Optional[str] = None,
    zip_code: Optional[str] = None,
    distance: Optional[int] = None,
    clean_title: Optional[bool] = None,
    limit: int = 50,
    skip: int = 0
):
    query = {}
    
    if make:
        query["make"] = {"$regex": make, "$options": "i"}
    if model:
        query["model"] = {"$regex": model, "$options": "i"}
    if year_from:
        query["year"] = {"$gte": year_from}
    if year_to:
        query.setdefault("year", {})["$lte"] = year_to
    if mileage_from:
        query["mileage"] = {"$gte": mileage_from}
    if mileage_to:
        query.setdefault("mileage", {})["$lte"] = mileage_to
    if price_from:
        query["price"] = {"$gte": price_from}
    if price_to:
        query.setdefault("price", {})["$lte"] = price_to
    if drive_type:
        query["drive_type"] = drive_type
    if zip_code:
        query["zip_code"] = {"$regex": f"^{zip_code[:3]}", "$options": "i"}
    if clean_title is not None:
        query["clean_title"] = clean_title
    
    listings = await db.listings.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Attach user info and favorite counts
    for listing in listings:
        user = await db.users.find_one({"id": listing["user_id"]}, {"_id": 0, "name": 1, "avatar": 1})
        listing["user_name"] = user["name"] if user else "Unknown"
        listing["user_avatar"] = user.get("avatar") if user else None
        listing["favorite_count"] = await db.favorites.count_documents({"listing_id": listing["id"]})
    
    return listings

@api_router.get("/listings/{listing_id}", response_model=CarListingResponse)
async def get_listing(listing_id: str):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    user = await db.users.find_one({"id": listing["user_id"]}, {"_id": 0, "name": 1, "avatar": 1})
    listing["user_name"] = user["name"] if user else "Unknown"
    listing["user_avatar"] = user.get("avatar") if user else None

    # Favorite count for this listing
    fav_count = await db.favorites.count_documents({"listing_id": listing_id})
    listing["favorite_count"] = fav_count
    
    return listing

@api_router.get("/my-listings", response_model=List[CarListingResponse])
async def get_my_listings(authorization: str = Header(None)):
    user = await require_auth(authorization)
    listings = await db.listings.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for listing in listings:
        listing["user_name"] = user["name"]
    return listings

@api_router.put("/listings/{listing_id}", response_model=CarListingResponse)
async def update_listing(listing_id: str, update_data: CarListingUpdate, authorization: str = Header(None)):
    user = await require_auth(authorization)
    
    listing = await db.listings.find_one({"id": listing_id, "user_id": user["id"]}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found or not authorized")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        await db.listings.update_one({"id": listing_id}, {"$set": update_dict})
    
    updated = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    updated["user_name"] = user["name"]
    return updated

@api_router.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, authorization: str = Header(None)):
    user = await require_auth(authorization)
    
    listing = await db.listings.find_one({"id": listing_id, "user_id": user["id"]})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found or not authorized")
    
    await db.listings.delete_one({"id": listing_id})
    
    # Delete images
    listing_dir = UPLOAD_DIR / listing_id
    if listing_dir.exists():
        shutil.rmtree(listing_dir)
    
    return {"message": "Listing deleted"}

@api_router.post("/listings/{listing_id}/images")
async def add_images(
    listing_id: str,
    images: List[UploadFile] = File(...),
    authorization: str = Form(...)
):
    user = await require_auth(authorization)
    
    listing = await db.listings.find_one({"id": listing_id, "user_id": user["id"]}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found or not authorized")
    
    listing_dir = UPLOAD_DIR / listing_id
    listing_dir.mkdir(exist_ok=True)
    
    current_images = listing.get("images", [])
    start_idx = len(current_images)
    
    new_paths = []
    for i, img in enumerate(images):
        content = await img.read()
        # Compress image to JPEG under 0.5MB
        compressed = compress_image(content)
        filename = f"{start_idx + i}.jpg"
        file_path = listing_dir / filename
        with open(file_path, "wb") as f:
            f.write(compressed)
        new_paths.append(f"/api/images/{listing_id}/{filename}")
    
    await db.listings.update_one(
        {"id": listing_id},
        {"$push": {"images": {"$each": new_paths}}}
    )
    
    return {"images": current_images + new_paths}

# Get unique makes and models for dropdowns
@api_router.get("/makes")
async def get_makes():
    makes = await db.listings.distinct("make")
    return sorted(set(m.title() for m in makes if m))

@api_router.get("/models")
async def get_models(make: Optional[str] = None):
    query = {"make": {"$regex": make, "$options": "i"}} if make else {}
    models = await db.listings.distinct("model", query)
    return sorted(set(m.title() for m in models if m))

# ========== FAVORITES ==========
class FavoriteCreate(BaseModel):
    listing_id: str

@api_router.post("/favorites")
async def add_favorite(data: FavoriteCreate, authorization: str = Header(None)):
    user = await require_auth(authorization)
    
    # Check if already favorited
    existing = await db.favorites.find_one({"user_id": user["id"], "listing_id": data.listing_id})
    if existing:
        return {"message": "Already in favorites", "id": existing.get("id")}
    
    fav_id = str(uuid.uuid4())
    await db.favorites.insert_one({
        "id": fav_id,
        "user_id": user["id"],
        "listing_id": data.listing_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Added to favorites", "id": fav_id}

@api_router.delete("/favorites/{listing_id}")
async def remove_favorite(listing_id: str, authorization: str = Header(None)):
    user = await require_auth(authorization)
    await db.favorites.delete_one({"user_id": user["id"], "listing_id": listing_id})
    return {"message": "Removed from favorites"}

@api_router.get("/favorites")
async def get_favorites(authorization: str = Header(None)):
    user = await require_auth(authorization)
    favorites = await db.favorites.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    
    # Get listing details
    result = []
    for fav in favorites:
        listing = await db.listings.find_one({"id": fav["listing_id"]}, {"_id": 0})
        if listing:
            listing_user = await db.users.find_one({"id": listing["user_id"]}, {"_id": 0, "name": 1, "avatar": 1})
            listing["user_name"] = listing_user["name"] if listing_user else "Unknown"
            listing["user_avatar"] = listing_user.get("avatar") if listing_user else None
            listing["favorite_id"] = fav["id"]
            listing["favorite_count"] = await db.favorites.count_documents({"listing_id": listing["id"]})
            result.append(listing)
    return result

@api_router.get("/favorites/ids")
async def get_favorite_ids(authorization: str = Header(None)):
    user = await require_auth(authorization)
    favorites = await db.favorites.find({"user_id": user["id"]}, {"_id": 0, "listing_id": 1}).to_list(100)
    return [f["listing_id"] for f in favorites]

# ========== SAVED SEARCHES ==========
class SavedSearchCreate(BaseModel):
    name: str
    filters: dict

@api_router.post("/saved-searches")
async def create_saved_search(data: SavedSearchCreate, authorization: str = Header(None)):
    user = await require_auth(authorization)
    
    search_id = str(uuid.uuid4())
    await db.saved_searches.insert_one({
        "id": search_id,
        "user_id": user["id"],
        "name": data.name,
        "filters": data.filters,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Search saved", "id": search_id}

@api_router.get("/saved-searches")
async def get_saved_searches(authorization: str = Header(None)):
    user = await require_auth(authorization)
    searches = await db.saved_searches.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return searches

@api_router.delete("/saved-searches/{search_id}")
async def delete_saved_search(search_id: str, authorization: str = Header(None)):
    user = await require_auth(authorization)
    await db.saved_searches.delete_one({"id": search_id, "user_id": user["id"]})
    return {"message": "Search deleted"}

# ========== MESSAGES ==========
class MessageCreate(BaseModel):
    listing_id: str
    receiver_id: str
    message: str

class MessageResponse(BaseModel):
    id: str
    listing_id: str

@api_router.get("/messages/conversation", response_model=List[dict])
async def get_conversation(listing_id: str, other_user_id: str, authorization: str = Header(None)):
    """Return full conversation for a listing between current user and other user."""
    user = await require_auth(authorization)

    query = {
        "listing_id": listing_id,
        "$or": [
            {"sender_id": user["id"], "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": user["id"]},
        ],
    }

    messages = await db.messages.find(query, {"_id": 0}).sort("created_at", 1).to_list(200)

    # enrich with names and basic listing info
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0, "make": 1, "model": 1, "year": 1})
    for msg in messages:
        sender = await db.users.find_one({"id": msg["sender_id"]}, {"_id": 0, "name": 1})
        receiver = await db.users.find_one({"id": msg["receiver_id"]}, {"_id": 0, "name": 1})
        msg["sender_name"] = sender["name"] if sender else "Unknown"
        msg["receiver_name"] = receiver["name"] if receiver else "Unknown"
        msg["listing_title"] = f"{listing['year']} {listing['make']} {listing['model']}" if listing else None

    return messages

@api_router.post("/messages")
async def send_message(data: MessageCreate, authorization: str = Header(None)):
    user = await require_auth(authorization)
    
    # Verify listing exists
    listing = await db.listings.find_one({"id": data.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    msg_id = str(uuid.uuid4())
    await db.messages.insert_one({
        "id": msg_id,
        "listing_id": data.listing_id,
        "sender_id": user["id"],
        "receiver_id": data.receiver_id,
        "message": data.message,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Message sent", "id": msg_id}

@api_router.get("/messages/threads")
async def get_threads(authorization: str = Header(None)):
    user = await require_auth(authorization)

    messages = await db.messages.find(
        {"$or": [
            {"sender_id": user["id"]},
            {"receiver_id": user["id"]},
        ]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(200)

    threads = {}

    for msg in messages:
        other_id = msg["receiver_id"] if msg["sender_id"] == user["id"] else msg["sender_id"]
        key = f"{msg['listing_id']}::{other_id}"

        thread = threads.get(key)
        if not thread:
            # fetch user and listing once per thread
            other_user = await db.users.find_one({"id": other_id}, {"_id": 0, "name": 1, "avatar": 1})
            listing = await db.listings.find_one({"id": msg["listing_id"]}, {"_id": 0, "make": 1, "model": 1, "year": 1, "images": 1})
            listing_title = f"{listing['year']} {listing['make']} {listing['model']}" if listing else "Deleted listing"
            listing_image = listing["images"][0] if listing and listing.get("images") else None

            thread = {
                "id": key,
                "listing_id": msg["listing_id"],
                "other_user_id": other_id,
                "other_user_name": other_user["name"] if other_user else "Unknown",
                "other_user_avatar": other_user.get("avatar") if other_user else None,
                "listing_title": listing_title,
                "listing_image": listing_image,
                "last_message": msg["message"],
                "last_created_at": msg["created_at"],
                "unread_count": 0,
            }
            threads[key] = thread

        # update last message if this msg is newer
        if msg["created_at"] > thread["last_created_at"]:
            thread["last_message"] = msg["message"]
            thread["last_created_at"] = msg["created_at"]

        # unread count (only messages to current user and not read)
        if msg["receiver_id"] == user["id"] and not msg.get("read", False):
            thread["unread_count"] += 1

    # sort threads by last_created_at desc
    result = sorted(threads.values(), key=lambda t: t["last_created_at"], reverse=True)
    return result


@api_router.get("/messages/inbox")
async def get_inbox(authorization: str = Header(None)):
    user = await require_auth(authorization)
    messages = await db.messages.find({"receiver_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    result = []
    for msg in messages:
        sender = await db.users.find_one({"id": msg["sender_id"]}, {"_id": 0, "name": 1})
        listing = await db.listings.find_one({"id": msg["listing_id"]}, {"_id": 0, "make": 1, "model": 1, "year": 1})
        msg["sender_name"] = sender["name"] if sender else "Unknown"
        msg["listing_title"] = f"{listing['year']} {listing['make']} {listing['model']}" if listing else "Deleted listing"
        result.append(msg)
    return result

@api_router.get("/messages/sent")
async def get_sent_messages(authorization: str = Header(None)):
    user = await require_auth(authorization)
    messages = await db.messages.find({"sender_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    result = []
    for msg in messages:
        receiver = await db.users.find_one({"id": msg["receiver_id"]}, {"_id": 0, "name": 1})
        listing = await db.listings.find_one({"id": msg["listing_id"]}, {"_id": 0, "make": 1, "model": 1, "year": 1})
        msg["receiver_name"] = receiver["name"] if receiver else "Unknown"
        msg["listing_title"] = f"{listing['year']} {listing['make']} {listing['model']}" if listing else "Deleted listing"
        result.append(msg)
    return result

@api_router.get("/messages/unread-count")
async def get_unread_count(authorization: str = Header(None)):
    user = await require_auth(authorization)
    count = await db.messages.count_documents({"receiver_id": user["id"], "read": False})
    return {"count": count}

@api_router.put("/messages/{message_id}/read")
async def mark_as_read(message_id: str, authorization: str = Header(None)):
    user = await require_auth(authorization)
    await db.messages.update_one({"id": message_id, "receiver_id": user["id"]}, {"$set": {"read": True}})
    return {"message": "Marked as read"}

@api_router.get("/")
async def root():
    return {"message": "NextRides API"}

# ========== PROFILE ==========
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    nickname: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    show_favorites: Optional[bool] = None
    show_saved_searches: Optional[bool] = None

@api_router.get("/profile")
async def get_profile(authorization: str = Header(None)):
    user = await require_auth(authorization)
    profile = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return profile

@api_router.put("/profile")
async def update_profile(data: ProfileUpdate, authorization: str = Header(None)):
    user = await require_auth(authorization)
    
    update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_dict:
        await db.users.update_one({"id": user["id"]}, {"$set": update_dict})
    
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return updated

@api_router.post("/profile/avatar")
async def upload_avatar(avatar: UploadFile = File(...), authorization: str = Form(...)):
    user = await require_auth(authorization)
    
    # Save avatar
    avatar_dir = UPLOAD_DIR / "avatars"
    avatar_dir.mkdir(exist_ok=True)
    
    ext = avatar.filename.split('.')[-1] if '.' in avatar.filename else 'jpg'
    filename = f"{user['id']}.{ext}"
    file_path = avatar_dir / filename
    
    with open(file_path, "wb") as f:
        content = await avatar.read()
        f.write(content)
    
    avatar_url = f"/api/images/avatars/{filename}"
    await db.users.update_one({"id": user["id"]}, {"$set": {"avatar": avatar_url}})
    
    return {"avatar": avatar_url}

@api_router.get("/users/{user_id}/public")
async def get_public_profile(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0, "email": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's listings with avatar
    listings = await db.listings.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for listing in listings:
        listing["user_name"] = user.get("nickname") or user.get("name", "Unknown")
        listing["user_avatar"] = user.get("avatar")
    
    # Get favorites if allowed
    favorites = []
    if user.get("show_favorites", True):
        fav_docs = await db.favorites.find({"user_id": user_id}, {"_id": 0}).to_list(50)
        for fav in fav_docs:
            listing = await db.listings.find_one({"id": fav["listing_id"]}, {"_id": 0})
            if listing:
                listing_user = await db.users.find_one({"id": listing["user_id"]}, {"_id": 0, "name": 1, "nickname": 1, "avatar": 1})
                listing["user_name"] = listing_user.get("nickname") or listing_user.get("name", "Unknown") if listing_user else "Unknown"
                listing["user_avatar"] = listing_user.get("avatar") if listing_user else None
                favorites.append(listing)
    
    # Get saved searches if allowed
    saved_searches = []
    if user.get("show_saved_searches", False):
        saved_searches = await db.saved_searches.find({"user_id": user_id}, {"_id": 0}).to_list(50)
    
    return {
        "user": user,
        "listings": listings,
        "favorites": favorites,
        "saved_searches": saved_searches
    }

# Serve avatar images
@api_router.get("/images/avatars/{filename}")
async def get_avatar_image(filename: str):
    file_path = UPLOAD_DIR / "avatars" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Avatar not found")
    return FileResponse(file_path, media_type="image/jpeg")

# ========== TEST SEED (for CI/CD) ==========
class TestSeedUser(BaseModel):
    email: EmailStr
    password: str
    name: str

@api_router.post("/test/seed")
async def seed_test_user(data: TestSeedUser):
    """Seed or reset a test user. Used by CI/CD test setup to ensure test user exists with correct credentials."""
    # Delete existing user with this email (if any)
    await db.users.delete_many({"email": data.email})
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    return {"message": "Test user seeded", "user_id": user_id}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
