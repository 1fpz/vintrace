"""FIWARE Integration Layer for VinTrace.
Connects to Orion Context Broker (1026), IoT Agent UltraLight (4041) and STH-Comet (8666).
"""
import re
from datetime import datetime, timezone, timedelta
from typing import Any
import httpx
from zoneinfo import ZoneInfo

from .config import settings
from .models import (
    CurrentReading,
    DeviceItem,
    EnvironmentalIncident,
    HistoryPoint,
    HistorySeries,
    TriggerConfig,
    WineMemoryResponse,
)

BR_TZ = ZoneInfo("America/Sao_Paulo")

def device_id_to_urn(device_id: str) -> str:
    """Standardizes device_id into NGSI-LD URN.
    vintrace001 -> urn:ngsi-ld:VinTrace:001
    vintrace002 -> urn:ngsi-ld:VinTrace:002
    """
    if device_id.startswith("urn:ngsi-ld:"):
        return device_id

    dev_lower = device_id.lower()
    if dev_lower.startswith("vintrace"):
        suffix = device_id[len("vintrace"):]
        if suffix:
            return f"urn:ngsi-ld:VinTrace:{suffix}"
    return f"urn:ngsi-ld:VinTrace:{device_id}"


def urn_to_device_id(urn: str) -> str:
    """Extracts device_id from URN."""
    if ":" in urn:
        suffix = urn.split(":")[-1]
        if suffix.isdigit():
            return f"vintrace{suffix}"
        return suffix
    return urn


def _fiware_headers() -> dict[str, str]:
    return {
        "Fiware-Service": settings.fiware_service,
        "Fiware-ServicePath": settings.fiware_service_path,
        "Accept": "application/json",
    }

def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


def _sensor_last_update(entity: dict[str, Any]) -> datetime | None:
    dates: list[datetime] = []

    for attr_name in ("temperature", "humidity", "luminosity"):
        attr = entity.get(attr_name)

        if not isinstance(attr, dict):
            continue

        metadata = attr.get("metadata", {})
        time_instant = metadata.get("TimeInstant")

        if isinstance(time_instant, dict):
            raw_value = time_instant.get("value")
        else:
            raw_value = time_instant

        parsed = _parse_datetime(raw_value)

        if parsed:
            dates.append(parsed)

    return max(dates) if dates else None


def _device_is_online(entity: dict[str, Any]) -> bool:
    last_update = _sensor_last_update(entity)

    if not last_update:
        return False

    seconds = (
        datetime.now(timezone.utc)
        - last_update.astimezone(timezone.utc)
    ).total_seconds()

    return seconds <= 60


async def check_fiware_health() -> dict[str, Any]:
    """Inspects health of Orion, IoT Agent, and STH-Comet."""
    results = {
        "orion": {"status": "offline", "url": settings.fiware_base_url, "details": None},
        "iot_agent": {"status": "offline", "url": settings.iot_agent_url, "details": None},
        "sth_comet": {"status": "offline", "url": settings.sth_comet_url, "details": None},
        "overall": "degraded",
    }

    async with httpx.AsyncClient(timeout=4.0) as client:
        # 1. Orion check
        try:
            r = await client.get(f"{settings.fiware_base_url.rstrip('/')}/version")
            if r.status_code == 200:
                results["orion"] = {"status": "online", "url": settings.fiware_base_url, "details": r.json()}
        except Exception as exc:
            results["orion"]["details"] = str(exc)

        # 2. IoT Agent check
        try:
            r = await client.get(f"{settings.iot_agent_url.rstrip('/')}/iot/about")
            if r.status_code == 200:
                results["iot_agent"] = {"status": "online", "url": settings.iot_agent_url, "details": r.json()}
            else:
                r2 = await client.get(f"{settings.iot_agent_url.rstrip('/')}/version")
                if r2.status_code == 200:
                    results["iot_agent"] = {"status": "online", "url": settings.iot_agent_url, "details": r2.json()}
        except Exception as exc:
            results["iot_agent"]["details"] = str(exc)

        # 3. STH-Comet check
        try:
            r = await client.get(f"{settings.sth_comet_url.rstrip('/')}/version")
            if r.status_code == 200:
                results["sth_comet"] = {"status": "online", "url": settings.sth_comet_url, "details": r.json()}
        except Exception as exc:
            results["sth_comet"]["details"] = str(exc)

    online_count = sum(1 for k in ("orion", "iot_agent", "sth_comet") if results[k]["status"] == "online")
    if online_count == 3:
        results["overall"] = "healthy"
    elif online_count == 0:
        results["overall"] = "unreachable"
    else:
        results["overall"] = "partial"

    return results


