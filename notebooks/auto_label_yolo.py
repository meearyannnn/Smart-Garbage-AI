import os
import random
import shutil
from pathlib import Path

# =====================
# CONFIG
# =====================
SRC_ROOT = Path("data/clean")
DST_ROOT = Path("yolo_garbage")

SPLIT = {
    "train": 0.8,
    "val": 0.1,
    "test": 0.1
}

CLASSES = [
    "cardboard",
    "e_waste",
    "glass",
    "metal",
    "organic",
    "paper",
    "plastic"
]

CLASS_TO_ID = {cls: i for i, cls in enumerate(CLASSES)}
IMAGE_EXTS = {".jpg", ".jpeg", ".png"}

# =====================
# CREATE FOLDERS
# =====================
for split in SPLIT:
    (DST_ROOT / "images" / split).mkdir(parents=True, exist_ok=True)
    (DST_ROOT / "labels" / split).mkdir(parents=True, exist_ok=True)

# =====================
# COLLECT IMAGES
# =====================
items = []

for cls in CLASSES:
    cls_dir = SRC_ROOT / cls
    for img in cls_dir.iterdir():
        if img.suffix.lower() in IMAGE_EXTS:
            items.append((img, cls))

random.shuffle(items)

# =====================
# SPLIT DATA
# =====================
n = len(items)
train_end = int(n * SPLIT["train"])
val_end = train_end + int(n * SPLIT["val"])

splits = {
    "train": items[:train_end],
    "val": items[train_end:val_end],
    "test": items[val_end:]
}

# =====================
# WRITE YOLO FILES
# =====================
def write_label(path, class_id):
    with open(path, "w") as f:
        # full image bounding box
        f.write(f"{class_id} 0.5 0.5 1.0 1.0\n")

for split, data in splits.items():
    for img_path, cls in data:
        dst_img = DST_ROOT / "images" / split / img_path.name
        dst_lbl = DST_ROOT / "labels" / split / (img_path.stem + ".txt")

        shutil.copy(img_path, dst_img)
        write_label(dst_lbl, CLASS_TO_ID[cls])

# =====================
# WRITE data.yaml
# =====================
yaml_path = DST_ROOT / "data.yaml"

with open(yaml_path, "w") as f:
    f.write(f"""train: images/train
val: images/val
test: images/test

names:
""")
    for i, cls in enumerate(CLASSES):
        f.write(f"  {i}: {cls}\n")

print("✅ AUTO-LABELING COMPLETE")
print(f"Images processed: {n}")
print("YOLO dataset ready at: yolo_garbage/")
