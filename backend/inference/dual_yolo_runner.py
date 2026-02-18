from classifier.dual_yolo_infer import GarbageClassifier, Config
import cv2
import os
import uuid

# Load models once at module import (singleton pattern)
_classifier = GarbageClassifier()

def run_dual_yolo(image_path: str):
    """
    Backend-safe DUAL YOLO inference
    No interactive UI elements - returns structured data
    """
    os.makedirs("backend/inference/outputs", exist_ok=True)

    output_name = f"{uuid.uuid4()}.jpg"
    output_path = os.path.join("backend/inference/outputs", output_name)

    # Validate image exists
    if not os.path.exists(image_path):
        return {
            "pipeline": "dual_yolo",
            "error": f"Image not found: {image_path}",
            "output_image": None,
            "detections": []
        }

    # Load image
    frame = cv2.imread(image_path)
    if frame is None:
        return {
            "pipeline": "dual_yolo",
            "error": f"Could not read image: {image_path}",
            "output_image": None,
            "detections": []
        }

    # Process frame (no UI)
    detections = _classifier.process_frame(frame)
    annotated_frame = _classifier.draw_detections(frame, detections)

    # Save output
    cv2.imwrite(output_path, annotated_frame)

    # Convert detections to JSON-safe format
    formatted_detections = []
    for det in detections:
        formatted_detections.append({
            "label": det["label"],
            "confidence": round(det["confidence"], 3),
            "bbox": det["bbox"],
            "waste_type": det.get("waste_type", ""),
            "area": det.get("area", 0)
        })

    return {
        "pipeline": "dual_yolo",
        "output_image": output_path,
        "detections": formatted_detections,
        "total_objects": len(formatted_detections)
    }