async def register_device_fiware(device_id: str, name: str, location: str) -> dict[str, Any]:
    """Registers device in IoT Agent with attributes t/h/l and commands alertTemp/alertHum/alertLum."""
    urn = device_id_to_urn(device_id)
    headers = {
        **_fiware_headers(),
        "Content-Type": "application/json",
    }

    iot_payload = {
        "devices": [
            {
                "device_id": device_id,
                "entity_name": urn,
                "entity_type": settings.entity_type,
                "timezone": "America/Sao_Paulo",
                "attributes": [
                    {"object_id": "t", "name": "temperature", "type": "Number"},
                    {"object_id": "h", "name": "humidity", "type": "Number"},
                    {"object_id": "l", "name": "luminosity", "type": "Number"},
                ],
                "commands": [
                    {"name": "alertTemp", "type": "command"},
                    {"name": "alertHum", "type": "command"},
                    {"name": "alertLum", "type": "command"},
                ],
                "static_attributes": [
                    {"name": "name", "type": "Text", "value": name},
                    {"name": "location", "type": "Text", "value": location},
                    {"name": "deviceId", "type": "Text", "value": device_id},
                ],
            }
        ]
    }

    async with httpx.AsyncClient(timeout=8.0) as client:
        # Register in IoT Agent
        iot_url = f"{settings.iot_agent_url.rstrip('/')}/iot/devices"
        try:
            r_iot = await client.post(iot_url, headers=headers, json=iot_payload)
            # If 409 (already exists), update it or ignore
        except httpx.HTTPError:
            pass

        # Ensure Orion has static metadata and entity structure
        orion_entity_url = f"{settings.fiware_base_url.rstrip('/')}/v2/entities/{urn}/attrs"
        orion_update_payload = {
            "name": {"type": "Text", "value": name},
            "location": {"type": "Text", "value": location},
            "deviceId": {"type": "Text", "value": device_id},
        }
        try:
            await client.post(orion_entity_url, headers=headers, json=orion_update_payload)
        except httpx.HTTPError:
            # If entity does not exist in Orion, create it directly
            create_url = f"{settings.fiware_base_url.rstrip('/')}/v2/entities"
            create_payload = {
                "id": urn,
                "type": settings.entity_type,
                "name": {"type": "Text", "value": name},
                "location": {"type": "Text", "value": location},
                "deviceId": {"type": "Text", "value": device_id},
                "temperature": {"type": "Number", "value": 0.0},
                "humidity": {"type": "Number", "value": 0.0},
                "luminosity": {"type": "Number", "value": 0.0},
            }
            try:
                await client.post(create_url, headers=headers, json=create_payload)
            except Exception:
                pass

    return {
        "device_id": device_id,
        "entity_urn": urn,
        "name": name,
        "location": location,
        "registered": True,
    }


async def delete_device_fiware(device_id: str) -> bool:
    """Removes device from IoT Agent and Orion Context Broker."""
    urn = device_id_to_urn(device_id)
    headers = _fiware_headers()

    async with httpx.AsyncClient(timeout=6.0) as client:
        # 1. IoT Agent delete
        try:
            iot_url = f"{settings.iot_agent_url.rstrip('/')}/iot/devices/{device_id}"
            await client.delete(iot_url, headers=headers)
        except Exception:
            pass

        # 2. Orion delete
        try:
            orion_url = f"{settings.fiware_base_url.rstrip('/')}/v2/entities/{urn}?type={settings.entity_type}"
            await client.delete(orion_url, headers=headers)
        except Exception:
            pass

    return True


