# Roteiro de pitch — 3 a 4 minutos

**Equipe:** Felipe Ilek, Bruno Gonçalves Minitti, Marcos Vinícius Tudisco, Michel Tatsuya Hanada, Nicolas Gomes de Almeida e Lucas Ferreira Rodrigues Silva.


## 1. Problema (20–30 s)
A conservação de vinhos depende de condições ambientais consistentes. Mudanças de temperatura, umidade e exposição à luz podem passar despercebidas sem monitoramento contínuo.

## 2. Solução (30 s)
O VinTrace propõe monitorar esses parâmetros com ESP32 e sensores, manter histórico em FIWARE/STH-Comet e apresentar o estado da adega em um dashboard.

## 3. Demonstração técnica (90–120 s)
1. Mostrar a montagem física e identificar DHT-11, LDR, LED e buzzer.
2. Mostrar leitura do sensor e publicação MQTT/FIWARE.
3. Abrir o dashboard e apontar valores/histórico com origem real identificada.
4. Alterar uma condição ou trigger e provocar a anomalia de forma controlada.
5. Demonstrar LED piscando e padrão sonoro correspondente.
6. Restaurar condições e provar que o alerta só para quando todos os parâmetros estão normais.

## 4. Diferencial (30 s)
Apresentar o conceito Wine Memory: associar condições ambientais e eventos ao histórico de conservação de um lote/garrafa, com potencial para construir uma memória verificável da adega.

## 5. Encerramento (15 s)
Mostrar repositório, documentação, arquitetura em camadas e limitações/etapas futuras.

**Regra de apresentação:** substituir esta narrativa por fatos observados na demonstração. Não mostrar a demo sintética como telemetria física.
