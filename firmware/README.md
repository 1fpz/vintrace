# VinTrace Edge — ESP32

## Componentes

- ESP32 DevKit (LED azul onboard normalmente no GPIO 2; confirme sua placa)
- DHT-11: DATA no GPIO 4, VCC conforme o módulo, GND em comum
- LDR em divisor de tensão com resistor (saída analógica no GPIO 34)
- Buzzer no GPIO 25 (se o buzzer exigir corrente maior, use transistor/driver)
- Jumpers e protoboard

## Bibliotecas Arduino IDE

Instale `DHT sensor library` (Adafruit), `Adafruit Unified Sensor`, `PubSubClient` e `ArduinoJson` pelo Library Manager. Selecione uma placa ESP32 compatível.

1. Copie `secrets.example.h` para `secrets.h`.
2. Configure Wi-Fi e broker MQTT em `secrets.h`.
3. Abra `vintrace.ino`, compile e envie para a placa.
4. Abra Serial Monitor em 115200 baud.
5. Publique `ALERT_ON`, `ALERT_OFF` ou `BUZZER_TEST` no tópico `vintrace/vintrace001/command` para testar comandos.
6. Observe a telemetria no tópico `vintrace/vintrace001/telemetry`.

## Limitações que precisam ser validadas

- Este é um firmware-base, não uma integração FIWARE pronta. O IoT Agent precisa ser provisionado para os tópicos/payloads usados, ou a equipe deve adaptar o firmware ao protocolo já adotado no laboratório.
- O mapeamento de luminosidade depende da orientação do LDR e do divisor; calibre com leituras reais.
- O LED usa GPIO 2 como padrão, mas algumas placas possuem LED onboard em outro pino.
- DHT-11 e LDR reais podem exigir ajuste de limites. A simulação solicitada no enunciado usa DHT-22.
- O estado remoto e as regras locais são combinados: o alerta local permanece se houver qualquer sensor fora da faixa.
