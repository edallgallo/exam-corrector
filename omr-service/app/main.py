"""
FastAPI Main Application

Entry point da aplicação com configuração de CORS e rotas.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.presentation.routes import router

# Criar aplicação FastAPI
app = FastAPI(
    title="OMR Service",
    description="Serviço de leitura de marcações (OMR) para correção automática de provas",
    version="1.0.0"
)

# Configurar CORS para aceitar requests do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternativa
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rotas
app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "OMR Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
