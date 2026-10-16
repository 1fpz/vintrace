# VinTrace Dashboard

Frontend React + TypeScript + Vite preservado a partir do protótipo enviado pela equipe.

## Executar

```bash
npm install
npm run dev
```

## Páginas

- `/` — visão geral
- `/dispositivos` — cadastro/gerenciamento demonstrativo
- `/monitoramento` — gráficos históricos demonstrativos
- `/triggers` — edição local de limites demonstrativos
- `/wine-memory` — conceito Wine Memory

## Estado atual

O frontend ainda consome dados `mock*` locais. A faixa de aviso **Modo demonstração** é intencional: as ações e os gráficos ainda não estão conectados à API FastAPI ou ao FIWARE. A integração, autenticação, persistência e validação com sensores reais são etapas pendentes.
