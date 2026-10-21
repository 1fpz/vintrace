# Manual de montagem e operação — hardware

## 1. Componentes

- ESP32 DOIT DevKit V1 / ESP32-WROOM-32
- DHT11 físico
- LDR + resistor para divisor de tensão
- TFT ST7735 1,8" 128×160
- LED azul externo + resistor limitador
- buzzer passivo
- protoboard e jumpers
- cabo USB

## 2. Pinagem final

| Componente | ESP32 |
|---|---:|
| DHT11 DATA | GPIO 4 |
| LDR | GPIO 34 |
| TFT SCK | GPIO 18 |
| TFT MOSI | GPIO 23 |
| TFT CS | GPIO 21 |
| TFT DC | GPIO 16 |
| TFT RST | GPIO 17 |
| LED azul | GPIO 27 |
| Buzzer passivo | GPIO 25 |

Todos os módulos devem compartilhar GND.

## 3. LDR

O LDR usa entrada analógica no GPIO 34. No firmware final, a escala percentual é calculada por:

```cpp
map(ldrRaw, 0, 4095, 100, 0)
```

Isso foi ajustado ao sentido do divisor usado no protótipo físico.

## 4. Display TFT

O ST7735 é utilizado em modo paisagem, resolução lógica 160×128.

A tela apresenta:

- valores atuais;
- estado `NORMAL`;
- temperatura alta ou baixa;
- umidade alta ou baixa;
- luminosidade alta ou baixa;
- lista de alertas quando há mais de uma anomalia.

## 5. Alertas físicos

Enquanto houver pelo menos uma anomalia:

- o LED azul no GPIO 27 pisca;
- o buzzer toca de forma não bloqueante;
- a TFT mostra a condição detectada.

Frequências:

| Sensor | Frequência |
|---|---:|
| Temperatura | 700 Hz |
| Umidade | 1100 Hz |
| Luminosidade | 1600 Hz |

Quando existem vários alertas, os sons são alternados.

## 6. Inicialização

1. Energize o ESP32.
2. A TFT mostra `VinTrace / Wine Guardian / Conectando...`.
3. O firmware conecta ao Wi-Fi.
4. Em seguida conecta ao MQTT.
5. Faz a primeira leitura dos sensores.
6. Mostra a tela operacional.

Se o dispositivo ficar em `Conectando...` após reconectar o USB, pressione `EN/RESET` e acompanhe o Serial Monitor em 115200 baud.

## 7. Teste físico

1. Confirme que o dispositivo aparece online no dashboard.
2. Observe temperatura, umidade e luminosidade.
3. Altere um trigger no frontend para provocar uma anomalia.
4. Confirme TFT, LED e buzzer.
5. Retorne o trigger para uma faixa segura.
6. Confirme que o comando `off` normaliza o dispositivo.
7. Repita para as três variáveis.
8. Teste múltiplas anomalias simultâneas.

Faixa segura utilizada após os ensaios:

```text
Temperatura: 0–50 °C
Umidade: 0–100%
Luminosidade: 0–100%
```

## 8. Segurança de montagem

- desligue a alimentação antes de alterar a fiação;
- utilize resistor limitador no LED externo;
- mantenha GND comum;
- deixe o DHT11 ventilado;
- evite que a luz do próprio display/LED interfira diretamente no LDR;
- preserve acesso ao USB e ao botão EN/RESET na carcaça.
