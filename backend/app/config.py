from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"

    fiware_base_url: str = "http://localhost:1026"
    iot_agent_url: str = "http://localhost:4041"
    sth_comet_url: str = "http://localhost:8666"

    fiware_service: str = "smart"
    fiware_service_path: str = "/"
    fiware_api_key: str = "TEF"
    entity_type: str = "VinTrace"

    sth_temperature_attribute: str = "temperature"
    sth_humidity_attribute: str = "humidity"
    sth_luminosity_attribute: str = "luminosity"

    # Resolução dos gráficos. O STH agregado cobre o período inteiro
    # sem devolver centenas de milhares de leituras de 5 em 5 segundos.
    sth_24h_period: str = "minute"
    sth_7d_period: str = "hour"
    sth_30d_period: str = "hour"

    # Fallback de histórico bruto caso a coleção agregada esteja vazia.
    sth_page_size: int = 100
    sth_fallback_max_points: int = 600

    # local = JSON (desenvolvimento/testes)
    # fiware = Orion (produção/Render, persistência durável enquanto o FIWARE existir)
    trigger_storage: str = "local"
    triggers_file_path: str = "data/triggers.json"

    monitoring_interval: float = 5.0

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
