#!/usr/bin/env python3
"""
Backend Diagnostic Script
Run this to identify issues with your Smart Garbage Segregator backend
"""

import sys
import os
from pathlib import Path

print("=" * 70)
print("SMART GARBAGE SEGREGATOR - BACKEND DIAGNOSTICS")
print("=" * 70)
print()

issues_found = []
warnings = []

# Test 1: Check Python version
print("✓ Checking Python version...")
if sys.version_info < (3, 8):
    issues_found.append(f"Python version too old: {sys.version}. Need 3.8+")
else:
    print(f"  Python {sys.version.split()[0]} ✓")
print()

# Test 2: Check required modules
print("✓ Checking required Python packages...")
required_packages = {
    'fastapi': 'FastAPI',
    'uvicorn': 'Uvicorn',
    'cv2': 'OpenCV (opencv-python)',
    'numpy': 'NumPy',
    'PIL': 'Pillow'
}

for module, name in required_packages.items():
    try:
        __import__(module)
        print(f"  {name} ✓")
    except ImportError:
        issues_found.append(f"Missing package: {name}")
        print(f"  {name} ✗ MISSING")

print()

# Test 3: Check optional ML packages
print("✓ Checking ML packages...")
ml_packages = {
    'torch': 'PyTorch',
    'ultralytics': 'Ultralytics YOLO'
}

for module, name in ml_packages.items():
    try:
        __import__(module)
        print(f"  {name} ✓")
    except ImportError:
        warnings.append(f"Optional package not found: {name}")
        print(f"  {name} ⚠ Not installed (may be needed)")

print()

# Test 4: Check directory structure
print("✓ Checking directory structure...")
required_dirs = [
    'backend',
    'backend/uploads',
    'backend/outputs',
    'classifier'
]

for dir_path in required_dirs:
    if Path(dir_path).exists():
        print(f"  {dir_path}/ ✓")
    else:
        issues_found.append(f"Missing directory: {dir_path}/")
        print(f"  {dir_path}/ ✗ MISSING")

print()

# Test 5: Check classifier files
print("✓ Checking classifier files...")
classifier_files = [
    'classifier/__init__.py',
    'classifier/dual_yolo_infer.py',
    'classifier/yolo_cnn_infer.py'
]

for file_path in classifier_files:
    if Path(file_path).exists():
        print(f"  {file_path} ✓")
    else:
        if file_path.endswith('__init__.py'):
            warnings.append(f"Missing file: {file_path} (can be empty)")
            print(f"  {file_path} ⚠ Missing (create empty file)")
        else:
            issues_found.append(f"Missing file: {file_path}")
            print(f"  {file_path} ✗ MISSING")

print()

# Test 6: Check model directory
print("✓ Checking model files...")
models_dir = Path('classifier/models')
if models_dir.exists():
    model_files = list(models_dir.glob('*'))
    if model_files:
        print(f"  Found {len(model_files)} files in classifier/models/:")
        for f in model_files:
            print(f"    - {f.name}")
    else:
        warnings.append("No model files found in classifier/models/")
        print("  ⚠ No model files found in classifier/models/")
else:
    issues_found.append("Missing directory: classifier/models/")
    print("  ✗ classifier/models/ directory not found")

print()

# Test 7: Check database
print("✓ Checking database...")
try:
    from backend.database import conn, cursor
    
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='detections'")
    if cursor.fetchone():
        print("  Database table 'detections' exists ✓")
        
        # Check schema
        cursor.execute("PRAGMA table_info(detections)")
        columns = [col[1] for col in cursor.fetchall()]
        
        expected_columns = ['id', 'waste_type', 'object_count', 'confidence', 
                           'mode', 'latitude', 'longitude', 'timestamp']
        
        if set(columns) == set(expected_columns):
            print("  Database schema is correct ✓")
        else:
            missing = set(expected_columns) - set(columns)
            extra = set(columns) - set(expected_columns)
            if missing:
                issues_found.append(f"Database missing columns: {missing}")
                print(f"  ✗ Missing columns: {missing}")
            if extra:
                warnings.append(f"Database has extra columns: {extra}")
                print(f"  ⚠ Extra columns: {extra}")
    else:
        warnings.append("Database table 'detections' doesn't exist yet")
        print("  ⚠ Table 'detections' doesn't exist (will be created on first run)")
        
except Exception as e:
    issues_found.append(f"Database error: {str(e)}")
    print(f"  ✗ Database error: {str(e)}")

print()

# Test 8: Try importing classifier modules
print("✓ Testing classifier imports...")
try:
    sys.path.insert(0, os.getcwd())
    from classifier.dual_yolo_infer import GarbageClassifier as DualYoloClassifier
    print("  dual_yolo_infer.GarbageClassifier ✓")
except Exception as e:
    issues_found.append(f"Cannot import DualYoloClassifier: {str(e)}")
    print(f"  ✗ dual_yolo_infer.GarbageClassifier failed: {str(e)}")

try:
    from classifier.yolo_cnn_infer import GarbageClassifier as YoloCnnClassifier
    print("  yolo_cnn_infer.GarbageClassifier ✓")
except Exception as e:
    issues_found.append(f"Cannot import YoloCnnClassifier: {str(e)}")
    print(f"  ✗ yolo_cnn_infer.GarbageClassifier failed: {str(e)}")

print()

# Test 9: Check if server is running
print("✓ Checking if server is running...")
try:
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', 8000))
    sock.close()
    
    if result == 0:
        print("  Server is running on port 8000 ✓")
    else:
        warnings.append("Server is not running on port 8000")
        print("  ⚠ Server is NOT running on port 8000")
except Exception as e:
    warnings.append(f"Cannot check server status: {str(e)}")
    print(f"  ⚠ Cannot check server status")

print()

# Summary
print("=" * 70)
print("DIAGNOSTIC SUMMARY")
print("=" * 70)
print()

if not issues_found and not warnings:
    print("✅ All checks passed! Your backend should be working correctly.")
    print()
    print("If you're still having issues:")
    print("1. Check the backend terminal for error messages")
    print("2. Try running: python -m uvicorn app:app --reload")
    print("3. Test the health endpoint: curl http://127.0.0.1:8000/health")
else:
    if issues_found:
        print(f"❌ Found {len(issues_found)} CRITICAL issue(s):")
        for i, issue in enumerate(issues_found, 1):
            print(f"   {i}. {issue}")
        print()
    
    if warnings:
        print(f"⚠️  Found {len(warnings)} warning(s):")
        for i, warning in enumerate(warnings, 1):
            print(f"   {i}. {warning}")
        print()
    
    print("RECOMMENDED ACTIONS:")
    print()
    
    if any("Missing package" in issue for issue in issues_found):
        print("📦 Install missing packages:")
        print("   pip install fastapi uvicorn opencv-python numpy pillow")
        print("   pip install torch torchvision  # for CNN models")
        print("   pip install ultralytics  # for YOLO")
        print()
    
    if any("Missing directory" in issue for issue in issues_found):
        print("📁 Create missing directories:")
        for issue in issues_found:
            if "Missing directory" in issue:
                dir_name = issue.split(": ")[1].replace("/", "")
                print(f"   mkdir -p {dir_name}")
        print()
    
    if any("Database" in issue for issue in issues_found):
        print("🗄️  Fix database:")
        print("   python migrate_db.py")
        print()
    
    if any("Cannot import" in issue for issue in issues_found):
        print("🔧 Fix classifier imports:")
        print("   touch classifier/__init__.py")
        print("   Check that classifier/*.py files exist and have no syntax errors")
        print()

print("=" * 70)