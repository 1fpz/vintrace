# Manual de instalação e operação — software

## 1. Pré-requisitos

- Git
- Python 3.11+
- Node.js 18+ e npm
- Arduino IDE para upload do firmware
- acesso ao stack FIWARE: Orion, IoT Agent, Mosquitto e STH-Comet

## 2. Backend local

Na raiz do projeto:

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env
```

Configure `backend/.env` com os endpoints do ambiente FIWARE.

Para desenvolvimento local, pode manter:

```env
TRIGGER_STORAGE=local
```

Para uma execução integrada em que os triggers devem ficar no Orion:

```env
TRIGGER_STORAGE=fiware
```

Execute:

```bash
uvicorn app.main:app --reload --port 8000
```

Verificações:

```text
http://127.0.0.1:8000/health
http://127.0.0.1:8000/health/fiware
http://127.0.0.1:8000/docs
```

## 3. Frontend local

```bash
cd dashboard/frontend
npm install
```

Crie `.env`:

```env
VITE_API_URL=http://localhost:8000
```

Execute:

```bash
npm run dev
```

Validação antes da entrega:

```bash
npm run lint
npm run build
```

## 4. Endpoints principais

| Método | Endpoint | Função |
|---|---|---|
| GET | `/health` | saúde da API |
| GET | `/health/fiware` | Orion, IoT Agent e STH-Comet |
| GET | `/devices` | lista dispositivos reais |
| POST | `/devices` | provisiona IoT Device |
| DELETE | `/devices/{id}` | remove dispositivo do FIWARE |
| GET | `/devices/{id}/current` | leitura atual do Orion |
| GET | `/devices/{id}/history?period=24h` | histórico do STH-Comet |
| GET | `/devices/{id}/triggers` | consulta limites |
| PUT | `/devices/{id}/triggers` | salva limites |
| GET | `/devices/{id}/alerts` | alertas detectados pelo monitor |
| GET | `/devices/{id}/wine-memory` | Passaporte Ambiental |
| POST | `/devices/{id}/monitoring/start` | inicia monitoramento |
| POST | `/devices/{id}/monitoring/stop` | interrompe monitoramento |
| POST | `/commands` | comando FIWARE manual |

## 5. Publicação utilizada no projeto

Dashboard:

```text
https://vintrace-wheat.vercel.app
```

Backend:

```text
https://vintrace-backend.onrender.com
```

Na publicação do frontend:

```env
VITE_API_URL=https://vintrace-backend.onrender.com
```

No Render, use `TRIGGER_STORAGE=fiware` para persistir limites no Orion.

## 6. Operação do ambiente FIWARE

Antes da demonstração:

1. iniciar o Lab da AWS/Vocareum;
2. aguardar a instância ficar ativa;
3. verificar `/health/fiware`;
4. alimentar o ESP32;
5. confirmar que o dispositivo aparece online no dashboard.

O backend do plano gratuito do Render pode entrar em modo de espera. Abra o dashboard/backend alguns minutos antes da apresentação para garantir que o serviço esteja acordado.

## 7. Testes automatizados

Backend:

```bash
cd backend
source .venv/Scripts/activate
unset TRIGGER_STORAGE
pytest -q
python -m compileall -q app
```

O `pytest` deve usar o modo local para não depender do FIWARE real durante os testes unitários.

Resultado da revisão final:

```text
8 passed
```

## 8. Observação sobre Git Bash e FIWARE_SERVICE_PATH

No Git Bash do Windows, exportar manualmente:

```bash
export FIWARE_SERVICE_PATH=/
```

pode fazer o Git Bash converter `/` para um caminho do Windows. Isso causa `400 Bad Request` no Orion.

Prefira deixar `/` no `.env` ou no valor padrão da aplicação. Se estiver testando por variáveis temporárias no Git Bash, não exporte `FIWARE_SERVICE_PATH` desnecessariamente.

## 9. Troubleshooting

### Dispositivo aparece offline

- confirme que o ESP32 está alimentado;
- pressione `EN/RESET` se acabou de reconectar o USB;
- abra Serial Monitor em 115200 baud;
- confirme Wi-Fi e MQTT;
- teste a porta MQTT 1883;
- confira `/health/fiware`.

### Orion responde 400

Confirme os headers:

```text
fiware-service: smart
fiware-servicepath: /
```

### Triggers retornam `persisted:false`

Em produção, confirme:

```env
TRIGGER_STORAGE=fiware
```

E verifique se os atributos `trigger*` existem na entidade do Orion.

### Histórico vazio

- confirme a Subscription do Orion para o STH-Comet;
- confirme telemetria atual no Orion;
- verifique a porta 8666;
- confirme `fiware-service` e `fiware-servicepath`.
