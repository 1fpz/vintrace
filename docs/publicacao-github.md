# Publicar o VinTrace no GitHub e colocar o site no ar

## 1. Criar o repositório

1. Entre em https://github.com/new.
2. Nome sugerido: `vintrace`.
3. Descrição: `Monitoramento inteligente de adegas com ESP32, sensores, FIWARE e dashboard web — projeto acadêmico CP5.`
4. Escolha **Public** se a equipe e as regras da disciplina permitirem.
5. Não marque para adicionar README, `.gitignore` ou licença: estes arquivos já estão no projeto.
6. Clique em Create repository.

## 2. Enviar os arquivos pelo PowerShell

Extraia o ZIP do projeto para uma pasta. Abra PowerShell nessa pasta, onde aparece o `README.md` principal, e execute:

```powershell
git init
git add .
git status
git commit -m "feat: organize VinTrace CP5 project"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/vintrace.git
git push -u origin main
```

Troque `SEU-USUARIO` pelo seu nome de usuário do GitHub. Se o Git pedir autenticação, siga a janela oficial do Git Credential Manager; não cole token em arquivo nem no chat.

Antes do `git add`, confirme que `firmware/secrets.h`, `backend/.env` e qualquer credencial não aparecem no `git status`. Eles devem estar ignorados.

## 3. Publicar o site gratuitamente

O workflow `.github/workflows/deploy-site.yml` publica automaticamente a pasta `site/`.

1. No repositório GitHub, abra **Settings → Pages**.
2. Em Build and deployment / Source, escolha **GitHub Actions**.
3. Abra a aba **Actions** e aguarde o workflow `Deploy VinTrace site to GitHub Pages` terminar com sucesso.
4. A URL pública aparece na execução do workflow e em Settings → Pages.
5. Abra a URL em janela anônima e no celular; confirme que a página e a demo carregam.

## 4. Atualizar depois

Sempre que alterar arquivos:

```powershell
git add .
git commit -m "docs: update VinTrace project"
git push
```

A alteração em `site/` dispara nova publicação. Mudanças no dashboard ou API atualizam o repositório, mas não criam hospedagem pública automática para esses serviços.

## 5. Equipe acadêmica

Os integrantes foram registrados em [`equipe.md`](equipe.md). Confirme com todos os integrantes e com a instituição se os RMs podem ser publicados em um repositório público.

## 6. Antes de divulgar

- Trocar placeholders por integrantes, turma, professor e link Wokwi real.
- Não divulgar URLs privadas nem credenciais FIWARE/MQTT.
- Conferir se a licença e os assets estão autorizados para publicação.
- Marcar claramente o que é demonstração e o que foi validado com hardware.
