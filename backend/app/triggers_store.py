import json
from pathlib import Path
from typing import Any

import httpx

from .config import settings
from .fiware import device_id_to_urn
from .models import SensorRange, TriggerConfig


DEFAULT_TRIGGERS = {
    "temperature": {"min": 10.0, "max": 18.0},
    "humidity": {"min": 60.0, "max": 80.0},
    "luminosity": {"min": 0.0, "max": 20.0},
}

TRIGGER_ATTRIBUTES = {
    "temperature": {
        "min": "triggerTemperatureMin",
        "max": "triggerTemperatureMax",
    },
    "humidity": {
        "min": "triggerHumidityMin",
        "max": "triggerHumidityMax",
    },
    "luminosity": {
        "min": "triggerLuminosityMin",
        "max": "triggerLuminosityMax",
    },
}


def default_trigger_config() -> TriggerConfig:
    return TriggerConfig(
        temperature=SensorRange(**DEFAULT_TRIGGERS["temperature"]),
        humidity=SensorRange(**DEFAULT_TRIGGERS["humidity"]),
        luminosity=SensorRange(**DEFAULT_TRIGGERS["luminosity"]),
    )


def _get_file_path() -> Path:
    base_dir = Path(__file__).resolve().parent.parent
    path = base_dir / settings.triggers_file_path
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _load_all() -> dict[str, Any]:
    file_path = _get_file_path()

    if not file_path.exists():
        initial = {"vintrace001": DEFAULT_TRIGGERS}
        _save_all(initial)
        return initial

    try:
        with open(file_path, "r", encoding="utf-8") as file:
            data = json.load(file)
            return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def _save_all(data: dict[str, Any]) -> None:
    file_path = _get_file_path()
    temp_path = file_path.with_suffix(".tmp")

    with open(temp_path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)

    temp_path.replace(file_path)


def _get_local_triggers(device_id: str) -> TriggerConfig:
    all_triggers = _load_all()
    device_data = all_triggers.get(device_id)

    if not device_data:
        config = default_trigger_config()
        all_triggers[device_id] = config.model_dump()
        _save_all(all_triggers)
        return config

    try:
        return TriggerConfig(**device_data)
    except Exception:
        return default_trigger_config()


def _save_local_triggers(device_id: str, triggers: TriggerConfig) -> None:
    all_triggers = _load_all()
    all_triggers[device_id] = triggers.model_dump()
    _save_all(all_triggers)


def _fiware_headers(content_type: bool = False) -> dict[str, str]:
    headers = {
        "Fiware-Service": settings.fiware_service,
        "Fiware-ServicePath": settings.fiware_service_path,
        "Accept": "application/json",
    }

    if content_type:
        headers["Content-Type"] = "application/json"

    return headers


def _trigger_storage_is_fiware() -> bool:
    return settings.trigger_storage.strip().lower() == "fiware"


def _extract_number(entity: dict[str, Any], attribute_name: str) -> float | None:
    attribute = entity.get(attribute_name)

    if not isinstance(attribute, dict):
        return None

    value = attribute.get("value")

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _trigger_config_from_entity(entity: dict[str, Any]) -> TriggerConfig | None:
    values: dict[str, dict[str, float]] = {}

    for sensor, names in TRIGGER_ATTRIBUTES.items():
        minimum = _extract_number(entity, names["min"])
        maximum = _extract_number(entity, names["max"])

        # Zero is a valid trigger value, so only None means "missing".
        if minimum is None or maximum is None:
            return None

        values[sensor] = {
            "min": minimum,
            "max": maximum,
        }

    try:
        return TriggerConfig(**values)
    except Exception:
        return None


def _trigger_attributes_payload(triggers: TriggerConfig) -> dict[str, Any]:
    return {
        "triggerTemperatureMin": {
            "type": "Number",
            "value": triggers.temperature.min,
        },
        "triggerTemperatureMax": {
            "type": "Number",
            "value": triggers.temperature.max,
        },
        "triggerHumidityMin": {
            "type": "Number",
            "value": triggers.humidity.min,
        },
        "triggerHumidityMax": {
            "type": "Number",
            "value": triggers.humidity.max,
        },
        "triggerLuminosityMin": {
            "type": "Number",
            "value": triggers.luminosity.min,
        },
        "triggerLuminosityMax": {
            "type": "Number",
            "value": triggers.luminosity.max,
        },
    }


