# 🚀 Quick Start Guide - Exam Corrector

## Início Rápido com Docker (Recomendado)

### Pré-requisitos
- Docker instalado
- Docker Compose instalado

### Passos

1. **Clone o repositório** (se ainda não fez)
```bash
git clone <repo-url>
cd exam-corrector
```

2. **Inicie todos os serviços**
```bash
docker-compose up --build
```

3. **Acesse a aplicação**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Documentação API: http://localhost:8000/docs

4. **Parar os serviços**
```bash
docker-compose down
```

## Comandos Úteis

### Ver logs
```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f omr-backend

# Apenas frontend
docker-compose logs -f frontend
```

### Reiniciar um serviço específico
```bash
docker-compose restart omr-backend
docker-compose restart frontend
```

### Rebuild após mudanças no código
```bash
docker-compose up --build
```

### Limpar tudo (containers, volumes, networks)
```bash
docker-compose down -v
```

## Fluxo de Uso

### 1. Criar Gabarito
1. Acesse http://localhost:5173
2. Clique em "Gabaritos"
3. Clique em "Novo Gabarito"
4. Preencha:
   - Nome do gabarito
   - Número de questões
   - Resposta correta para cada questão (A-E)
   - Pontos por questão
   - Percentual mínimo para aprovação
5. Salve

### 2. Corrigir Prova
1. Clique em "Corrigir"
2. Selecione o gabarito criado
3. Escolha "OMR (Imagem)"
4. Faça upload da foto da prova
5. Aguarde o processamento
6. Veja o resultado!

## Formato da Prova

A prova deve estar em formato de **tabela**:

```
    A   B   C   D   E
1   [ ] [X] [ ] [ ] [ ]
2   [ ] [ ] [X] [ ] [ ]
3   [X] [ ] [ ] [ ] [ ]
```

### Dicas para melhor resultado:
- ✅ Boa iluminação
- ✅ Foto centralizada
- ✅ Marcações visíveis (X ou preenchimento)
- ✅ Evitar sombras
- ✅ Formato JPG, PNG ou WEBP

## Troubleshooting

### Backend não inicia
```bash
# Verificar logs
docker-compose logs omr-backend

# Reiniciar
docker-compose restart omr-backend
```

### Frontend não conecta ao backend
1. Verifique se o backend está rodando:
   ```bash
   curl http://localhost:8000/api/health
   ```
2. Deve retornar: `{"status":"ok","service":"omr-service"}`

### OMR não detecta marcações
- Use o modo **Manual** como fallback
- Verifique a qualidade da foto
- Certifique-se de que as marcações são visíveis

## Desenvolvimento

### Executar sem Docker

#### Backend
```bash
cd omr-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend
```bash
npm install
npm run dev
```

### Testar OMR via CLI
```bash
cd omr-service
source venv/bin/activate
python cli.py --image ./sample.jpg --numQuestions 10 --choices A,B,C,D,E --debug
```

### Rodar testes
```bash
cd omr-service
pytest tests/ -v
```

## Próximos Passos

- [ ] Testar com imagens reais de provas
- [ ] Ajustar thresholds de confiança se necessário
- [ ] Criar imagens de exemplo para documentação
- [ ] Implementar modo de produção com Nginx

## Suporte

Para mais informações, consulte:
- [README.md](README.md) - Documentação completa
- [omr-service/README.md](omr-service/README.md) - Documentação do backend
- [omr-service/ARCHITECTURE.md](omr-service/ARCHITECTURE.md) - Arquitetura detalhada
