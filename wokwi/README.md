# Simulação Wokwi — VinTrace CP5

Simulação do requisito oficial do CP5 usando:

- ESP32 DevKit v4
- DHT22 no GPIO 4
- LDR no GPIO 34
- LED azul no GPIO 27
- Buzzer no GPIO 25

O DHT22 é usado somente na simulação Wokwi. No hardware físico, o VinTrace utiliza DHT11.

## Teste

1. Abra o projeto no Wokwi.
2. Inicie a simulação.
3. Altere temperatura e umidade no DHT22.
4. Altere a luminosidade no fotoresistor.
5. Verifique o Serial Monitor, o LED azul e o buzzer.

Os alertas usam os mesmos limites padrão do projeto e sons distintos para temperatura, umidade e luminosidade.

## Link público

Após publicar o projeto no Wokwi, inserir aqui:

`WOKWI_LINK_PENDENTE`

O link também deve ser colocado no README principal e no formulário de entrega.