async def list_devices_fiware() -> list[DeviceItem]:
    """Fetches real devices from Orion Context Broker."""
    headers = _fiware_headers()
    orion_url = f"{settings.fiware_base_url.rstrip('/')}/v2/entities?type={settings.entity_type}&limit=100"

    items: list[DeviceItem] = []
    async with httpx.AsyncClient(timeout=6.0) as client:
        try:
            r = await client.get(orion_url, headers=headers)
            if r.status_code == 200:
                entities = r.json()
                for entity in entities:
                    urn = entity.get("id", "")
                    dev_id = urn_to_device_id(urn)
                    if "deviceId" in entity and isinstance(entity["deviceId"], dict):
                        dev_id = entity["deviceId"].get("value", dev_id)

                    name = dev_id
                    if "name" in entity and isinstance(entity["name"], dict):
                        name = entity["name"].get("value", dev_id)

                    location = "Laboratório"
                    if "location" in entity and isinstance(entity["location"], dict):
                        location = entity["location"].get("value", location)

                    temp = 0.0
                    if "temperature" in entity and isinstance(entity["temperature"], dict):
                        val = entity["temperature"].get("value")
                        if val is not None:
                            try:
                                temp = float(val)
                            except (ValueError, TypeError):
                                pass

                    hum = 0.0
                    if "humidity" in entity and isinstance(entity["humidity"], dict):
                        val = entity["humidity"].get("value")
                        if val is not None:
                            try:
                                hum = float(val)
                            except (ValueError, TypeError):
                                pass

                    lum = 0.0
                    if "luminosity" in entity and isinstance(entity["luminosity"], dict):
                        val = entity["luminosity"].get("value")
                        if val is not None:
                            try:
                                lum = float(val)
                            except (ValueError, TypeError):
                                pass

                    # Device is considered online if it has valid readings
                    online = _device_is_online(entity)

                    items.append(
                        DeviceItem(
                            id=dev_id,
                            name=name,
                            location=location,
                            online=online,
                            temperature=round(temp, 1),
                            humidity=round(hum, 1),
                            luminosity=round(lum, 1),
                        )
                    )
        except Exception:
            pass

    return items


async def get_current_reading(device_id: str) -> CurrentReading:
    """Queries Orion for the current reading of a device."""
    urn = device_id_to_urn(device_id)
    headers = _fiware_headers()
    orion_url = f"{settings.fiware_base_url.rstrip('/')}/v2/entities/{urn}?type={settings.entity_type}"

    async with httpx.AsyncClient(timeout=6.0) as client:
        r = await client.get(orion_url, headers=headers)
        if r.status_code == 404:
            raise ValueError(f"Dispositivo '{device_id}' ({urn}) não encontrado no Orion.")
        r.raise_for_status()
        entity = r.json()

    temp = 0.0
    if "temperature" in entity and isinstance(entity["temperature"], dict):
        try:
            temp = float(entity["temperature"].get("value", 0.0))
        except (ValueError, TypeError):
            pass

    hum = 0.0
    if "humidity" in entity and isinstance(entity["humidity"], dict):
        try:
            hum = float(entity["humidity"].get("value", 0.0))
        except (ValueError, TypeError):
            pass

    lum = 0.0
    if "luminosity" in entity and isinstance(entity["luminosity"], dict):
        try:
            lum = float(entity["luminosity"].get("value", 0.0))
        except (ValueError, TypeError):
            pass

    alerts: dict[str, bool] = {
        "alertTemp": False,
        "alertHum": False,
        "alertLum": False,
    }
    for cmd in ("alertTemp", "alertHum", "alertLum"):
        if cmd in entity and isinstance(entity[cmd], dict):
            val = str(entity[cmd].get("value", "")).lower()
            if val in ("on", "true", "1"):
                alerts[cmd] = True

    last_update = _sensor_last_update(entity)

    reading_timestamp = (
        last_update.astimezone(BR_TZ).isoformat()
        if last_update
        else datetime.now(BR_TZ).isoformat()
    )

    online = _device_is_online(entity)

    return CurrentReading(
        device_id=device_id,
        entity_urn=urn,
        timestamp=reading_timestamp,
        temperature=round(temp, 1),
        humidity=round(hum, 1),
        luminosity=round(lum, 1),
        online=online,
        status="Alerta" if any(alerts.values()) else "Normal",
        alerts=alerts,
        raw=entity,
    )


