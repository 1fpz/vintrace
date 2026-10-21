# VinTrace Dashboard

Dashboard operacional do VinTrace desenvolvido com React, TypeScript e Vite.

## Execução local

```bash
npm install
npm run dev
```

Por padrão, configure a URL da API em `.env`:

```env
VITE_API_URL=http://localhost:8000
```

Em produção, o frontend está publicado em:

https://vintrace-wheat.vercel.app

## Páginas

- `/` — visão geral do dispositivo e estado atual;
- `/dispositivos` — cadastro e gerenciamento de IoT Devices;
- `/monitoramento` — leituras e gráficos históricos do STH-Comet;
- `/triggers` — limites mínimo/máximo para temperatura, umidade e luminosidade;
- `/wine-memory` — Passaporte Ambiental baseado no histórico real.

## Integração

O dashboard consome a API FastAPI real. Não utiliza arquivos `mock*` como fonte operacional.

Fluxo principal:

```text
React → FastAPI → Orion / IoT Agent / STH-Comet → ESP32
```

As alterações de trigger são enviadas ao backend, persistidas no Orion e aplicadas pelo monitor remoto.

## Validação

```bash
npm run lint
npm run build
```

Na revisão final do projeto, ambos os comandos foram executados com sucesso.
