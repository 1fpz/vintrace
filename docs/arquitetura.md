# Arquitetura em camadas — VinTrace

## Objetivo

Monitorar temperatura, umidade e luminosidade em uma adega, guardar histórico, comparar os valores com limites configuráveis e acionar alertas físicos remotamente quando houver anomalias.

## Camadas

1. **Dispositivo físico** — ESP32, DHT11, LDR, TFT ST7735, LED azul e buzzer passivo.
2. **Transporte** — Wi-Fi, MQTT e protocolo UltraLight 2.0.
3. **Adaptação IoT** — IoT Agent UltraLight recebe telemetria e converte entre MQTT/UltraLight e NGSIv2.
4. **Contexto** — Orion Context Broker mantém o estado atual das entidades e encaminha comandos.
5. **Histórico** — STH-Comet armazena e disponibiliza séries temporais.
6. **Aplicação** — FastAPI centraliza dispositivos, leituras, histórico, triggers, monitoramento e Wine Memory.
7. **Interface** — React/TypeScript apresenta as informações e permite operar o sistema.

## Fluxo de telemetria

```text
DHT11 + LDR
    ↓
ESP32
    ↓ MQTT /ul/TEF/{device_id}/attrs
Mosquitto
    ↓
IoT Agent UltraLight
    ↓
Orion
    ↓ Subscription
STH-Comet
    ↓
FastAPI
    ↓
React
```

O Orion representa o estado atual. O STH-Comet é a fonte das séries históricas.

## Fluxo de alerta remoto

```text
Usuário altera triggers no dashboard
    ↓
FastAPI persiste os limites no Orion
    ↓
Monitor do backend consulta a leitura atual
    ↓
Detecta abaixo / normal / acima
    ↓
FastAPI envia comando NGSIv2 ao Orion
    ↓
IoT Agent converte para MQTT
    ↓
ESP32 recebe high / low / off
    ↓
TFT + LED + buzzer
```

Comandos:

```text
alertTemp = high | low | off
alertHum  = high | low | off
alertLum  = high | low | off
```

O firmware mantém os alertas independentes. A normalização de uma variável não desliga outra anomalia ainda ativa.

## Persistência dos triggers

Há dois modos:

- `TRIGGER_STORAGE=local`: arquivo `backend/data/triggers.json`, usado em desenvolvimento/testes;
- `TRIGGER_STORAGE=fiware`: atributos da entidade no Orion, usado na publicação do backend.

No ambiente final, a persistência FIWARE evita depender do filesystem temporário do Render.

## Histórico

A API oferece:

```text
24h
7d
30d
```

O backend tenta usar agregações do STH-Comet por minuto/hora. Quando necessário, faz paginação do histórico bruto com `hLimit` e `hOffset` e reduz os pontos para uso no gráfico.

## Wine Memory

O Wine Memory interpreta os pontos históricos do STH-Comet e gera incidentes por sensor.

Cada incidente pode registrar:

- `type`: temperatura, umidade ou luminosidade;
- `direction`: `high` ou `low`;
- início e fim;
- duração;
- pico;
- descrição;
- estado ativo ou encerrado.

A versão atual calcula a exposição retrospectivamente com base nos triggers vigentes na consulta. Alterações históricas de trigger não são versionadas.

## Infraestrutura

| Serviço | Porta |
|---|---:|
| Orion Context Broker | 1026 |
| IoT Agent UltraLight | 4041 |
| Mosquitto MQTT | 1883 |
| STH-Comet | 8666 |
| MongoDB | 27017 interno |

## Segurança

- Credenciais de Wi-Fi ficam em `firmware/secrets.h`, ignorado pelo Git.
- Variáveis de ambiente reais ficam em `backend/.env` ou no provedor de deploy.
- O navegador não acessa diretamente credenciais FIWARE.
- O MongoDB não deve ser exposto desnecessariamente à internet.

O projeto é uma prova de conceito acadêmica. Uma implantação de produção exigiria autenticação, autorização, auditoria e políticas de rede mais restritas.
