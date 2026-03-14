import os
import sys

# Monkeypatch symlink to avoid WinError 1314
import pathlib
import shutil
def symlink_to_copy_patch(self, target, target_is_directory=False):
    if target_is_directory:
        if self.exists(): shutil.rmtree(self)
        shutil.copytree(str(target), str(self))
    else:
        if self.exists(): os.remove(self)
        shutil.copy2(str(target), str(self))
pathlib.Path.symlink_to = symlink_to_copy_patch

os.environ['SPEECHBRAIN_USE_SYMLINKS'] = 'False'
os.environ['HF_HUB_DISABLE_SYMLINKS'] = '1'

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import voice_auth

# Create a dummy wav file if not exists for testing (silence or whatever)
# Actually, just use one of the existing files as the "test" file
test_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "voice_db", "vamshi.wav"))

if not os.path.exists(test_file):
    print("Test file not found")
    sys.exit(1)

try:
    print("Testing verify_voice_headless...")
    result = voice_auth.verify_voice_headless(test_file)
    print(f"Result: {result}")
except Exception as e:
    print(f"Caught error: {str(e)}")
    import traceback
    traceback.print_exc()
