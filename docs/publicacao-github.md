# Publicação e deploy — VinTrace

## Repositório

https://github.com/br330a/vintrace

## Serviços publicados

Dashboard:

```text
https://vintrace-wheat.vercel.app
```

Backend:

```text
https://vintrace-backend.onrender.com
```

Wokwi:

```text
https://wokwi.com/projects/478447086402895873
```

## Fluxo de atualização

O trabalho final é preparado em branch e só depois integrado à `main`.

Antes de enviar alterações:

```bash
git status
git diff --check
```

Depois:

```bash
git add .
git commit -m "tipo: descricao da alteracao"
git push
```

## Segurança antes do push

Nunca versionar:

```text
backend/.env
firmware/secrets.h
senhas Wi-Fi
tokens
credenciais privadas
node_modules
.venv
```

Confirme que os exemplos públicos usam apenas placeholders.

## Deploy

- Vercel publica o frontend conectado à branch configurada.
- Render publica o backend.
- O FIWARE depende do ambiente AWS/Vocareum estar iniciado.
- O Render gratuito pode precisar ser acordado antes da apresentação.

## Checklist público

- README atualizado;
- links do dashboard, backend e Wokwi funcionando;
- nomes da equipe corretos;
- arquitetura e manuais atualizados;
- nenhuma credencial exposta;
- vídeo final acessível;
- evidências físicas adicionadas.
