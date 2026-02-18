import cv2
import torch
import torch.nn as nn
import numpy as np
from PIL import Image
from torchvision import transforms
import timm
from ultralytics import YOLO
import os
from pathlib import Path

# =====================
# CONFIGURATION
# =====================
class Config:
    """Configuration settings for the garbage segregator"""
    CNN_MODEL_PATH = "classifier/garbage_model.pth"
    YOLO_MODEL_PATH = "models/garbage_pile_best.pt"
    
    IMG_SIZE = 224
    CONF_THRESHOLD = 0.60
    EWASTE_THRESHOLD = 0.85
    
    # ✅ FIX 4: LOWERED FROM 800 → 200 (accept smaller objects)
    MIN_CROP_AREA = 200
    
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    
    # Waste categories (shared by both YOLO and CNN)
    CLASSES = [
        "cardboard",
        "e_waste",
        "glass",
        "metal",
        "organic",
        "paper",
        "plastic"
    ]
    
    # ⚠️ CRITICAL FIX: Use garbage classes, not COCO classes!
    # These match your custom YOLO training
    ALLOWED_YOLO_CLASSES = {"garbage"}

    # Color coding for different waste types (BGR format)
    CLASS_COLORS = {
        "cardboard": (0, 165, 255),    # Orange
        "e_waste": (0, 0, 255),         # Red
        "glass": (255, 255, 0),         # Cyan
        "metal": (128, 128, 128),       # Gray
        "organic": (0, 255, 0),         # Green
        "paper": (255, 200, 100),       # Light Blue
        "plastic": (0, 255, 255),       # Yellow
        "mixed": (255, 255, 255)        # White
    }
    
    # =====================
    # ARCHITECTURE CHOICE
    # =====================
    # Option 1: "yolo_only" - Use only YOLO predictions (faster)
    # Option 2: "yolo_cnn" - Use YOLO for detection + CNN for refinement (more accurate)
    
    ARCHITECTURE = "yolo_cnn"  # Change to "yolo_only" if you want faster processing
    
    # =====================
    # YOLO SETTINGS (NEW!)
    # =====================
    # ✅ FIX 1: LOWERED YOLO CONFIDENCE THRESHOLD
    YOLO_CONF = 0.10  # Was defaulting to ~0.25, now much lower
    YOLO_IOU = 0.4    # NMS threshold
    
    # ✅ FIX 2: TEMPORARY DEBUG MODE
    ENABLE_CLASS_FILTERING = False  # Set to True to re-enable filtering
    DEBUG_MODE = True  # Shows raw YOLO detections

# =====================
# MODEL LOADER
# =====================
class ModelLoader:
    """Handles loading of CNN and YOLO models"""
    
    @staticmethod
    def load_cnn(config):
        """Load the CNN classifier model"""
        try:
            cnn = timm.create_model("efficientnet_b0", pretrained=False)
            cnn.classifier = nn.Linear(cnn.classifier.in_features, len(config.CLASSES))
            cnn.load_state_dict(torch.load(config.CNN_MODEL_PATH, map_location=config.DEVICE))
            cnn.to(config.DEVICE)
            cnn.eval()
            print(f"✓ CNN model loaded successfully on {config.DEVICE}")
            return cnn
        except Exception as e:
            print(f"❌ Error loading CNN model: {e}")
            raise
    
    @staticmethod
    def load_yolo(config):
        """Load the YOLO detection model"""
        try:
            yolo = YOLO(config.YOLO_MODEL_PATH)
            print(f"✓ YOLO model loaded successfully")
            
            # Verify YOLO classes
            print(f"✓ YOLO model classes: {list(yolo.names.values())}")
            
            return yolo
        except Exception as e:
            print(f"❌ Error loading YOLO model: {e}")
            raise

