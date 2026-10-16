"""Background Anomaly Monitor for VinTrace.
Periodically compares current Orion sensor readings with persisted triggers,
dispatching remote FIWARE alert commands (alertTemp, alertHum, alertLum)
strictly on state transitions.
"""
import asyncio
from datetime import datetime, timezone
import logging
from typing import Any

from .config import settings
from .fiware import get_current_reading, send_fiware_command
from .models import AlertItem, MonitoringStatus
from .triggers_store import get_device_triggers

logger = logging.getLogger("vintrace.monitor")


class AnomalyMonitor:
    def __init__(self):
        # device_id -> bool (is monitoring active)
        self.active_devices: dict[str, bool] = {}
        # device_id -> {"alertTemp": bool, "alertHum": bool, "alertLum": bool}
        self.device_alert_states: dict[str, dict[str, bool]] = {}
        # device_id -> list[AlertItem]
        self.device_alerts_history: dict[str, list[AlertItem]] = {}
        self.last_check: dict[str, str] = {}
        self._task: asyncio.Task | None = None
        self._running = False
        self._alert_id_counter = 1

    def start_loop(self):
        if not self._running:
            self._running = True
            self._task = asyncio.create_task(self._monitor_loop())

    def stop_loop(self):
        self._running = False
        if self._task:
            self._task.cancel()

    def start_monitoring_device(self, device_id: str) -> None:
        self.active_devices[device_id] = True
        if device_id not in self.device_alert_states:
            self.device_alert_states[device_id] = {
                "alertTemp": False,
                "alertHum": False,
                "alertLum": False,
            }
        if device_id not in self.device_alerts_history:
            self.device_alerts_history[device_id] = []
        logger.info(f"Monitoramento iniciado para o dispositivo '{device_id}'.")

    async def stop_monitoring_device(self, device_id: str) -> None:
        self.active_devices[device_id] = False
        # Turn off any active alerts
        current_states = self.device_alert_states.get(device_id, {})
        for cmd_name, is_active in current_states.items():
            if is_active:
                try:
                    await send_fiware_command(device_id, cmd_name, "off")
                except Exception as exc:
                    logger.warning(f"Erro ao desligar {cmd_name} no stop: {exc}")
                current_states[cmd_name] = False
        logger.info(f"Monitoramento parado para o dispositivo '{device_id}'.")

    def get_status(self, device_id: str) -> MonitoringStatus:
        return MonitoringStatus(
            device_id=device_id,
            is_active=self.active_devices.get(device_id, False),
            last_check=self.last_check.get(device_id),
            active_alerts=self.device_alert_states.get(
                device_id, {"alertTemp": False, "alertHum": False, "alertLum": False}
            ),
        )

    def get_recent_alerts(self, device_id: str) -> list[AlertItem]:
        return list(reversed(self.device_alerts_history.get(device_id, [])))[:10]

    async def _monitor_loop(self):
        while self._running:
            try:
                for device_id, is_active in list(self.active_devices.items()):
                    if is_active:
                        await self._evaluate_device(device_id)
            except Exception as exc:
                logger.error(f"Erro no ciclo de monitoramento: {exc}")
            await asyncio.sleep(settings.monitoring_interval)

    async def _evaluate_device(self, device_id: str):
        self.last_check[device_id] = datetime.now(timezone.utc).isoformat()
        try:
            current = await get_current_reading(device_id)
        except Exception:
            return

        triggers = get_device_triggers(device_id)
        current_state = self.device_alert_states.setdefault(
            device_id, {"alertTemp": False, "alertHum": False, "alertLum": False}
        )

        now_formatted = datetime.now().strftime("%d/%m, %H:%M")

        # 1. Temperature evaluation
        temp_is_anomaly = (
            current.temperature < triggers.temperature.min
            or current.temperature > triggers.temperature.max
        )
        if temp_is_anomaly != current_state["alertTemp"]:
            cmd_val = "on" if temp_is_anomaly else "off"
            try:
                await send_fiware_command(device_id, "alertTemp", cmd_val)
                current_state["alertTemp"] = temp_is_anomaly
                if temp_is_anomaly:
                    msg = (
                        f"Temperatura acima do limite ({current.temperature} °C > {triggers.temperature.max} °C)"
                        if current.temperature > triggers.temperature.max
                        else f"Temperatura abaixo do limite ({current.temperature} °C < {triggers.temperature.min} °C)"
                    )
                    self._record_alert(device_id, "Temperatura", msg, f"{current.temperature} °C", now_formatted)
                else:
                    self._record_alert(device_id, "Temperatura", "Temperatura normalizada", f"{current.temperature} °C", now_formatted, active=False)
            except Exception as exc:
                logger.error(f"Falha ao enviar alertTemp={cmd_val}: {exc}")

        # 2. Humidity evaluation
        hum_is_anomaly = (
            current.humidity < triggers.humidity.min
            or current.humidity > triggers.humidity.max
        )
        if hum_is_anomaly != current_state["alertHum"]:
            cmd_val = "on" if hum_is_anomaly else "off"
            try:
                await send_fiware_command(device_id, "alertHum", cmd_val)
                current_state["alertHum"] = hum_is_anomaly
                if hum_is_anomaly:
                    msg = (
                        f"Umidade acima do limite ({current.humidity}% > {triggers.humidity.max}%)"
                        if current.humidity > triggers.humidity.max
                        else f"Umidade abaixo do limite ({current.humidity}% < {triggers.humidity.min}%)"
                    )
                    self._record_alert(device_id, "Umidade", msg, f"{current.humidity}%", now_formatted)
                else:
                    self._record_alert(device_id, "Umidade", "Umidade normalizada", f"{current.humidity}%", now_formatted, active=False)
            except Exception as exc:
                logger.error(f"Falha ao enviar alertHum={cmd_val}: {exc}")

        # 3. Luminosity evaluation
        lum_is_anomaly = (
            current.luminosity < triggers.luminosity.min
            or current.luminosity > triggers.luminosity.max
        )
        if lum_is_anomaly != current_state["alertLum"]:
            cmd_val = "on" if lum_is_anomaly else "off"
            try:
                await send_fiware_command(device_id, "alertLum", cmd_val)
                current_state["alertLum"] = lum_is_anomaly
                if lum_is_anomaly:
                    msg = (
                        f"Luminosidade acima do limite ({current.luminosity}% > {triggers.luminosity.max}%)"
                        if current.luminosity > triggers.luminosity.max
                        else f"Luminosidade abaixo do limite ({current.luminosity}% < {triggers.luminosity.min}%)"
                    )
                    self._record_alert(device_id, "Luminosidade", msg, f"{current.luminosity}%", now_formatted)
                else:
                    self._record_alert(device_id, "Luminosidade", "Luminosidade normalizada", f"{current.luminosity}%", now_formatted, active=False)
            except Exception as exc:
                logger.error(f"Falha ao enviar alertLum={cmd_val}: {exc}")

    def _record_alert(self, device_id: str, sensor: str, message: str, value: str, time: str, active: bool = True):
        item = AlertItem(
            id=self._alert_id_counter,
            sensor=sensor,
            message=message,
            value=value,
            time=time,
            active=active,
        )
        self._alert_id_counter += 1
        history = self.device_alerts_history.setdefault(device_id, [])
        history.append(item)
        if len(history) > 50:
            history.pop(0)


monitor = AnomalyMonitor()
