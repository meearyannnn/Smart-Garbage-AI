import os

root = "data/clean"

print("FINAL DATASET DISTRIBUTION:")
total = 0
for cls in sorted(os.listdir(root)):
    cls_path = os.path.join(root, cls)
    if os.path.isdir(cls_path):
        count = len(os.listdir(cls_path))
        print(f"{cls}: {count}")
        total += count

print("TOTAL:", total)
