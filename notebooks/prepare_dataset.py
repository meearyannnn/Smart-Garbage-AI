import json
import os
import shutil
from collections import defaultdict

# =========================
# PATHS
# =========================
ANNOTATION_FILE = "data/annotations.json"
IMAGE_ROOT = "data"
OUTPUT_DIR = "data/clean"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# =========================
# CATEGORY MAPPING
# =========================
def map_category(name: str) -> str:
    name = name.lower()

    # plastic
    if any(x in name for x in ["plastic", "wrapper", "bag", "bottle", "poly"]):
        return "plastic"

    # paper
    if "paper" in name and not any(x in name for x in ["cardboard", "carton", "box"]):
        return "paper"

    # cardboard
    if any(x in name for x in ["cardboard", "carton", "box"]):
        return "cardboard"

    # metal cans
    if any(x in name for x in ["can", "aluminium can", "soda can"]):
        return "metal_can"

    # other metal
    if any(x in name for x in ["metal", "foil", "tin", "scrap"]):
        return "metal_other"

    # glass
    if "glass" in name:
        return "glass"

    # organic
    if any(x in name for x in ["food", "organic", "fruit", "vegetable", "peel", "leftover"]):
        return "organic"

    # e-waste
    if any(x in name for x in ["battery", "wire", "cable", "electronics", "e-waste"]):
        return "e_waste"

    # fallback
    return "mixed"


# =========================
# LOAD COCO JSON
# =========================
with open(ANNOTATION_FILE, "r") as f:
    coco = json.load(f)

categories = {c["id"]: c["name"] for c in coco["categories"]}
images = {i["id"]: i for i in coco["images"]}

# =========================
# COLLECT MATERIALS PER IMAGE
# =========================
image_materials = defaultdict(list)

for ann in coco["annotations"]:
    img_id = ann["image_id"]
    cat_name = categories[ann["category_id"]]
    material = map_category(cat_name)

    # bbox area = width * height
    _, _, w, h = ann["bbox"]
    area = w * h

    image_materials[img_id].append((material, area))

# =========================
# DOMINANT MATERIAL PER IMAGE
# =========================
final_assignment = {}

for img_id, materials in image_materials.items():
    if not materials:
        final_assignment[img_id] = "mixed"
        continue

    dominant_material = max(materials, key=lambda x: x[1])[0]
    final_assignment[img_id] = dominant_material

# =========================
# COPY IMAGES
# =========================
counts = defaultdict(int)

for img_id, cls in final_assignment.items():
    img_info = images[img_id]
    src = os.path.join(IMAGE_ROOT, img_info["file_name"])
    dst_dir = os.path.join(OUTPUT_DIR, cls)

    os.makedirs(dst_dir, exist_ok=True)

    if os.path.exists(src):
        shutil.copy(src, dst_dir)
        counts[cls] += 1

# =========================
# SUMMARY
# =========================
print("\nFINAL DATASET DISTRIBUTION:")
total = 0
for k in sorted(counts.keys()):
    print(f"{k}: {counts[k]}")
    total += counts[k]

print(f"\nTOTAL IMAGES USED: {total}")
