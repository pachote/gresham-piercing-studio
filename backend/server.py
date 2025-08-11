from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import pymongo
import uuid
import os
from pymongo import MongoClient
import base64
import json
from twilio.rest import Client
import urllib.parse

# Database setup
MONGO_URL = os.environ.get('DATABASE_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'piercing_studio')

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Twilio setup
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')

twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ClientForm(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    date_of_birth: str
    piercing_type: str
    jewelry_choice: str
    is_minor: bool = False
    parent_first_name: Optional[str] = None
    parent_last_name: Optional[str] = None
    parent_email: Optional[str] = None
    parent_phone: Optional[str] = None
    signature: str
    parent_signature: Optional[str] = None
    id_photo: str
    parent_id_photo: Optional[str] = None
    agreed_terms: bool

class SMSRequest(BaseModel):
    phone_number: str
    client_name: str
    piercing_type: str

class ReminderRequest(BaseModel):
    phone_number: str
    client_name: str
    piercing_type: str
    downsize_due_date: str

class ClientLookup(BaseModel):
    first_name: str
    last_name: str

# Helper functions
def calculate_downsize_date(piercing_type: str, pierce_date: datetime):
    oral_piercings = ['tongue', 'lip', 'labret', 'monroe', 'medusa', 'snake bite', 'spider bite']
    earlobe_piercings = ['earlobe', 'earlobes', 'set of earlobes']
    
    if any(earlobe in piercing_type.lower() for earlobe in earlobe_piercings):
        return None
    elif any(oral in piercing_type.lower() for oral in oral_piercings):
        return pierce_date + timedelta(weeks=2)
    elif 'daith' in piercing_type.lower():
        return pierce_date + timedelta(weeks=16)
    else:
        return pierce_date + timedelta(weeks=12)

def get_pricing(piercing_type: str) -> float:
    pricing = {
        'set of earlobes': 80, 'earlobe': 80, 'earlobes': 80,
        'industrial': 100, 'surface bar': 120, 'nipple': 100,
        'nipple pair': 150, 'dermal': 175, 'dermal pair': 250,
        'nostril': 90, 'tragus': 90, 'rook': 90, 'septum': 90,
        'daith': 90, 'helix': 90, 'forward-helix': 90, 'conch': 90,
        'anti-tragus': 90, 'snug': 90, 'eyebrow': 90, 'navel': 90,
        'tongue': 90, 'lip': 90, 'labret': 90, 'monroe': 90, 'medusa': 90
    }
    return pricing.get(piercing_type.lower(), 90)

def get_jewelry_options(piercing_type: str) -> dict:
    standard_options = {
        "16g_bead_ring": "16g Bead Ring",
        "16g_labret_stud": "16g Labret Stud with Clear Jewel"
    }
    earlobe_piercings = ['earlobe', 'earlobes', 'set of earlobes']
    if any(earlobe in piercing_type.lower() for earlobe in earlobe_piercings):
        return {
            "14g_captive_ring": "14g Captive Bead Ring",
            "16g_labret_stud": "16g Labret Stud",
            "custom": "Custom Jewelry Available"
        }
    return standard_options

def send_sms(phone_number: str, message: str) -> bool:
    if not twilio_client:
        return False
    try:
        message = twilio_client.messages.create(
            body=message, from_=TWILIO_PHONE_NUMBER, to=phone_number
        )
        return True
    except Exception as e:
        print(f"Error sending SMS: {str(e)}")
        return False

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/pricing")
async def get_pricing_info():
    return {
        "single_piercings": {
            "set_of_earlobes": {"name": "Set of Earlobes", "price": 80},
            "industrial": {"name": "Industrial", "price": 100},
            "surface_bar": {"name": "Surface Bar", "price": 120},
            "nipple": {"name": "Nipple (one)", "price": 100},
            "nipple_pair": {"name": "Nipples (pair)", "price": 150},
            "dermal": {"name": "Dermal (one)", "price": 175},
            "dermal_pair": {"name": "Dermals (pair)", "price": 250}
        },
        "standard_piercings": {
            "single": {
                "price": 90,
                "types": ["Nostril", "Tragus", "Rook", "Septum", "Daith", "Helix", 
                         "Forward-Helix", "Conch", "Anti-Tragus", "Snug", "Eyebrow", 
                         "Navel", "Tongue", "Lip", "Labret", "Monroe", "Medusa"]
            },
            "pair": {"price": 130, "additional": 20}
        },
        "services": {
            "jewelry_change": {"name": "Jewelry Change", "price": 5},
            "dermal_top_change": {"name": "Dermal Top Change", "price": 10}
        },
        "guarantee": "All piercings include a three month guarantee"
    }

@app.get("/api/business-info")
async def get_business_info():
    return {
        "name": "Multnomah Body Piercing & Tattoo",
        "address": "1861 NE DIVISION ST GRESHAM OR. 97030",
        "phone": "(503) 669-4191",
        "email": "Multnomahtattoo@gmail.com",
        "coordinates": {"lat": 45.5053461, "lng": -122.4131308},
        "hours": {
            "tuesday": "11:00 AM – 6:00 PM", "wednesday": "11:00 AM – 6:00 PM", 
            "thursday": "11:00 AM – 6:00 PM", "friday": "11:00 AM – 7:00 PM",
            "saturday": "11:00 AM – 7:00 PM", "sunday": "CLOSED", "monday": "CLOSED"
        }
    }

@app.post("/api/release-form")
async def submit_release_form(form_data: ClientForm):
    try:
        client_id = str(uuid.uuid4())
        pierce_date = datetime.now()
        downsize_date = calculate_downsize_date(form_data.piercing_type, pierce_date)
        
        client_record = {
            "client_id": client_id,
            "first_name": form_data.first_name,
            "last_name": form_data.last_name,
            "email": form_data.email,
            "phone": form_data.phone,
            "piercing_type": form_data.piercing_type,
            "jewelry_choice": form_data.jewelry_choice,
            "signature": form_data.signature,
            "id_photo": form_data.id_photo,
            "created_at": pierce_date.isoformat(),
        }
        
        pricing = get_pricing(form_data.piercing_type)
        piercing_record = {
            "record_id": str(uuid.uuid4()),
            "client_id": client_id,
            "piercing_type": form_data.piercing_type,
            "price": pricing,
            "date_pierced": pierce_date.isoformat(),
            "downsize_due_date": downsize_date.isoformat() if downsize_date else None,
        }
        
        db.clients.insert_one(client_record)
        db.piercings.insert_one(piercing_record)
        
        return {
            "success": True,
            "client_id": client_id,
            "pricing": pricing,
            "message": "Release form submitted successfully!"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jewelry-options/{piercing_type}")
async def get_jewelry_options_endpoint(piercing_type: str):
    options = get_jewelry_options(piercing_type)
    return {"piercing_type": piercing_type, "options": options}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
