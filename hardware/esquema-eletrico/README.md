# Esquema elétrico — a documentar com evidência real

Ligações-base previstas (confirmar os pinos e a pinagem do módulo comprado):

| Componente | ESP32 | Observação |
|---|---|---|
| DHT-11 DATA | GPIO 4 | Usar pull-up se o módulo não o tiver |
| DHT-11 VCC/GND | 3V3 e GND | Confirmar especificação do módulo |
| Saída do divisor LDR | GPIO 34 | ADC1, entrada analógica |
| LED azul externo (se necessário) | GPIO 2 via resistor | Não ligar LED sem resistor limitador |
| Buzzer | GPIO 25 | Driver/transistor se necessário |

Adicione aqui foto da montagem real e um esquema exportado pelo simulador. A tabela não substitui a validação física.
