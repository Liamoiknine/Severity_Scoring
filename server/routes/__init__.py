# routes/__init__.py
from flask import Blueprint

# Create a blueprint nameed api
api_bp = Blueprint('api', __name__)

# Import all view functions from the blueprint file
from .api import *
