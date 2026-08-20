#!/usr/bin/env python3
"""Rebuild every asset and both templates from source, in order."""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

for script in ("build_logo.py", "build_word.py", "build_sample.py"):
    print("=== {}".format(script))
    subprocess.check_call([sys.executable, os.path.join(HERE, script)])
print("\ndone — .dotx and .potx are in the parent directory")
