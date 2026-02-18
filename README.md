🧙‍♂️ IMMUNDUS AI – SYSTEM ARCHITECTURE
🌐 FRONTEND PART (React / Next / Vanilla JS UI)
🔹 What Frontend Does

Your frontend:

Uploads image

Shows live camera feed

Sends image to backend

Receives JSON response

Displays:

Annotated image

Detected class

Confidence

Bounding boxes

Total objects

Saves detection with location

Updates dashboard stats

🔹 Frontend Flow (Explain Like This in Viva)

“The frontend acts as a user interaction layer. It allows image upload or live webcam capture. The image is sent via HTTP POST request to the backend inference API. The response is rendered dynamically, including annotated image, detected waste class, confidence score, and object count.”

🔹 Main Frontend Components
1️⃣ Detection Page

Upload relic

Live Scrying (Webcam)

Choose:

Single Object (YOLO + CNN)

Garbage Pile (Dual YOLO)

2️⃣ Results Page

Shows:

Detected Class

Confidence %

Model Used

Bounding Boxes

Total Objects

3️⃣ Dashboard Page

Shows:

Total detections

Most common class

Avg confidence

Heatmap (Leaflet + OpenStreetMap)

Donut chart distribution

4️⃣ Guide Page

Shows:

Waste category

Disposal instructions

Eco XP game

🔹 Technologies Used (Say This Clearly)

HTML / CSS / JS

Fetch API / Axios

Leaflet.js (for heatmap)

Chart.js (for distribution graph)

Geolocation API

Camera API (navigator.mediaDevices)

⚙️ BACKEND PART (Python + OpenCV + YOLO)

Now coming to your backend inference code.

You have TWO pipelines:

🧠 1️⃣ YOLO + CNN PIPELINE

Function:

run_yolo_cnn(image_path)

🔹 What Happens Internally

Load image using OpenCV

YOLO detects bounding boxes

CNN reclassifies cropped objects

Draw detections

Save annotated image

Return JSON

🔹 JSON Response Structure
{
  "pipeline": "yolo_cnn",
  "output_image": "path.jpg",
  "detections": [
    {
      "label": "Organic",
      "confidence": 0.657,
      "bbox": [x1, y1, x2, y2],
      "yolo_class": "food",
      "yolo_conf": 0.72,
      "source": "CNN",
      "area": 12345
    }
  ],
  "total_objects": 1
}

🔹 Why YOLO + CNN?

Say this in viva:

“YOLO is excellent for fast object detection but sometimes struggles in fine-grained classification. So we added a CNN classifier to refine classification after detection. This improves overall classification accuracy.”

🔥 2️⃣ DUAL YOLO PIPELINE

Function:

run_dual_yolo(image_path)


Used for:

Garbage piles

Multiple overlapping objects

Large-scale detection

🔹 What Happens

First YOLO detects objects

Second YOLO refines classification or filters

Bounding boxes drawn

JSON returned

🔹 Why Dual YOLO?

“Dual YOLO improves detection in cluttered environments by refining predictions in a second stage, increasing robustness for garbage pile scenarios.”

🔄 COMPLETE SYSTEM FLOW

Say this confidently:

User uploads image

Frontend sends image via POST request

Backend stores image

Backend runs inference

Annotated image saved

JSON returned

Frontend displays results

Detection stored in DB

Dashboard updates