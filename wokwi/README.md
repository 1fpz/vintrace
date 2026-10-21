# Simulação Wokwi — VinTrace

Projeto público:

https://wokwi.com/projects/478447086402895873

A simulação atende ao requisito do CP5 de utilizar **DHT22 + LDR**.

## Componentes

- ESP32
- DHT22
- LDR
- LED azul
- buzzer passivo

## Pinagem da simulação

```text
DHT22 DATA  GPIO 4
LDR         GPIO 34
LED azul    GPIO 27
Buzzer      GPIO 25
```

## Alertas

A simulação usa frequências alinhadas ao firmware físico:

```text
Temperatura  700 Hz
Umidade      1100 Hz
Luminosidade 1600 Hz
```

Foram testadas as três variáveis individualmente e os sons foram confirmados como diferentes.

Arquivos locais:

```text
wokwi/vintrace-simulation/sketch.ino
wokwi/vintrace-simulation/diagram.json
wokwi/vintrace-simulation/libraries.txt
wokwi/vintrace-simulation/wokwi.toml
```
