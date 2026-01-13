# Corretor de Provas

Sistema React + FastAPI para correção automática de provas através de processamento de imagens com **OMR (Optical Mark Recognition)** usando OpenCV.

## 🎯 Funcionalidades

- 📝 Cadastro de gabaritos com pesos personalizados
- 📸 Upload e processamento de imagens de provas
- 🔍 **Detecção automática de marcações usando OMR (OpenCV)**
- 📊 Cálculo automático de notas baseado em pesos
- 📈 Visualização detalhada de resultados
- ⚠️ Flags de qualidade (questões em branco, múltiplas marcações, baixa confiança)
- 🐳 **Execução simultânea via Docker Compose**

## 🏗️ Arquitetura

O projeto é dividido em dois componentes:

### Frontend (React + Vite)
- Interface de usuário para cadastro de gabaritos e correção
- Comunicação com backend via API REST

### Backend (Python FastAPI + OpenCV)
- Microserviço OMR para detecção de marcações
- Pipeline completo de processamento de imagem
- Clean Architecture com camadas bem definidas

## 🚀 Como Usar

### Opção 1: Docker Compose (Recomendado)

A maneira mais fácil de rodar o projeto completo:

```bash
# 1. Clonar o repositório
git clone <repo-url>
cd exam-corrector

# 2. Criar arquivo .env (opcional)
cp .env.example .env

# 3. Iniciar todos os serviços
docker-compose up --build
```

Acesse:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Documentação API**: http://localhost:8000/docs

Para parar os serviços:
```bash
docker-compose down
```

### Opção 2: Execução Manual

#### Backend (OMR Service)

```bash
cd omr-service

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Instalar dependências
pip install -r requirements.txt

# Iniciar servidor
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
# Na raiz do projeto
npm install
npm run dev
```

## 📋 Como Usar o Sistema

### 1. Criar um Gabarito

1. Acesse a página "Gabaritos"
2. Clique em "Novo Gabarito"
3. Defina o nome do gabarito
4. Configure as questões com respostas corretas (A-E)
5. Atribua pontos para cada questão (0 a 1000 pontos)
6. Defina a pontuação mínima para aprovação (%)
7. Salve o gabarito

### 2. Corrigir uma Prova

1. Acesse a página "Corrigir"
2. Selecione o gabarito desejado
3. Escolha o método:
   - **OMR (Imagem)**: Upload de foto da prova (recomendado)
   - **Manual**: Digite as respostas manualmente
4. Faça upload da imagem da prova
5. Aguarde o processamento
6. Visualize os resultados

## 📷 Formato da Prova (OMR)

Para melhor resultado com OMR, a prova deve estar no formato de **tabela**:

```
    A   B   C   D   E
1   [ ] [X] [ ] [ ] [ ]  → Resposta: B
2   [ ] [ ] [X] [ ] [ ]  → Resposta: C
3   [X] [ ] [ ] [ ] [ ]  → Resposta: A
```

### Requisitos da Foto

- ✅ Formato: JPG, PNG ou WEBP
- ✅ Tamanho: até 5MB
- ✅ Resolução: mínimo 800x600 pixels
- ✅ Iluminação: uniforme (evitar sombras fortes)
- ✅ Ângulo: pode estar levemente inclinada (correção automática)
- ✅ Marcações: "X" ou preenchimento visível

## 🔧 Tecnologias Utilizadas

### Frontend
- React 18
- React Router DOM
- Lucide React (Ícones)
- Vite (Build Tool)

### Backend
- Python 3.11
- FastAPI (Framework web)
- OpenCV (Processamento de imagem)
- NumPy (Operações numéricas)
- Pillow (Validação de imagem)
- Pydantic (Validação de dados)

### DevOps
- Docker & Docker Compose
- Multi-stage builds

## 📁 Estrutura do Projeto

```
exam-corrector/
├── src/                    # Frontend React
│   ├── pages/             # Páginas (Home, AnswerKey, Correction, Results)
│   ├── components/        # Componentes reutilizáveis
│   └── utils/             # Utilitários (omrProcessor, storage, gradeCalculator)
│
├── omr-service/           # Backend Python
│   ├── app/
│   │   ├── domain/       # Entidades e Value Objects
│   │   ├── application/  # Use Cases e Interfaces
│   │   ├── infrastructure/ # OpenCV Engine, Validators
│   │   └── presentation/ # FastAPI Routes e DTOs
│   ├── tests/            # Testes automatizados
│   └── cli.py            # Ferramenta CLI
│
├── docker-compose.yml     # Orquestração de serviços
├── Dockerfile            # Frontend container
└── README.md            # Esta documentação
```

## 🧪 Testes

### Backend

```bash
cd omr-service
source venv/bin/activate
pytest tests/ -v
```

### CLI (Teste local do OMR)

```bash
cd omr-service
python cli.py --image ./sample.jpg --numQuestions 10 --choices A,B,C,D,E --debug
```

## 📊 API Endpoints

### Health Check
```
GET /api/health
```

### Ler Marcações (OMR)
```
POST /api/omr/read
Content-Type: multipart/form-data

Campos:
- image: arquivo de imagem
- options: JSON com configurações
```

### Corrigir Prova
```
POST /api/corrigir
Content-Type: multipart/form-data

Campos:
- image: arquivo de imagem
- gabarito: JSON com gabarito completo
```

Documentação completa: http://localhost:8000/docs

## 🐛 Troubleshooting

### OMR não detecta marcações

- Verifique se a imagem tem boa iluminação
- Certifique-se de que as marcações são visíveis
- Use caneta/lápis mais escuro
- Tente o modo Manual como fallback

### Backend não inicia

```bash
# Verificar se a porta 8000 está livre
docker-compose down
docker-compose up --build
```

### Frontend não conecta ao backend

- Verifique se o backend está rodando: http://localhost:8000/api/health
- Confirme a variável de ambiente `VITE_OMR_SERVICE_URL` no `.env`

## 📝 Variáveis de Ambiente

### Frontend (.env)
```
VITE_OMR_SERVICE_URL=http://localhost:8000
```

### Backend (omr-service/.env)
```
OMR_DEBUG_DIR=/tmp/omr_debug
OMR_MAX_FILE_SIZE_MB=5
OMR_MIN_CONFIDENCE=0.3
OMR_BLANK_THRESHOLD=0.05
OMR_MULTIPLE_THRESHOLD=0.7
```

## 🚀 Build para Produção

### Frontend
```bash
npm run build
```
Os arquivos otimizados serão gerados na pasta `dist/`.

### Backend
```bash
cd omr-service
docker build -t omr-service:latest .
```

## 📄 Licença

MIT

## 👨‍💻 Desenvolvimento

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📚 Documentação Adicional

- [Arquitetura do Backend](omr-service/ARCHITECTURE.md)
- [Documentação da API](http://localhost:8000/docs) (quando rodando)
- [Guia do OMR](omr-service/README.md)
