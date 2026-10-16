# Manual de montagem e operação — hardware

## Materiais

ESP32, sensor DHT-11, LDR, resistor para divisor de tensão, LED azul (e resistor limitador se externo), buzzer, protoboard, jumpers e cabo USB de dados.

## Montagem de referência

- DHT-11: VCC/GND e DATA no GPIO 4.
- LDR: montar divisor de tensão; ponto médio no GPIO 34.
- LED azul: GPIO 2 se compatível com a placa ou LED externo com resistor apropriado.
- Buzzer: GPIO 25; use driver se a corrente exceder o permitido pelo GPIO.
- Compartilhar GND entre os módulos.

**Desligue a alimentação antes de alterar a fiação.** Confirme a pinagem do módulo e a tensão suportada pelo componente comprado; módulos variam.

## Firmware

Siga `firmware/README.md`. A rede Wi-Fi e o broker são configurados em `firmware/secrets.h`, arquivo local ignorado pelo Git.

## Teste físico sugerido

1. Energizar ESP32 e observar a inicialização no Serial Monitor (115200 baud).
2. Confirmar conexão Wi-Fi/MQTT.
3. Comparar leituras do DHT com a condição ambiente e testar resposta do LDR com mais/menos luz.
4. Publicar `BUZZER_TEST` no tópico de comando.
5. Forçar uma anomalia controlada (sem danificar o hardware) e confirmar padrão sonoro/LED.
6. Restaurar o ambiente e confirmar que o LED para apenas quando todos os parâmetros estão dentro das faixas.
7. Confirmar o histórico no STH-Comet e o mesmo intervalo no dashboard.
8. Registrar fotos e vídeo contínuo mostrando dispositivo, mensagens e dashboard.

Não declare um teste aprovado sem evidência observada.
