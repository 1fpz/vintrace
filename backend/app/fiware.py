"""FIWARE Integration Layer for VinTrace.
Connects to Orion Context Broker (1026), IoT Agent UltraLight (4041) and STH-Comet (8666).
"""
import re
from datetime import datetime, timezone, timedelta
from typing import Any
import httpx

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
                    online = (temp != 0.0 or hum != 0.0 or lum != 0.0)

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

    now_iso = datetime.now(timezone.utc).isoformat()

    return CurrentReading(
        device_id=device_id,
        entity_urn=urn,
        timestamp=now_iso,
        temperature=round(temp, 1),
        humidity=round(hum, 1),
        luminosity=round(lum, 1),
        online=True,
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


def _parse_sth_values(raw_data: dict[str, Any], period: str) -> list[HistoryPoint]:
    """Parses raw STH-Comet JSON response into time/value series."""
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

            # Format timestamp
            # ISO: 2026-10-16T14:32:00.000Z
            try:
                dt = datetime.fromisoformat(recv_time.replace("Z", "+00:00"))
                if period == "24h":
                    formatted_time = dt.strftime("%H:%M")
                elif period == "7d":
                    formatted_time = dt.strftime("%d/%m %Hh")
                else:
                    formatted_time = dt.strftime("%d/%m")
            except Exception:
                formatted_time = str(recv_time)

            points.append(HistoryPoint(time=formatted_time, value=round(val, 1)))
    except Exception:
        pass

    return points


async def fetch_sth_history(device_id: str, period: str = "24h") -> HistorySeries:
    """Queries STH-Comet on port 8666 for temperature, humidity and luminosity history."""
    urn = device_id_to_urn(device_id)
    headers = _fiware_headers()

    # Determine lastN based on period
    count_map = {"24h": 24, "7d": 84, "30d": 120}
    last_n = count_map.get(period, 24)

    series = HistorySeries()

    async with httpx.AsyncClient(timeout=8.0) as client:
        for attr, field in (
            (settings.sth_temperature_attribute, "temperature"),
            (settings.sth_humidity_attribute, "humidity"),
            (settings.sth_luminosity_attribute, "luminosity"),
        ):
            url = (
                f"{settings.sth_comet_url.rstrip('/')}/STH/v1/contextEntities/"
                f"type/{settings.entity_type}/id/{urn}/attributes/{attr}"
            )
            params = {"lastN": last_n}
            try:
                r = await client.get(url, headers=headers, params=params)
                if r.status_code == 200:
                    raw = r.json()
                    parsed = _parse_sth_values(raw, period)
                    setattr(series, field, parsed)
                elif r.status_code == 404:
                    setattr(series, field, [])
                else:
                    r.raise_for_status()
            except httpx.HTTPError as exc:
                # Raise explicit error so API does not hide failure silently
                raise RuntimeError(
                    f"STH-Comet inacessível para atributo '{attr}' do dispositivo '{device_id}': {exc}"
                ) from exc

    return series


def calculate_wine_memory(device_id: str, history: HistorySeries, triggers: TriggerConfig) -> WineMemoryResponse:
    """Calculates Environmental Passport / Wine Memory strictly based on real environmental data."""
    incidents: list[EnvironmentalIncident] = []
    incident_counter = 1
    total_anomaly_samples = 0
    total_samples = 0

    # Analyze temperature
    temp_min = triggers.temperature.min
    temp_max = triggers.temperature.max
    in_temp_incident = False
    incident_start = ""
    peak_val = 0.0

    for pt in history.temperature:
        total_samples += 1
        if pt.value < temp_min or pt.value > temp_max:
            total_anomaly_samples += 1
            if not in_temp_incident:
                in_temp_incident = True
                incident_start = pt.time
                peak_val = pt.value
            else:
                if abs(pt.value - ((temp_min + temp_max) / 2)) > abs(peak_val - ((temp_min + temp_max) / 2)):
                    peak_val = pt.value
        else:
            if in_temp_incident:
                in_temp_incident = False
                incidents.append(
                    EnvironmentalIncident(
                        id=incident_counter,
                        type="temperature",
                        title="Temperatura fora da faixa",
                        startedAt=incident_start,
                        endedAt=pt.time,
                        duration="Período detectado",
                        peakValue=f"{peak_val} °C",
                        description=f"A temperatura variou além dos limites configurados ({temp_min}°C - {temp_max}°C).",
                        active=False,
                    )
                )
                incident_counter += 1

    if in_temp_incident:
        incidents.append(
            EnvironmentalIncident(
                id=incident_counter,
                type="temperature",
                title="Temperatura fora da faixa",
                startedAt=incident_start,
                endedAt="Em andamento",
                duration="Ativo",
                peakValue=f"{peak_val} °C",
                description="A temperatura permanece fora dos limites configurados.",
                active=True,
            )
        )
        incident_counter += 1

    # Analyze humidity
    hum_min = triggers.humidity.min
    hum_max = triggers.humidity.max
    in_hum_incident = False
    incident_start = ""
    peak_val = 0.0

    for pt in history.humidity:
        total_samples += 1
        if pt.value < hum_min or pt.value > hum_max:
            total_anomaly_samples += 1
            if not in_hum_incident:
                in_hum_incident = True
                incident_start = pt.time
                peak_val = pt.value
            else:
                if abs(pt.value - 70.0) > abs(peak_val - 70.0):
                    peak_val = pt.value
        else:
            if in_hum_incident:
                in_hum_incident = False
                incidents.append(
                    EnvironmentalIncident(
                        id=incident_counter,
                        type="humidity",
                        title="Umidade fora da faixa",
                        startedAt=incident_start,
                        endedAt=pt.time,
                        duration="Período detectado",
                        peakValue=f"{peak_val}%",
                        description=f"A umidade variou além dos limites configurados ({hum_min}% - {hum_max}%).",
                        active=False,
                    )
                )
                incident_counter += 1

    if in_hum_incident:
        incidents.append(
            EnvironmentalIncident(
                id=incident_counter,
                type="humidity",
                title="Umidade fora da faixa",
                startedAt=incident_start,
                endedAt="Em andamento",
                duration="Ativo",
                peakValue=f"{peak_val}%",
                description="A umidade permanece fora dos limites configurados.",
                active=True,
            )
        )
        incident_counter += 1

    # Analyze luminosity
    lum_min = triggers.luminosity.min
    lum_max = triggers.luminosity.max
    in_lum_incident = False
    incident_start = ""
    peak_val = 0.0

    for pt in history.luminosity:
        total_samples += 1
        if pt.value < lum_min or pt.value > lum_max:
            total_anomaly_samples += 1
            if not in_lum_incident:
                in_lum_incident = True
                incident_start = pt.time
                peak_val = pt.value
            else:
                if pt.value > peak_val:
                    peak_val = pt.value
        else:
            if in_lum_incident:
                in_lum_incident = False
                incidents.append(
                    EnvironmentalIncident(
                        id=incident_counter,
                        type="luminosity",
                        title="Luminosidade fora da faixa",
                        startedAt=incident_start,
                        endedAt=pt.time,
                        duration="Período detectado",
                        peakValue=f"{peak_val}%",
                        description=f"A luminosidade ultrapassou o limite recomendado ({lum_min}% - {lum_max}%).",
                        active=False,
                    )
                )
                incident_counter += 1

    if in_lum_incident:
        incidents.append(
            EnvironmentalIncident(
                id=incident_counter,
                type="luminosity",
                title="Luminosidade fora da faixa",
                startedAt=incident_start,
                endedAt="Em andamento",
                duration="Ativo",
                peakValue=f"{peak_val}%",
                description="A luminosidade permanece além do limite configurado.",
                active=True,
            )
        )
        incident_counter += 1

    # Calculate stability
    if total_samples > 0:
        stability = round(max(0.0, min(100.0, ((total_samples - total_anomaly_samples) / total_samples) * 100)), 1)
    else:
        stability = 100.0

    # Sort incidents latest first
    incidents.reverse()

    last_incident_text = "Nenhum incidente registrado"
    if incidents:
        last_incident_text = incidents[0].startedAt

    approx_minutes = total_anomaly_samples * 5
    if approx_minutes < 60:
        exposure_time_str = f"{approx_minutes} min"
    else:
        hours = approx_minutes // 60
        mins = approx_minutes % 60
        exposure_time_str = f"{hours}h {mins}min"

    return WineMemoryResponse(
        device_id=device_id,
        totalIncidents=len(incidents),
        exposureTime=exposure_time_str,
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
