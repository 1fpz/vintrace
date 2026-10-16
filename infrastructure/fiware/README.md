# Infraestrutura FIWARE — VinTrace

Guia completo para configuração, provisionamento e integração do stack FIWARE com o VinTrace.

## 1. Arquitetura do Stack

- **Orion Context Broker**: Porta `1026` — Gerenciador de contexto NGSIv2.
- **IoT Agent UltraLight 2.0**: Porta `4041` (HTTP de gestão) e MQTT na porta `1883`.
- **STH-Comet**: Porta `8666` — Histórico de séries temporais.
- **Mosquitto MQTT**: Porta `1883` — Broker MQTT para comunicação com ESP32 / Wokwi.
- **MongoDB**: Porta `27017` — Banco de dados subjacente do Orion e STH-Comet.

## 2. Parâmetros e Padrões Obrigatórios

| Item | Padrão | Observação |
|---|---|---|
| **Entity type** | `VinTrace` | Padronizado (não usar WineCellar nem Vintrace) |
| **Device ID** | `vintrace001` | Pode haver múltiplos dispositivos (`vintrace002`, etc.) |
| **Entity URN** | `urn:ngsi-ld:VinTrace:001` | Gerado consistentemente pelo backend |
| **FIWARE-Service** | `smart` | Configurado via `.env` |
| **FIWARE-ServicePath** | `/` | Configurado via `.env` |
| **API Key** | `TEF` | Configurado via `.env` |
| **Telemetria t** | `temperature` | Mapeado no IoT Agent como Number |
| **Telemetria h** | `humidity` | Mapeado no IoT Agent como Number |
| **Telemetria l** | `luminosity` | Mapeado no IoT Agent como Number |
| **Comando alertTemp** | `alertTemp` | Aciona alarme remoto de temperatura no ESP32 (`on`/`off`) |
| **Comando alertHum** | `alertHum` | Aciona alarme remoto de umidade no ESP32 (`on`/`off`) |
| **Comando alertLum** | `alertLum` | Aciona alarme remoto de luminosidade no ESP32 (`on`/`off`) |

## 3. Provisionamento Automatizado

Com o backend configurado com as variáveis apontando para a instância FIWARE (localhost ou IP da EC2):

```bash
# Executar a partir da raiz do repositório
python infrastructure/fiware/setup_fiware.py
```

O script realiza:
1. Verificação de status dos 3 componentes (`/health/fiware`).
2. Provisionamento do Service Group (`/iot/services`) com API Key `TEF`.
3. Provisionamento da Subscription no Orion para que alterações de `temperature`, `humidity` e `luminosity` sejam enviadas ao STH-Comet (`http://sth-comet:8666/notify`).
4. Registro do dispositivo de teste `vintrace001`.

## 4. Tópicos MQTT do IoT Agent UltraLight

- **Publicação de Telemetria (ESP32 -> IoT Agent)**:
  - Tópico: `/TEF/{device_id}/attrs` (ex: `/TEF/vintrace001/attrs`)
  - Payload UltraLight: `t|14.2|h|68.0|l|12`
- **Comandos Remotos (IoT Agent -> ESP32)**:
  - Tópico: `/TEF/{device_id}/cmd` (ex: `/TEF/vintrace001/cmd`)
  - Payload UltraLight: `{device_id}@{command}|{value}` (ex: `vintrace001@alertTemp|on`)
- **Confirmação de Execução de Comando (ESP32 -> IoT Agent)**:
  - Tópico: `/TEF/{device_id}/cmdexe`
  - Payload: `{device_id}@{command}|{command} OK`