async def send_fiware_command(device_id: str, command: str, value: str = "on") -> dict[str, Any]:
    """Sends command through FIWARE Orion -> IoT Agent UltraLight -> ESP32."""
    urn = device_id_to_urn(device_id)
    headers = {
        **_fiware_headers(),
        "Content-Type": "application/json",
    }

    # 1. Try sending command via Orion Context Broker v2
    orion_cmd_url = f"{settings.fiware_base_url.rstrip('/')}/v2/entities/{urn}/attrs"
    payload = {
        command: {
            "type": "command",
            "value": value,
        }
    }

    sent_via = "orion"
    async with httpx.AsyncClient(timeout=6.0) as client:
        try:
            r = await client.patch(orion_cmd_url, headers=headers, json=payload)
            if r.status_code not in (200, 204):
                # Try POST /v2/entities/{id}/attrs/{command}/cmd
                cmd_url_alt = f"{settings.fiware_base_url.rstrip('/')}/v2/entities/{urn}/attrs/{command}/cmd"
                r2 = await client.post(cmd_url_alt, headers={"Fiware-Service": settings.fiware_service, "Fiware-ServicePath": settings.fiware_service_path, "Content-Type": "text/plain"}, content=value)
                if r2.status_code not in (200, 204):
                    sent_via = "mqtt_fallback"
        except Exception:
            sent_via = "mqtt_fallback"

    # 2. Fallback to MQTT if Orion didn't dispatch
    if sent_via == "mqtt_fallback" and settings.mqtt_host:
        try:
            import paho.mqtt.publish as mqtt_publish
            auth = None
            if settings.mqtt_username:
                auth = {"username": settings.mqtt_username, "password": settings.mqtt_password}
            
            # Format expected by IoT Agent or firmware: /TEF/{device_id}/cmd with payload {device_id}@{command}|{value}
            topic = f"/{settings.fiware_api_key}/{device_id}/cmd"
            payload_str = f"{device_id}@{command}|{value}"
            mqtt_publish.single(
                topic=topic,
                payload=payload_str,
                hostname=settings.mqtt_host,
                port=settings.mqtt_port,
                auth=auth,
                qos=1,
            )
        except Exception as exc:
            if sent_via == "mqtt_fallback":
                raise RuntimeError(f"Falha ao enviar comando via FIWARE e MQTT: {exc}") from exc

    return {
        "device_id": device_id,
        "command": command,
        "value": value,
        "sent_via": sent_via,
        "status": "dispatched",
    }


def _parse_sth_values(
    raw_data: dict[str, Any],
    period: str
) -> list[HistoryPoint]:

    points: list[HistoryPoint] = []

    try:
        context_responses = raw_data.get("contextResponses", [])

        if not context_responses:
            return points

        elem = context_responses[0].get("contextElement", {})
        attrs = elem.get("attributes", [])

        if not attrs:
            return points

        values = attrs[0].get("values", [])

        for item in values:
            raw_val = item.get("attrValue")
            recv_time = item.get("recvTime")

            if raw_val is None or recv_time is None:
                continue

            try:
                val = float(raw_val)
            except (ValueError, TypeError):
                continue

            try:
                dt = datetime.fromisoformat(
                    recv_time.replace("Z", "+00:00")
                )
                dt = dt.astimezone(BR_TZ)

                timestamp = dt.isoformat()

                if period == "24h":
                    formatted_time = dt.strftime("%H:%M")
                elif period == "7d":
                    formatted_time = dt.strftime("%d/%m %Hh")
                else:
                    formatted_time = dt.strftime("%d/%m")

            except Exception:
                timestamp = str(recv_time)
                formatted_time = str(recv_time)

            points.append(
                HistoryPoint(
                    time=formatted_time,
                    value=round(val, 1),
                    timestamp=timestamp,
                )
            )

    except Exception:
        pass

    return points


