# Plano de testes e evidências — VinTrace

Os estados abaixo refletem os ensaios executados durante a integração final. Evidências visuais serão organizadas na pasta `docs/evidencias/` na etapa final de entrega.

| ID | Teste | Critério | Estado |
|---|---|---|---|
| T01 | Firmware compila e faz upload | sem erro no ESP32 | **Aprovado** |
| T02 | DHT11 físico | temperatura e umidade plausíveis | **Aprovado** |
| T03 | LDR físico | valor reage à iluminação | **Aprovado** |
| T04 | Wokwi DHT22 + LDR | link público e alertas funcionais | **Aprovado** |
| T05 | Provisionamento | dispositivo criado no IoT Agent/Orion | **Aprovado** |
| T06 | Estado atual | `temperature`, `humidity`, `luminosity` atualizam no Orion | **Aprovado** |
| T07 | Histórico STH | dados disponíveis pela porta 8666 | **Aprovado** |
| T08 | CRUD de dispositivos | cadastro e exclusão reais | **Aprovado** |
| T09 | Dashboard de dispositivos | listagem usa FIWARE real | **Aprovado** |
| T10 | Gráficos | 24h, 7d e 30d usam STH-Comet | **Aprovado** |
| T11 | Triggers | limites editáveis e persistidos no Orion | **Aprovado** |
| T12 | Temperatura | comando remoto + LED + buzzer + TFT | **Aprovado** |
| T13 | Umidade | comando remoto + LED + buzzer + TFT | **Aprovado** |
| T14 | Luminosidade | comando remoto + LED + buzzer + TFT | **Aprovado** |
| T15 | Normalização | `off` encerra o alerta normalizado | **Aprovado** |
| T16 | Anomalias simultâneas | alertas restantes continuam ativos | **Aprovado** |
| T17 | Reconexão | ESP32 volta após reset/reconexão | **Aprovado em bancada** |
| T18 | TFT | tela normal, alertas individuais e múltiplos legíveis | **Aprovado** |
| T19 | Wine Memory | incidente real calculado pelo histórico | **Aprovado** |
| T20 | Encapsulamento | montagem final segura e acessível | **A documentar** |
| T21 | Manuais/Git/arquitetura | documentação reproduzível | **Em finalização** |
| T22 | Vídeo/Forms/pitch | links finais e entrega | **Pendente da etapa de evidências** |

## Resultados técnicos registrados

### Backend

```text
pytest -q
8 passed
```

### Frontend

```text
npm run lint
aprovado

npm run build
aprovado
```

### Health FIWARE

Durante a integração final:

```text
Orion: online
IoT Agent: online
STH-Comet: online
overall: healthy
```

### Histórico

Exemplo de retorno observado:

```text
24h: 98 pontos por série
7d: 8 pontos por série
30d: 8 pontos por série
source: sth-comet
```

A quantidade depende do tempo de telemetria realmente existente no STH-Comet.

### Wine Memory

Foi validado incidente de temperatura com:

```text
direction: high
```

Depois do ensaio, os triggers foram devolvidos para uma faixa segura.

### Wokwi

Link público:

https://wokwi.com/projects/478447086402895873

Foram testados temperatura, umidade e luminosidade, cada uma com frequência sonora diferente.
