import json
import os
from datetime import datetime
from pathlib import Path
from functools import wraps
from uuid import uuid4
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from flask import (
    Blueprint,
    jsonify,
    current_app,
    redirect,
    render_template,
    request,
    send_from_directory,
    session,
    url_for,
)
from sqlalchemy.exc import OperationalError
from werkzeug.security import check_password_hash, generate_password_hash

from models import Dataset, Moderator, ModeratorActionLog, db


def _ensure_moderator_tables():
    """Create moderator-related tables if they do not exist (e.g. after deploy without restart)."""
    try:
        db.create_all()
    except Exception:
        pass

admin_bp = Blueprint("admin", __name__)

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://127.0.0.1:3001")
EXCHANGE_CATEGORIES = [
    "ads",
    "buyAds",
    "jobs",
    "services",
    "currency",
    "sellChannels",
    "buyChannels",
    "other",
]
MODERATION_SECTION_TO_DATASET = {
    "buy-ads": "buyAds",
    "sell-ads": "ads",
    "jobs": "jobs",
    "designers": "services",
    "sell-channel": "sellChannels",
    "buy-channel": "buyChannels",
    "other": "other",
}


def is_logged_in():
    return bool(session.get("admin_logged_in"))


def require_login(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not is_logged_in():
            return redirect(url_for("admin.admin_login"))
        return fn(*args, **kwargs)

    return wrapper


def require_admin(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not is_logged_in():
            return redirect(url_for("admin.admin_login"))
        if session.get("role") != "admin":
            if request.wants_json() or request.accept_mimetypes.best == "application/json":
                return jsonify({"error": "Доступ запрещён"}), 403
            return redirect(url_for("admin.admin_panel"))
        return fn(*args, **kwargs)

    return wrapper


def _log_moderator_action(action_type, request_id, details=None):
    if session.get("role") != "moderator":
        return
    mod_id = session.get("moderator_id")
    if not mod_id:
        return
    details_str = None
    if details is not None:
        details_str = json.dumps(details, ensure_ascii=False) if isinstance(details, dict) else str(details)
    entry = ModeratorActionLog(
        moderator_id=mod_id,
        action_type=action_type,
        request_id=request_id,
        details=details_str,
    )
    db.session.add(entry)
    db.session.commit()


def _dataset_payload(dataset):
    return json.loads(dataset.payload)


def _extract_items(payload):
    if not isinstance(payload, dict):
        raise ValueError("Dataset payload must be object")
    for key, value in payload.items():
        if isinstance(value, list):
            return key, value
    raise ValueError("Dataset payload must contain list field")


def _save_dataset_items(dataset, list_key, items):
    payload = _dataset_payload(dataset)
    payload[list_key] = items
    dataset.payload = json.dumps(payload, ensure_ascii=False)
    db.session.commit()


def _extract_items_safe(payload):
    try:
        return _extract_items(payload)
    except ValueError:
        return None, []


def _get_users_count():
    try:
        with urlopen(f"{BACKEND_API_URL.rstrip('/')}/stats/users-count", timeout=3) as response:
            data = json.loads(response.read().decode("utf-8"))
            return int(data.get("usersCount", 0))
    except (URLError, ValueError, TimeoutError):
        return 0


def _backend_get_json(path, query_params=None):
    url = f"{BACKEND_API_URL.rstrip('/')}/{path.lstrip('/')}"
    if query_params:
        url = f"{url}?{urlencode(query_params)}"
    with urlopen(url, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))


def _backend_json(path, method, payload):
    url = f"{BACKEND_API_URL.rstrip('/')}/{path.lstrip('/')}"
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = Request(
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    with urlopen(req, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))


def _get_active_ads_total():
    total = 0
    for category in EXCHANGE_CATEGORIES:
        row = Dataset.query.filter_by(name=category).first()
        if not row:
            continue
        payload = _dataset_payload(row)
        _, items = _extract_items_safe(payload)
        total += len(items)
    return total


def _upsert_dataset(name, payload):
    row = Dataset.query.filter_by(name=name).first()
    if row:
        row.payload = json.dumps(payload, ensure_ascii=False)
    else:
        row = Dataset(name=name, payload=json.dumps(payload, ensure_ascii=False))
        db.session.add(row)
    db.session.commit()
    return row


def _uploads_dir():
    db_path = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    # sqlite:////app/admin/data/app.db -> /app/admin/data
    if db_path.startswith("sqlite:///"):
        abs_db = db_path.replace("sqlite:///", "", 1)
        base_dir = Path(abs_db).resolve().parent
    else:
        base_dir = Path(os.getcwd())
    uploads_dir = base_dir / "bot_uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    return uploads_dir


def _build_admin_public_url(path):
    base = os.getenv("ADMIN_PUBLIC_BASE_URL", "").strip().rstrip("/")
    if not base:
        base = request.host_url.rstrip("/")
    return f"{base}{path}"


def _to_bool(value, default=False):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        val = value.strip().lower()
        if val in {"yes", "true", "1", "да"}:
            return True
        if val in {"no", "false", "0", "нет"}:
            return False
    return default


def _to_number(value, default=0):
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _parse_range(value, default_min=0, default_max=0):
    """Parse range string like '1000-2000' or '15000' into (min, max) tuple."""
    if not value or not isinstance(value, str):
        return (default_min, default_max)
    
    value = value.strip()
    if not value:
        return (default_min, default_max)
    
    # Handle single value (e.g., "15000" or "~15000")
    if value.startswith("~"):
        value = value[1:].strip()
    
    if "-" not in value:
        num = _to_number(value, 0)
        return (num, num)
    
    # Handle range (e.g., "1000-2000")
    parts = value.split("-", 1)
    if len(parts) == 2:
        min_val = _to_number(parts[0].strip(), default_min)
        max_val = _to_number(parts[1].strip(), default_max)
        return (min_val, max_val)
    
    return (default_min, default_max)


def _normalize_item_for_dataset(section, form_data):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    if section == "buy-ads":
        username = str(form_data.get("username") or "").lstrip("@")
        price_min, price_max = _parse_range(form_data.get("priceRange"))
        views_min, views_max = _parse_range(form_data.get("viewsRange"))
        
        return {
            "id": str(uuid4()),
            "username": username,
            "usernameLink": f"https://t.me/{username}" if username else "",
            "verified": False,
            "priceMin": int(price_min),
            "priceMax": int(price_max),
            "viewsMin": int(views_min),
            "viewsMax": int(views_max),
            "theme": str(form_data.get("theme") or ""),
            "description": str(form_data.get("description") or ""),
            "publishedAt": today,
        }
    if section == "sell-ads":
        return {
            "id": str(uuid4()),
            "adType": str(form_data.get("adType") or "post_in_channel"),
            "channelOrChatLink": str(form_data.get("channelOrChatLink") or ""),
            "imageUrl": None,
            "verified": _to_bool(form_data.get("verified"), False),
            "username": str(form_data.get("username") or "").lstrip("@"),
            "price": _to_number(form_data.get("price"), 0),
            "pinned": _to_bool(form_data.get("pinned"), False),
            "underGuarantee": _to_bool(form_data.get("underGuarantee"), False),
            "publishTime": str(form_data.get("publishTime") or "-"),
            "postDuration": str(form_data.get("postDuration") or "-"),
            "paymentMethod": str(form_data.get("paymentMethod") or "card"),
            "theme": str(form_data.get("theme") or ""),
            "description": str(form_data.get("description") or ""),
            "publishedAt": today,
        }
    if section == "jobs":
        return {
            "id": str(uuid4()),
            "offerType": str(form_data.get("offerType") or "looking_for_work"),
            "work": str(form_data.get("work") or "other"),
            "usernameLink": str(form_data.get("usernameLink") or ""),
            "portfolioUrl": str(form_data.get("portfolioUrl") or ""),
            "employmentType": str(form_data.get("employmentType") or "project"),
            "paymentCurrency": str(form_data.get("paymentCurrency") or "rub"),
            "paymentAmount": str(form_data.get("paymentAmount") or ""),
            "theme": str(form_data.get("theme") or ""),
            "description": str(form_data.get("description") or ""),
        }
    if section == "designers":
        return {
            "id": str(uuid4()),
            "title": str(form_data.get("title") or ""),
            "username": str(form_data.get("username") or "").lstrip("@"),
            "price": _to_number(form_data.get("price"), 0),
            "theme": str(form_data.get("theme") or ""),
            "description": str(form_data.get("description") or ""),
            "publishedAt": today,
        }
    if section == "sell-channel":
        return {
            "id": str(uuid4()),
            "name": str(form_data.get("name") or ""),
            "username": str(form_data.get("username") or "").lstrip("@"),
            "usernameLink": str(form_data.get("usernameLink") or ""),
            "subscribers": int(_to_number(form_data.get("subscribers"), 0)),
            "reach": int(_to_number(form_data.get("reach"), 0)),
            "price": _to_number(form_data.get("price"), 0),
            "viaGuarantor": _to_bool(form_data.get("viaGuarantor"), False),
            "theme": str(form_data.get("theme") or ""),
            "description": str(form_data.get("description") or ""),
        }
    if section == "buy-channel":
        return {
            "id": str(uuid4()),
            "username": str(form_data.get("username") or "").lstrip("@"),
            "usernameLink": str(form_data.get("usernameLink") or ""),
            "priceMin": _to_number(form_data.get("priceMin"), 0),
            "priceMax": _to_number(form_data.get("priceMax"), 0),
            "reachMin": int(_to_number(form_data.get("reachMin"), 0)),
            "reachMax": int(_to_number(form_data.get("reachMax"), 0)),
            "subscribersMin": int(_to_number(form_data.get("subscribersMin"), 0)),
            "subscribersMax": int(_to_number(form_data.get("subscribersMax"), 0)),
            "viaGuarantor": _to_bool(form_data.get("viaGuarantor"), False),
            "theme": str(form_data.get("theme") or ""),
            "description": str(form_data.get("description") or ""),
        }
    if section == "other":
        return {
            "id": str(uuid4()),
            "username": str(form_data.get("username") or "").lstrip("@"),
            "usernameLink": str(form_data.get("usernameLink") or ""),
            "verified": _to_bool(form_data.get("verified"), False),
            "price": _to_number(form_data.get("price"), 0),
            "description": str(form_data.get("description") or ""),
        }
    raise ValueError("Unsupported moderation section")


@admin_bp.route("/admin")
@admin_bp.route("/admin/")
def admin_root():
    if is_logged_in():
        return redirect(url_for("admin.admin_panel"))
    return redirect(url_for("admin.admin_login"))


@admin_bp.route("/admin-static/<path:filename>")
def admin_static(filename):
    base = os.path.dirname(os.path.abspath(__file__))
    static_dir = os.path.join(base, "views", "src")
    return send_from_directory(static_dir, filename)


@admin_bp.route("/admin/uploads/<path:filename>")
def admin_uploads(filename):
    return send_from_directory(str(_uploads_dir()), filename)


@admin_bp.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if is_logged_in():
        return redirect(url_for("admin.admin_panel"))

    error = None
    if request.method == "POST":
        password = request.form.get("password", "")
        if password == ADMIN_PASSWORD:
            session.clear()
            session["admin_logged_in"] = True
            session["role"] = "admin"
            return redirect(url_for("admin.admin_panel"))
        for mod in Moderator.query.all():
            if check_password_hash(mod.password_hash, password):
                session.clear()
                session["admin_logged_in"] = True
                session["role"] = "moderator"
                session["moderator_id"] = mod.id
                return redirect(url_for("admin.admin_panel"))
        error = "Неверный пароль"

    return render_template("admin_login.html", error=error)


@admin_bp.route("/admin/logout")
def admin_logout():
    session.clear()
    return redirect(url_for("admin.admin_login"))


@admin_bp.route("/admin/panel")
@require_login
def admin_panel():
    role = session.get("role", "admin")
    miniapp_base_url = os.environ.get("MINIAPP_BASE_URL", "").rstrip("/")
    return render_template("admin_panel.html", role=role, miniapp_base_url=miniapp_base_url)


@admin_bp.route("/admin/api/categories", methods=["GET"])
@require_login
@require_admin
def categories():
    rows = (
        Dataset.query.filter(Dataset.name.in_(EXCHANGE_CATEGORIES))
        .order_by(Dataset.name.asc())
        .all()
    )
    result = []
    for row in rows:
        payload = _dataset_payload(row)
        list_key, items = _extract_items_safe(payload)
        if not list_key:
            continue
        result.append(
            {
                "name": row.name,
                "listKey": list_key,
                "count": len(items),
                "updatedAt": row.updated_at.isoformat() if row.updated_at else None,
            }
        )
    return jsonify({"categories": result})


@admin_bp.route("/admin/api/categories/<category>/items", methods=["GET"])
@require_login
@require_admin
def category_items(category):
    row = Dataset.query.filter_by(name=category).first()
    if not row:
        return jsonify({"error": "Category not found"}), 404
    payload = _dataset_payload(row)
    list_key, items = _extract_items(payload)
    return jsonify({"category": category, "listKey": list_key, "items": items})


@admin_bp.route("/admin/api/categories/<category>/items", methods=["POST"])
@require_login
@require_admin
def create_item(category):
    row = Dataset.query.filter_by(name=category).first()
    if not row:
        return jsonify({"error": "Category not found"}), 404
    body = request.get_json(silent=True) or {}
    item = body.get("item")
    if not isinstance(item, dict):
        return jsonify({"error": "Body must contain object field 'item'"}), 400

    payload = _dataset_payload(row)
    list_key, items = _extract_items(payload)
    if not item.get("id"):
        item["id"] = str(uuid4())
    items.append(item)
    _save_dataset_items(row, list_key, items)
    
    # Update user username if provided in item (for buy-ads and other sections with username)
    username_from_item = item.get("username")
    if username_from_item and category == "buyAds":
        # Try to find telegramId from moderation request if available
        # For direct creation, we can't update username without telegramId
        # This is handled in the approve flow
        pass
    
    return jsonify({"ok": True, "item": item}), 201


@admin_bp.route("/admin/api/categories/<category>/items/<item_id>", methods=["PUT"])
@require_login
@require_admin
def update_item(category, item_id):
    row = Dataset.query.filter_by(name=category).first()
    if not row:
        return jsonify({"error": "Category not found"}), 404
    body = request.get_json(silent=True) or {}
    item = body.get("item")
    if not isinstance(item, dict):
        return jsonify({"error": "Body must contain object field 'item'"}), 400

    payload = _dataset_payload(row)
    list_key, items = _extract_items(payload)
    idx = next((i for i, it in enumerate(items) if str(it.get("id")) == str(item_id)), -1)
    if idx == -1:
        return jsonify({"error": "Item not found"}), 404

    item["id"] = str(item_id)
    items[idx] = item
    _save_dataset_items(row, list_key, items)
    return jsonify({"ok": True, "item": item})


@admin_bp.route("/admin/api/categories/<category>/items/<item_id>", methods=["DELETE"])
@require_login
@require_admin
def delete_item(category, item_id):
    row = Dataset.query.filter_by(name=category).first()
    if not row:
        return jsonify({"error": "Category not found"}), 404

    payload = _dataset_payload(row)
    list_key, items = _extract_items(payload)
    filtered = [it for it in items if str(it.get("id")) != str(item_id)]
    if len(filtered) == len(items):
        return jsonify({"error": "Item not found"}), 404

    _save_dataset_items(row, list_key, filtered)
    return jsonify({"ok": True})


@admin_bp.route("/admin/api/search/users", methods=["GET"])
@require_login
@require_admin
def search_users():
    q = (request.args.get("q") or "").strip().lower()
    if len(q) < 2:
        return jsonify({"results": []})

    rows = Dataset.query.order_by(Dataset.name.asc()).all()
    results = []
    for row in rows:
        payload = _dataset_payload(row)
        _, items = _extract_items_safe(payload)
        for item in items:
            if not isinstance(item, dict):
                continue
            username = str(item.get("username", ""))
            username_link = str(item.get("usernameLink", ""))
            if q in username.lower() or q in username_link.lower():
                results.append(
                    {
                        "category": row.name,
                        "id": item.get("id"),
                        "username": username,
                        "usernameLink": username_link,
                        "title": item.get("title") or item.get("theme") or "",
                    }
                )
    return jsonify({"results": results[:200]})


@admin_bp.route("/admin/api/dashboard/main", methods=["GET"])
@require_login
@require_admin
def dashboard_main():
    return jsonify(
        {
            "usersCount": _get_users_count(),
            "activeAdsTotal": _get_active_ads_total(),
        }
    )


@admin_bp.route("/admin/api/config/main-page", methods=["GET"])
@require_login
@require_admin
def get_main_page_config():
    row = Dataset.query.filter_by(name="mainPage").first()
    payload = _dataset_payload(row) if row else {}
    return jsonify({"name": "mainPage", "payload": payload})


@admin_bp.route("/admin/api/config/main-page", methods=["PUT"])
@require_login
@require_admin
def put_main_page_config():
    body = request.get_json(silent=True) or {}
    payload = body.get("payload")
    if not isinstance(payload, dict):
        return jsonify({"error": "Body must contain object field 'payload'"}), 400
    row = _upsert_dataset("mainPage", payload)
    return jsonify({"ok": True, "updatedAt": row.updated_at.isoformat() if row.updated_at else None})


DEFAULT_BANNERS_PAYLOAD = {"banners": [{"id": "default-1", "imageUrl": "/1.png", "order": 0}]}


@admin_bp.route("/admin/api/config/banners", methods=["GET"])
@require_login
@require_admin
def get_banners_config():
    row = Dataset.query.filter_by(name="banners").first()
    if not row:
        return jsonify({"name": "banners", "payload": DEFAULT_BANNERS_PAYLOAD})
    payload = _dataset_payload(row)
    banners = payload.get("banners")
    if not isinstance(banners, list):
        payload = DEFAULT_BANNERS_PAYLOAD
    return jsonify({"name": "banners", "payload": payload})


@admin_bp.route("/admin/api/config/banners", methods=["PUT"])
@require_login
@require_admin
def put_banners_config():
    body = request.get_json(silent=True) or {}
    payload = body.get("payload")
    if not isinstance(payload, dict):
        return jsonify({"error": "Body must contain object field 'payload'"}), 400
    if not isinstance(payload.get("banners"), list):
        return jsonify({"error": "payload.banners must be an array"}), 400
    row = _upsert_dataset("banners", payload)
    return jsonify({"ok": True, "updatedAt": row.updated_at.isoformat() if row.updated_at else None})


@admin_bp.route("/admin/api/banners/upload", methods=["POST"])
@require_login
@require_admin
def upload_banner():
    file = request.files.get("file")
    if not file or not file.filename:
        return jsonify({"error": "File is required"}), 400
    suffix = Path(file.filename).suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        return jsonify({"error": "Only image files (jpg, png, webp, gif) are supported"}), 400
    banners_dir = _uploads_dir() / "banners"
    banners_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{suffix}"
    destination = banners_dir / filename
    file.save(destination)
    public_url = _build_admin_public_url(f"/admin/uploads/banners/{filename}")
    return jsonify({"ok": True, "url": public_url, "filename": filename})


@admin_bp.route("/admin/api/config/guarant", methods=["GET"])
@require_login
@require_admin
def get_guarant_config():
    row = Dataset.query.filter_by(name="guarantConfig").first()
    payload = _dataset_payload(row) if row else {}
    return jsonify({"name": "guarantConfig", "payload": payload})


@admin_bp.route("/admin/api/config/guarant", methods=["PUT"])
@require_login
@require_admin
def put_guarant_config():
    body = request.get_json(silent=True) or {}
    payload = body.get("payload")
    if not isinstance(payload, dict):
        return jsonify({"error": "Body must contain object field 'payload'"}), 400
    row = _upsert_dataset("guarantConfig", payload)
    return jsonify({"ok": True, "updatedAt": row.updated_at.isoformat() if row.updated_at else None})


@admin_bp.route("/admin/api/config/faq", methods=["GET"])
@require_login
@require_admin
def get_faq_config():
    row = Dataset.query.filter_by(name="faq").first()
    payload = _dataset_payload(row) if row else {"items": []}
    return jsonify({"name": "faq", "payload": payload})


@admin_bp.route("/admin/api/config/faq", methods=["PUT"])
@require_login
@require_admin
def put_faq_config():
    body = request.get_json(silent=True) or {}
    payload = body.get("payload")
    if not isinstance(payload, dict):
        return jsonify({"error": "Body must contain object field 'payload'"}), 400
    if not isinstance(payload.get("items"), list):
        return jsonify({"error": "payload.items must be an array"}), 400
    row = _upsert_dataset("faq", payload)
    return jsonify({"ok": True, "updatedAt": row.updated_at.isoformat() if row.updated_at else None})


@admin_bp.route("/admin/api/config/bot", methods=["GET"])
@require_login
@require_admin
def get_bot_config():
    row = Dataset.query.filter_by(name="botConfig").first()
    payload = _dataset_payload(row) if row else {
        "welcomeMessage": "",
        "welcomePhotoUrl": None,
        "supportLink": "https://t.me/miniapp_admin_example",
    }
    return jsonify({"name": "botConfig", "payload": payload})


@admin_bp.route("/admin/api/config/bot", methods=["PUT"])
@require_login
@require_admin
def put_bot_config():
    body = request.get_json(silent=True) or {}
    payload = body.get("payload")
    if not isinstance(payload, dict):
        return jsonify({"error": "Body must contain object field 'payload'"}), 400
    if not isinstance(payload.get("welcomeMessage"), str):
        return jsonify({"error": "payload.welcomeMessage must be a string"}), 400
    if payload.get("welcomePhotoUrl") is not None and not isinstance(payload.get("welcomePhotoUrl"), str):
        return jsonify({"error": "payload.welcomePhotoUrl must be null or string"}), 400
    if payload.get("supportLink") is not None and not isinstance(payload.get("supportLink"), str):
        return jsonify({"error": "payload.supportLink must be null or string"}), 400
    row = _upsert_dataset("botConfig", payload)
    return jsonify({"ok": True, "updatedAt": row.updated_at.isoformat() if row.updated_at else None})


DEFAULT_EXCHANGE_OPTIONS = {
    "jobTypes": [
        {"value": "editor", "label": "Редактор"},
        {"value": "sales", "label": "Продажник"},
        {"value": "buyer", "label": "Закупщик"},
        {"value": "designer", "label": "Дизайнер"},
        {"value": "motion_designer", "label": "Моушен-дизайнер"},
        {"value": "other", "label": "Другое"},
    ],
    "currencies": [
        {"value": "usd", "label": "доллары"},
        {"value": "rub", "label": "рубли"},
    ],
}


@admin_bp.route("/admin/api/config/exchange-options", methods=["GET"])
@require_login
@require_admin
def get_exchange_options_config():
    row = Dataset.query.filter_by(name="exchangeOptions").first()
    payload = _dataset_payload(row) if row else DEFAULT_EXCHANGE_OPTIONS
    if not isinstance(payload.get("jobTypes"), list):
        payload = dict(payload) if isinstance(payload, dict) else {}
        payload["jobTypes"] = DEFAULT_EXCHANGE_OPTIONS["jobTypes"]
    if not isinstance(payload.get("currencies"), list):
        payload = dict(payload) if isinstance(payload, dict) else {}
        payload["currencies"] = DEFAULT_EXCHANGE_OPTIONS["currencies"]
    return jsonify({"name": "exchangeOptions", "payload": payload})


@admin_bp.route("/admin/api/config/exchange-options", methods=["PUT"])
@require_login
@require_admin
def put_exchange_options_config():
    body = request.get_json(silent=True) or {}
    payload = body.get("payload")
    if not isinstance(payload, dict):
        return jsonify({"error": "Body must contain object field 'payload'"}), 400
    if not isinstance(payload.get("jobTypes"), list):
        return jsonify({"error": "payload.jobTypes must be an array"}), 400
    if not isinstance(payload.get("currencies"), list):
        return jsonify({"error": "payload.currencies must be an array"}), 400
    for i, item in enumerate(payload["jobTypes"]):
        if not isinstance(item, dict) or not isinstance(item.get("value"), str) or not isinstance(item.get("label"), str):
            return jsonify({"error": f"payload.jobTypes[{i}] must be {{value, label}}"}), 400
    for i, item in enumerate(payload["currencies"]):
        if not isinstance(item, dict) or not isinstance(item.get("value"), str) or not isinstance(item.get("label"), str):
            return jsonify({"error": f"payload.currencies[{i}] must be {{value, label}}"}), 400
    row = _upsert_dataset("exchangeOptions", payload)
    return jsonify({"ok": True, "updatedAt": row.updated_at.isoformat() if row.updated_at else None})


@admin_bp.route("/admin/api/config/bot/upload-photo", methods=["POST"])
@require_login
@require_admin
def upload_bot_welcome_photo():
    file = request.files.get("photo")
    if not file or not file.filename:
        return jsonify({"error": "Photo file is required"}), 400

    suffix = Path(file.filename).suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        return jsonify({"error": "Only jpg/jpeg/png/webp are supported"}), 400

    filename = f"{uuid4().hex}{suffix}"
    destination = _uploads_dir() / filename
    file.save(destination)
    public_url = _build_admin_public_url(f"/admin/uploads/{filename}")
    return jsonify({"ok": True, "url": public_url, "filename": filename})


def _create_multipart_form_data(fields, files):
    """Create multipart/form-data body for HTTP request."""
    boundary = uuid4().hex
    parts = []
    for key, value in fields.items():
        parts.append(f"--{boundary}\r\n".encode("utf-8"))
        parts.append(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode("utf-8"))
        parts.append(f"{value}\r\n".encode("utf-8"))
    for key, (filename, file_data, content_type) in files.items():
        parts.append(f"--{boundary}\r\n".encode("utf-8"))
        parts.append(
            f'Content-Disposition: form-data; name="{key}"; filename="{filename}"\r\n'.encode("utf-8")
        )
        parts.append(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
        parts.append(file_data)
        parts.append("\r\n".encode("utf-8"))
    parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    body = b"".join(parts)
    return boundary, body


@admin_bp.route("/admin/api/bot/send-message", methods=["POST"])
@require_login
@require_admin
def send_bot_message():
    token = os.getenv("BOT_TOKEN", "").strip()
    if not token:
        return jsonify({"error": "BOT_TOKEN is not configured on admin service"}), 500

    is_multipart = request.content_type and "multipart/form-data" in request.content_type
    photo_file = None
    message = ""
    telegram_id = ""
    send_to_all = False

    if is_multipart:
        photo_file = request.files.get("photo")
        message = str(request.form.get("message", "")).strip()
        telegram_id = str(request.form.get("telegramId", "")).strip()
        send_to_all = request.form.get("sendToAll", "").lower() == "true"
    else:
        body = request.get_json(silent=True) or {}
        message = str(body.get("message") or "").strip()
        telegram_id = str(body.get("telegramId") or "").strip()
        send_to_all = bool(body.get("sendToAll"))

    if not message and not photo_file:
        return jsonify({"error": "message or photo is required"}), 400

    if photo_file:
        if not photo_file.filename:
            return jsonify({"error": "Invalid photo file"}), 400
        suffix = Path(photo_file.filename).suffix.lower()
        if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
            return jsonify({"error": "Only image files are supported (jpg, jpeg, png, webp, gif)"}), 400
        photo_file.seek(0, os.SEEK_END)
        file_size = photo_file.tell()
        photo_file.seek(0)
        max_size = 10 * 1024 * 1024
        if file_size > max_size:
            return jsonify({"error": "Photo size must not exceed 10 MB"}), 400

    targets = []
    if send_to_all:
        try:
            users_data = _backend_get_json("/users")
            targets = [str(user.get("telegramId")) for user in users_data.get("users", []) if user.get("telegramId")]
        except Exception as exc:  # noqa: BLE001
            return jsonify({"error": f"Failed to load users list from backend: {exc}"}), 502
    elif telegram_id:
        targets = [telegram_id]
    else:
        return jsonify({"error": "telegramId is required when sendToAll=false"}), 400

    photo_data = None
    photo_filename = None
    photo_content_type = None
    if photo_file:
        photo_file.seek(0)
        photo_data = photo_file.read()
        photo_filename = photo_file.filename
        photo_content_type = photo_file.content_type or "image/jpeg"

    sent = 0
    failed = []
    for chat_id in sorted(set(targets)):
        try:
            if photo_file and photo_data:
                fields = {"chat_id": chat_id}
                if message:
                    fields["caption"] = message
                files = {"photo": (photo_filename, photo_data, photo_content_type)}
                boundary, body_data = _create_multipart_form_data(fields, files)
                req = Request(
                    f"https://api.telegram.org/bot{token}/sendPhoto",
                    data=body_data,
                    method="POST",
                    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
                )
            else:
                payload = json.dumps({"chat_id": chat_id, "text": message}, ensure_ascii=False).encode("utf-8")
                req = Request(
                    f"https://api.telegram.org/bot{token}/sendMessage",
                    data=payload,
                    method="POST",
                    headers={"Content-Type": "application/json"},
                )
            with urlopen(req, timeout=10) as response:
                response_data = json.loads(response.read().decode("utf-8"))
                if response_data.get("ok"):
                    sent += 1
                else:
                    failed.append({"telegramId": chat_id, "error": response_data})
        except Exception as exc:  # noqa: BLE001
            failed.append({"telegramId": chat_id, "error": str(exc)})

    return jsonify({"ok": True, "sent": sent, "failed": failed, "total": len(set(targets))})


@admin_bp.route("/admin/api/users", methods=["GET"])
@require_login
@require_admin
def admin_users_list():
    q = (request.args.get("q") or "").strip()
    try:
        data = _backend_get_json("/users", {"q": q})
        return jsonify({"users": data.get("users", [])})
    except (HTTPError, URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to fetch users from backend: {exc}"}), 502


@admin_bp.route("/admin/api/users/top", methods=["GET"])
@require_login
@require_admin
def admin_users_top():
    limit = request.args.get("limit", "10")
    try:
        data = _backend_get_json("/users/top", {"limit": limit})
        return jsonify(data)
    except (HTTPError, URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to fetch top users from backend: {exc}"}), 502


@admin_bp.route("/admin/api/users/<user_id>", methods=["GET"])
@require_login
@require_admin
def admin_users_get(user_id):
    try:
        data = _backend_get_json(f"/users/{user_id}")
        return jsonify(data)
    except HTTPError as exc:
        status = exc.code if exc.code else 502
        return jsonify({"error": f"Backend returned {status}"}), status
    except (URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to fetch user: {exc}"}), 502


@admin_bp.route("/admin/api/users/<user_id>/statistics", methods=["GET"])
@require_login
@require_admin
def admin_users_get_statistics(user_id):
    try:
        data = _backend_get_json(f"/users/{user_id}/statistics")
        return jsonify(data)
    except HTTPError as exc:
        status = exc.code if exc.code else 502
        return jsonify({"error": f"Backend returned {status}"}), status
    except (URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to fetch statistics: {exc}"}), 502


@admin_bp.route("/admin/api/users/<user_id>/rating-manual", methods=["PATCH"])
@require_login
@require_admin
def admin_users_patch_rating(user_id):
    body = request.get_json(silent=True) or {}
    rating_manual_delta = body.get("ratingManualDelta")
    if not isinstance(rating_manual_delta, (int, float)):
        return jsonify({"error": "ratingManualDelta must be a number"}), 400
    try:
        data = _backend_json(
            f"/users/{user_id}/rating-manual",
            "PATCH",
            {"ratingManualDelta": float(rating_manual_delta)},
        )
        return jsonify(data)
    except HTTPError as exc:
        status = exc.code if exc.code else 502
        return jsonify({"error": f"Backend returned {status}"}), status
    except (URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to update rating: {exc}"}), 502


@admin_bp.route("/admin/api/users/<user_id>/verified", methods=["PATCH"])
@require_login
@require_admin
def admin_users_patch_verified(user_id):
    body = request.get_json(silent=True) or {}
    verified = body.get("verified")
    if not isinstance(verified, bool):
        return jsonify({"error": "verified must be boolean"}), 400
    try:
        data = _backend_json(
            f"/users/{user_id}/verified",
            "PATCH",
            {"verified": verified},
        )
        return jsonify(data)
    except HTTPError as exc:
        status = exc.code if exc.code else 502
        return jsonify({"error": f"Backend returned {status}"}), status
    except (URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to update verification: {exc}"}), 502


@admin_bp.route("/admin/api/users/<user_id>/scam", methods=["PATCH"])
@require_login
@require_admin
def admin_users_patch_scam(user_id):
    body = request.get_json(silent=True) or {}
    is_scam = body.get("isScam")
    if not isinstance(is_scam, bool):
        return jsonify({"error": "isScam must be boolean"}), 400
    try:
        data = _backend_json(
            f"/users/{user_id}/scam",
            "PATCH",
            {"isScam": is_scam},
        )
        return jsonify(data)
    except HTTPError as exc:
        status = exc.code if exc.code else 502
        return jsonify({"error": f"Backend returned {status}"}), status
    except (URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to update SCAM flag: {exc}"}), 502


@admin_bp.route("/admin/api/users/<user_id>/blocked", methods=["PATCH"])
@require_login
@require_admin
def admin_users_patch_blocked(user_id):
    body = request.get_json(silent=True) or {}
    is_blocked = body.get("isBlocked")
    if not isinstance(is_blocked, bool):
        return jsonify({"error": "isBlocked must be boolean"}), 400
    try:
        data = _backend_json(
            f"/users/{user_id}/blocked",
            "PATCH",
            {"isBlocked": is_blocked},
        )
        return jsonify(data)
    except HTTPError as exc:
        status = exc.code if exc.code else 502
        return jsonify({"error": f"Backend returned {status}"}), status
    except (URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to update blocked flag: {exc}"}), 502


@admin_bp.route("/admin/api/labels", methods=["GET"])
@require_login
@require_admin
def admin_labels_list():
    try:
        data = _backend_get_json("/labels")
        return jsonify(data)
    except (HTTPError, URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to fetch labels from backend: {exc}"}), 502


@admin_bp.route("/admin/api/labels", methods=["POST"])
@require_login
@require_admin
def admin_labels_create():
    body = request.get_json(silent=True) or {}
    name = body.get("name")
    if not name or not isinstance(name, str):
        return jsonify({"error": "name is required and must be string"}), 400
    default_color = body.get("defaultColor")
    try:
        payload = {"name": name}
        if default_color:
            payload["defaultColor"] = default_color
        data = _backend_json("/labels", "POST", payload)
        return jsonify(data), 201
    except HTTPError as exc:
        status = exc.code if exc.code else 502
        return jsonify({"error": f"Backend returned {status}"}), status
    except (URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to create label: {exc}"}), 502


@admin_bp.route("/admin/api/labels/<label_id>", methods=["PATCH"])
@require_login
@require_admin
def admin_labels_update(label_id):
    body = request.get_json(silent=True) or {}
    payload = {}
    if "name" in body:
        if not isinstance(body["name"], str):
            return jsonify({"error": "name must be string"}), 400
        payload["name"] = body["name"]
    if "defaultColor" in body:
        if not isinstance(body["defaultColor"], str):
            return jsonify({"error": "defaultColor must be string"}), 400
        payload["defaultColor"] = body["defaultColor"]
    if not payload:
        return jsonify({"error": "At least one field (name or defaultColor) must be provided"}), 400
    try:
        data = _backend_json(f"/labels/{label_id}", "PATCH", payload)
        return jsonify(data)
    except HTTPError as exc:
        status = exc.code if exc.code else 502
        return jsonify({"error": f"Backend returned {status}"}), status
    except (URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to update label: {exc}"}), 502


@admin_bp.route("/admin/api/labels/<label_id>", methods=["DELETE"])
@require_login
@require_admin
def admin_labels_delete(label_id):
    try:
        data = _backend_json(f"/labels/{label_id}", "DELETE", {})
        return jsonify(data)
    except HTTPError as exc:
        status = exc.code if exc.code else 502
        return jsonify({"error": f"Backend returned {status}"}), status
    except (URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to delete label: {exc}"}), 502


@admin_bp.route("/admin/api/users/<user_id>/labels", methods=["GET"])
@require_login
@require_admin
def admin_users_labels_list(user_id):
    try:
        data = _backend_get_json(f"/users/{user_id}/labels")
        return jsonify(data)
    except (HTTPError, URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to fetch user labels from backend: {exc}"}), 502


@admin_bp.route("/admin/api/users/<user_id>/labels", methods=["POST"])
@require_login
@require_admin
def admin_users_labels_add(user_id):
    body = request.get_json(silent=True) or {}
    label_id = body.get("labelId")
    if not label_id or not isinstance(label_id, str):
        return jsonify({"error": "labelId is required and must be string"}), 400
    payload = {"labelId": label_id}
    if "customColor" in body:
        payload["customColor"] = body["customColor"]
    try:
        data = _backend_json(f"/users/{user_id}/labels", "POST", payload)
        return jsonify(data), 201
    except HTTPError as exc:
        status = exc.code if exc.code else 502
        return jsonify({"error": f"Backend returned {status}"}), status
    except (URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to add label to user: {exc}"}), 502


@admin_bp.route("/admin/api/users/<user_id>/labels/<label_id>", methods=["DELETE"])
@require_login
@require_admin
def admin_users_labels_remove(user_id, label_id):
    try:
        data = _backend_json(f"/users/{user_id}/labels/{label_id}", "DELETE", {})
        return jsonify(data)
    except HTTPError as exc:
        status = exc.code if exc.code else 502
        return jsonify({"error": f"Backend returned {status}"}), status
    except (URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to remove label from user: {exc}"}), 502


@admin_bp.route("/admin/api/users/<user_id>/labels/<label_id>", methods=["PATCH"])
@require_login
@require_admin
def admin_users_labels_update_color(user_id, label_id):
    body = request.get_json(silent=True) or {}
    payload = {}
    if "customColor" in body:
        payload["customColor"] = body["customColor"]
    if not payload:
        return jsonify({"error": "customColor must be provided"}), 400
    try:
        data = _backend_json(f"/users/{user_id}/labels/{label_id}", "PATCH", payload)
        return jsonify(data)
    except HTTPError as exc:
        status = exc.code if exc.code else 502
        return jsonify({"error": f"Backend returned {status}"}), status
    except (URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to update label color: {exc}"}), 502


@admin_bp.route("/admin/api/moderators", methods=["GET"])
@require_login
@require_admin
def list_moderators():
    _ensure_moderator_tables()
    try:
        rows = Moderator.query.order_by(Moderator.created_at.desc()).all()
    except OperationalError:
        _ensure_moderator_tables()
        rows = Moderator.query.order_by(Moderator.created_at.desc()).all()
    return jsonify({
        "moderators": [
            {"id": r.id, "label": r.label or "", "createdAt": r.created_at.isoformat() if r.created_at else None}
            for r in rows
        ]
    })


@admin_bp.route("/admin/api/moderators", methods=["POST"])
@require_login
@require_admin
def create_moderator():
    body = request.get_json(silent=True) or {}
    password = body.get("password")
    if not password or not isinstance(password, str):
        return jsonify({"error": "password is required"}), 400
    label = body.get("label")
    if label is not None and not isinstance(label, str):
        return jsonify({"error": "label must be string"}), 400
    label = (label or "").strip()
    mod = Moderator(
        label=label,
        password_hash=generate_password_hash(password),
    )
    db.session.add(mod)
    db.session.commit()
    return jsonify({
        "id": mod.id,
        "label": mod.label or "",
        "createdAt": mod.created_at.isoformat() if mod.created_at else None,
    }), 201


@admin_bp.route("/admin/api/moderators/<int:mod_id>", methods=["PATCH"])
@require_login
@require_admin
def update_moderator(mod_id):
    mod = Moderator.query.get(mod_id)
    if not mod:
        return jsonify({"error": "Moderator not found"}), 404
    body = request.get_json(silent=True) or {}
    if "password" in body and body["password"] is not None:
        pw = body["password"]
        if not isinstance(pw, str):
            return jsonify({"error": "password must be string"}), 400
        mod.password_hash = generate_password_hash(pw)
    if "label" in body:
        label = body["label"]
        if not isinstance(label, str):
            return jsonify({"error": "label must be string"}), 400
        mod.label = (label or "").strip()
    db.session.commit()
    return jsonify({
        "id": mod.id,
        "label": mod.label or "",
        "createdAt": mod.created_at.isoformat() if mod.created_at else None,
    })


@admin_bp.route("/admin/api/moderators/<int:mod_id>", methods=["DELETE"])
@require_login
@require_admin
def delete_moderator(mod_id):
    mod = Moderator.query.get(mod_id)
    if not mod:
        return jsonify({"error": "Moderator not found"}), 404
    db.session.delete(mod)
    db.session.commit()
    return jsonify({"ok": True})


@admin_bp.route("/admin/api/log", methods=["GET"])
@require_login
@require_admin
def admin_log():
    _ensure_moderator_tables()
    try:
        rows = (
            ModeratorActionLog.query
            .order_by(ModeratorActionLog.created_at.desc())
            .limit(200)
            .all()
        )
    except OperationalError:
        _ensure_moderator_tables()
        rows = (
            ModeratorActionLog.query
            .order_by(ModeratorActionLog.created_at.desc())
            .limit(200)
            .all()
        )
    mod_ids = {r.moderator_id for r in rows}
    moderators = {}
    if mod_ids:
        moderators = {m.id: (m.label or f"Модератор #{m.id}") for m in Moderator.query.filter(Moderator.id.in_(mod_ids)).all()}
    entries = []
    for r in rows:
        entries.append({
            "id": r.id,
            "moderatorLabel": moderators.get(r.moderator_id, f"#{r.moderator_id}"),
            "actionType": r.action_type,
            "requestId": r.request_id,
            "details": r.details,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
        })
    return jsonify({"entries": entries})


@admin_bp.route("/admin/api/support-requests", methods=["GET"])
@require_login
@require_admin
def admin_support_requests():
    try:
        data = _backend_get_json("/support/requests")
        return jsonify({"requests": data.get("requests", [])})
    except (HTTPError, URLError, ValueError) as exc:
        return jsonify({"error": str(exc)}), 502


@admin_bp.route("/admin/api/moderation/requests", methods=["GET"])
@require_login
def admin_moderation_list():
    status = (request.args.get("status") or "").strip()
    query = {"status": status} if status else None
    try:
        data = _backend_get_json("/moderation/requests", query)
        return jsonify({"requests": data.get("requests", [])})
    except (HTTPError, URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to load moderation requests: {exc}"}), 502


@admin_bp.route("/admin/api/moderation/requests/<request_id>", methods=["GET"])
@require_login
def admin_moderation_get(request_id):
    try:
        data = _backend_get_json(f"/moderation/requests/{request_id}")
        return jsonify(data)
    except HTTPError as exc:
        status = exc.code if exc.code else 502
        return jsonify({"error": f"Backend returned {status}"}), status
    except (URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to load moderation request: {exc}"}), 502


@admin_bp.route("/admin/api/moderation/requests/<request_id>", methods=["PATCH"])
@require_login
def admin_moderation_update(request_id):
    body = request.get_json(silent=True) or {}
    payload = {}
    if "formData" in body:
        if not isinstance(body.get("formData"), dict):
            return jsonify({"error": "formData must be object"}), 400
        payload["formData"] = body.get("formData")
    if "adminNote" in body:
        note = body.get("adminNote")
        if note is not None and not isinstance(note, str):
            return jsonify({"error": "adminNote must be null or string"}), 400
        payload["adminNote"] = note
    try:
        data = _backend_json(f"/moderation/requests/{request_id}", "PATCH", payload)
        _log_moderator_action("edit", request_id)
        return jsonify(data)
    except HTTPError as exc:
        status = exc.code if exc.code else 502
        return jsonify({"error": f"Backend returned {status}"}), status
    except (URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to update moderation request: {exc}"}), 502


@admin_bp.route("/admin/api/moderation/requests/<request_id>/reject", methods=["PATCH"])
@require_login
def admin_moderation_reject(request_id):
    body = request.get_json(silent=True) or {}
    payload = {"adminNote": body.get("adminNote")}
    try:
        data = _backend_json(f"/moderation/requests/{request_id}/reject", "PATCH", payload)
        _log_moderator_action("reject", request_id)
        return jsonify(data)
    except HTTPError as exc:
        status = exc.code if exc.code else 502
        return jsonify({"error": f"Backend returned {status}"}), status
    except (URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to reject moderation request: {exc}"}), 502


@admin_bp.route("/admin/api/moderation/requests/<request_id>/approve", methods=["PATCH"])
@require_login
def admin_moderation_approve(request_id):
    body = request.get_json(silent=True) or {}
    form_data = body.get("formData")
    admin_note = body.get("adminNote")

    try:
        current = _backend_get_json(f"/moderation/requests/{request_id}").get("request", {})
    except HTTPError as exc:
        status = exc.code if exc.code else 502
        return jsonify({"error": f"Backend returned {status}"}), status
    except (URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to load moderation request: {exc}"}), 502

    if current.get("status") == "approved" and current.get("publishedItemId"):
        _log_moderator_action("approve", request_id, {"alreadyApproved": True})
        return jsonify({"ok": True, "request": current, "alreadyApproved": True})

    if form_data is not None:
        if not isinstance(form_data, dict):
            return jsonify({"error": "formData must be object"}), 400
        try:
            _backend_json(
                f"/moderation/requests/{request_id}",
                "PATCH",
                {"formData": form_data, "adminNote": admin_note},
            )
            current = _backend_get_json(f"/moderation/requests/{request_id}").get("request", current)
        except HTTPError as exc:
            status = exc.code if exc.code else 502
            return jsonify({"error": f"Backend returned {status}"}), status
        except (URLError, ValueError) as exc:
            return jsonify({"error": f"Failed to update moderation request before publish: {exc}"}), 502

    section = current.get("section")
    dataset_name = MODERATION_SECTION_TO_DATASET.get(section)
    if not dataset_name:
        return jsonify({"error": f"Unsupported moderation section: {section}"}), 400
    if not isinstance(current.get("formData"), dict):
        return jsonify({"error": "Request formData is invalid"}), 400

    row = Dataset.query.filter_by(name=dataset_name).first()
    if not row:
        return jsonify({"error": f"Dataset '{dataset_name}' not found"}), 404
    payload = _dataset_payload(row)
    list_key, items = _extract_items(payload)
    new_item = _normalize_item_for_dataset(section, current.get("formData"))
    items.append(new_item)
    _save_dataset_items(row, list_key, items)

    # Update user username if provided in formData
    telegram_id = current.get("telegramId")
    form_data = current.get("formData", {})
    username_from_form = form_data.get("username")
    if telegram_id and username_from_form:
        try:
            username_clean = str(username_from_form).lstrip("@").strip()
            if username_clean:
                print(f"[Admin] Updating username for telegramId={telegram_id}, username={username_clean}")
                _backend_json(
                    "/users/track",
                    "POST",
                    {"telegramId": telegram_id, "username": username_clean},
                )
                print(f"[Admin] Successfully updated username for telegramId={telegram_id}")
        except Exception as e:
            # Log error but don't fail the approval
            print(f"[Admin] Failed to update username for telegramId={telegram_id}: {e}")
            pass

    try:
        approved = _backend_json(
            f"/moderation/requests/{request_id}/approve",
            "PATCH",
            {"publishedItemId": new_item.get("id"), "adminNote": admin_note},
        )
        _log_moderator_action("approve", request_id)
        return jsonify({"ok": True, "publishedItem": new_item, "request": approved.get("request")})
    except HTTPError as exc:
        status = exc.code if exc.code else 502
        return jsonify({"error": f"Backend returned {status}"}), status
    except (URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to approve moderation request: {exc}"}), 502