async def fetch_sth_history(
    device_id: str,
    period: str = "24h"
) -> HistorySeries:

    urn = device_id_to_urn(device_id)
    headers = _fiware_headers()

    period_delta = {
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
    }

    now = datetime.now(timezone.utc)
    date_from = now - period_delta.get(
        period,
        timedelta(hours=24)
    )

    date_from_str = (
        date_from.isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )

    date_to_str = (
        now.isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )

    last_n = min(
        max(settings.sth_last_n, 1),
        100
    )

    series = HistorySeries()

    async with httpx.AsyncClient(timeout=8.0) as client:

        for attr, field in (
            (
                settings.sth_temperature_attribute,
                "temperature"
            ),
            (
                settings.sth_humidity_attribute,
                "humidity"
            ),
            (
                settings.sth_luminosity_attribute,
                "luminosity"
            ),
        ):

            url = (
                f"{settings.sth_comet_url.rstrip('/')}"
                f"/STH/v1/contextEntities/"
                f"type/{settings.entity_type}/"
                f"id/{urn}/attributes/{attr}"
            )

            params = {
                "lastN": last_n,
                "dateFrom": date_from_str,
                "dateTo": date_to_str,
            }

            try:
                response = await client.get(
                    url,
                    headers=headers,
                    params=params,
                )

                if response.status_code == 200:
                    parsed = _parse_sth_values(
                        response.json(),
                        period
                    )

                    setattr(
                        series,
                        field,
                        parsed
                    )

                elif response.status_code == 404:
                    setattr(
                        series,
                        field,
                        []
                    )

                else:
                    response.raise_for_status()

            except httpx.HTTPError as exc:
                raise RuntimeError(
                    f"STH-Comet inacessível para "
                    f"'{attr}' de '{device_id}': {exc}"
                ) from exc

    return series


