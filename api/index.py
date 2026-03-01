# Vercel Serverless Entry Point
# This file makes the Flask app work on Vercel

import sys
import os

# Add flask_app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'flask_app'))

# Import the Flask app
from vercel_app import app

# Export for Vercel
app = app
