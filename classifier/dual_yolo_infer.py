import cv2
import numpy as np
from ultralytics import YOLO
import os
from pathlib import Path

# =====================
# CONFIGURATION
# =====================
class Config:
    """Configuration settings for the garbage segregator"""
    # Models
    YOLO_PILE_MODEL = "models/garbage_pile_best.pt"   # YOLO-1: Detects garbage piles
    YOLO_WASTE_MODEL = "models/waste_yolo_best.pt"    # YOLO-2: Classifies waste types
    
    # Detection thresholds
    YOLO_CONF = 0.25
    YOLO_IOU = 0.45
    MIN_CROP_AREA = 200
    
    DEBUG_MODE = False
    
    # Color coding for different waste types (BGR format)
    CLASS_COLORS = {
        "plastic": (0, 255, 255),      # Yellow
        "paper": (255, 200, 100),      # Light Blue
        "cardboard": (0, 165, 255),    # Orange
        "metal": (128, 128, 128),      # Gray
        "glass": (255, 255, 0),        # Cyan
        "organic": (0, 255, 0),        # Green
        "unknown": (255, 255, 255)     # White
    }
    
    # 🔑 MATERIAL MAPPING (CRITICAL)
    # Maps YOLO-2 detected classes to material categories
    MATERIAL_MAP = {
        "plastic_bottle": "plastic",
        "plastic_bag": "plastic",
        "plastic_container": "plastic",
        "plastic_sachet": "plastic",
        "food_wrapper": "plastic",
        "paper": "paper",
        "cardboard": "cardboard",
        "aluminum": "metal",
        "glass_bottle": "glass",
        "left_over_food": "organic"
    }

# =====================
# MODEL LOADER
# =====================
class ModelLoader:
    """Handles loading of YOLO models"""
    
    @staticmethod
    def load_yolo_models(config):
        """Load both YOLO models (pile detection + waste classification)"""
        try:
            pile_model = YOLO(config.YOLO_PILE_MODEL)
            waste_model = YOLO(config.YOLO_WASTE_MODEL)
            
            print("✓ YOLO-1 (Pile Detection) loaded")
            print("✓ YOLO-2 (Waste Classification) loaded")
            print(f"✓ YOLO-2 classes: {list(waste_model.names.values())}")
            
            return pile_model, waste_model
        except Exception as e:
            print(f"❌ Error loading YOLO models: {e}")
            raise

