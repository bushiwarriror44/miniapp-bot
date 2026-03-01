from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from dotenv import load_dotenv
import os

from models import db, init_all_models, Moderator, ModeratorActionLog
from api_routes import api_bp
from admin_routes import admin_bp

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

env_path = os.path.join(PROJECT_ROOT, '.env')
load_dotenv(env_path)

app = Flask(__name__, template_folder="views")

app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

allowed_origins = os.getenv('ALLOWED_ORIGINS', '*').split(',')
CORS(app, origins=allowed_origins, supports_credentials=True)

if os.path.exists(os.path.join(BASE_DIR, 'data')):
    data_dir = os.path.join(BASE_DIR, 'data')
else:
    data_dir = os.path.join(PROJECT_ROOT, 'data')

os.makedirs(data_dir, exist_ok=True)

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(data_dir, "app.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

app.register_blueprint(api_bp)
app.register_blueprint(admin_bp)

_db_initialized = False

def init_db():
    global _db_initialized
    if not _db_initialized:
        with app.app_context():
            init_all_models(PROJECT_ROOT)
        _db_initialized = True

@app.before_request
def before_first_request():
    init_db()

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'service': 'miniapp-admin-api',
        'status': 'ok',
        'docs': {
            'health': '/api/health',
            'listDatasets': '/api/datasets',
            'getDataset': '/api/datasets/<name>',
            'upsertDataset': 'PUT /api/datasets/<name>',
        },
    })

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested resource was not found',
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred'
    }), 500

@app.errorhandler(403)
def forbidden_error(error):
    if request.path.startswith("/admin"):
        return jsonify({
            'error': 'Forbidden',
            'message': 'Access denied'
        }), 403
    return jsonify({
        'error': 'Forbidden',
        'message': 'Access denied'
    }), 403

if __name__ == '__main__':
    with app.app_context():
        init_all_models(PROJECT_ROOT)
    debug_mode = os.getenv('FLASK_DEBUG', 'False') == 'True'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000)
