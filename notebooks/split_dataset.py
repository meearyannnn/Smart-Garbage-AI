import os
import shutil
import random

# =========================
# CONFIG
# =========================
SOURCE_DIR = "data/clean"
DEST_DIR = "data/final"

TRAIN_RATIO = 0.7
VAL_RATIO = 0.2
TEST_RATIO = 0.1

random.seed(42)

# =========================
# PREPARE DEST FOLDERS
# =========================
for split in ["train", "val", "test"]:
    split_path = os.path.join(DEST_DIR, split)
    os.makedirs(split_path, exist_ok=True)

# =========================
# SPLIT PER CLASS
# =========================
summary = {}

for cls in os.listdir(SOURCE_DIR):
    cls_path = os.path.join(SOURCE_DIR, cls)
    if not os.path.isdir(cls_path):
        continue

    images = os.listdir(cls_path)
    random.shuffle(images)

    n = len(images)
    n_train = int(n * TRAIN_RATIO)
    n_val = int(n * VAL_RATIO)

    train_imgs = images[:n_train]
    val_imgs = images[n_train:n_train + n_val]
    test_imgs = images[n_train + n_val:]

    for split, split_imgs in zip(
        ["train", "val", "test"],
        [train_imgs, val_imgs, test_imgs]
    ):
        split_cls_dir = os.path.join(DEST_DIR, split, cls)
        os.makedirs(split_cls_dir, exist_ok=True)

        for img in split_imgs:
            src = os.path.join(cls_path, img)
            dst = os.path.join(split_cls_dir, img)
            shutil.copy(src, dst)

    summary[cls] = {
        "train": len(train_imgs),
        "val": len(val_imgs),
        "test": len(test_imgs),
        "total": n
    }

# =========================
# SUMMARY
# =========================
print("\nDATASET SPLIT SUMMARY:\n")
total_all = 0
for cls, stats in summary.items():
    print(
        f"{cls:12s} | "
        f"train: {stats['train']:4d} | "
        f"val: {stats['val']:4d} | "
        f"test: {stats['test']:4d} | "
        f"total: {stats['total']:4d}"
    )
    total_all += stats["total"]

print(f"\nTOTAL IMAGES: {total_all}")
