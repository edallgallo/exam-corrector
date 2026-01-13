"""
Presentation Layer - DTOs (Data Transfer Objects)

Modelos Pydantic para validação de requests e responses da API.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, validator


class ROIDto(BaseModel):
    """DTO para Region of Interest"""
    x: int = Field(ge=0)
    y: int = Field(ge=0)
    w: int = Field(gt=0, alias="w")
    h: int = Field(gt=0, alias="h")

    class Config:
        populate_by_name = True


class OMROptionsDto(BaseModel):
    """DTO para opções de processamento OMR"""
    numQuestions: int = Field(ge=1, le=100)
    choices: List[str] = Field(min_length=2)
    template: str = Field(default="AUTO", pattern="^(AUTO|MANUAL_ROI)$")
    roi: Optional[ROIDto] = None
    debug: bool = False

    @validator('choices')
    def validate_choices(cls, v):
        """Valida que as alternativas são letras maiúsculas únicas"""
        if not all(len(c) == 1 and c.isupper() for c in v):
            raise ValueError("Alternativas devem ser letras maiúsculas únicas (A, B, C, ...)")
        if len(v) != len(set(v)):
            raise ValueError("Alternativas duplicadas não são permitidas")
        return v


class QuestionDto(BaseModel):
    """DTO para questão do gabarito"""
    number: int = Field(ge=1)
    correctAnswer: str = Field(min_length=1, max_length=1)
    points: float = Field(gt=0)

    @validator('correctAnswer')
    def validate_answer(cls, v):
        """Valida que a resposta é uma letra maiúscula"""
        if not v.isupper():
            raise ValueError("Resposta deve ser uma letra maiúscula")
        return v


class AnswerKeyDto(BaseModel):
    """DTO para gabarito completo"""
    id: str
    name: str
    questions: List[QuestionDto]
    passingScore: float = Field(ge=0, le=100)

    @validator('questions')
    def validate_questions(cls, v):
        """Valida que há pelo menos uma questão"""
        if not v:
            raise ValueError("Gabarito deve ter pelo menos uma questão")
        return v


class OMRResultDto(BaseModel):
    """DTO para resultado da leitura OMR"""
    answers: Dict[str, Optional[str]]
    confidence: Dict[str, float]
    flags: Dict[str, List[int]]
    debug: Optional[Dict[str, str]] = None


class ExamCorrectionDto(BaseModel):
    """DTO para resultado da correção"""
    provaId: str
    detectadas: Dict[str, Optional[str]]
    acertos: int
    erros: List[Dict[str, Any]]
    invalidas: List[int]
    emBranco: List[int]
    pontuacao: float
    percentual: float
    aprovado: bool
    revisao: List[Dict[str, Any]]


class ErrorResponseDto(BaseModel):
    """DTO para resposta de erro"""
    detail: str
    error_type: Optional[str] = None
