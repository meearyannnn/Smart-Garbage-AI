import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import timm
import cv2
import numpy as np

# =====================
# CONFIG
# =====================
MODEL_PATH = "classifier/garbage_model.pth"
IMG_SIZE = 224
CONF_THRESHOLD = 0.60  # below this → mixed
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

CLASSES = [
    "cardboard",
    "e_waste",
    "glass",
    "metal",
    "organic",
    "paper",
    "plastic"
]

# =====================
# TRANSFORM
# =====================
transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

# =====================
# LOAD MODEL
# =====================
model = timm.create_model("efficientnet_b0", pretrained=False)
model.classifier = nn.Linear(model.classifier.in_features, len(CLASSES))
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model.to(DEVICE)
model.eval()

# =====================
# IMAGE PREDICTION
# =====================
def predict_image(img_path):
    img = Image.open(img_path).convert("RGB")
    x = transform(img).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=1)[0].cpu().numpy()

    idx = np.argmax(probs)
    confidence = probs[idx]

    if confidence < CONF_THRESHOLD:
        return "mixed", confidence

    return CLASSES[idx], confidence


# =====================
# WEBCAM INFERENCE
# =====================
def webcam_inference():
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Webcam not accessible")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(img)

        x = transform(img_pil).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            logits = model(x)
            probs = torch.softmax(logits, dim=1)[0].cpu().numpy()

        idx = np.argmax(probs)
        conf = probs[idx]

        label = CLASSES[idx] if conf >= CONF_THRESHOLD else "mixed"
        text = f"{label} ({conf*100:.1f}%)"

        cv2.putText(frame, text, (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1,
                    (0, 255, 0), 2)

        cv2.imshow("Smart Garbage AI", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


# =====================
# MAIN
# =====================
if __name__ == "__main__":
    print("1 → Image prediction")
    print("2 → Webcam prediction")
    choice = input("Choose mode: ")

    if choice == "1":
        path = input("Enter image path: ")
        label, conf = predict_image(path)
        print(f"Prediction: {label} | Confidence: {conf*100:.2f}%")

    elif choice == "2":
        webcam_inference()
