"""
Testes de Integração - API Endpoints

Testa os endpoints FastAPI com requests HTTP reais.
Requer que o servidor esteja rodando.
"""

import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    """Testa o endpoint de health check"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "omr-service"


@pytest.mark.asyncio
async def test_root_endpoint():
    """Testa o endpoint raiz"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")

    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "OMR Service"
    assert "version" in data


# Nota: Testes completos de /omr/read e /corrigir requerem imagens de exemplo
# e devem ser executados com o servidor rodando e imagens de teste disponíveis.
# Exemplo de teste completo (comentado):

# @pytest.mark.asyncio
# async def test_omr_read_endpoint():
#     """Testa o endpoint de leitura OMR"""
#     async with AsyncClient(app=app, base_url="http://test") as client:
#         with open("tests/sample_exam.jpg", "rb") as image_file:
#             files = {"image": ("exam.jpg", image_file, "image/jpeg")}
#             data = {
#                 "options": json.dumps({
#                     "numQuestions": 10,
#                     "choices": ["A", "B", "C", "D", "E"],
#                     "template": "AUTO",
#                     "debug": False
#                 })
#             }
#             response = await client.post("/api/omr/read", files=files, data=data)
#
#     assert response.status_code == 200
#     result = response.json()
#     assert "answers" in result
#     assert "confidence" in result
#     assert "flags" in result
