from flask import Flask, jsonify
from flask_cors import CORS
from routes import api_bp
from config import Config
from firebase_client import init_firebase

# Factory function to create flask instance, add blueprint(s), and add configs
def create_app():
    import os
    app = Flask(__name__)
    app.config.from_object(Config)

    # Get allowed origins from environment variable or default to localhost
    # Format: comma-separated list of origins, e.g., "http://localhost:3000,https://yourdomain.com"
    allowed_origins_env = os.getenv('CORS_ORIGINS', 'http://localhost:3000')
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(',')]
    
    # CORS configuration - must use explicit origins when supports_credentials=True
    CORS(
        app,
        origins=allowed_origins,
        supports_credentials=True,
        allow_headers=['Content-Type', 'Authorization'],
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    )
    init_firebase(app) 

    app.register_blueprint(api_bp, url_prefix='/api')
    return app

# If this file is run directly, run the Flask app
if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=3456, debug=True)
