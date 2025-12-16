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
    images: List[UploadFile] = File(...),
    authorization: str = Form(...)
):
    user = await require_auth(authorization)
    
    if len(images) < 3:
        raise HTTPException(status_code=400, detail="At least 3 images required")
    
    if len(description) < 10:
        raise HTTPException(status_code=400, detail="Description must be at least 10 characters")
    
    # Save images
    image_paths = []
    listing_id = str(uuid.uuid4())
    listing_dir = UPLOAD_DIR / listing_id
    listing_dir.mkdir(exist_ok=True)
    
    for i, img in enumerate(images):
        ext = img.filename.split('.')[-1] if '.' in img.filename else 'jpg'
        filename = f"{i}.{ext}"
        file_path = listing_dir / filename
        with open(file_path, "wb") as f:
            content = await img.read()
            f.write(content)
        image_paths.append(f"/uploads/{listing_id}/{filename}")
    
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
    
    listings = await db.listings.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Get user names
    for listing in listings:
        user = await db.users.find_one({"id": listing["user_id"]}, {"_id": 0, "name": 1})
        listing["user_name"] = user["name"] if user else "Unknown"
    
    return listings

@api_router.get("/listings/{listing_id}", response_model=CarListingResponse)
async def get_listing(listing_id: str):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    user = await db.users.find_one({"id": listing["user_id"]}, {"_id": 0, "name": 1})
    listing["user_name"] = user["name"] if user else "Unknown"
    
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
        ext = img.filename.split('.')[-1] if '.' in img.filename else 'jpg'
        filename = f"{start_idx + i}.{ext}"
        file_path = listing_dir / filename
        with open(file_path, "wb") as f:
            content = await img.read()
            f.write(content)
        new_paths.append(f"/uploads/{listing_id}/{filename}")
    
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

@api_router.get("/")
async def root():
    return {"message": "NextRides API"}

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
