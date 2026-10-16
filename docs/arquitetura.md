# Arquitetura em camadas — VinTrace

## Objetivo

Monitorar condições ambientais de uma adega, armazenar histórico de leituras, comparar os valores com limites configurados e comunicar anomalias ao operador.

## Camadas

1. **Dispositivo físico:** ESP32, DHT-11 (temperatura/umidade), LDR (luminosidade), LED azul e buzzer.
2. **Conectividade:** Wi-Fi e MQTT. O formato de tópicos e payloads deve coincidir com o provisionamento do IoT Agent adotado no laboratório.
3. **Contexto e histórico FIWARE:** Orion Context Broker mantém o estado atual; STH-Comet armazena séries históricas e deve estar acessível na porta 8666 conforme o enunciado.
4. **API de aplicação:** FastAPI centraliza leitura do histórico, validação de limites e envio de comandos. A versão atual ainda guarda cadastro e triggers em memória; não é persistência de produção.
5. **Interface:** dashboard React/TypeScript para dispositivos, monitoramento, triggers e Wine Memory; landing page estática para apresentação pública.

## Fluxo de telemetria

1. ESP32 coleta sensores e prepara a mensagem.
2. A mensagem segue pelo broker/MQTT e pelo mapeamento configurado no IoT Agent.
3. O Orion recebe/atualiza o contexto e o STH-Comet mantém o histórico.
4. A API consulta o histórico no endpoint STH-Comet e disponibiliza os dados ao frontend.
5. O frontend diferencia telemetria real de dados de demonstração.

## Fluxo de alerta

- O operador define limites no frontend.
- A API valida `min < max` para cada sensor.
- A configuração deve ser enviada ao dispositivo ou aplicada em lógica de controle confiável. A API incluída valida e mantém os limites em memória, mas o fluxo completo de distribuição das faixas para o ESP32 ainda precisa ser integrado.
- Se qualquer sensor permanecer fora da faixa, o LED azul deve continuar piscando. Ao normalizar um sensor, o alerta só deve cessar quando todos os sensores estiverem normais.
- Sons distintos devem identificar temperatura, umidade e luminosidade.

## Diferencial — Wine Memory

A página Wine Memory pode evoluir para um registro de condições de armazenamento e eventos por garrafa/lote, relacionando períodos de temperatura, umidade e luz com o histórico de conservação. Para afirmar que esse histórico é real, a implementação precisa relacionar leituras a lotes/garrafas e persistir esses vínculos.

## Segurança e limites atuais

- Não guardar segredos no frontend nem no repositório.
- Habilitar CORS somente para origens conhecidas ao publicar a API.
- A API atual tem CORS local, cadastro/triggers em memória e adaptador STH-Comet básico.
- Antes de produção, adicionar autenticação, banco persistente, controle de acesso, auditoria e testes de integração.