# =====================
# GARBAGE CLASSIFIER
# =====================
class GarbageClassifier:
    """Main classifier for garbage segregation using dual YOLO approach"""
    
    def __init__(self, config=None):
        self.config = config or Config()
        self.pile_yolo, self.waste_yolo = ModelLoader.load_yolo_models(self.config)
    
    def detect_pile(self, frame):
        """
        Step 1: Detect garbage pile using YOLO-1
        Returns the bounding box of the largest detected pile
        """
        results = self.pile_yolo(
            frame,
            conf=0.4,  # Higher confidence for pile detection
            iou=0.5,
            verbose=False
        )[0]
        
        if len(results.boxes) == 0:
            if self.config.DEBUG_MODE:
                print("⚠ No garbage pile detected")
            return None
        
        # Take the largest pile (by area)
        box = max(
            results.boxes,
            key=lambda b: (b.xyxy[0][2] - b.xyxy[0][0]) * 
                         (b.xyxy[0][3] - b.xyxy[0][1])
        )
        
        return tuple(map(int, box.xyxy[0]))
    
    def process_frame(self, frame):
        """
        Process a single frame with dual YOLO approach:
        1. Detect pile with YOLO-1
        2. Crop to pile region
        3. Detect individual waste items with YOLO-2
        4. Map detections to material categories
        """
        
        # Step 1: Detect pile
        pile_box = self.detect_pile(frame)
        if pile_box is None:
            return []
        
        x1, y1, x2, y2 = pile_box
        pile_crop = frame[y1:y2, x1:x2]
        
        if self.config.DEBUG_MODE:
            print(f"🔍 Pile detected: {x2-x1}x{y2-y1}px")
        
        # Step 2: Detect waste items within pile
        results = self.waste_yolo(
            pile_crop,
            conf=self.config.YOLO_CONF,
            iou=self.config.YOLO_IOU,
            verbose=False
        )[0]
        
        if self.config.DEBUG_MODE:
            print(f"🔍 YOLO-2 detected {len(results.boxes)} objects in pile")
        
        detections = []
        
        for box in results.boxes:
            cls_id = int(box.cls[0])
            cls_name = self.waste_yolo.names[cls_id]
            conf = float(box.conf[0])
            
            # Map to material category
            material = self.config.MATERIAL_MAP.get(cls_name, "unknown")
            
            # Get bbox coordinates (relative to pile crop)
            bx1, by1, bx2, by2 = map(int, box.xyxy[0])
            area = (bx2 - bx1) * (by2 - by1)
            
            # Filter small detections
            if area < self.config.MIN_CROP_AREA:
                if self.config.DEBUG_MODE:
                    print(f"   ⏭️  Skipped: {cls_name} (area {area} < {self.config.MIN_CROP_AREA})")
                continue
            
            # Convert coordinates back to original frame
            detections.append({
                "bbox": (bx1 + x1, by1 + y1, bx2 + x1, by2 + y1),
                "label": material,
                "confidence": conf,
                "waste_type": cls_name,  # Original YOLO class
                "area": area
            })
            
            if self.config.DEBUG_MODE:
                print(f"   ✅ {cls_name} → {material} (conf={conf:.2f}, area={area}px)")
        
        return detections
    
    def draw_detections(self, frame, detections):
        """Draw bounding boxes and labels on frame"""
        annotated_frame = frame.copy()
        
        for det in detections:
            x1, y1, x2, y2 = det['bbox']
            label = det['label']
            conf = det['confidence']
            waste_type = det.get('waste_type', '')
            
            # Get color for the material type
            color = self.config.CLASS_COLORS.get(label, (255, 255, 255))
            
            # Draw bounding box
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 3)
            
            # Prepare text with material category
            text = f"{label.upper()} {conf*100:.1f}%"
            
            # Draw background for text
            (text_w, text_h), _ = cv2.getTextSize(
                text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2
            )
            cv2.rectangle(
                annotated_frame,
                (x1, y1 - text_h - 10),
                (x1 + text_w, y1),
                color,
                -1
            )
            
            # Draw text
            cv2.putText(
                annotated_frame, text, (x1, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                (0, 0, 0), 2
            )
        
        return annotated_frame

# =====================
# APPLICATION MODES
# =====================
class GarbageSegregatorApp:
    """Application wrapper for different modes"""
    
    def __init__(self):
        self.classifier = GarbageClassifier()
        print(f"\n🏗️  Architecture: DUAL YOLO")
        print("   → YOLO-1 detects pile + YOLO-2 classifies waste")
        print(f"   → Min object area: {Config.MIN_CROP_AREA}px")
        print(f"   → Confidence threshold: {Config.YOLO_CONF}")
    
    def run_image(self, img_path, save_output=None):
        """Process a single image"""
        if not os.path.exists(img_path):
            print(f"❌ Image not found: {img_path}")
            return None
        
        frame = cv2.imread(img_path)
        if frame is None:
            print(f"❌ Could not read image: {img_path}")
            return None
        
        print(f"\n📸 Processing image: {img_path}")
        
        # Process frame
        detections = self.classifier.process_frame(frame)
        annotated_frame = self.classifier.draw_detections(frame, detections)
        
        # Print detection summary
        if len(detections) == 0:
            print("\n⚠️  Detected 0 waste items")
            print("   Possible reasons:")
            print("   - No garbage pile detected by YOLO-1")
            print("   - No objects detected by YOLO-2 within pile")
            print("   - All objects smaller than MIN_CROP_AREA")
        else:
            print(f"\n🗑️  Detected {len(detections)} waste items:")
            
            # Group by material
            material_counts = {}
            for det in detections:
                material = det['label']
                material_counts[material] = material_counts.get(material, 0) + 1
            
            for i, det in enumerate(detections, 1):
                print(f"  {i}. {det['label'].upper()} ({det['confidence']*100:.1f}%) "
                      f"[Type: {det['waste_type']}] area={det['area']}px")
            
            print(f"\n📊 Material Summary:")
            for material, count in sorted(material_counts.items()):
                print(f"   {material.upper()}: {count}")
        
        # Save output if requested
        if save_output:
            cv2.imwrite(save_output, annotated_frame)
            print(f"\n💾 Saved result to: {save_output}")
        
        # Display
        cv2.imshow("Smart Garbage Segregator", annotated_frame)
        print("\nPress any key to close the window...")
        cv2.waitKey(0)
        cv2.destroyAllWindows()
        
        return annotated_frame
    
    def run_webcam(self, camera_id=0):
        """Run real-time classification from webcam"""
        cap = cv2.VideoCapture(camera_id)
        
        if not cap.isOpened():
            print(f"❌ Could not access camera {camera_id}")
            return
        
        print("\n📹 Starting webcam mode...")
        print("Controls:")
        print("  'q' - Quit")
        print("  's' - Save screenshot")
        print("  'd' - Toggle debug info")
        
        frame_count = 0
        show_debug = False
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("⚠ Failed to read frame")
                break
            
            # Process frame
            detections = self.classifier.process_frame(frame)
            annotated_frame = self.classifier.draw_detections(frame, detections)
            
            # Count materials
            material_counts = {}
            for det in detections:
                material = det['label']
                material_counts[material] = material_counts.get(material, 0) + 1
            
            # Add frame info
            info_text = f"Objects: {len(detections)} | Conf={Config.YOLO_CONF} | 'q'=quit 's'=save 'd'=debug"
            cv2.putText(
                annotated_frame, info_text, (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                (255, 255, 255), 2
            )
            
            # Show material counts if debug enabled
            if show_debug and material_counts:
                y_offset = 60
                for material, count in sorted(material_counts.items()):
                    debug_text = f"{material}: {count}"
                    cv2.putText(
                        annotated_frame, debug_text, (10, y_offset),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                        (255, 255, 255), 1
                    )
                    y_offset += 25
            
            cv2.imshow("Smart Garbage Segregator - Webcam", annotated_frame)
            
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q'):
                break
            elif key == ord('s'):
                filename = f"garbage_detection_{frame_count}.jpg"
                cv2.imwrite(filename, annotated_frame)
                print(f"📸 Screenshot saved: {filename}")
                frame_count += 1
            elif key == ord('d'):
                show_debug = not show_debug
                print(f"🐛 Debug info: {'ON' if show_debug else 'OFF'}")
        
        cap.release()
        cv2.destroyAllWindows()
        print("👋 Webcam mode closed")
    
    def run_batch(self, input_dir, output_dir=None):
        """Process multiple images from a directory"""
        input_path = Path(input_dir)
        
        if not input_path.exists():
            print(f"❌ Directory not found: {input_dir}")
            return
        
        # Get all image files
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
        image_files = [
            f for f in input_path.iterdir() 
            if f.suffix.lower() in image_extensions
        ]
        
        if not image_files:
            print(f"❌ No images found in: {input_dir}")
            return
        
        # Create output directory if needed
        if output_dir:
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
        
        print(f"\n📁 Processing {len(image_files)} images from {input_dir}")
        print(f"🏗️  Using: DUAL YOLO architecture\n")
        
        total_detections = 0
        material_totals = {}
        
        for i, img_file in enumerate(image_files, 1):
            print(f"\n{'='*60}")
            print(f"[{i}/{len(image_files)}] Processing: {img_file.name}")
            print('='*60)
            
            save_path = None
            if output_dir:
                save_path = str(output_path / f"detected_{img_file.name}")
            
            result = self.run_image(str(img_file), save_output=save_path)
            
            if result is not None:
                detections = self.classifier.process_frame(cv2.imread(str(img_file)))
                total_detections += len(detections)
                
                # Accumulate material counts
                for det in detections:
                    material = det['label']
                    material_totals[material] = material_totals.get(material, 0) + 1
            
            cv2.destroyAllWindows()
        
        print(f"\n{'='*60}")
        print(f"✅ BATCH PROCESSING COMPLETE!")
        print(f"{'='*60}")
        print(f"📊 Total images processed: {len(image_files)}")
        print(f"📊 Total objects detected: {total_detections}")
        print(f"📊 Average per image: {total_detections/len(image_files):.1f}")
        print(f"\n📊 Material Distribution:")
        for material, count in sorted(material_totals.items()):
            percentage = (count / total_detections * 100) if total_detections > 0 else 0
            print(f"   {material.upper()}: {count} ({percentage:.1f}%)")
        if output_dir:
            print(f"\n💾 Results saved to: {output_dir}")

# =====================
# BACKEND-SAFE FUNCTION
# =====================
def run_dual_yolo(image_path: str, output_dir: str):
    """
    Backend-safe DUAL YOLO inference
    Returns detections + output image path
    """
    
    app = GarbageSegregatorApp()
    
    output_path = os.path.join(
        output_dir,
        f"dual_yolo_{os.path.basename(image_path)}"
    )
    
    # Load and process image
    if not os.path.exists(image_path):
        return {"error": f"Image not found: {image_path}"}
    
    frame = cv2.imread(image_path)
    if frame is None:
        return {"error": f"Could not read image: {image_path}"}
    
    # Process frame
    detections = app.classifier.process_frame(frame)
    annotated_frame = app.classifier.draw_detections(frame, detections)
    
    # Save output
    cv2.imwrite(output_path, annotated_frame)
    
    # Convert detections to JSON-safe format
    formatted = []
    for det in detections:
        formatted.append({
            "label": det["label"],
            "confidence": round(det["confidence"], 3),
            "bbox": det["bbox"]
        })
    
    return {
        "detections": formatted,
        "output_image": output_path
    }

# =====================
# MAIN
# =====================
def main():
    """Main application entry point"""
    print("=" * 60)
    print("🗑️  SMART GARBAGE SEGREGATOR v3.0 - DUAL YOLO")
    print("=" * 60)
    print("\n🏗️  Architecture: DUAL YOLO")
    print("   → YOLO-1: Detects garbage piles")
    print("   → YOLO-2: Classifies individual waste items")
    print("   → No CNN required - pure YOLO pipeline")
    print("=" * 60)
    print("\nSelect Mode:")
    print("1 → Webcam (Real-time)")
    print("2 → Single Image")
    print("3 → Batch Processing (Directory)")
    print("=" * 60)
    
    choice = input("\nChoose mode (1-3): ").strip()
    
    app = GarbageSegregatorApp()
    
    if choice == "1":
        app.run_webcam()
    
    elif choice == "2":
        img_path = input("Enter image path: ").strip()
        save_output = input("Save output? (y/n): ").strip().lower()
        
        if save_output == 'y':
            output_path = input("Enter output path (or press Enter for auto): ").strip()
            if not output_path:
                output_path = f"detected_{Path(img_path).name}"
            app.run_image(img_path, save_output=output_path)
        else:
            app.run_image(img_path)
    
    elif choice == "3":
        input_dir = input("Enter input directory: ").strip()
        output_dir = input("Enter output directory (or press Enter to skip saving): ").strip()
        
        if not output_dir:
            output_dir = None
        
        app.run_batch(input_dir, output_dir)
    
    else:
        print("❌ Invalid choice")

if __name__ == "__main__":
    main()