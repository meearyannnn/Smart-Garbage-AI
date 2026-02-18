import os
import torch
import torch.nn as nn
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
import timm
from sklearn.metrics import confusion_matrix, classification_report
import numpy as np

# =====================
# CONFIG
# =====================
DATA_DIR = "data/final"
BATCH_SIZE = 32
EPOCHS = 10
LR = 1e-4
IMG_SIZE = 224
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# =====================
# TRANSFORMS
# =====================
train_tfms = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

val_tfms = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

# =====================
# DATASETS
# =====================
train_ds = datasets.ImageFolder(os.path.join(DATA_DIR, "train"), transform=train_tfms)
val_ds   = datasets.ImageFolder(os.path.join(DATA_DIR, "val"), transform=val_tfms)
test_ds  = datasets.ImageFolder(os.path.join(DATA_DIR, "test"), transform=val_tfms)

train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
val_loader   = DataLoader(val_ds, batch_size=BATCH_SIZE)
test_loader  = DataLoader(test_ds, batch_size=BATCH_SIZE)

num_classes = len(train_ds.classes)
print("Classes:", train_ds.classes)

# =====================
# MODEL
# =====================
model = timm.create_model("efficientnet_b0", pretrained=True)
model.classifier = nn.Linear(model.classifier.in_features, num_classes)
model.to(DEVICE)

# =====================
# TRAINING SETUP
# =====================
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=LR)

# =====================
# TRAIN LOOP
# =====================
for epoch in range(EPOCHS):
    model.train()
    train_loss = 0

    for x, y in train_loader:
        x, y = x.to(DEVICE), y.to(DEVICE)
        optimizer.zero_grad()
        preds = model(x)
        loss = criterion(preds, y)
        loss.backward()
        optimizer.step()
        train_loss += loss.item()

    # Validation
    model.eval()
    correct, total = 0, 0
    with torch.no_grad():
        for x, y in val_loader:
            x, y = x.to(DEVICE), y.to(DEVICE)
            preds = model(x)
            predicted = preds.argmax(1)
            correct += (predicted == y).sum().item()
            total += y.size(0)

    val_acc = correct / total * 100
    print(f"Epoch [{epoch+1}/{EPOCHS}] | Train Loss: {train_loss:.2f} | Val Acc: {val_acc:.2f}%")

# =====================
# SAVE MODEL
# =====================
torch.save(model.state_dict(), "classifier/garbage_model.pth")
print("Model saved as classifier/garbage_model.pth")

# =====================
# TEST EVALUATION
# =====================
model.eval()
all_preds, all_labels = [], []

with torch.no_grad():
    for x, y in test_loader:
        x = x.to(DEVICE)
        preds = model(x).argmax(1).cpu().numpy()
        all_preds.extend(preds)
        all_labels.extend(y.numpy())

print("\nClassification Report:")
print(classification_report(all_labels, all_preds, target_names=train_ds.classes))

print("\nConfusion Matrix:")
print(confusion_matrix(all_labels, all_preds))
