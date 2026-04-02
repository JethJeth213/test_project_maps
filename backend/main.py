import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

app = FastAPI()

# 1. CORS CONFIGURATION
# This allows your Vercel frontend to talk to this Render backend.
origins = [
    "https://test-project-maps-yeas.vercel.app",  # Your specific Vercel URL
    "http://localhost:5173",                     # Default Vite port
    "http://localhost:3000",                     # Alternative local port
    "*"                                          # Use "*" only if you want to allow ANY site (less secure)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. SUPABASE SETUP
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in environment variables.")

supabase: Client = create_client(url, key)

# 3. MODELS
class Location(BaseModel):
    name: str
    lat: float
    lng: float

class UpdateLocation(BaseModel):
    id: int
    name: str
    lat: float
    lng: float

# 4. ROUTES

@app.get("/")
def root():
    return {"status": "OmniRoute Backend is running"}

# CREATE
@app.post("/locations")
def add_location(location: Location):
    try:
        data = supabase.table("locations").insert({
            "name": location.name,
            "lat": location.lat,
            "lng": location.lng
        }).execute()
        return {"message": "Location added", "data": data.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# READ
@app.get("/locations")
def get_locations():
    try:
        data = supabase.table("locations").select("*").execute()
        return data.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# UPDATE
@app.put("/locations")
def update_location(location: UpdateLocation):
    try:
        data = supabase.table("locations").update({
            "name": location.name,
            "lat": location.lat,
            "lng": location.lng
        }).eq("id", location.id).execute()
        return {"message": "Location updated", "data": data.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# DELETE
@app.delete("/locations/{location_id}")
def delete_location(location_id: int):
    try:
        data = supabase.table("locations").delete().eq("id", location_id).execute()
        return {"message": "Location deleted", "data": data.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))