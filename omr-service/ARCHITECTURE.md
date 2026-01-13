# Estrutura do Backend OMR Service

## Árvore de Diretórios

```
omr-service/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application entry point
│   │
│   ├── domain/                    # 🎯 DOMAIN LAYER (Business Logic)
│   │   ├── __init__.py
│   │   ├── entities.py           # Answer, OMRResult, Question, AnswerKey, ExamCorrection
│   │   └── value_objects.py      # ROI, OMROptions, ImageMetadata
│   │
│   ├── application/               # 🔄 APPLICATION LAYER (Use Cases)
│   │   ├── __init__.py
│   │   ├── interfaces.py         # IOMREngine, IImageValidator, IDebugStorage
│   │   └── use_cases.py          # ReadAnswersUseCase, CorrectExamUseCase
│   │
│   ├── infrastructure/            # 🔧 INFRASTRUCTURE LAYER (Implementations)
│   │   ├── __init__.py
│   │   ├── omr_engine.py         # OpenCVOMREngine (core OMR processing)
│   │   ├── image_validator.py    # ImageValidator (Pillow-based)
│   │   └── debug_storage.py      # DebugStorage (filesystem)
│   │
│   └── presentation/              # 🌐 PRESENTATION LAYER (API)
│       ├── __init__.py
│       ├── dtos.py               # Pydantic models for API
│       └── routes.py             # FastAPI endpoints
│
├── tests/
│   ├── __init__.py
│   ├── test_domain.py            # Unit tests for domain layer
│   └── test_integration.py       # Integration tests for API
│
├── cli.py                         # CLI tool for local testing
├── setup.sh                       # Setup script (Linux/Mac)
├── setup.bat                      # Setup script (Windows)
├── requirements.txt               # Python dependencies
├── pytest.ini                     # Pytest configuration
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
└── README.md                      # Documentation
```

## Clean Architecture - Camadas

### 1. Domain Layer (Núcleo)
**Responsabilidade**: Regras de negócio puras, sem dependências externas.

**Componentes**:
- `entities.py`: Entidades de negócio
  - `Answer`: Resposta detectada com confiança e qualidade
  - `OMRResult`: Resultado completo da leitura
  - `Question`: Questão do gabarito
  - `AnswerKey`: Gabarito completo
  - `ExamCorrection`: Resultado da correção
  - `MarkQuality`: Enum para qualidade da marcação

- `value_objects.py`: Objetos de valor imutáveis
  - `ROI`: Region of Interest
  - `OMROptions`: Configurações de processamento
  - `ImageMetadata`: Metadados da imagem

### 2. Application Layer (Casos de Uso)
**Responsabilidade**: Orquestrar a lógica de negócio.

**Componentes**:
- `interfaces.py`: Contratos (Ports)
  - `IOMREngine`: Interface para motor OMR
  - `IImageValidator`: Interface para validação
  - `IDebugStorage`: Interface para armazenamento debug

- `use_cases.py`: Casos de uso
  - `ReadAnswersUseCase`: Ler respostas de imagem
  - `CorrectExamUseCase`: Corrigir prova completa

### 3. Infrastructure Layer (Implementações)
**Responsabilidade**: Implementações concretas das interfaces.

**Componentes**:
- `omr_engine.py`: **Motor OMR com OpenCV**
  - Pré-processamento (grayscale, blur, threshold)
  - Detecção automática de ROI
  - Correção de perspectiva
  - Remoção de grade
  - Análise de células
  - Cálculo de confiança

- `image_validator.py`: Validador de imagens (Pillow)
- `debug_storage.py`: Armazenamento de debug (filesystem)

### 4. Presentation Layer (API)
**Responsabilidade**: Expor funcionalidades via HTTP.

**Componentes**:
- `dtos.py`: Modelos Pydantic para validação
- `routes.py`: Endpoints FastAPI
  - `POST /api/omr/read`: Ler marcações
  - `POST /api/corrigir`: Corrigir prova
  - `GET /api/health`: Health check

- `main.py`: Aplicação FastAPI com CORS

## Fluxo de Dados

```
HTTP Request (Frontend)
    ↓
[Presentation Layer]
    routes.py → DTOs validation
    ↓
[Application Layer]
    use_cases.py → Orchestration
    ↓
[Infrastructure Layer]
    omr_engine.py → OpenCV processing
    image_validator.py → Validation
    debug_storage.py → Debug images
    ↓
[Domain Layer]
    entities.py → Business logic
    value_objects.py → Data structures
    ↓
[Application Layer]
    use_cases.py → Result assembly
    ↓
[Presentation Layer]
    routes.py → JSON response
    ↓
HTTP Response (Frontend)
```

## Dependency Injection

O sistema usa **Dependency Injection** para manter as camadas desacopladas:

```python
# routes.py
def get_read_answers_use_case() -> ReadAnswersUseCase:
    debug_storage = DebugStorage()
    omr_engine = OpenCVOMREngine(debug_storage=debug_storage)
    image_validator = ImageValidator()
    
    return ReadAnswersUseCase(omr_engine, image_validator, debug_storage)

@router.post("/omr/read")
async def read_answers(
    use_case: ReadAnswersUseCase = Depends(get_read_answers_use_case)
):
    # Use case já vem injetado e configurado
    result = use_case.execute(...)
```

## Princípios SOLID Aplicados

✅ **Single Responsibility**: Cada classe tem uma única responsabilidade
✅ **Open/Closed**: Extensível via interfaces, fechado para modificação
✅ **Liskov Substitution**: Implementações podem ser substituídas
✅ **Interface Segregation**: Interfaces específicas e focadas
✅ **Dependency Inversion**: Dependências apontam para abstrações

## Como Rodar

### Setup Inicial
```bash
# Linux/Mac
chmod +x setup.sh
./setup.sh

# Windows
setup.bat
```

### Iniciar Servidor
```bash
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

uvicorn app.main:app --reload --port 8000
```

### Testar via CLI
```bash
python cli.py --image ./sample.jpg --numQuestions 10 --choices A,B,C,D,E --debug
```

### Rodar Testes
```bash
pytest tests/ -v
```

## Próximos Passos

1. ✅ Backend completo com Clean Architecture
2. ⏳ Integração com frontend React
3. ⏳ Testes com imagens reais
4. ⏳ Ajustes finos no algoritmo OMR
