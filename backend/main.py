from fastapi import FastAPI
from pydantic import BaseModel
from supabase import create_client
import os

app = FastAPI()

# Supabase setup
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

supabase = create_client(url, key)

# Model
class Location(BaseModel):
    name: str
    lat: float
    lng: float


# CREATE
@app.post("/locations")
def add_location(location: Location):
    data = supabase.table("locations").insert({
        "name": location.name,
        "lat": location.lat,
        "lng": location.lng
    }).execute()

    return {"message": "Location added", "data": data.data}


# READ
@app.get("/locations")
def get_locations():
    data = supabase.table("locations").select("*").execute()
    return data.data


# UPDATE
class UpdateLocation(BaseModel):
    id: int
    name: str
    lat: float
    lng: float

@app.put("/locations")
def update_location(location: UpdateLocation):
    data = supabase.table("locations").update({
        "name": location.name,
        "lat": location.lat,
        "lng": location.lng
    }).eq("id", location.id).execute()

    return {"message": "Location updated", "data": data.data}


# DELETE
@app.delete("/locations/{location_id}")
def delete_location(location_id: int):
    data = supabase.table("locations").delete().eq("id", location_id).execute()

    return {"message": "Location deleted", "data": data.data}