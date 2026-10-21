# Infraestrutura FIWARE — VinTrace

## Componentes

| Serviço | Porta | Função |
|---|---:|---|
| Orion Context Broker | 1026 | estado atual e comandos NGSIv2 |
| IoT Agent UltraLight | 4041 | provisionamento e adaptação UltraLight |
| Mosquitto | 1883 | transporte MQTT |
| STH-Comet | 8666 | séries históricas |
| MongoDB | 27017 | persistência interna do stack |

## Contrato

```text
FIWARE-Service: smart
FIWARE-ServicePath: /
API Key: TEF
Entity type: VinTrace
Device principal: vintrace001
Entity: urn:ngsi-ld:VinTrace:001
```

Atributos:

```text
t → temperature
h → humidity
l → luminosity
```

Comandos:

```text
alertTemp
alertHum
alertLum
```

Valores:

```text
high
low
off
```

## MQTT UltraLight

Telemetria:

```text
/ul/TEF/{device_id}/attrs
```

Exemplo:

```text
t|25.8|h|53|l|52
```

Comandos:

```text
/TEF/{device_id}/cmd
```

Resultado de comando:

```text
/ul/TEF/{device_id}/cmdexe
```

## Triggers

Em produção, os limites são persistidos como atributos do próprio dispositivo no Orion:

```text
triggerTemperatureMin
triggerTemperatureMax
triggerHumidityMin
triggerHumidityMax
triggerLuminosityMin
triggerLuminosityMax
```

Configuração do backend:

```env
TRIGGER_STORAGE=fiware
```

## Histórico

O Orion envia alterações ao STH-Comet por Subscription. A API do VinTrace consulta o histórico pela porta 8666 e expõe períodos de 24h, 7d e 30d ao frontend.

## Health checks

```text
GET :1026/version
GET :4041/iot/about
GET :8666/version
```

Ou pelo backend:

```text
GET /health/fiware
```

## Observação de segurança

O stack é utilizado como ambiente acadêmico de prova de conceito. Não exponha credenciais reais no Git e mantenha MongoDB restrito sempre que possível.