def calculate_wine_memory(
    device_id: str,
    history: HistorySeries,
    triggers: TriggerConfig
) -> WineMemoryResponse:

    incidents: list[EnvironmentalIncident] = []

    incident_counter = 1
    total_samples = 0
    anomaly_samples = 0
    exposure_seconds = 0

    last_incident_dt: datetime | None = None
    last_incident_text = "Nenhum"

    def point_datetime(point: HistoryPoint) -> datetime | None:

        if point.timestamp:
            try:
                return datetime.fromisoformat(
                    point.timestamp.replace("Z", "+00:00")
                )
            except Exception:
                pass

        for fmt in ("%H:%M", "%d/%m %Hh", "%d/%m"):
            try:
                return datetime.strptime(
                    point.time,
                    fmt
                )
            except Exception:
                pass

        return None

    def format_duration(seconds: int) -> str:

        seconds = max(seconds, 0)

        if seconds < 60:
            return f"{seconds}s"

        minutes = seconds // 60

        if minutes < 60:
            return f"{minutes} min"

        hours = minutes // 60
        remaining_minutes = minutes % 60

        return f"{hours}h {remaining_minutes}min"

    def process_sensor(
        points: list[HistoryPoint],
        sensor_type: str,
        title: str,
        minimum: float,
        maximum: float,
        unit: str,
    ) -> None:

        nonlocal incident_counter
        nonlocal total_samples
        nonlocal anomaly_samples
        nonlocal exposure_seconds
        nonlocal last_incident_dt
        nonlocal last_incident_text

        active = False
        start_point: HistoryPoint | None = None
        last_bad_point: HistoryPoint | None = None
        peak_point: HistoryPoint | None = None

        def deviation(value: float) -> float:
            if value < minimum:
                return minimum - value

            if value > maximum:
                return value - maximum

            return 0.0

        for point in points:

            total_samples += 1

            bad = (
                point.value < minimum
                or point.value > maximum
            )

            if bad:
                anomaly_samples += 1

                if not active:
                    active = True
                    start_point = point
                    peak_point = point

                    start_dt = point_datetime(point)

                    if (
                        start_dt
                        and (
                            last_incident_dt is None
                            or start_dt > last_incident_dt
                        )
                    ):
                        last_incident_dt = start_dt
                        last_incident_text = point.time

                last_bad_point = point

                if (
                    peak_point is None
                    or deviation(point.value)
                    > deviation(peak_point.value)
                ):
                    peak_point = point

                continue

            if active and start_point and peak_point:

                start_dt = point_datetime(start_point)
                end_dt = point_datetime(point)

                duration_seconds = int(
                    settings.monitoring_interval
                )

                if start_dt and end_dt:
                    duration_seconds = max(
                        int(
                            (
                                end_dt - start_dt
                            ).total_seconds()
                        ),
                        int(settings.monitoring_interval),
                    )

                exposure_seconds += duration_seconds

                incidents.append(
                    EnvironmentalIncident(
                        id=incident_counter,
                        type=sensor_type,
                        title=title,
                        startedAt=start_point.time,
                        endedAt=point.time,
                        duration=format_duration(
                            duration_seconds
                        ),
                        peakValue=f"{peak_point.value}{unit}",
                        description=(
                            f"Valor fora da faixa "
                            f"configurada "
                            f"({minimum}{unit} - "
                            f"{maximum}{unit})."
                        ),
                        active=False,
                    )
                )

                incident_counter += 1

                active = False
                start_point = None
                last_bad_point = None
                peak_point = None

        if (
            active
            and start_point
            and peak_point
            and last_bad_point
        ):

            start_dt = point_datetime(start_point)
            end_dt = point_datetime(last_bad_point)

            duration_seconds = int(
                settings.monitoring_interval
            )

            if start_dt and end_dt:
                duration_seconds = max(
                    int(
                        (
                            end_dt - start_dt
                        ).total_seconds()
                    ),
                    int(settings.monitoring_interval),
                )

            exposure_seconds += duration_seconds

            incidents.append(
                EnvironmentalIncident(
                    id=incident_counter,
                    type=sensor_type,
                    title=title,
                    startedAt=start_point.time,
                    endedAt="Em andamento",
                    duration=format_duration(
                        duration_seconds
                    ),
                    peakValue=f"{peak_point.value}{unit}",
                    description=(
                        f"O valor permanece fora da "
                        f"faixa configurada "
                        f"({minimum}{unit} - "
                        f"{maximum}{unit})."
                    ),
                    active=True,
                )
            )

            incident_counter += 1

    process_sensor(
        history.temperature,
        "temperature",
        "Temperatura fora da faixa",
        triggers.temperature.min,
        triggers.temperature.max,
        " °C",
    )

    process_sensor(
        history.humidity,
        "humidity",
        "Umidade fora da faixa",
        triggers.humidity.min,
        triggers.humidity.max,
        "%",
    )

    process_sensor(
        history.luminosity,
        "luminosity",
        "Luminosidade fora da faixa",
        triggers.luminosity.min,
        triggers.luminosity.max,
        "%",
    )

    if total_samples == 0:
        stability = 100.0
    else:
        stability = round(
            (
                1
                - (
                    anomaly_samples
                    / total_samples
                )
            )
            * 100,
            1,
        )

    return WineMemoryResponse(
        device_id=device_id,
        totalIncidents=len(incidents),
        exposureTime=format_duration(
            exposure_seconds
        ),
        lastIncident=last_incident_text,
        stability=stability,
        incidents=incidents,
    )


def generate_demo_history(period: str = "24h") -> HistorySeries:
    """Explicit fallback series for local testing when STH-Comet is offline."""
    now = datetime.now()
    count = 24 if period == "24h" else (70 if period == "7d" else 90)
    step_minutes = 60 if period == "24h" else (180 if period == "7d" else 480)

    t_points = []
    h_points = []
    l_points = []

    for i in range(count):
        pt_time = now - timedelta(minutes=(count - i - 1) * step_minutes)
        if period == "24h":
            label = pt_time.strftime("%H:%M")
        else:
            label = pt_time.strftime("%d/%m %Hh")

        # Base values with minor realistic wave
        cycle = (i % 8) - 4
        temp_val = round(14.0 + (cycle * 0.3), 1)
        hum_val = round(68.0 + (cycle * 0.8), 1)
        lum_val = round(12.0 + (cycle * 0.5), 1)

        t_points.append(HistoryPoint(time=label, value=temp_val))
        h_points.append(HistoryPoint(time=label, value=hum_val))
        l_points.append(HistoryPoint(time=label, value=lum_val))

    return HistorySeries(temperature=t_points, humidity=h_points, luminosity=l_points)
