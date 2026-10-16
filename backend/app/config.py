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
    sth_last_n: int = 24
    mqtt_host: str = "localhost"
    mqtt_port: int = 1883
    mqtt_username: str = ""
    mqtt_password: str = ""
    mqtt_command_topic: str = "/TEF/{device_id}/cmd"
    triggers_file_path: str = "data/triggers.json"
    monitoring_interval: float = 5.0

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
