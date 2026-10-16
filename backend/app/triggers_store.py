import json
import os
from pathlib import Path
from typing import Any

from .config import settings
from .models import SensorRange, TriggerConfig

DEFAULT_TRIGGERS = {
    "temperature": {"min": 10.0, "max": 18.0},
    "humidity": {"min": 60.0, "max": 80.0},
    "luminosity": {"min": 0.0, "max": 20.0},
}


def _get_file_path() -> Path:
    # Resolve relative to backend directory
    base_dir = Path(__file__).resolve().parent.parent
    path = base_dir / settings.triggers_file_path
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _load_all() -> dict[str, Any]:
    file_path = _get_file_path()
    if not file_path.exists():
        # Initialize default for vintrace001
        initial = {"vintrace001": DEFAULT_TRIGGERS}
        _save_all(initial)
        return initial
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not isinstance(data, dict):
                return {}
            return data
    except Exception:
        return {}


def _save_all(data: dict[str, Any]) -> None:
    file_path = _get_file_path()
    temp_path = file_path.with_suffix(".tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    temp_path.replace(file_path)


def get_device_triggers(device_id: str) -> TriggerConfig:
    all_triggers = _load_all()
    device_data = all_triggers.get(device_id)
    if not device_data:
        # Retorna default e salva
        cfg = TriggerConfig(
            temperature=SensorRange(**DEFAULT_TRIGGERS["temperature"]),
            humidity=SensorRange(**DEFAULT_TRIGGERS["humidity"]),
            luminosity=SensorRange(**DEFAULT_TRIGGERS["luminosity"]),
        )
        save_device_triggers(device_id, cfg)
        return cfg
    return TriggerConfig(
        temperature=SensorRange(**device_data["temperature"]),
        humidity=SensorRange(**device_data["humidity"]),
        luminosity=SensorRange(**device_data["luminosity"]),
    )


def save_device_triggers(device_id: str, triggers: TriggerConfig) -> None:
    all_triggers = _load_all()
    all_triggers[device_id] = triggers.model_dump()
    _save_all(all_triggers)


def delete_device_triggers(device_id: str) -> bool:
    all_triggers = _load_all()
    if device_id in all_triggers:
        del all_triggers[device_id]
        _save_all(all_triggers)
        return True
    return False


def list_devices_with_triggers() -> list[str]:
    return list(_load_all().keys())
