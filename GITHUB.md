# 🚀 Guia: Como Subir o Projeto no GitHub

## Pré-requisitos

1. **Git instalado**
   ```bash
   git --version
   ```

2. **Conta no GitHub** criada em https://github.com

3. **Git configurado** com seu nome e email
   ```bash
   git config --global user.name "Seu Nome"
   git config --global user.email "seu.email@example.com"
   ```

## Passo a Passo

### 1. Criar Repositório no GitHub

1. Acesse https://github.com
2. Clique em **"New repository"** (botão verde)
3. Preencha:
   - **Repository name**: `exam-corrector` (ou outro nome)
   - **Description**: "Sistema de correção automática de provas com OMR usando OpenCV"
   - **Public** ou **Private** (sua escolha)
   - **NÃO** marque "Initialize with README" (já temos um)
4. Clique em **"Create repository"**

### 2. Inicializar Git Localmente

No terminal, na pasta do projeto:

```bash
cd ~/Estudos/meus_projetos/exam-corrector

# Inicializar repositório Git
git init

# Adicionar todos os arquivos
git add .

# Fazer o primeiro commit
git commit -m "Initial commit: Sistema OMR para correção de provas

- Backend Python FastAPI com Clean Architecture
- Frontend React + Vite
- Pipeline OMR com OpenCV
- Docker Compose para deploy
- Testes unitários e integração
"
```

### 3. Conectar ao GitHub

Substitua `SEU_USUARIO` e `NOME_DO_REPO` pelos seus dados:

```bash
# Adicionar remote
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git

# Renomear branch para main (se necessário)
git branch -M main

# Enviar para o GitHub
git push -u origin main
```

### 4. Autenticação

Se pedir autenticação, você tem duas opções:

#### Opção A: Personal Access Token (Recomendado)

1. Vá em GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Clique em "Generate new token (classic)"
3. Marque: `repo` (acesso completo)
4. Copie o token gerado
5. Use o token como senha quando o Git pedir

#### Opção B: SSH

```bash
# Gerar chave SSH
ssh-keygen -t ed25519 -C "seu.email@example.com"

# Copiar chave pública
cat ~/.ssh/id_ed25519.pub

# Adicionar no GitHub: Settings → SSH and GPG keys → New SSH key
# Colar a chave copiada

# Trocar remote para SSH
git remote set-url origin git@github.com:SEU_USUARIO/NOME_DO_REPO.git
```

## Comandos Úteis

### Verificar Status
```bash
git status
```

### Adicionar Mudanças
```bash
# Adicionar arquivo específico
git add arquivo.js

# Adicionar todos os arquivos modificados
git add .
```

### Fazer Commit
```bash
git commit -m "Descrição das mudanças"
```

### Enviar para GitHub
```bash
git push
```

### Ver Histórico
```bash
git log --oneline
```

### Criar Branch
```bash
# Criar e mudar para nova branch
git checkout -b feature/nova-funcionalidade

# Enviar branch para GitHub
git push -u origin feature/nova-funcionalidade
```

## Estrutura do Projeto no GitHub

Após o push, seu repositório terá:

```
exam-corrector/
├── README.md                 # Documentação principal
├── QUICKSTART.md            # Guia de início rápido
├── package.json             # Frontend dependencies
├── docker-compose.yml       # Orquestração Docker
├── Dockerfile              # Container frontend
├── .gitignore              # Arquivos ignorados
├── src/                    # Frontend React
├── omr-service/            # Backend Python
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   └── tests/
└── ...
```

## Adicionar Badge no README

Adicione badges no topo do README.md:

```markdown
# Corretor de Provas

![Python](https://img.shields.io/badge/Python-3.11-blue)
![React](https://img.shields.io/badge/React-18-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)
![OpenCV](https://img.shields.io/badge/OpenCV-4.9-red)
![License](https://img.shields.io/badge/License-MIT-yellow)
```

## Próximos Passos

1. **Adicionar LICENSE**
   - Crie arquivo `LICENSE` com licença MIT ou outra

2. **Configurar GitHub Actions** (CI/CD)
   - Criar `.github/workflows/test.yml` para rodar testes automaticamente

3. **Adicionar Issues e Projects**
   - Organizar tarefas futuras

4. **Criar Releases**
   - Marcar versões estáveis (v1.0.0, v1.1.0, etc.)

## Troubleshooting

### Erro: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
```

### Erro: "failed to push some refs"
```bash
# Puxar mudanças primeiro
git pull origin main --rebase

# Depois fazer push
git push
```

### Arquivo muito grande
```bash
# Remover do histórico
git rm --cached arquivo-grande.zip

# Adicionar ao .gitignore
echo "arquivo-grande.zip" >> .gitignore

# Commit e push
git commit -m "Remove arquivo grande"
git push
```

## Exemplo Completo

```bash
# 1. Navegar para o projeto
cd ~/Estudos/meus_projetos/exam-corrector

# 2. Inicializar Git
git init

# 3. Adicionar arquivos
git add .

# 4. Primeiro commit
git commit -m "Initial commit: Sistema OMR completo"

# 5. Adicionar remote (substitua SEU_USUARIO e REPO)
git remote add origin https://github.com/SEU_USUARIO/exam-corrector.git

# 6. Push
git branch -M main
git push -u origin main
```

Pronto! Seu projeto estará no GitHub! 🎉
