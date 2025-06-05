# config.py
"""
import os

class Config:
    FIREBASE_CRED = os.getenv('FIREBASE_CREDENTIALS', '../../firebase.json')
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev')
"""
# config.py
import os
import json

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev')
    
    firebase_json = os.getenv('FIREBASE_CONFIG')
    if firebase_json:
        FIREBASE_CRED = json.loads(firebase_json)
    else:
        # Fallback to file path for local dev
        with open('../../firebase.json') as f:
            FIREBASE_CRED = json.load(f)
