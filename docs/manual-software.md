# Manual de instalação e operação — software

## Pré-requisitos

- Node.js LTS + npm
- Python 3.11+
- Acesso ao ambiente FIWARE/MQTT da disciplina para telemetria real

## Dashboard local

```powershell
cd dashboard/frontend
npm install
npm run dev
```
Abra a URL local indicada pelo Vite, normalmente `http://localhost:5173`.

Para compilar e revisar:

```powershell
npm run build
npm run lint
```

**Atenção:** a versão recebida do dashboard ainda usa dados `mock*`. O layout abre como protótipo, mas precisa ser conectado à API para mostrar dados reais.

## API local

Em um terminal separado:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

Teste `http://127.0.0.1:8000/health` e `http://127.0.0.1:8000/docs`.

Configure no arquivo local `.env` os endereços e nomes de entidade/atributos do FIWARE disponibilizado pela disciplina. O nome exato da entidade, tipo e atributos depende do provisionamento feito no IoT Agent; confirme com o ambiente da equipe.

## API e endpoints

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/health` | Verificar se a API está ativa |
| GET | `/api/devices` | Listar dispositivos registrados em memória |
| POST | `/api/devices` | Registrar dispositivo em memória |
| GET | `/api/triggers/{device_id}` | Ler limites configurados |
| PUT | `/api/triggers/{device_id}` | Validar e atualizar limites em memória |
| GET | `/api/telemetry/{attribute}?source=demo` | Dados sintéticos para teste local |
| GET | `/api/telemetry/{attribute}?source=fiware` | Consultar o STH-Comet e falhar se indisponível |
| POST | `/api/commands` | Publicar comando MQTT para dispositivo |

Os cadastros e triggers atuais são temporários: reiniciar a API apaga alterações. Não use essa limitação como se fosse persistência implementada.

## Publicação

O site estático em `site/` pode ser publicado em GitHub Pages. A API conectada ao FIWARE precisa ser hospedada separadamente em ambiente acessível e configurada com as credenciais do laboratório. Nunca exponha credenciais FIWARE/MQTT em JavaScript público.
