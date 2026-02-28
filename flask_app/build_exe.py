# MilkRecord POS - PyInstaller Build Script
# Builds standalone Windows EXE from pos_server.py

import PyInstaller.__main__
import os
import shutil

# Get absolute paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APPS_DIR = os.path.join(BASE_DIR, '..', 'apps')

# Clean previous builds
if os.path.exists('dist'):
    shutil.rmtree('dist')
    print("✅ Cleaned old dist folder")

if os.path.exists('build'):
    shutil.rmtree('build')
    print("✅ Cleaned old build folder")

# Build EXE
PyInstaller.__main__.run([
    'pos_server.py',
    '--onefile',              # Single executable
    '--noconsole',            # No console window
    '--name=MilkRecordPOS',   # EXE name
    f'--add-data={APPS_DIR};apps',  # Include HTML files
    '--hidden-import=flask',
    '--hidden-import=flask_sqlalchemy',
    '--hidden-import=supabase',
    '--hidden-import=uuid6',
    '--hidden-import=psutil',
    '--hidden-import=requests',
    '--icon=icon.ico' if os.path.exists('icon.ico') else '',
])

print("\n✅ Build complete!")
print("📦 EXE location: dist/MilkRecordPOS.exe")
print("\n📝 To distribute:")
print("   1. Copy dist/MilkRecordPOS.exe")
print("   2. Create .env file with Supabase credentials")
print("   3. Run EXE - it will create database automatically")
