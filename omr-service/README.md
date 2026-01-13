# OMR Service - Microserviço de Leitura de Marcações

Sistema de leitura de marcações (OMR - Optical Mark Recognition) usando OpenCV para correção automática de provas.

## Arquitetura

Este projeto segue os princípios de **Clean Architecture**, organizado em camadas:

```
omr-service/
├── app/
│   ├── domain/           # Camada de Domínio (Entidades e Regras de Negócio)
│   ├── application/      # Camada de Aplicação (Use Cases)
│   ├── infrastructure/   # Camada de Infraestrutura (OpenCV, File System)
│   ├── presentation/     # Camada de Apresentação (FastAPI Controllers)
│   └── main.py          # Entry point da aplicação
├── tests/               # Testes automatizados
├── cli.py              # Interface CLI para testes
├── requirements.txt    # Dependências Python
└── README.md          # Esta documentação
```

### Camadas

- **Domain**: Entidades de negócio puras (OMRResult, Question, Answer) sem dependências externas
- **Application**: Use Cases que orquestram a lógica de negócio (ReadAnswersUseCase, CorrectExamUseCase)
- **Infrastructure**: Implementações concretas (OpenCV engine, validadores, file handlers)
- **Presentation**: Controllers FastAPI que recebem requests HTTP e chamam use cases

## Instalação

### 1. Criar ambiente virtual

```bash
cd omr-service
python -m venv venv

# Linux/Mac
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

## Como Usar

### Rodar o servidor

```bash
uvicorn app.main:app --reload --port 8000
```

O servidor estará disponível em `http://localhost:8000`

### Endpoints

#### Health Check
```bash
GET http://localhost:8000/health
```

#### Ler Marcações
```bash
POST http://localhost:8000/api/omr/read
Content-Type: multipart/form-data

Campos:
- image: arquivo de imagem (JPG/PNG/WEBP, max 5MB)
- options: JSON string com configurações
  {
    "numQuestions": 10,
    "choices": ["A", "B", "C", "D", "E"],
    "template": "AUTO",  // ou "MANUAL_ROI"
    "roi": {"x": 0, "y": 0, "w": 0, "h": 0},  // opcional
    "debug": false
  }

Resposta:
{
  "answers": {"1": "B", "2": "C", ...},
  "confidence": {"1": 0.42, "2": 0.68, ...},
  "flags": {
    "blank": [3, 7],
    "multiple": [5],
    "lowConfidence": [1, 9]
  },
  "debug": {
    "roiImageUrl": "/tmp/omr_debug/roi_xxx.jpg",
    "binaryUrl": "/tmp/omr_debug/binary_xxx.jpg",
    "noGridUrl": "/tmp/omr_debug/nogrid_xxx.jpg"
  }
}
```

#### Corrigir Prova Completa
```bash
POST http://localhost:8000/api/corrigir
Content-Type: multipart/form-data

Campos:
- image: arquivo de imagem
- gabarito: JSON string com gabarito
  {
    "id": "gabarito-1",
    "name": "Prova de Matemática",
    "questions": [
      {"number": 1, "correctAnswer": "B", "points": 10},
      {"number": 2, "correctAnswer": "C", "points": 10},
      ...
    ],
    "passingScore": 60
  }

Resposta:
{
  "provaId": "gabarito-1",
  "detectadas": {"1": "B", "2": "C", ...},
  "acertos": 8,
  "erros": [{"q": 3, "marcada": "B", "correta": "C"}],
  "invalidas": [5, 7],
  "emBranco": [7],
  "pontuacao": 80,
  "percentual": 80.0,
  "aprovado": true,
  "revisao": [
    {"q": 5, "motivo": "dupla_marcacao", "confianca": 0.15},
    {"q": 7, "motivo": "em_branco", "confianca": 0.0}
  ]
}
```

### Testar via CLI

```bash
python cli.py --image ./tests/sample_exam.jpg --numQuestions 10 --choices A,B,C,D,E --debug
```

## Formato da Imagem

A imagem deve conter uma **tabela** com:
- **Linhas**: uma para cada questão (numeradas 1, 2, 3, ...)
- **Colunas**: uma para cada alternativa (A, B, C, D, E)
- **Marcações**: "X" ou preenchimento na célula da resposta

Exemplo:
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
- ✅ Ângulo: pode estar levemente inclinada (correção automática de perspectiva)
- ✅ Marcações: "X" ou preenchimento visível

## Algoritmo OMR

### 1. Pré-processamento
- Conversão para escala de cinza
- Blur gaussiano (redução de ruído)
- Binarização adaptativa

### 2. Detecção de ROI
- Detecção de contornos retangulares
- Análise de linhas (Hough Transform)
- Seleção do contorno com maior "score de grade"

### 3. Correção de Perspectiva
- Ordenação dos 4 pontos do contorno
- Transformação de perspectiva

### 4. Remoção de Grade
- Extração de linhas horizontais e verticais
- Subtração da grade da imagem

### 5. Divisão em Células
- Cálculo de dimensões (questões × alternativas)
- Extração de cada célula com padding interno

### 6. Análise de Marcação
- Cálculo de densidade de tinta por célula
- Ordenação por densidade
- Cálculo de confiança: `(melhor - segundo) / melhor`

### 7. Flags de Qualidade
- **blank**: densidade < 5%
- **multiple**: segunda alternativa > 70% da primeira
- **lowConfidence**: confiança < 30%

## Testes

### Testes Unitários
```bash
pytest tests/test_domain.py -v
pytest tests/test_use_cases.py -v
```

### Testes de Integração
```bash
# Com o servidor rodando
pytest tests/test_integration.py -v
```

## Troubleshooting

### Erro: "No ROI detected"
- Verifique se a imagem contém uma tabela visível
- Tente usar modo `MANUAL_ROI` e especificar coordenadas

### Erro: "Low confidence on multiple questions"
- Melhore a iluminação da foto
- Certifique-se de que as marcações estão visíveis
- Use caneta/lápis mais escuro

### Erro: "Multiple marks detected"
- Apague marcações duplicadas
- Use apenas uma marcação por questão

## Variáveis de Ambiente

Crie um arquivo `.env` (opcional):
```
OMR_DEBUG_DIR=/tmp/omr_debug
OMR_MAX_FILE_SIZE_MB=5
OMR_MIN_CONFIDENCE=0.3
```

## Licença

MIT
