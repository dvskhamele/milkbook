# PyInstaller spec file for MilkRecord Flask App
# Build Windows EXE with: pyinstaller milkrecord.spec

import sys
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

# App name
app_name = 'MilkRecord'

# Main script
a = Analysis(
    ['app.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('../apps', 'apps'),
        ('templates', 'templates'),
        ('static', 'static'),
        ('database', 'database'),
    ] + collect_data_files('flask') + collect_data_files('serial'),
    hiddenimports=[
        'flask',
        'flask_sqlalchemy',
        'serial',
        'serial.tools.list_ports',
        'werkzeug',
        'jinja2',
        'markupsafe',
        'dotenv',
    ] + collect_submodules('flask') + collect_submodules('serial'),
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None,
    noarchive=False,
)

# Create executable
pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name=app_name,
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # Set to True for debug mode
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='icon.ico' if sys.platform == 'win32' else None,
)
