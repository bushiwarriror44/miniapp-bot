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

# Frontend section id for URLs
DATASET_TO_SECTION = {
    "ads": "sell-ads",
    "buyAds": "buy-ads",
    "jobs": "jobs",
    "services": "designers",
    "currency": "currency",
    "sellChannels": "sell-channel",
    "buyChannels": "buy-channel",
    "other": "other",
}


def _get_list_from_payload(payload, dataset_name):
    """Extract list of items from payload. Payload is e.g. { 'ads': [...] }."""
    if not isinstance(payload, dict):
        return []
    return payload.get(dataset_name, payload.get("items", [])) if isinstance(payload.get(dataset_name), list) else []


def _listing_snippet(dataset_name, item):
    """Build a unified listing record for user listings response."""
    section = DATASET_TO_SECTION.get(dataset_name, dataset_name)
    item_id = item.get("id")
    published_at = item.get("publishedAt") or item.get("createdAt") or ""
    title = ""
    if dataset_name == "ads":
        title = (item.get("theme") or item.get("description") or "")[:200]
    elif dataset_name == "buyAds":
        title = (item.get("theme") or item.get("description") or "")[:200]
    elif dataset_name == "jobs":
        title = (item.get("theme") or item.get("description") or "")[:200]
    elif dataset_name == "services":
        title = (item.get("title") or item.get("theme") or item.get("description") or "")[:200]
    elif dataset_name == "currency":
        title = (item.get("theme") or item.get("description") or "")[:200]
    elif dataset_name == "sellChannels":
        title = (item.get("name") or item.get("theme") or item.get("description") or "")[:200]
    elif dataset_name == "buyChannels":
        title = (item.get("theme") or item.get("description") or "")[:200]
    elif dataset_name == "other":
        title = (item.get("theme") or item.get("description") or "")[:200]
    return {
        "section": section,
        "id": item_id,
        "title": (title or "").strip() or None,
        "publishedAt": published_at or None,
        "username": item.get("username"),
    }


def _item_username_match(item, username_arg):
    """Check if item's username/usernameLink matches the given username (normalized, case-insensitive)."""
    if not username_arg or not isinstance(item, dict):
        return True
    q = str(username_arg).strip().lstrip("@").lower()
    if not q:
        return True
    uname = str(item.get("username") or "").strip().lstrip("@").lower()
    ulink = str(item.get("usernameLink") or "").lower()
    uname_from_link = ""
    if ulink and "t.me/" in ulink:
        parts = ulink.rstrip("/").split("t.me/")
        if len(parts) > 1:
            uname_from_link = (parts[-1] or "").split("/")[0].split("?")[0].lower()
    return q == uname or q in ulink or q == uname_from_link


