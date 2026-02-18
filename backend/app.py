"""
FastAPI Backend for Smart Garbage Segregator
Provides endpoints for image upload detection and real-time webcam inference
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from typing import Optional, Dict, Any
from collections import Counter
import shutil
import uuid
import os
import numpy as np
import cv2
import base64
from datetime import datetime
from fastapi import Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Detection

from pathlib import Path

from backend.inference.dispatcher import (
    run_inference, 
    run_inference_frame,
    get_available_modes,
    get_mode_info
)

from backend.database import engine, SessionLocal, Base
from backend.models import Detection


# =====================
# APP SETUP
# =====================
app = FastAPI(
    title="Smart Garbage Segregator API",
    description="AI-powered waste detection and classification system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# =====================
# DIRECTORIES
# =====================
UPLOAD_DIR = Path("backend/uploads")
OUTPUT_DIR = Path("backend/outputs")

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# =====================
# CONFIGURATION
# =====================
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
VALID_MODES = ["yolo_cnn", "dual_yolo"]


# =====================
# SMART GUIDE GENERATORS
# =====================

def generate_smart_guide(waste_type: str) -> Dict[str, Any]:
    """
    Simple smart guide generator (as requested)
    
    Args:
        waste_type: Type of waste detected
        
    Returns:
        Dictionary containing basic disposal guide
    """
    guides = {
        "Plastic": {
            "bin": "Blue",
            "color": "🔵",
            "rune": "ᛒ",
            "title": "Dry Recyclable Waste",
            "subtitle": "Plastic Artefact",
            "steps": [
                "Rinse before disposal",
                "Remove food residue",
                "Do not mix with organic waste"
            ],
            "tip": "Recycling plastic reduces ocean pollution.",
            "impact": "Prevents landfill overflow and marine damage.",
            "prohibition": "Never burn plastic waste."
        },
        "Organic": {
            "bin": "Green",
            "color": "🟢",
            "rune": "ᚷ",
            "title": "Biodegradable Waste",
            "subtitle": "Organic Matter",
            "steps": [
                "Dispose within 24 hours",
                "Keep separate from plastic",
                "Ideal for composting"
            ],
            "tip": "Composting enriches soil health.",
            "impact": "Reduces methane emissions in landfills.",
            "prohibition": "Do not mix with electronic waste."
        },
        "E-Waste": {
            "bin": "Red",
            "color": "🔴",
            "rune": "ᚱ",
            "title": "Hazardous Electronic Waste",
            "subtitle": "Electronic Artefact",
            "steps": [
                "Do not break the device",
                "Keep away from moisture",
                "Send to authorized e-waste center"
            ],
            "tip": "E-waste contains toxic materials.",
            "impact": "Prevents heavy metal contamination.",
            "prohibition": "Never throw in regular dustbin."
        }
    }

    return guides.get(waste_type, {
        "bin": "Black",
        "color": "⚫",
        "rune": "ᛞ",
        "title": "General Waste",
        "subtitle": "Unknown Artefact",
        "steps": ["Dispose responsibly"],
        "tip": "Segregation improves recycling efficiency.",
        "impact": "Supports sustainable waste management.",
        "prohibition": "Avoid littering."
    })


def get_smart_disposal_guide(waste_type: str) -> Dict[str, Any]:
    """
    Comprehensive smart guide generator with detailed information
    
    Args:
        waste_type: Type of waste detected
        
    Returns:
        Dictionary containing comprehensive disposal guide
    """
    guides = {
        "Plastic": {
            "bin": "Blue",
            "color": "🔵",
            "rune": "ᛈ",
            "title": "Dry Recyclable Waste",
            "subtitle": "The Blue Vessel of Renewal",
            "steps": [
                "Rinse the plastic item thoroughly to remove residue",
                "Remove all food particles and liquids completely",
                "Separate caps and labels if possible",
                "Do not mix with organic or hazardous waste",
                "Flatten bottles to save space"
            ],
            "tip": "Recycling plastic reduces ocean pollution by 80% and saves energy equivalent to powering a home for months.",
            "impact": "Each recycled plastic bottle saves enough energy to power a laptop for 3 hours",
            "prohibition": "Never burn plastic waste - it releases toxic fumes"
        },
        "Organic": {
            "bin": "Green",
            "color": "🟢",
            "rune": "ᚷ",
            "title": "Wet Biodegradable Waste",
            "subtitle": "The Green Cauldron of Life",
            "steps": [
                "Dispose within 24 hours to prevent odor",
                "Avoid mixing with plastic, metal, or glass",
                "Remove any packaging materials",
                "Ideal for composting and biogas production",
                "Can include food scraps, leaves, and plant matter"
            ],
            "tip": "Composting organic waste creates nutrient-rich soil and reduces landfill methane emissions by 50%.",
            "impact": "Composted waste improves soil fertility and reduces need for chemical fertilizers",
            "prohibition": "Do not add meat, dairy, or cooked oils to home composting"
        },
        "E-Waste": {
            "bin": "Red",
            "color": "🔴",
            "rune": "ᛖ",
            "title": "Hazardous Electronic Waste",
            "subtitle": "The Crimson Vault of Danger",
            "steps": [
                "Do not break or disassemble the electronic item",
                "Keep dry - avoid exposure to water or moisture",
                "Remove batteries if easily accessible",
                "Send to authorized e-waste collection centers",
                "Request certificate of proper disposal"
            ],
            "tip": "E-waste contains precious metals worth billions annually, and toxic materials that contaminate soil for centuries.",
            "impact": "Proper e-waste recycling recovers gold, silver, and rare earth elements",
            "prohibition": "Never dispose e-waste in regular bins - it contains lead, mercury, and cadmium"
        },
        "Glass": {
            "bin": "Blue",
            "color": "🔵",
            "rune": "ᚷ",
            "title": "Glass & Recyclable Materials",
            "subtitle": "The Crystal Chamber of Transformation",
            "steps": [
                "Rinse glass containers to remove residue",
                "Remove metal caps and plastic labels",
                "Separate broken glass carefully in newspaper",
                "Keep different colors separated if possible",
                "Handle broken glass with extreme care"
            ],
            "tip": "Glass can be recycled infinitely without losing quality - one recycled bottle saves enough energy to power a TV for 3 hours.",
            "impact": "Recycling glass reduces air pollution by 20% and water pollution by 50%",
            "prohibition": "Never mix window glass, mirrors, or ceramics with bottle glass"
        },
        "Metal": {
            "bin": "Blue",
            "color": "🔵",
            "rune": "ᛗ",
            "title": "Metal & Metallic Waste",
            "subtitle": "The Azure Forge of Rebirth",
            "steps": [
                "Clean metal items to remove food residue",
                "Crush aluminum cans to save space",
                "Remove plastic coatings if easily separable",
                "Separate ferrous and non-ferrous if known",
                "Steel and aluminum are highly recyclable"
            ],
            "tip": "Recycling one aluminum can saves enough energy to run a laptop for 3 hours. Aluminum can be recycled indefinitely.",
            "impact": "Recycling metals reduces mining impact and saves 95% of energy compared to virgin production",
            "prohibition": "Do not include aerosol cans with residual pressure"
        },
        "Paper": {
            "bin": "Blue",
            "color": "🔵",
            "rune": "ᛈ",
            "title": "Paper & Cardboard Waste",
            "subtitle": "The Scroll Sanctuary of Renewal",
            "steps": [
                "Keep paper dry - wet paper cannot be recycled",
                "Remove plastic windows from envelopes",
                "Flatten cardboard boxes",
                "Remove tape, staples, and plastic bindings",
                "Shred sensitive documents before recycling"
            ],
            "tip": "Recycling one ton of paper saves 17 trees, 7,000 gallons of water, and prevents 60 pounds of air pollution.",
            "impact": "Paper can be recycled 5-7 times before fibers become too short",
            "prohibition": "Never recycle wax-coated, food-soiled, or tissue paper"
        },
        "Cardboard": {
            "bin": "Blue",
            "color": "🔵",
            "rune": "ᛣ",
            "title": "Cardboard & Corrugated Materials",
            "subtitle": "The Folded Archive of Rebirth",
            "steps": [
                "Remove all packing materials and tape",
                "Flatten boxes to save collection space",
                "Keep dry - moisture ruins recyclability",
                "Remove any plastic or metal attachments",
                "Break down large boxes into smaller pieces"
            ],
            "tip": "Cardboard recycling saves 46 gallons of oil per ton and is one of the most recycled materials globally.",
            "impact": "Recycled cardboard reduces greenhouse gas emissions by 25%",
            "prohibition": "Do not recycle grease-stained pizza boxes or wax-coated boxes"
        },
        "Hazardous": {
            "bin": "Red",
            "color": "🔴",
            "rune": "ᚺ",
            "title": "Hazardous & Toxic Waste",
            "subtitle": "The Sealed Vault of Peril",
            "steps": [
                "Keep in original container if possible",
                "Never mix different hazardous materials",
                "Store in cool, dry, well-ventilated area",
                "Contact local hazardous waste facility",
                "Bring to designated collection events"
            ],
            "tip": "Improper disposal of hazardous waste can contaminate water supplies for entire communities for decades.",
            "impact": "One gallon of used motor oil can contaminate one million gallons of water",
            "prohibition": "Never pour down drains, toilets, or storm sewers"
        },
        "Textile": {
            "bin": "Yellow",
            "color": "🟡",
            "rune": "ᛏ",
            "title": "Textile & Fabric Waste",
            "subtitle": "The Golden Weave of Restoration",
            "steps": [
                "Donate wearable clothes to charities",
                "Use textile recycling bins for damaged items",
                "Separate natural and synthetic fibers if possible",
                "Remove buttons, zippers before recycling",
                "Consider upcycling into cleaning rags"
            ],
            "tip": "85% of textiles end up in landfills. Recycling textiles saves water, reduces pollution, and creates jobs.",
            "impact": "Recycling one ton of textiles saves 20 tons of CO2 emissions",
            "prohibition": "Do not recycle heavily soiled or moldy fabrics"
        },
        "Battery": {
            "bin": "Red",
            "color": "🔴",
            "rune": "ᛒ",
            "title": "Batteries & Power Cells",
            "subtitle": "The Charged Chamber of Containment",
            "steps": [
                "Tape battery terminals to prevent short circuits",
                "Never throw in regular trash",
                "Separate by battery type if known",
                "Bring to designated battery recycling locations",
                "Store in cool, dry place until disposal"
            ],
            "tip": "Batteries contain toxic heavy metals that leach into soil. One battery can contaminate 600,000 liters of water.",
            "impact": "Recycling recovers valuable materials like cobalt, nickel, and lithium",
            "prohibition": "Never incinerate or puncture batteries - risk of explosion and toxic gas"
        }
    }
    
    # Default guide for unknown waste types
    default_guide = {
        "bin": "Black",
        "color": "⚫",
        "rune": "ᛟ",
        "title": "General Mixed Waste",
        "subtitle": "The Dark Repository of Last Resort",
        "steps": [
            "If unsure, place in general waste bin",
            "Check local waste management guidelines",
            "Consider contacting waste facility for guidance",
            "Avoid contaminating recyclable streams",
            "When in doubt, choose general waste over recycling"
        ],
        "tip": "Segregating waste properly improves recycling efficiency by up to 70% and reduces environmental impact.",
        "impact": "Every small effort in proper segregation counts toward a cleaner planet",
        "prohibition": "Do not assume all waste is recyclable - check local guidelines"
    }
    
    return guides.get(waste_type, default_guide)


# =====================
# HELPER FUNCTIONS
# =====================
def validate_image_file(file: UploadFile) -> None:
    """Validate uploaded image file"""
    # Check extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check content type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File must be an image"
        )


def validate_mode(mode: str) -> None:
    """Validate inference mode"""
    if mode not in VALID_MODES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid mode. Must be one of: {', '.join(VALID_MODES)}"
        )


def extract_primary_waste_type(detections: list, mode: str) -> str:
    """
    Extract primary waste type from detections
    
    Args:
        detections: List of detection results
        mode: Detection mode (yolo_cnn or dual_yolo)
        
    Returns:
        Primary waste type string
    """
    if not detections or len(detections) == 0:
        return "unknown"
    
    # For single object mode, use the first detection
    if mode == "yolo_cnn":
        return detections[0].get("waste_type") or detections[0].get("label", "unknown")
    
    # For pile mode, use most common detection
    labels = [det.get("waste_type") or det.get("label", "unknown") for det in detections]
    most_common = Counter(labels).most_common(1)
    return most_common[0][0] if most_common else "unknown"


# =====================
# ROUTES
# =====================

@app.get("/")
def root():
    """API health check"""
    return {
        "status": "online",
        "service": "Smart Garbage Segregator API",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "uploads_dir": str(UPLOAD_DIR),
        "outputs_dir": str(OUTPUT_DIR),
        "available_modes": VALID_MODES
    }


@app.get("/modes")
def list_modes():
    """Get available inference modes"""
    return {
        "modes": get_available_modes()
    }


@app.get("/modes/{mode}")
def mode_details(mode: str):
    """Get detailed information about a specific mode"""
    validate_mode(mode)
    return get_mode_info(mode)


@app.post("/detect")
async def detect_waste(
    file: UploadFile = File(..., description="Image file to analyze"),
    mode: str = Form("yolo_cnn", description="Inference mode: yolo_cnn or dual_yolo")
):
    """
    Upload an image and run waste detection inference
    
    Args:
        file: Image file (jpg, png, etc.)
        mode: Inference pipeline to use (yolo_cnn or dual_yolo)
    
    Returns:
        JSON with detections, output image path, and smart disposal guide
    """
    
    # Validate inputs
    validate_mode(mode)
    validate_image_file(file)
    
    # Generate unique filename
    file_id = uuid.uuid4().hex[:12]
    file_ext = Path(file.filename).suffix
    input_filename = f"{file_id}{file_ext}"
    input_path = UPLOAD_DIR / input_filename
    
    # Save uploaded file
    try:
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save uploaded file: {str(e)}"
        )
    
    # Run inference
    try:
        result = run_inference(
            image_path=str(input_path),
            mode=mode,
            output_dir=str(OUTPUT_DIR)
        )
        
        # Check for errors in result
        if "error" in result:
            raise HTTPException(
                status_code=500,
                detail=result["error"]
            )
        
        # Extract primary waste type
        primary_waste_type = extract_primary_waste_type(result["detections"], mode)
        
        # Get smart disposal guide (using simple generator)
        smart_guide = generate_smart_guide(primary_waste_type)
        
        # Alternative: Use comprehensive guide
        # smart_guide = get_smart_disposal_guide(primary_waste_type)
        
        return {
            "success": True,
            "mode": result["mode"],
            "detections": result["detections"],
            "total_objects": result["total_objects"],
            "output_image": result["output_image"],
            "input_file": input_filename,
            "waste_type": primary_waste_type,
            "smart_guide": smart_guide
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inference failed: {str(e)}"
        )
    finally:
        # Optional: Clean up uploaded file
        # input_path.unlink(missing_ok=True)
        pass


@app.post("/detect-frame")
async def detect_frame(
    file: UploadFile = File(..., description="Image frame from webcam"),
    mode: str = Form("yolo_cnn", description="Inference mode: yolo_cnn or dual_yolo")
):
    """
    Process a single frame for real-time detection (webcam/video)
    
    Args:
        file: Image frame as file upload
        mode: Inference pipeline to use
    
    Returns:
        JSON with detections, base64 encoded annotated image, and smart disposal guide
    """
    
    # Validate mode
    validate_mode(mode)
    
    # Read and decode image
    try:
        image_bytes = await file.read()
        np_img = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(
                status_code=400,
                detail="Failed to decode image. Invalid image data."
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error reading image: {str(e)}"
        )
    
    # Run inference
    try:
        result = run_inference_frame(frame, mode)
        
        # Check for errors
        if "error" in result:
            raise HTTPException(
                status_code=500,
                detail=result["error"]
            )
        
        # Extract primary waste type
        primary_waste_type = extract_primary_waste_type(result["detections"], mode)
        
        # Get smart disposal guide
        smart_guide = generate_smart_guide(primary_waste_type)
        
        return {
            "success": True,
            "mode": result["mode"],
            "detections": result["detections"],
            "total_objects": result["total_objects"],
            "image_base64": result["image_base64"],
            "waste_type": primary_waste_type,
            "smart_guide": smart_guide
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Frame inference failed: {str(e)}"
        )


@app.post("/detect-base64")
async def detect_base64(
    image_data: str = Form(..., description="Base64 encoded image"),
    mode: str = Form("yolo_cnn", description="Inference mode")
):
    """
    Process base64 encoded image (alternative to file upload)
    
    Args:
        image_data: Base64 encoded image string
        mode: Inference pipeline to use
    
    Returns:
        JSON with detections, base64 encoded annotated image, and smart disposal guide
    """
    
    # Validate mode
    validate_mode(mode)
    
    # Decode base64 image
    try:
        # Remove data URL prefix if present
        if "base64," in image_data:
            image_data = image_data.split("base64,")[1]
        
        image_bytes = base64.b64decode(image_data)
        np_img = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(
                status_code=400,
                detail="Failed to decode base64 image"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid base64 image data: {str(e)}"
        )
    
    # Run inference
    try:
        result = run_inference_frame(frame, mode)
        
        if "error" in result:
            raise HTTPException(
                status_code=500,
                detail=result["error"]
            )
        
        # Extract primary waste type
        primary_waste_type = extract_primary_waste_type(result["detections"], mode)
        
        # Get smart disposal guide
        smart_guide = generate_smart_guide(primary_waste_type)
        
        return {
            "success": True,
            "mode": result["mode"],
            "detections": result["detections"],
            "total_objects": result["total_objects"],
            "image_base64": result["image_base64"],
            "waste_type": primary_waste_type,
            "smart_guide": smart_guide
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Base64 inference failed: {str(e)}"
        )


@app.get("/disposal-guide/{waste_type}")
def get_disposal_guide(waste_type: str):
    """
    Get disposal guide for a specific waste type
    
    Args:
        waste_type: Type of waste (Plastic, Organic, E-Waste, etc.)
        
    Returns:
        Disposal guide with bin info, steps, and tips
    """
    # Use comprehensive guide for standalone requests
    guide = get_smart_disposal_guide(waste_type)
    return {
        "waste_type": waste_type,
        "guide": guide
    }


@app.post("/save-detection")
def save_detection(data: dict = Body(...)):
    """
    Save detection results to database
    
    Args:
        data: Dictionary containing:
            - wasteType: Type of waste detected
            - count: Number of items detected
            - confidence: Detection confidence score
            - mode: Inference mode used
            - lat: Latitude coordinate
            - lng: Longitude coordinate
    
    Returns:
        Success message
    """
    db = SessionLocal()
    
    try:
        detection = Detection(
            waste_type=data["wasteType"],
            count=data["count"],
            confidence=data["confidence"],
            mode=data["mode"],
            latitude=data["lat"],
            longitude=data["lng"],
            timestamp=datetime.utcnow()
        )
        
        db.add(detection)
        db.commit()
        db.refresh(detection)
        
        return {
            "success": True,
            "message": "Detection saved successfully",
            "detection_id": detection.id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save detection: {str(e)}"
        )
    finally:
        db.close()


@app.get("/detections")
def get_detections():
    """Get all detections from database"""
    db = SessionLocal()
    detections = db.query(Detection).all()
    db.close()

    return [
        {
            "id": d.id,
            "wasteType": d.waste_type,
            "count": d.count,
            "confidence": d.confidence,
            "mode": d.mode,
            "lat": d.latitude,
            "lng": d.longitude,
            "timestamp": d.timestamp
        }
        for d in detections
    ]


@app.delete("/clear-detections")
def clear_detections(db: Session = Depends(get_db)):
    """Clear all detections from database"""
    db.query(Detection).delete()
    db.commit()
    return {"message": "All detections cleared"}


@app.delete("/outputs/{filename}")
async def delete_output(filename: str):
    """Delete an output file"""
    file_path = OUTPUT_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )
    
    try:
        file_path.unlink()
        return {
            "success": True,
            "message": f"Deleted {filename}"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete file: {str(e)}"
        )


# =====================
# STATIC FILE SERVING
# =====================
app.mount(
    "/outputs",
    StaticFiles(directory=str(OUTPUT_DIR)),
    name="outputs"
)


# =====================
# ERROR HANDLERS
# =====================
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Catch-all exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc)
        }
    )


# =====================
# STARTUP/SHUTDOWN
# =====================
@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    print("🚀 Smart Garbage Segregator API starting...")
    print(f"📁 Upload directory: {UPLOAD_DIR}")
    print(f"📁 Output directory: {OUTPUT_DIR}")
    print(f"🔧 Available modes: {', '.join(VALID_MODES)}")
    print("🗄️  Database tables created/verified")
    print("♻️  Smart disposal guide system active")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("👋 Smart Garbage Segregator API shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )