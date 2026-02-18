🧙‍♂️ IMMUNDUS AI – COMPLETE SYSTEM ARCHITECTURE

You have two intelligent pipelines:

1️⃣ YOLO + CNN → Single Object Mode
2️⃣ YOLO + YOLO (Dual YOLO) → Garbage Pile Mode

Both serve different real-world scenarios.

🌐 FRONTEND ARCHITECTURE (Presentation Ready)
🔹 What Frontend Does

The frontend acts as the user interaction layer.

It:

Uploads image (Upload Relic)

Captures webcam feed (Live Scrying)

Sends image to backend via POST API

Receives structured JSON

Displays:

Annotated image

Detected class

Confidence score

Model used

Bounding boxes

Total object count

Saves detection with GPS location

Updates dashboard analytics

🔹 Frontend Flow (Say This Exactly)

“The frontend provides image upload and live camera capture functionality. The image is sent via HTTP POST to the backend inference API. The backend processes the image using either YOLO+CNN or Dual YOLO pipeline and returns a structured JSON response. The frontend then dynamically renders the annotated image and detection statistics.”

🔹 Main Frontend Pages
1️⃣ Detection Page

User chooses:

🟡 Single Object → YOLO + CNN

🟡 Garbage Pile → YOLO + YOLO

2️⃣ Results Page

Shows:

Detected Class

Confidence %

Model Used

Bounding Boxes

Object Count

3️⃣ Dashboard Page

Shows:

Total detections

Most frequent class

Average confidence

Heatmap (Leaflet + OpenStreetMap)

Class distribution donut chart

4️⃣ Guide Page

Waste category info

Disposal instructions

Eco XP gamification

🔹 Technologies Used

HTML / CSS / JS

Fetch API

Leaflet.js

Chart.js

Geolocation API

navigator.mediaDevices (Camera API)

⚙️ BACKEND ARCHITECTURE

Backend built using:

Python

OpenCV

YOLO

Custom CNN

REST API

You implemented two pipelines.

🧠 PIPELINE 1: YOLO + CNN (Single Object Mode)
🔹 When Used?

When user uploads a single object image.

Example from your screenshot:
Detected: Cardboard – 95.6% confidence

🔹 Step-by-Step Internal Flow

Function:

run_yolo_cnn(image_path)

Step 1 – Image Load

OpenCV loads image.

Step 2 – YOLO Detection

YOLO detects:

Bounding box

Objectness score

Initial class prediction

Example:

YOLO → food (0.72)

Step 3 – Crop Object

Detected region is cropped using bounding box.

Step 4 – CNN Reclassification

Cropped object sent to custom CNN classifier.

CNN outputs refined class.

Example:

CNN → Cardboard (0.956)


CNN overrides YOLO class if more confident.

Step 5 – Draw Final Detection

Bounding box drawn

Label from CNN used

Confidence updated

Step 6 – Return JSON
{
  "pipeline": "yolo_cnn",
  "detections": [
    {
      "label": "Cardboard",
      "confidence": 0.956,
      "bbox": [x1, y1, x2, y2],
      "source": "CNN"
    }
  ],
  "total_objects": 1
}

🔹 WHY YOLO + CNN?

Say this clearly:

“YOLO performs fast object detection, but CNN performs more fine-grained classification. Therefore, YOLO localizes the object and CNN improves classification accuracy.”

🔹 Why This Is Powerful

Reduces classification errors

Improves fine-grained discrimination

Especially useful for visually similar materials

🔥 PIPELINE 2: YOLO + YOLO (Dual YOLO) – Garbage Pile Mode

Now from your cardboard pile image.

We see multiple bounding boxes detected.

🔹 When Used?

For:

Garbage pile

Multiple overlapping objects

Complex scenes

🔹 Step-by-Step Flow

Function:

run_dual_yolo(image_path)

Step 1 – First YOLO Detection

YOLO detects all potential objects.

In your image:
Multiple "CARDBOARD" boxes detected.

Step 2 – Second YOLO Refinement

Second YOLO model:

Refines classification

Filters false positives

Improves robustness in clutter

Step 3 – Non-Maximum Suppression

Overlapping boxes removed.

Highest confidence retained.

Step 4 – Final Annotated Output

Multiple bounding boxes drawn.

Example from your image:

Cardboard 85.1%

Cardboard 76.4%

Cardboard 59.4%

etc.

Step 5 – Return JSON
{
  "pipeline": "dual_yolo",
  "detections": [...],
  "total_objects": 8
}

🔹 WHY Dual YOLO?

Say confidently:

“In cluttered environments, single-stage detection may produce noisy predictions. The second YOLO acts as a refinement stage, improving detection stability and reducing false positives.”

🧠 DIFFERENCE BETWEEN BOTH PIPELINES
Feature	YOLO + CNN	YOLO + YOLO
Use Case	Single Object	Garbage Pile
Focus	Classification refinement	Multi-object robustness
Cropping	Yes	No
Second Model	CNN classifier	Another YOLO detector
Speed	Slightly slower	Still real-time
Accuracy	High class precision	High detection robustness
