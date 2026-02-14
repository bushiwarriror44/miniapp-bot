import json
import os
from functools import wraps
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from uuid import uuid4

from flask import (
    Blueprint,
    jsonify,
    redirect,
    render_template,
    request,
    send_from_directory,
    session,
    url_for,
)

from models import Dataset, db

admin_bp = Blueprint("admin", __name__)

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://127.0.0.1:3001")
EXCHANGE_CATEGORIES = [
    "ads",
    "buyAds",
    "jobs",
    "services",
    "sellChannels",
    "buyChannels",
    "other",
]


def is_logged_in():
    return bool(session.get("admin_logged_in"))


def require_login(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not is_logged_in():
            return redirect(url_for("admin.admin_login"))
        return fn(*args, **kwargs)

    return wrapper


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
    return render_template("admin_panel.html")


@admin_bp.route("/admin/api/categories", methods=["GET"])
@require_login
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
def category_items(category):
    row = Dataset.query.filter_by(name=category).first()
    if not row:
        return jsonify({"error": "Category not found"}), 404
    payload = _dataset_payload(row)
    list_key, items = _extract_items(payload)
    return jsonify({"category": category, "listKey": list_key, "items": items})


@admin_bp.route("/admin/api/categories/<category>/items", methods=["POST"])
@require_login
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
    return jsonify({"ok": True, "item": item}), 201


@admin_bp.route("/admin/api/categories/<category>/items/<item_id>", methods=["PUT"])
@require_login
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
def dashboard_main():
    return jsonify(
        {
            "usersCount": _get_users_count(),
            "activeAdsTotal": _get_active_ads_total(),
        }
    )


@admin_bp.route("/admin/api/config/main-page", methods=["GET"])
@require_login
def get_main_page_config():
    row = Dataset.query.filter_by(name="mainPage").first()
    payload = _dataset_payload(row) if row else {}
    return jsonify({"name": "mainPage", "payload": payload})


@admin_bp.route("/admin/api/config/main-page", methods=["PUT"])
@require_login
def put_main_page_config():
    body = request.get_json(silent=True) or {}
    payload = body.get("payload")
    if not isinstance(payload, dict):
        return jsonify({"error": "Body must contain object field 'payload'"}), 400
    row = _upsert_dataset("mainPage", payload)
    return jsonify({"ok": True, "updatedAt": row.updated_at.isoformat() if row.updated_at else None})


@admin_bp.route("/admin/api/config/guarant", methods=["GET"])
@require_login
def get_guarant_config():
    row = Dataset.query.filter_by(name="guarantConfig").first()
    payload = _dataset_payload(row) if row else {}
    return jsonify({"name": "guarantConfig", "payload": payload})


@admin_bp.route("/admin/api/config/guarant", methods=["PUT"])
@require_login
def put_guarant_config():
    body = request.get_json(silent=True) or {}
    payload = body.get("payload")
    if not isinstance(payload, dict):
        return jsonify({"error": "Body must contain object field 'payload'"}), 400
    row = _upsert_dataset("guarantConfig", payload)
    return jsonify({"ok": True, "updatedAt": row.updated_at.isoformat() if row.updated_at else None})


@admin_bp.route("/admin/api/config/faq", methods=["GET"])
@require_login
def get_faq_config():
    row = Dataset.query.filter_by(name="faq").first()
    payload = _dataset_payload(row) if row else {"items": []}
    return jsonify({"name": "faq", "payload": payload})


@admin_bp.route("/admin/api/config/faq", methods=["PUT"])
@require_login
def put_faq_config():
    body = request.get_json(silent=True) or {}
    payload = body.get("payload")
    if not isinstance(payload, dict):
        return jsonify({"error": "Body must contain object field 'payload'"}), 400
    if not isinstance(payload.get("items"), list):
        return jsonify({"error": "payload.items must be an array"}), 400
    row = _upsert_dataset("faq", payload)
    return jsonify({"ok": True, "updatedAt": row.updated_at.isoformat() if row.updated_at else None})


@admin_bp.route("/admin/api/users", methods=["GET"])
@require_login
def admin_users_list():
    q = (request.args.get("q") or "").strip()
    try:
        data = _backend_get_json("/users", {"q": q})
        return jsonify({"users": data.get("users", [])})
    except (HTTPError, URLError, ValueError) as exc:
        return jsonify({"error": f"Failed to fetch users from backend: {exc}"}), 502


@admin_bp.route("/admin/api/users/<user_id>", methods=["GET"])
@require_login
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