def _filter_exchange_items(dataset_name, items, args):
    """Filter items by query params. Returns filtered list."""
    if not items:
        return items
    result = []
    for item in items:
        if not isinstance(item, dict):
            result.append(item)
            continue
        if dataset_name == "ads":
            try:
                price = float(item.get("price") or 0)
            except (TypeError, ValueError):
                price = 0
            p_from = args.get("priceFrom", "").strip()
            p_to = args.get("priceTo", "").strip()
            if p_from and float(p_from) > price:
                continue
            if p_to and float(p_to) < price:
                continue
            theme = (item.get("theme") or "").lower()
            if args.get("theme", "").strip() and args.get("theme", "").strip().lower() not in theme:
                continue
        elif dataset_name == "buyAds":
            p_min = item.get("priceMin")
            p_max = item.get("priceMax")
            try:
                p_min = float(p_min) if p_min is not None else None
                p_max = float(p_max) if p_max is not None else None
            except (TypeError, ValueError):
                p_min = p_max = None
            p_from = args.get("priceFrom", "").strip()
            p_to = args.get("priceTo", "").strip()
            if p_from:
                try:
                    if p_max is not None and float(p_from) > p_max:
                        continue
                except (TypeError, ValueError):
                    pass
            if p_to:
                try:
                    if p_min is not None and float(p_to) < p_min:
                        continue
                except (TypeError, ValueError):
                    pass
            theme = (item.get("theme") or "").lower()
            if args.get("theme", "").strip() and args.get("theme", "").strip().lower() not in theme:
                continue
        elif dataset_name == "jobs":
            if args.get("offerType", "").strip() and item.get("offerType") != args.get("offerType"):
                continue
            if args.get("work", "").strip() and item.get("work") != args.get("work"):
                continue
            if args.get("employmentType", "").strip() and item.get("employmentType") != args.get("employmentType"):
                continue
            if args.get("paymentCurrency", "").strip() and item.get("paymentCurrency") != args.get("paymentCurrency"):
                continue
            if args.get("hasPortfolio") == "yes" and not item.get("portfolioUrl"):
                continue
            if args.get("hasPortfolio") == "no" and item.get("portfolioUrl"):
                continue
            theme = (item.get("theme") or "").lower()
            if args.get("themeSearch", "").strip() and args.get("themeSearch", "").strip().lower() not in theme:
                continue
            desc = (item.get("description") or "").lower()
            if args.get("descriptionSearch", "").strip() and args.get("descriptionSearch", "").strip().lower() not in desc:
                continue
        elif dataset_name == "services":
            theme = (item.get("theme") or "").lower()
            if args.get("theme", "").strip() and args.get("theme", "").strip().lower() not in theme:
                continue
        elif dataset_name == "other":
            theme = (item.get("theme") or "").lower()
            if args.get("theme", "").strip() and args.get("theme", "").strip().lower() not in theme:
                continue
            date_from = args.get("dateFrom", "").strip()
            date_to = args.get("dateTo", "").strip()
            if date_from or date_to:
                pub = item.get("publishedAt") or item.get("createdAt") or ""
                if date_to and pub > date_to:
                    continue
                if date_from and pub < date_from:
                    continue
        elif dataset_name in ("currency", "sellChannels", "buyChannels"):
            theme = (item.get("theme") or item.get("description") or "").lower()
            if args.get("theme", "").strip() and args.get("theme", "").strip().lower() not in theme:
                continue
        if args.get("username", "").strip() and not _item_username_match(item, args.get("username")):
            continue
        result.append(item)
    return result

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
        if dataset_name == 'banners':
            payload = {'banners': [{'id': 'default-1', 'imageUrl': '/1.png', 'order': 0}]}
            return jsonify({'name': 'banners', 'payload': payload, 'updatedAt': None})
        return jsonify({'error': f'Dataset "{dataset_name}" not found'}), 404

    try:
        payload = json.loads(item.payload)
    except json.JSONDecodeError:
        return jsonify({'error': f'Dataset "{dataset_name}" has invalid JSON in DB'}), 500

    use_pagination = dataset_name in EXCHANGE_DATASETS and (
        request.args.get('cursor') is not None or request.args.get('limit') is not None
    )
    if use_pagination:
        raw_list = _get_list_from_payload(payload, dataset_name)
        filtered = _filter_exchange_items(dataset_name, raw_list, request.args)
        try:
            offset = int(request.args.get('cursor') or 0)
        except (TypeError, ValueError):
            offset = 0
        limit = min(int(request.args.get('limit') or 20), 100)
        if limit < 1:
            limit = 20
        slice_list = filtered[offset:offset + limit]
        next_offset = offset + len(slice_list)
        next_cursor = str(next_offset) if next_offset < len(filtered) else None
        out_payload = {dataset_name: slice_list}
        return jsonify({
            'name': item.name,
            'payload': out_payload,
            'updatedAt': item.updated_at.isoformat() if item.updated_at else None,
            'nextCursor': next_cursor,
        })

    return jsonify({
        'name': item.name,
        'payload': payload,
        'updatedAt': item.updated_at.isoformat() if item.updated_at else None,
    })


@api_bp.route('/datasets/<dataset_name>/items/<item_id>', methods=['GET'])
def get_dataset_item(dataset_name, item_id):
    if dataset_name not in EXCHANGE_DATASETS:
        return jsonify({'error': f'Dataset "{dataset_name}" not found'}), 404
    row = Dataset.query.filter_by(name=dataset_name).first()
    if not row:
        return jsonify({'error': f'Dataset "{dataset_name}" not found'}), 404
    try:
        payload = json.loads(row.payload)
    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid dataset payload'}), 500
    raw_list = _get_list_from_payload(payload, dataset_name)
    item_id_str = str(item_id).strip()
    for it in raw_list:
        if isinstance(it, dict) and str(it.get("id", "")).strip() == item_id_str:
            return jsonify({'item': it, 'name': dataset_name})
    return jsonify({'error': 'Item not found'}), 404


@api_bp.route('/users/<username>/listings', methods=['GET'])
def get_user_listings(username):
    username_clean = (username or "").strip().lstrip("@")
    if not username_clean:
        return jsonify({'items': [], 'nextCursor': None})

    merged = []
    args_username = {"username": username_clean}
    for dataset_name in EXCHANGE_DATASETS:
        row = Dataset.query.filter_by(name=dataset_name).first()
        if not row:
            continue
        try:
            payload = json.loads(row.payload)
        except json.JSONDecodeError:
            continue
        raw_list = _get_list_from_payload(payload, dataset_name)
        filtered = _filter_exchange_items(dataset_name, raw_list, args_username)
        for it in filtered:
            if isinstance(it, dict):
                merged.append(_listing_snippet(dataset_name, it))

    merged.sort(key=lambda x: (x.get("publishedAt") or ""), reverse=True)

    try:
        offset = int(request.args.get("cursor") or 0)
    except (TypeError, ValueError):
        offset = 0
    limit = min(int(request.args.get("limit") or 20), 100)
    if limit < 1:
        limit = 20
    slice_list = merged[offset:offset + limit]
    next_offset = offset + len(slice_list)
    next_cursor = str(next_offset) if next_offset < len(merged) else None

    return jsonify({"items": slice_list, "nextCursor": next_cursor})


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
