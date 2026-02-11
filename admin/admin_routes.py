import json
import os
from functools import wraps
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
    rows = Dataset.query.order_by(Dataset.name.asc()).all()
    result = []
    for row in rows:
        payload = _dataset_payload(row)
        list_key, items = _extract_items(payload)
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
        _, items = _extract_items(payload)
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
