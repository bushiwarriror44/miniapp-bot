import json
import os

from flask import Blueprint, jsonify, request

from models import DATASET_FILES, DEFAULT_DATASETS, Dataset, db

api_bp = Blueprint('api', __name__, url_prefix='/api')

EXCHANGE_DATASETS = [
    "ads",
    "buyAds",
    "jobs",
    "services",
    "currency",
    "sellChannels",
    "buyChannels",
    "other",
]

@api_bp.route('/health', methods=['GET'])
def healthcheck():
    return jsonify({'ok': True})


@api_bp.route('/datasets', methods=['GET'])
def list_datasets():
    items = Dataset.query.order_by(Dataset.name.asc()).all()
    return jsonify({
        'datasets': [
            {
                'name': item.name,
                'updatedAt': item.updated_at.isoformat() if item.updated_at else None,
            }
            for item in items
        ]
    })


@api_bp.route('/datasets/<dataset_name>', methods=['GET'])
def get_dataset(dataset_name):
    item = Dataset.query.filter_by(name=dataset_name).first()
    if not item:
        if dataset_name == 'exchangeOptions':
            payload = DEFAULT_DATASETS.get('exchangeOptions', {'jobTypes': [], 'currencies': []})
            return jsonify({'name': 'exchangeOptions', 'payload': payload, 'updatedAt': None})
        return jsonify({'error': f'Dataset "{dataset_name}" not found'}), 404

    try:
        payload = json.loads(item.payload)
    except json.JSONDecodeError:
        return jsonify({'error': f'Dataset "{dataset_name}" has invalid JSON in DB'}), 500

    return jsonify({
        'name': item.name,
        'payload': payload,
        'updatedAt': item.updated_at.isoformat() if item.updated_at else None,
    })


@api_bp.route('/datasets/<dataset_name>', methods=['PUT'])
def upsert_dataset(dataset_name):
    admin_token = os.getenv('ADMIN_API_TOKEN', '')
    if admin_token:
        incoming_token = request.headers.get('X-Admin-Token', '')
        if incoming_token != admin_token:
            return jsonify({'error': 'Forbidden'}), 403

    body = request.get_json(silent=True)
    if not body or 'payload' not in body:
        return jsonify({'error': 'Body must contain "payload"'}), 400

    payload = body['payload']
    payload_json = json.dumps(payload, ensure_ascii=False)

    item = Dataset.query.filter_by(name=dataset_name).first()
    if item:
        item.payload = payload_json
    else:
        item = Dataset(name=dataset_name, payload=payload_json)
        db.session.add(item)

    db.session.commit()

    return jsonify({
        'ok': True,
        'name': item.name,
        'updatedAt': item.updated_at.isoformat() if item.updated_at else None,
    })


@api_bp.route('/seed/defaults', methods=['GET'])
def seed_defaults_info():
    names = set(DATASET_FILES.keys()) | set(DEFAULT_DATASETS.keys())
    return jsonify({'supportedDatasetNames': sorted(names)})


@api_bp.route('/stats/active-ads-total', methods=['GET'])
def active_ads_total():
    total = 0
    per_category = {}

    for dataset_name in EXCHANGE_DATASETS:
        row = Dataset.query.filter_by(name=dataset_name).first()
        if not row:
            per_category[dataset_name] = 0
            continue

        try:
            payload = json.loads(row.payload)
        except json.JSONDecodeError:
            per_category[dataset_name] = 0
            continue

        items_count = 0
        if isinstance(payload, dict):
            for value in payload.values():
                if isinstance(value, list):
                    items_count = len(value)
                    break

        per_category[dataset_name] = items_count
        total += items_count

    return jsonify({'activeAdsTotal': total, 'perCategory': per_category})
