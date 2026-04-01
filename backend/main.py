from fastapi import FastAPI
from pydantic import BaseModel
import mysql.connector

app = FastAPI()

def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        port=3307,
        password="",
        database="map_project",
    )

class Location(BaseModel):
    name: str
    lat: float
    lng: float

@app.post("/locations")
def add_location(location: Location):
    db = get_db()
    cursor = db.cursor()

    sql = "INSERT INTO locations (name, lat, lng) VALUES (%s, %s, %s)"
    cursor.execute(sql, (location.name, location.lat, location.lng))

    db.commit()
    db.close()

    return {"message" : "Location added successfully"}

@app.put("/locations")
def add_location(location: Location):
    db = get_db()
    cursor = db.cursor()

    sql = "UPDATE locations SET name = %s, lat = %s, lng = %s WHERE id = %s"
    cursor.execute(sql, (location.name, location.lat, location.lng))

    db.commit()
    db.close()

    return {"message" : " Location updated successfully"}

@app.delete("/locations/{location_id}")
def delete_location(id: int):
    db = get_db()
    cursor = db.cursor()

    sql = "DELETE FROM locations WHERE id = %s"
    cursor.execute(sql, (id,))

    db.commit()
    db.close()

    return {"message" : "Location deleted successfully"}
