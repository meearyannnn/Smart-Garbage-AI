
# Smart Garbage AI 🗑️🤖

A full‑stack waste‑detection & classification system built with  
**YOLO, CNNs, React/Vite frontend and a Python backend**.  
Designed for accurate object detection, fine‑grained classification and realtime dashboards.

---

## 🚀 Project Overview

- **Frontend** – React/Vite UI (with Tailwind): image upload, live webcam capture, results, dashboard and guide.
- **Backend** – Python/Flask API performing inference with two pipelines (YOLO + CNN and dual‑YOLO).  
  Images stored, detections saved to database, JSON returned.
- **Models** – Multiple YOLO weights and a custom CNN classifier for waste categories.
- **Data** – Structured dataset with `train/val/test` partitions and Roboflow‑style YAMLs.
- **Classifier utilities** – Training/inference scripts under classifier.
- **Inference engines** – inference contains dispatchers and runners for both pipelines.
- **Dashboards & storage** – Frontend heatmaps, charts and location logging.  
- **Evaluation notebooks** – Jupyter scripts in notebooks for data preparation and analysis.

---

## 🗂️ Repository Structure

```
/
├── backend/                # Flask app + inference logic + DB models
│   ├── app.py
│   ├── database.py
│   ├── models.py
│   └── inference/          # runners & dispatcher
├── classifier/             # training & inference for CNN and dual‑YOLO
├── data/                   # raw & clean images, annotations, splits
├── frontend/               # React/Vite SPA
├── models/                 # pretrained weight files
├── notebooks/              # Jupyter support scripts
├── yolo*/                  # dataset folders for various experiments
├── requirements.txt        # backend dependencies
└── README.md               # ← you are here
```

---

## 🔧 Setup & Installation

### Python (backend & classifier)

```bash
cd "c:\Users\abhin\Desktop\smart garbage ai"
python -m venv .venv
& .\.venv\Scripts\Activate.ps1        # Windows PowerShell
pip install -r requirements.txt
```

- requirements.txt contains Flask, OpenCV, ultralytics, SQLAlchemy, etc.
- Model weights (`.pt` files) are tracked in models and root.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Uses Vite + React + Tailwind CSS.
- Entrypoint: `src/App.tsx`.

### Database

Default uses SQLite (see database.py); migrations handled manually.

---

## 🖼️ Inference Pipelines

### 1. YOLO + CNN  
Used for single‑object or standard images.

- `run_yolo_cnn(image_path)`  
  1. Load via OpenCV  
  2. YOLO detects bounding boxes  
  3. Crop & classify each box with CNN  
  4. Draw annotations, save image  
  5. Return JSON:

```json
{
  "pipeline": "yolo_cnn",
  "output_image": "path.jpg",
  "detections":[
    {
      "label":"Organic",
      "confidence":0.657,
      "bbox":[x1,y1,x2,y2],
      "yolo_class":"food",
      "yolo_conf":0.72,
      "source":"CNN",
      "area":12345
    }
  ],
  "total_objects":1
}
```

### 2. Dual‑YOLO  
Tailored for garbage piles and cluttered scenes.

- `run_dual_yolo(image_path)`  
  First YOLO makes an initial pass; second YOLO refines or filters predictions.  
  Improves detection in overlapping/large‑scale debris.

---

## 📡 Frontend Features

- **Upload or live camera stream**  
- **Detection page** – choose pipeline, view annotated result  
- **Results page** – class, confidence, bounding boxes, model info  
- **Dashboard** – totals, most common class, avg confidence, heatmap (Leaflet + OSM), distribution chart (Chart.js)  
- **Guide page** – waste categories, disposal instructions, gamified “Eco XP”  

---

## 📊 Model Performance (example metrics)

- Precision: **93.76 %**  
- Recall: **92.26 %**  
- mAP@0.5: **96.88 %**  
- mAP@0.5‑0.95: **78.91 %**

_loss decreased steadily over training with no major overfitting._

---

## 🛠 Training & Evaluation

- **Classifier training**: train.py  
- **Inference scripts**: infer.py, `yolo_cnn_infer.py`, `dual_yolo_infer.py`
- **Dataset preparation**: prepare_dataset.py, `split_dataset.py`  
- Data distribution checks: check_distribution.py  
- Metrics exported to final_metrics.json and `results.csv`.

---

## 📝 Usage Example

1. Start backend:

   ```bash
   cd backend
   flask run
   ```

2. Visit `http://localhost:3000` (frontend dev server)  
3. Upload an image or enable webcam  
4. Select pipeline → view results → dashboard updates automatically  

---

## 💡 Notes & Tips

- Add new waste categories by updating `yolo/*.yaml` and retraining model.  
- Swap models by replacing `.pt` weight files and restarting backend.  
- Frontend environment variables: `VITE_API_URL` for backend base URL.

---

## 🧩 Contribution & Extension

- New pipelines can be added under inference.  
- Extend dashboard by editing components or adding new routes.  
- Use the notebooks to explore data or develop custom augmentation.

---

## 📄 License & Credits

*Include license details here (e.g., MIT) and acknowledge any datasets or third‑party tools used.*

---

💬 **Any questions or ideas?** Just open an issue or drop a message – let’s make smart waste management smarter!
