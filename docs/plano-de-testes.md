# Plano de testes e evidências

| ID | Teste | Critério de aprovação | Evidência a guardar | Estado inicial |
|---|---|---|---|---|
| T01 | API health | `/health` retorna `status=ok` | captura de tela/terminal | Preparado |
| T02 | Cadastro de dispositivo | ID duplicado é rejeitado | requisição e resposta | Preparado |
| T03 | Validação de trigger | `min >= max` é rejeitado | resposta 422 | Preparado |
| T04 | Leitura STH-Comet | dados vêm da entidade/atributo correto | resposta JSON + dashboard | Pendente FIWARE |
| T05 | DHT-11 | temperatura/umidade mudam de modo plausível | Serial Monitor | Pendente hardware |
| T06 | LDR | leitura reage a alteração de iluminação | Serial Monitor | Pendente hardware |
| T07 | Buzzer | padrões diferentes por anomalia | vídeo | Pendente hardware |
| T08 | LED azul | pisca até todas as faixas normalizarem | vídeo | Pendente hardware |
| T09 | Comando remoto | ação do frontend/API chega ao ESP32 | log MQTT + vídeo | Pendente integração |
| T10 | Histórico | gráfico reflete valores do STH-Comet | dashboard + resposta API | Pendente integração |
| T11 | Wokwi | DHT-22 + LDR simulados e link acessível | URL pública | Pendente Wokwi |
| T12 | Publicação | site abre em URL pública sem segredo exposto | URL pública | Pendente deploy |

Use o estado `Aprovado` somente depois de executar o teste. Guarde evidências em `docs/evidencias/` sem dados pessoais ou segredos.
