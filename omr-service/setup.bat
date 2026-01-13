@echo off
REM Script de setup do OMR Service para Windows
REM Cria ambiente virtual e instala dependências

echo 🚀 Setup do OMR Service
echo =======================
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado. Por favor, instale Python 3.8 ou superior.
    exit /b 1
)

echo ✓ Python encontrado
python --version
echo.

REM Criar ambiente virtual
echo 📦 Criando ambiente virtual...
python -m venv venv

if errorlevel 1 (
    echo ❌ Erro ao criar ambiente virtual
    exit /b 1
)

echo ✓ Ambiente virtual criado
echo.

REM Ativar ambiente virtual
echo 🔧 Ativando ambiente virtual...
call venv\Scripts\activate.bat

REM Atualizar pip
echo 📥 Atualizando pip...
python -m pip install --upgrade pip >nul 2>&1

REM Instalar dependências
echo 📥 Instalando dependências...
pip install -r requirements.txt

if errorlevel 1 (
    echo ❌ Erro ao instalar dependências
    exit /b 1
)

echo ✓ Dependências instaladas
echo.

REM Criar diretório de debug
echo 📁 Criando diretório de debug...
if not exist "C:\temp\omr_debug" mkdir "C:\temp\omr_debug"
echo ✓ Diretório criado: C:\temp\omr_debug
echo.

REM Copiar .env.example para .env se não existir
if not exist .env (
    echo 📝 Criando arquivo .env...
    copy .env.example .env
    echo ✓ Arquivo .env criado
) else (
    echo ✓ Arquivo .env já existe
)

echo.
echo ✅ Setup concluído com sucesso!
echo.
echo Para iniciar o servidor:
echo   1. Ative o ambiente virtual: venv\Scripts\activate
echo   2. Execute: uvicorn app.main:app --reload --port 8000
echo.
echo Para testar via CLI:
echo   python cli.py --image .\sample.jpg --numQuestions 10 --choices A,B,C,D,E --debug
echo.
echo Para rodar testes:
echo   pytest tests\ -v
echo.

pause