async def _read_device_entity(device_id: str) -> dict[str, Any] | None:
    urn = device_id_to_urn(device_id)
    url = (
        f"{settings.fiware_base_url.rstrip('/')}"
        f"/v2/entities/{urn}?type={settings.entity_type}"
    )

    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get(url, headers=_fiware_headers())

    if response.status_code == 404:
        return None

    response.raise_for_status()
    return response.json()


async def _read_fiware_triggers(device_id: str) -> TriggerConfig | None:
    entity = await _read_device_entity(device_id)

    if entity is None:
        return None

    return _trigger_config_from_entity(entity)


async def _ensure_device_exists(device_id: str) -> None:
    entity = await _read_device_entity(device_id)

    if entity is None:
        raise RuntimeError(
            f"Dispositivo '{device_id}' não encontrado no Orion."
        )


async def _persist_fiware_triggers(
    device_id: str,
    triggers: TriggerConfig,
) -> None:
    """Cria ou atualiza os atributos de trigger na própria entidade VinTrace.

    POST /v2/entities/{id}/attrs cria atributos ausentes e atualiza atributos
    existentes. Essa é a mesma entidade que já contém temperature, humidity e
    luminosity, evitando uma segunda entidade de configuração desnecessária.
    """
    urn = device_id_to_urn(device_id)
    url = (
        f"{settings.fiware_base_url.rstrip('/')}"
        f"/v2/entities/{urn}/attrs?type={settings.entity_type}"
    )

    async with httpx.AsyncClient(timeout=6.0) as client:
        response = await client.post(
            url,
            headers=_fiware_headers(content_type=True),
            json=_trigger_attributes_payload(triggers),
        )

    if response.status_code not in (204,):
        raise RuntimeError(
            "Falha ao persistir triggers no Orion: "
            f"HTTP {response.status_code} - {response.text[:300]}"
        )

    saved = await _read_fiware_triggers(device_id)

    if saved is None or saved.model_dump() != triggers.model_dump():
        raise RuntimeError(
            "O Orion aceitou a gravação, mas a leitura de verificação não "
            "retornou os mesmos triggers."
        )


async def get_device_triggers(device_id: str) -> TriggerConfig:
    """Obtém triggers do Orion em produção e usa JSON local em desenvolvimento."""
    local_config = _get_local_triggers(device_id)

    if not _trigger_storage_is_fiware():
        return local_config

    try:
        fiware_config = await _read_fiware_triggers(device_id)

        if fiware_config is not None:
            _save_local_triggers(device_id, fiware_config)
            return fiware_config
    except (httpx.HTTPError, RuntimeError):
        return local_config

    return local_config


async def triggers_are_persisted(device_id: str) -> bool:
    """True somente quando os seis atributos de trigger existem no Orion."""
    if not _trigger_storage_is_fiware():
        return True

    try:
        return await _read_fiware_triggers(device_id) is not None
    except (httpx.HTTPError, RuntimeError):
        return False


async def save_device_triggers(
    device_id: str,
    triggers: TriggerConfig,
) -> str:
    """Persiste triggers e retorna onde foram gravados: local ou fiware."""
    if not _trigger_storage_is_fiware():
        _save_local_triggers(device_id, triggers)
        return "local"

    try:
        await _ensure_device_exists(device_id)
        await _persist_fiware_triggers(device_id, triggers)
    except httpx.HTTPError as exc:
        raise RuntimeError(
            f"Falha de comunicação com Orion ao salvar triggers: {exc}"
        ) from exc

    _save_local_triggers(device_id, triggers)
    return "fiware"


async def delete_device_trigger_config(device_id: str) -> None:
    """Compatibilidade com main.py.

    Os triggers agora ficam na própria entidade do dispositivo, que é removida
    logo em seguida por delete_device_fiware(). Portanto não há uma segunda
    entidade de configuração para excluir.
    """
    return None


def delete_device_triggers(device_id: str) -> bool:
    """Remove o cache local dos triggers."""
    all_triggers = _load_all()

    if device_id not in all_triggers:
        return False

    del all_triggers[device_id]
    _save_all(all_triggers)
    return True
