import json
import os
from datetime import datetime

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Dataset(db.Model):
    __tablename__ = "datasets"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    payload = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


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
}


def _load_json_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def seed_datasets_from_frontend(project_root):
    data_dir = os.path.join(project_root, "frontend", "src", "shared", "data")
    if not os.path.isdir(data_dir):
        return

    for dataset_name, file_name in DATASET_FILES.items():
        file_path = os.path.join(data_dir, file_name)
        if not os.path.isfile(file_path):
            continue

        existing = Dataset.query.filter_by(name=dataset_name).first()
        if existing:
            continue

        payload = _load_json_file(file_path)
        db.session.add(
            Dataset(name=dataset_name, payload=json.dumps(payload, ensure_ascii=False))
        )

    for dataset_name, payload in DEFAULT_DATASETS.items():
        existing = Dataset.query.filter_by(name=dataset_name).first()
        if existing:
            continue
        db.session.add(
            Dataset(name=dataset_name, payload=json.dumps(payload, ensure_ascii=False))
        )

    db.session.commit()


def init_all_models(project_root):
    db.create_all()
    seed_datasets_from_frontend(project_root)
