from flask import Flask, jsonify
from flask_cors import CORS
from routes import api_bp
from config import Config
from firebase_client import init_firebase

# Factory function to create flask instance, add blueprint(s), and add configs
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(
        app,
        origins=["http://localhost:3000", "https://liamoiknine.github.io"],
        supports_credentials=True,
        resources={r"/api/*": {"origins": "*"}}
    )
    init_firebase(app) 

    app.register_blueprint(api_bp, url_prefix='/api')
    return app

# If this file is run directly, run the Flask app
if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=3456, debug=True)
