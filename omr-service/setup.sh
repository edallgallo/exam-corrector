#!/bin/bash

# Script de setup do OMR Service
# Cria ambiente virtual e instala dependências

echo "🚀 Setup do OMR Service"
echo "======================="
echo ""

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Por favor, instale Python 3.8 ou superior."
    exit 1
fi

echo "✓ Python encontrado: $(python3 --version)"
echo ""

# Criar ambiente virtual
echo "📦 Criando ambiente virtual..."
python3 -m venv venv

if [ $? -ne 0 ]; then
    echo "❌ Erro ao criar ambiente virtual"
    exit 1
fi

echo "✓ Ambiente virtual criado"
echo ""

# Ativar ambiente virtual
echo "🔧 Ativando ambiente virtual..."
source venv/bin/activate

# Atualizar pip
echo "📥 Atualizando pip..."
pip install --upgrade pip > /dev/null 2>&1

# Instalar dependências
echo "📥 Instalando dependências..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

echo "✓ Dependências instaladas"
echo ""

# Criar diretório de debug
echo "📁 Criando diretório de debug..."
mkdir -p /tmp/omr_debug
echo "✓ Diretório criado: /tmp/omr_debug"
echo ""

# Copiar .env.example para .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "✓ Arquivo .env criado"
else
    echo "✓ Arquivo .env já existe"
fi

echo ""
echo "✅ Setup concluído com sucesso!"
echo ""
echo "Para iniciar o servidor:"
echo "  1. Ative o ambiente virtual: source venv/bin/activate"
echo "  2. Execute: uvicorn app.main:app --reload --port 8000"
echo ""
echo "Para testar via CLI:"
echo "  python cli.py --image ./sample.jpg --numQuestions 10 --choices A,B,C,D,E --debug"
echo ""
echo "Para rodar testes:"
echo "  pytest tests/ -v"
echo ""
