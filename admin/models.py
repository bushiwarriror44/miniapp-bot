import json
import os
from datetime import datetime

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class AppState(db.Model):
    __tablename__ = "app_state"

    key = db.Column(db.String(100), primary_key=True)
    value = db.Column(db.Text, nullable=False, default="")
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class Dataset(db.Model):
    __tablename__ = "datasets"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    payload = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class Moderator(db.Model):
    __tablename__ = "moderators"

    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(200), nullable=True, default="")
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class ModeratorActionLog(db.Model):
    __tablename__ = "moderator_action_log"

    id = db.Column(db.Integer, primary_key=True)
    moderator_id = db.Column(db.Integer, db.ForeignKey("moderators.id"), nullable=False)
    action_type = db.Column(db.String(50), nullable=False)
    request_id = db.Column(db.String(100), nullable=True)
    details = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


DATASET_FILES = {
    "ads": "ads.json",
    "buyAds": "buyAds.json",
    "buyChannels": "buyChannels.json",
    "hotOffers": "hot-offers.json",
    "jobs": "jobs.json",
    "other": "other.json",
    "sellChannels": "sellChannels.json",
    "services": "services.json",
    "topUsers": "top-users.json",
}

DEFAULT_DATASETS = {
    "mainPage": {
        "hotOffers": {
            "offers": [
                {
                    "id": "1",
                    "title": "BTC → USDT",
                    "price": "97 250",
                    "subtitle": "Быстрый обмен, низкая комиссия",
                },
                {
                    "id": "2",
                    "title": "ETH → USDT",
                    "price": "3 420",
                    "subtitle": "Мгновенное зачисление",
                },
                {
                    "id": "3",
                    "title": "TON → USDT",
                    "price": "5.12",
                    "subtitle": "Выгодный курс",
                },
            ]
        },
        "news": {
            "channelUrl": "https://t.me/your_channel",
        },
    },
    "guarantConfig": {
        "guarantor": {
            "username": "autogarant_example",
            "displayName": "Гарант miniapp-bot",
            "profileLink": "https://t.me/autogarant_example",
        },
        "commissionTiers": [
            "До 100 000 ₽ — 5% от суммы сделки",
            "От 100 000 ₽ до 500 000 ₽ — 4% от суммы сделки",
            "Свыше 500 000 ₽ — 3% от суммы сделки (обсуждается индивидуально)",
        ],
        "aboutText": "Автогарант сейчас находится в разработке, сейчас гарант доступен в ручном режиме.",
    },
    "faq": {
        "items": [
            {
                "id": "what-is-miniapp",
                "title": "Что такое miniapp-bot?",
                "text": "Это мини‑приложение в Telegram для размещения объявлений, поиска рекламы, работы и услуг, а также безопасных сделок через гаранта.",
            },
            {
                "id": "how-guarant-works",
                "title": "Как работает гарант?",
                "text": "Средства блокируются до тех пор, пока обе стороны не подтвердят выполнение условий сделки.",
            },
            {
                "id": "how-to-add-ad",
                "title": "Как добавить объявление?",
                "text": "Перейдите в раздел Биржа, выберите подходящую категорию и заполните форму объявления. После сохранения объявление сразу появится в списке.",
            },
            {
                "id": "how-rating-works",
                "title": "Как формируется рейтинг пользователя?",
                "text": "Рейтинг рассчитывается автоматически по активности и сделкам. Администратор может вручную скорректировать итоговое значение.",
            },
            {
                "id": "is-verification-required",
                "title": "Нужна ли верификация?",
                "text": "Верификация не обязательна, но повышает доверие к профилю и может положительно влиять на приоритет размещения.",
            },
            {
                "id": "support-contact",
                "title": "Куда обратиться при проблеме?",
                "text": "Используйте кнопку обращения в поддержку в профиле или напишите администратору через Telegram-ссылку в приложении.",
            },
        ]
    },
    "botConfig": {
        "welcomeMessage": "Привет! Это Telegram Mini App бот. Нажми кнопку ниже, чтобы открыть мини‑приложение.",
        "welcomePhotoUrl": None,
        "supportLink": "https://t.me/miniapp_admin_example",
    },
    "exchangeOptions": {
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
    },
}


def _load_json_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _upsert_state(key, value):
    row = AppState.query.filter_by(key=key).first()
    if row:
        row.value = value
    else:
        row = AppState(key=key, value=value)
        db.session.add(row)
    return row


def _has_state(key):
    return AppState.query.filter_by(key=key).first() is not None


def migrate_datasets_from_frontend(project_root, overwrite_existing=False):
    data_dir = os.path.join(project_root, "frontend", "src", "shared", "data")
    if not os.path.isdir(data_dir):
        return {"migrated": [], "skipped": sorted(set(DATASET_FILES.keys()) | set(DEFAULT_DATASETS.keys()))}

    migrated = []
    skipped = []

    for dataset_name, file_name in DATASET_FILES.items():
        file_path = os.path.join(data_dir, file_name)
        if not os.path.isfile(file_path):
            skipped.append(dataset_name)
            continue

        existing = Dataset.query.filter_by(name=dataset_name).first()
        if existing and not overwrite_existing:
            skipped.append(dataset_name)
            continue

        payload = _load_json_file(file_path)
        payload_json = json.dumps(payload, ensure_ascii=False)
        if existing:
            existing.payload = payload_json
        else:
            db.session.add(Dataset(name=dataset_name, payload=payload_json))
        migrated.append(dataset_name)

    for dataset_name, payload in DEFAULT_DATASETS.items():
        existing = Dataset.query.filter_by(name=dataset_name).first()
        if existing and not overwrite_existing:
            skipped.append(dataset_name)
            continue
        payload_json = json.dumps(payload, ensure_ascii=False)
        if existing:
            existing.payload = payload_json
        else:
            db.session.add(Dataset(name=dataset_name, payload=payload_json))
        migrated.append(dataset_name)
    
        db.session.commit()
    return {"migrated": sorted(set(migrated)), "skipped": sorted(set(skipped))}


def seed_datasets_once(project_root):
    """
    One-time bootstrap seed:
    - Runs only once per DB lifetime.
    - Never re-seeds after marker is set, so admins can freely edit/delete data.
    """
    marker_key = "json_seed_v1_done"
    if _has_state(marker_key):
        return {"status": "already-seeded", "migrated": []}

    result = migrate_datasets_from_frontend(project_root, overwrite_existing=False)
    _upsert_state(marker_key, datetime.utcnow().isoformat())
    db.session.commit()
    return {"status": "seeded", **result}


def init_all_models(project_root):
    db.create_all()
    seed_datasets_once(project_root)
