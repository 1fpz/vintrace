from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import Any
import httpx
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .fiware import (
    calculate_wine_memory,
    check_fiware_health,
    delete_device_fiware,
    device_id_to_urn,
    fetch_sth_history,
    generate_demo_history,
    get_current_reading,
    list_devices_fiware,
    register_device_fiware,
    send_fiware_command,
)
from .models import (
    AlertItem,
    CommandRequest,
    CurrentReading,
    DeviceItem,
    DeviceRegistration,
    HistoryResponse,
    MonitoringStatus,
    TriggerConfig,
    WineMemoryResponse,
)
from .monitor import monitor
from .triggers_store import (
    delete_device_triggers,
    get_device_triggers,
    list_devices_with_triggers,
    save_device_triggers,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    monitor.start_loop()
    # Garante monitoramento para vintrace001 inicialmente
    monitor.start_monitoring_device("vintrace001")
    yield
    monitor.stop_loop()


app = FastAPI(
    title="VinTrace API",
    version="1.0.0",
    description="API de Integração VinTrace — FIWARE Orion, IoT Agent UltraLight e STH-Comet.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# ROOT & HEALTH ENDPOINTS
# ==========================================

@app.get("/")
def root():
    return {
        "service": "VinTrace API",
        "status": "online",
        "docs": "/docs",
        "health": "/health",
        "devices": "/devices",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "vintrace-api",
        "environment": settings.app_env,
        "fiware_service": settings.fiware_service,
        "fiware_service_path": settings.fiware_service_path,
        "api_key": settings.fiware_api_key,
    }


@app.get("/health/fiware")
async def health_fiware():
    """Diagnóstico rápido de Orion, IoT Agent e STH-Comet."""
    return await check_fiware_health()


# ==========================================
# DEVICE CRUD
# ==========================================

@app.get("/devices", response_model=dict[str, Any])
@app.get("/api/devices", response_model=dict[str, Any])
async def list_devices():
    """Lista dispositivos reais do FIWARE Orion / IoT Agent."""
    fiware_devices = await list_devices_fiware()
    
    # Se o Orion não retornar nada (ex: antes de qualquer registro), garantir os dispositivos configurados nos triggers
    known_ids = set(d.id for d in fiware_devices)
    all_trigger_devices = list_devices_with_triggers()

    for dev_id in all_trigger_devices:
        if dev_id not in known_ids:
            fiware_devices.append(
                DeviceItem(
                    id=dev_id,
                    name=f"Adega {dev_id}",
                    location="Laboratório",
                    online=False,
                    temperature=0.0,
                    humidity=0.0,
                    luminosity=0.0,
                )
            )

    return {"items": [d.model_dump() for d in fiware_devices], "total": len(fiware_devices), "source": "fiware"}


@app.post("/devices", status_code=status.HTTP_201_CREATED)
@app.post("/api/devices", status_code=status.HTTP_201_CREATED)
async def create_device(payload: DeviceRegistration):
    """Registra dispositivo no IoT Agent UltraLight e persiste triggers iniciais."""
    try:
        reg_result = await register_device_fiware(
            device_id=payload.device_id,
            name=payload.name,
            location=payload.location,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Erro ao registrar no FIWARE: {exc}") from exc

    # Persiste triggers padrão se ainda não existirem
    get_device_triggers(payload.device_id)
    # Ativa monitoramento
    monitor.start_monitoring_device(payload.device_id)

    return {
        "id": payload.device_id,
        "name": payload.name,
        "location": payload.location,
        "fiware": reg_result,
    }


@app.delete("/devices/{device_id}")
@app.delete("/api/devices/{device_id}")
async def remove_device(device_id: str):
    """Remove dispositivo do IoT Agent, Orion e exclui triggers associados."""
    await monitor.stop_monitoring_device(device_id)
    delete_device_triggers(device_id)
    await delete_device_fiware(device_id)
    return {"device_id": device_id, "deleted": True}


# ==========================================
# CURRENT READING
# ==========================================

@app.get("/devices/{device_id}/current", response_model=CurrentReading)
@app.get("/api/devices/{device_id}/current", response_model=CurrentReading)
async def current_reading(device_id: str):
    """Retorna a leitura atual do dispositivo obtida do Orion Context Broker."""
    try:
        reading = await get_current_reading(device_id)
        return reading
    except Exception:
        # Quando Orion não estiver conectado (teste local sem FIWARE ativo),
        # retorna valores de teste seguros para a tela funcionar em modo offline/demo
        now_iso = datetime.now(timezone.utc).isoformat()
        return CurrentReading(
            device_id=device_id,
            entity_urn=device_id_to_urn(device_id),
            timestamp=now_iso,
            temperature=14.5,
            humidity=68.0,
            luminosity=12.0,
            online=False,
            status="Normal",
            alerts={"alertTemp": False, "alertHum": False, "alertLum": False},
            raw={"note": "Orion Context Broker offline; exibindo leitura para teste local."},
        )


# ==========================================
# HISTORY (STH-COMET)
# ==========================================

@app.get("/devices/{device_id}/history", response_model=HistoryResponse)
@app.get("/api/devices/{device_id}/history", response_model=HistoryResponse)
async def device_history(device_id: str, period: str = Query(default="24h", pattern="^(24h|7d|30d)$")):
    """Consulta séries temporais reais do STH-Comet pela porta 8666."""
    try:
        series = await fetch_sth_history(device_id=device_id, period=period)
        return HistoryResponse(
            device_id=device_id,
            period=period,
            history=series,
            source="sth-comet",
        )
    except Exception:
        # Quando STH-Comet estiver offline, gera série de demonstração para testes locais sem quebrar o gráfico
        series = generate_demo_history(period)
        return HistoryResponse(
            device_id=device_id,
            period=period,
            history=series,
            source="demo_offline",
        )


# ==========================================
# TRIGGERS
# ==========================================

@app.get("/devices/{device_id}/triggers")
@app.get("/api/devices/{device_id}/triggers")
@app.get("/api/triggers/{device_id}")
def get_triggers_endpoint(device_id: str):
    """Retorna os limites configurados para o dispositivo (fonte oficial persistida)."""
    cfg = get_device_triggers(device_id)
    return {
        "device_id": device_id,
        "triggers": cfg.model_dump(),
        "persisted": True,
    }


@app.put("/devices/{device_id}/triggers")
@app.put("/api/devices/{device_id}/triggers")
@app.put("/api/triggers/{device_id}")
def update_triggers_endpoint(device_id: str, payload: TriggerConfig):
    """Atualiza e persiste os limites do dispositivo no data/triggers.json."""
    save_device_triggers(device_id, payload)
    return {
        "device_id": device_id,
        "triggers": payload.model_dump(),
        "persisted": True,
        "message": "Triggers salvos com sucesso no backend.",
    }


# ==========================================
# WINE MEMORY (PASSAPORTE AMBIENTAL)
# ==========================================

@app.get("/devices/{device_id}/wine-memory", response_model=WineMemoryResponse)
@app.get("/api/devices/{device_id}/wine-memory", response_model=WineMemoryResponse)
async def wine_memory_endpoint(device_id: str):
    """Calcula Passaporte Ambiental real comparando dados do STH-Comet aos triggers."""
    triggers = get_device_triggers(device_id)
    try:
        series = await fetch_sth_history(device_id, period="30d")
        return calculate_wine_memory(device_id, series, triggers)
    except Exception:
        # Quando STH-Comet estiver offline, calcula com base na série histórica local
        demo_series = generate_demo_history("30d")
        return calculate_wine_memory(device_id, demo_series, triggers)


# ==========================================
# MONITORING & ALERTS
# ==========================================

@app.get("/devices/{device_id}/alerts")
@app.get("/api/devices/{device_id}/alerts")
def get_alerts_endpoint(device_id: str):
    """Retorna alertas/incidentes recentes detectados pelo monitor."""
    alerts = monitor.get_recent_alerts(device_id)
    return {"device_id": device_id, "alerts": [a.model_dump() for a in alerts]}


@app.post("/devices/{device_id}/monitoring/start")
@app.post("/api/devices/{device_id}/monitoring/start")
def start_monitoring_endpoint(device_id: str):
    """Ativa o monitoramento remoto de anomalias para o dispositivo."""
    monitor.start_monitoring_device(device_id)
    return {"device_id": device_id, "monitoring": True}


@app.post("/devices/{device_id}/monitoring/stop")
@app.post("/api/devices/{device_id}/monitoring/stop")
async def stop_monitoring_endpoint(device_id: str):
    """Para o monitoramento e desliga alertas ativos."""
    await monitor.stop_monitoring_device(device_id)
    return {"device_id": device_id, "monitoring": False}


@app.get("/devices/{device_id}/monitoring")
@app.get("/api/devices/{device_id}/monitoring")
def get_monitoring_status_endpoint(device_id: str):
    """Retorna status atual da monitoração do dispositivo."""
    return monitor.get_status(device_id)


# ==========================================
# MANUAL COMMANDS
# ==========================================

@app.post("/commands")
@app.post("/api/commands")
async def manual_command(payload: CommandRequest):
    """Dispara comando remoto FIWARE para o dispositivo."""
    try:
        res = await send_fiware_command(
            device_id=payload.device_id,
            command=payload.command,
            value=payload.value,
        )
        return res
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Falha ao emitir comando FIWARE: {exc}") from exc
