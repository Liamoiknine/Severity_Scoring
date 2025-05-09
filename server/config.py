# config.py
import os

class Config:
    FIREBASE_CRED = os.getenv('FIREBASE_CREDENTIALS', '../../firebase.json')
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev')
