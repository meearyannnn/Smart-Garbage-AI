"""
Dispatcher for garbage classification pipelines
Routes requests to appropriate inference pipeline
"""

from typing import Dict, Any
import os
import uuid
import cv2
import base64

# Import classifiers directly
from classifier.dual_yolo_infer import GarbageClassifier as DualYoloClassifier
from classifier.yolo_cnn_infer import GarbageClassifier as YoloCnnClassifier

# Load models once at module import (singleton pattern)
_dual_yolo_classifier = None
_yolo_cnn_classifier = None


def _get_dual_yolo_classifier():
    """Lazy load dual YOLO classifier"""
    global _dual_yolo_classifier
    if _dual_yolo_classifier is None:
        _dual_yolo_classifier = DualYoloClassifier()
    return _dual_yolo_classifier


def _get_yolo_cnn_classifier():
    """Lazy load YOLO+CNN classifier"""
    global _yolo_cnn_classifier
    if _yolo_cnn_classifier is None:
        _yolo_cnn_classifier = YoloCnnClassifier()
    return _yolo_cnn_classifier


def run_inference(image_path: str, mode: str = "yolo_cnn", output_dir: str = "backend/outputs") -> Dict[str, Any]:
    """
    Main inference function matching app.py API signature
    
    Args:
        image_path: Path to input image
        mode: Either "yolo_cnn" or "dual_yolo"
        output_dir: Directory to save output images
    
    Returns:
        Dictionary with:
        - mode: pipeline used
        - output_image: path to annotated image
        - detections: list of detected objects
        - total_objects: count of detections
        - error: error message if any
    """
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Validate image exists
    if not os.path.exists(image_path):
        return {
            "mode": mode,
            "error": f"Image not found: {image_path}",
            "output_image": None,
            "detections": [],
            "total_objects": 0
        }
    
    # Load image
    frame = cv2.imread(image_path)
    if frame is None:
        return {
            "mode": mode,
            "error": f"Could not read image: {image_path}",
            "output_image": None,
            "detections": [],
            "total_objects": 0
        }
    
    # Generate output path
    output_name = f"{uuid.uuid4()}.jpg"
    output_path = os.path.join(output_dir, output_name)
    
    # Route to appropriate pipeline
    if mode == "dual_yolo":
        classifier = _get_dual_yolo_classifier()
        detections = classifier.process_frame(frame)
        annotated_frame = classifier.draw_detections(frame, detections)
        
        # Format detections for dual_yolo
        formatted_detections = []
        for det in detections:
            formatted_detections.append({
                "label": det["label"],
                "confidence": round(det["confidence"], 3),
                "bbox": det["bbox"],
                "waste_type": det.get("waste_type", ""),
                "area": det.get("area", 0)
            })
    
    elif mode == "yolo_cnn":
        classifier = _get_yolo_cnn_classifier()
        detections = classifier.process_frame(frame)
        annotated_frame = classifier.draw_detections(frame, detections, show_source=False)
        
        # Format detections for yolo_cnn
        formatted_detections = []
        for det in detections:
            formatted_detections.append({
                "label": det["label"],
                "confidence": round(det["confidence"], 3),
                "bbox": det["bbox"],
                "yolo_class": det.get("yolo_class", ""),
                "yolo_conf": round(det.get("yolo_conf", 0.0), 3),
                "source": det.get("source", "YOLO"),
                "area": det.get("area", 0)
            })
    
    else:
        return {
            "mode": mode,
            "error": f"Unknown mode: {mode}. Use 'yolo_cnn' or 'dual_yolo'",
            "output_image": None,
            "detections": [],
            "total_objects": 0
        }
    
    # Save output image
    cv2.imwrite(output_path, annotated_frame)
    
    return {
        "mode": mode,
        "output_image": f"/outputs/{output_name}",
        "detections": formatted_detections,
        "total_objects": len(formatted_detections)
    }


def run_inference_frame(frame, mode: str = "yolo_cnn"):
    """
    Run inference directly on a frame (for webcam)
    Returns JSON-safe results (NO file saving required)
    
    Args:
        frame: OpenCV frame (numpy array)
        mode: Either "yolo_cnn" or "dual_yolo"
    
    Returns:
        Dictionary with:
        - mode: pipeline used
        - detections: list of detected objects
        - image_base64: base64 encoded annotated image
        - total_objects: count of detections
        - error: error message if any
    """
    if mode == "dual_yolo":
        classifier = _get_dual_yolo_classifier()
        detections = classifier.process_frame(frame)
        annotated = classifier.draw_detections(frame, detections)
    elif mode == "yolo_cnn":
        classifier = _get_yolo_cnn_classifier()
        detections = classifier.process_frame(frame)
        annotated = classifier.draw_detections(frame, detections, show_source=False)
    else:
        return {"error": "Invalid mode"}
    
    # Encode annotated frame to base64
    _, buffer = cv2.imencode(".jpg", annotated)
    img_base64 = base64.b64encode(buffer).decode("utf-8")
    
    return {
        "mode": mode,
        "detections": detections,
        "image_base64": img_base64,
        "total_objects": len(detections)
    }


def get_available_modes() -> Dict[str, str]:
    """
    Get list of available inference modes
    
    Returns:
        Dictionary mapping mode names to descriptions
    """
    return {
        "dual_yolo": "YOLO-1 detects pile + YOLO-2 classifies waste (faster, 2-stage)",
        "yolo_cnn": "YOLO detects + CNN refines classification (more accurate, hybrid)"
    }


def get_mode_info(mode: str) -> Dict[str, Any]:
    """
    Get detailed information about a specific mode
    
    Args:
        mode: Mode name ("dual_yolo" or "yolo_cnn")
    
    Returns:
        Dictionary with mode configuration and details
    """
    from classifier.dual_yolo_infer import Config as DualConfig
    from classifier.yolo_cnn_infer import Config as YoloCnnConfig
    
    if mode == "dual_yolo":
        return {
            "name": "Dual YOLO",
            "description": "Two-stage YOLO pipeline",
            "models": [
                {"name": "YOLO-1", "purpose": "Garbage pile detection"},
                {"name": "YOLO-2", "purpose": "Waste type classification"}
            ],
            "config": {
                "confidence_threshold": DualConfig.YOLO_CONF,
                "iou_threshold": DualConfig.YOLO_IOU,
                "min_crop_area": DualConfig.MIN_CROP_AREA
            },
            "material_categories": list(DualConfig.CLASS_COLORS.keys())
        }
    elif mode == "yolo_cnn":
        return {
            "name": "YOLO + CNN",
            "description": "YOLO detection with CNN refinement",
            "models": [
                {"name": "YOLO", "purpose": "Object detection"},
                {"name": "EfficientNet-B0 CNN", "purpose": "Classification refinement"}
            ],
            "config": {
                "architecture": YoloCnnConfig.ARCHITECTURE,
                "yolo_confidence": YoloCnnConfig.YOLO_CONF,
                "cnn_confidence": YoloCnnConfig.CONF_THRESHOLD,
                "min_crop_area": YoloCnnConfig.MIN_CROP_AREA
            },
            "waste_categories": YoloCnnConfig.CLASSES,
            "device": YoloCnnConfig.DEVICE
        }
    else:
        return {
            "error": f"Unknown mode: {mode}"
        }