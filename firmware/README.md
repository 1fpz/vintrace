# VinTrace Edge — ESP32

Firmware físico do VinTrace para ESP32, DHT11, LDR, TFT ST7735, LED azul e buzzer passivo.

## Pinagem

| Componente | GPIO |
|---|---:|
| DHT11 DATA | 4 |
| LDR | 34 |
| TFT SCK | 18 |
| TFT MOSI | 23 |
| TFT CS | 21 |
| TFT DC | 16 |
| TFT RST | 17 |
| LED azul | 27 |
| Buzzer passivo | 25 |

## Bibliotecas

Instale pelo Arduino IDE:

- DHT sensor library (Adafruit)
- Adafruit Unified Sensor
- PubSubClient
- Adafruit GFX Library
- Adafruit ST7735 and ST7789 Library

## Segredos

Copie:

```text
secrets.example.h
```

para:

```text
secrets.h
```

Preencha Wi-Fi e broker MQTT. `secrets.h` está ignorado pelo Git e não deve ser versionado.

## Arduino IDE

O Arduino IDE pode exigir que o arquivo `vintrace.ino` esteja dentro de uma pasta chamada `vintrace`.

Se necessário, crie temporariamente:

```text
firmware/vintrace/
```

com:

```text
vintrace.ino
secrets.h
```

Depois do upload, mantenha no repositório apenas o arquivo oficial `firmware/vintrace.ino` e nunca faça commit do `secrets.h`.

## MQTT / FIWARE

```text
Device ID: vintrace001
Telemetria: /ul/TEF/vintrace001/attrs
Comandos: /TEF/vintrace001/cmd
Resultado: /ul/TEF/vintrace001/cmdexe
```

Comandos aceitos:

```text
alertTemp|high
alertTemp|low
alertTemp|off

alertHum|high
alertHum|low
alertHum|off

alertLum|high
alertLum|low
alertLum|off
```

O parser também mantém compatibilidade com `on` como alerta alto.

## Alertas

- Temperatura: 700 Hz
- Umidade: 1100 Hz
- Luminosidade: 1600 Hz
- LED azul pisca enquanto houver qualquer alerta.
- Múltiplos alertas alternam os sons.
- A TFT diferencia condições acima e abaixo do limite.

## Serial Monitor

Baud rate:

```text
115200
```

Após energizar/resetar, confirme Wi-Fi e MQTT antes de diagnosticar falhas no FIWARE.
