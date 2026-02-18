from classifier.yolo_cnn_infer import GarbageClassifier, Config
import cv2
import os
import uuid

# Load models once at module import (singleton pattern)
_classifier = GarbageClassifier()

def run_yolo_cnn(image_path: str):
    """
    Backend-safe YOLO + CNN inference
    No interactive UI elements - returns structured data
    """
    os.makedirs("backend/inference/outputs", exist_ok=True)

    output_name = f"{uuid.uuid4()}.jpg"
    output_path = os.path.join("backend/inference/outputs", output_name)

    # Validate image exists
    if not os.path.exists(image_path):
        return {
            "pipeline": "yolo_cnn",
            "error": f"Image not found: {image_path}",
            "output_image": None,
            "detections": []
        }

    # Load image
    frame = cv2.imread(image_path)
    if frame is None:
        return {
            "pipeline": "yolo_cnn",
            "error": f"Could not read image: {image_path}",
            "output_image": None,
            "detections": []
        }

    # Process frame (no UI)
    detections = _classifier.process_frame(frame)
    annotated_frame = _classifier.draw_detections(frame, detections, show_source=False)

    # Save output
    cv2.imwrite(output_path, annotated_frame)

    # Convert detections to JSON-safe format
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

    return {
        "pipeline": "yolo_cnn",
        "output_image": output_path,
        "detections": formatted_detections,
        "total_objects": len(formatted_detections)
    }