# =====================
# GARBAGE CLASSIFIER
# =====================
class GarbageClassifier:
    """Main classifier for garbage segregation"""
    
    def __init__(self, config=None):
        self.config = config or Config()
        
        # Always load YOLO
        self.yolo = ModelLoader.load_yolo(self.config)
        
        # Only load CNN if using yolo_cnn architecture
        if self.config.ARCHITECTURE == "yolo_cnn":
            self.cnn = ModelLoader.load_cnn(self.config)
            self.transform = transforms.Compose([
                transforms.Resize((self.config.IMG_SIZE, self.config.IMG_SIZE)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])
        else:
            self.cnn = None
            print("ℹ️  Using YOLO-only mode (faster, no CNN refinement)")
    
    def classify_crop(self, crop_bgr):
        """Classify a cropped image region using CNN"""
        try:
            crop_rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
            img = Image.fromarray(crop_rgb)
            
            x = self.transform(img).unsqueeze(0).to(self.config.DEVICE)
            
            with torch.no_grad():
                logits = self.cnn(x)
                probs = torch.softmax(logits, dim=1)[0].cpu().numpy()
            
            idx = np.argmax(probs)
            conf = float(probs[idx])
            label = self.config.CLASSES[idx]
            
            # Hard rule for e-waste
            if label == "e_waste" and conf < self.config.EWASTE_THRESHOLD:
                return "mixed", conf
            
            if conf < self.config.CONF_THRESHOLD:
                return "mixed", conf
            
            return label, conf
        
        except Exception as e:
            print(f"⚠ Classification error: {e}")
            return "mixed", 0.0
    
    def process_frame(self, frame):
        """Process a single frame with YOLO (+ optional CNN)"""
        
        # ✅ FIX 1: LOWERED YOLO CONFIDENCE THRESHOLD
        results = self.yolo(
            frame,
            conf=self.config.YOLO_CONF,  # Now 0.10 instead of default ~0.25
            iou=self.config.YOLO_IOU,
            verbose=False
        )[0]
        
        # ✅ FIX 3: DEBUG OUTPUT - Show raw YOLO detections
        if self.config.DEBUG_MODE:
            if len(results.boxes) == 0:
                print("⚠ YOLO produced ZERO boxes")
            else:
                print(f"\n🔍 YOLO raw detections ({len(results.boxes)} boxes):")
                for i, box in enumerate(results.boxes, 1):
                    yolo_cls_id = int(box.cls[0])
                    yolo_cls_name = self.yolo.names[yolo_cls_id]
                    yolo_conf = float(box.conf[0])
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    area = (x2-x1) * (y2-y1)
                    print(f"   {i}. {yolo_cls_name:12s} conf={yolo_conf:.3f} area={area:6d}px")
        
        detections = []
        
        for box in results.boxes:
            yolo_cls_id = int(box.cls[0])
            yolo_cls_name = self.yolo.names[yolo_cls_id]
            yolo_conf = float(box.conf[0])
            
            # ✅ FIX 2: TEMPORARILY DISABLED CLASS FILTERING
            # This allows YOLO to detect anything, then CNN decides
            if self.config.ENABLE_CLASS_FILTERING:
                if yolo_cls_name not in self.config.ALLOWED_YOLO_CLASSES:
                    if self.config.DEBUG_MODE:
                        print(f"   ⏭️  Skipped: {yolo_cls_name} (not in allowed classes)")
                    continue
            
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            crop = frame[y1:y2, x1:x2]
            
            if crop.size == 0:
                if self.config.DEBUG_MODE:
                    print(f"   ⏭️  Skipped: {yolo_cls_name} (empty crop)")
                continue
            
            # ✅ FIX 4: Now accepts smaller objects (MIN_CROP_AREA = 200)
            h, w = crop.shape[:2]
            crop_area = h * w
            if crop_area < self.config.MIN_CROP_AREA:
                if self.config.DEBUG_MODE:
                    print(f"   ⏭️  Skipped: {yolo_cls_name} (area {crop_area} < {self.config.MIN_CROP_AREA})")
                continue
            
            # ARCHITECTURE DECISION
            if self.config.ARCHITECTURE == "yolo_cnn" and self.cnn is not None:
                # Option 2: Refine YOLO prediction with CNN
                label, conf = self.classify_crop(crop)
                source = "CNN"
                if self.config.DEBUG_MODE:
                    print(f"   ✅ YOLO: {yolo_cls_name}→{yolo_conf:.2f} | CNN: {label}→{conf:.2f}")
            else:
                # Option 1: Use YOLO prediction directly
                label = yolo_cls_name
                conf = yolo_conf
                source = "YOLO"
                if self.config.DEBUG_MODE:
                    print(f"   ✅ Using YOLO: {label}→{conf:.2f}")
            
            detections.append({
                'bbox': (x1, y1, x2, y2),
                'label': label,
                'confidence': conf,
                'yolo_class': yolo_cls_name,
                'yolo_conf': yolo_conf,
                'source': source,
                'area': crop_area
            })
        
        return detections
    
    def draw_detections(self, frame, detections, show_source=False):
        """Draw bounding boxes and labels on frame"""
        annotated_frame = frame.copy()
        
        for det in detections:
            x1, y1, x2, y2 = det['bbox']
            label = det['label']
            conf = det['confidence']
            source = det.get('source', 'YOLO')
            
            # Get color for the waste type
            color = self.config.CLASS_COLORS.get(label, (255, 255, 255))
            
            # Draw bounding box
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 3)
            
            # Prepare text
            if show_source:
                text = f"{label.upper()} {conf*100:.1f}% ({source})"
            else:
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
        print(f"\n🏗️  Architecture: {Config.ARCHITECTURE.upper()}")
        if Config.ARCHITECTURE == "yolo_cnn":
            print("   → YOLO detects objects + CNN refines classification")
        else:
            print("   → YOLO-only mode (faster)")
        
        # ✅ Show fix summary
        print(f"\n🔧 FIXES APPLIED:")
        print(f"   ✓ YOLO conf threshold: {Config.YOLO_CONF} (was ~0.25)")
        print(f"   ✓ Min crop area: {Config.MIN_CROP_AREA}px (was 800px)")
        print(f"   ✓ Class filtering: {'ENABLED' if Config.ENABLE_CLASS_FILTERING else 'DISABLED (accepts all)'}")
        print(f"   ✓ Debug mode: {'ON' if Config.DEBUG_MODE else 'OFF'}")
    
    def run_image(self, img_path, save_output=None, show_source=False):
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
        annotated_frame = self.classifier.draw_detections(frame, detections, show_source)
        
        # Print detection summary
        if len(detections) == 0:
            print("\n⚠️  Detected 0 waste items")
            print("   Possible reasons:")
            print("   - No objects detected by YOLO even at low confidence")
            print("   - All objects smaller than MIN_CROP_AREA")
            print("   - Try lowering YOLO_CONF even more (currently {})".format(Config.YOLO_CONF))
        else:
            print(f"\n🗑️  Detected {len(detections)} waste items:")
            for i, det in enumerate(detections, 1):
                if Config.ARCHITECTURE == "yolo_cnn":
                    print(f"  {i}. {det['label'].upper()} ({det['confidence']*100:.1f}%) "
                          f"[YOLO: {det['yolo_class']} {det['yolo_conf']*100:.1f}%] area={det['area']}px")
                else:
                    print(f"  {i}. {det['label'].upper()} ({det['confidence']*100:.1f}%) area={det['area']}px")
        
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
    
    def run_webcam(self, camera_id=0, show_source=False):
        """Run real-time classification from webcam"""
        cap = cv2.VideoCapture(camera_id)
        
        if not cap.isOpened():
            print(f"❌ Could not access camera {camera_id}")
            return
        
        print("\n📹 Starting webcam mode...")
        print("Controls:")
        print("  'q' - Quit")
        print("  's' - Save screenshot")
        print("  'd' - Toggle debug info (YOLO vs CNN)")
        
        frame_count = 0
        show_debug = show_source
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("⚠ Failed to read frame")
                break
            
            # Process frame
            detections = self.classifier.process_frame(frame)
            annotated_frame = self.classifier.draw_detections(frame, detections, show_debug)
            
            # Add frame info
            mode_text = f"Mode: {Config.ARCHITECTURE.upper()}"
            conf_text = f"YOLO conf={Config.YOLO_CONF}"
            info_text = f"Objects: {len(detections)} | {mode_text} | {conf_text} | 'q'=quit 's'=save 'd'=debug"
            
            cv2.putText(
                annotated_frame, info_text, (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                (255, 255, 255), 2
            )
            
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
    
    def run_batch(self, input_dir, output_dir=None, show_source=False):
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
        print(f"🏗️  Using: {Config.ARCHITECTURE.upper()} architecture\n")
        
        total_detections = 0
        
        for i, img_file in enumerate(image_files, 1):
            print(f"\n{'='*60}")
            print(f"[{i}/{len(image_files)}] Processing: {img_file.name}")
            print('='*60)
            
            save_path = None
            if output_dir:
                save_path = str(output_path / f"detected_{img_file.name}")
            
            result = self.run_image(str(img_file), save_output=save_path, show_source=show_source)
            
            if result is not None:
                detections = self.classifier.process_frame(cv2.imread(str(img_file)))
                total_detections += len(detections)
            
            cv2.destroyAllWindows()
        
        print(f"\n{'='*60}")
        print(f"✅ BATCH PROCESSING COMPLETE!")
        print(f"{'='*60}")
        print(f"📊 Total images processed: {len(image_files)}")
        print(f"📊 Total objects detected: {total_detections}")
        print(f"📊 Average per image: {total_detections/len(image_files):.1f}")
        if output_dir:
            print(f"💾 Results saved to: {output_dir}")

# =====================
# BACKEND-SAFE FUNCTION
# =====================
def run_yolo_cnn(image_path: str, output_dir: str):
    """
    Backend-safe YOLO + CNN inference
    Returns detections + output image path
    """
    
    # Reuse existing logic WITHOUT input(), cv2.imshow(), or waitKey()
    app = GarbageSegregatorApp()
    
    output_path = os.path.join(
        output_dir,
        f"yolo_cnn_{os.path.basename(image_path)}"
    )
    
    # Load and process image
    if not os.path.exists(image_path):
        return {"error": f"Image not found: {image_path}"}
    
    frame = cv2.imread(image_path)
    if frame is None:
        return {"error": f"Could not read image: {image_path}"}
    
    # Process frame
    detections = app.classifier.process_frame(frame)
    annotated_frame = app.classifier.draw_detections(frame, detections, show_source=False)
    
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
    print("🗑️  SMART GARBAGE SEGREGATOR v2.1 - FIXED")
    print("=" * 60)
    print(f"\n🏗️  Current Architecture: {Config.ARCHITECTURE.upper()}")
    if Config.ARCHITECTURE == "yolo_cnn":
        print("   → YOLO detects + CNN refines (more accurate)")
    else:
        print("   → YOLO-only (faster)")
    print("\n💡 Change Config.ARCHITECTURE to switch modes")
    print("=" * 60)
    print("\n🔧 CRITICAL FIXES APPLIED:")
    print(f"   1. YOLO confidence lowered: {Config.YOLO_CONF} (was ~0.25)")
    print(f"   2. Class filtering: {'ENABLED' if Config.ENABLE_CLASS_FILTERING else 'DISABLED'}")
    print(f"   3. Debug mode: {'ON' if Config.DEBUG_MODE else 'OFF'}")
    print(f"   4. Min crop area: {Config.MIN_CROP_AREA}px (was 800px)")
    print("=" * 60)
    print("\nSelect Mode:")
    print("1 → Webcam (Real-time)")
    print("2 → Single Image")
    print("3 → Batch Processing (Directory)")
    print("=" * 60)
    
    choice = input("\nChoose mode (1-3): ").strip()
    
    app = GarbageSegregatorApp()
    
    if choice == "1":
        app.run_webcam(show_source=True)
    
    elif choice == "2":
        img_path = input("Enter image path: ").strip()
        save_output = input("Save output? (y/n): ").strip().lower()
        show_source = input("Show source (YOLO/CNN)? (y/n): ").strip().lower() == 'y'
        
        if save_output == 'y':
            output_path = input("Enter output path (or press Enter for auto): ").strip()
            if not output_path:
                output_path = f"detected_{Path(img_path).name}"
            app.run_image(img_path, save_output=output_path, show_source=show_source)
        else:
            app.run_image(img_path, show_source=show_source)
    
    elif choice == "3":
        input_dir = input("Enter input directory: ").strip()
        output_dir = input("Enter output directory (or press Enter to skip saving): ").strip()
        show_source = input("Show source (YOLO/CNN) in labels? (y/n): ").strip().lower() == 'y'
        
        if not output_dir:
            output_dir = None
        
        app.run_batch(input_dir, output_dir, show_source=show_source)
    
    else:
        print("❌ Invalid choice")

if __name__ == "__main__":
    main()