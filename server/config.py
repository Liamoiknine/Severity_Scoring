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
        # Get the directory where this config file is located
        config_dir = os.path.dirname(os.path.abspath(__file__))
        # Go up one level from server/ to project root, then look for firebase.json
        project_root = os.path.dirname(config_dir)
        firebase_json_path = os.path.join(project_root, 'firebase.json')
        
        if not os.path.exists(firebase_json_path):
            raise FileNotFoundError(
                f"Firebase credentials file not found at {firebase_json_path}\n"
                "Please either:\n"
                "1. Place your Firebase Admin SDK credentials file at the project root as 'firebase.json', OR\n"
                "2. Set the FIREBASE_CONFIG environment variable with the JSON content as a string.\n"
                "You can download the credentials file from Firebase Console > Project Settings > Service Accounts."
            )
        
        with open(firebase_json_path) as f:
            FIREBASE_CRED = json.load(f)
