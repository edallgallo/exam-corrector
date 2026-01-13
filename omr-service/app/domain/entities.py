"""
Domain Layer - Entities

Entidades de negócio puras sem dependências externas.
Representam os conceitos centrais do domínio OMR.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum


class MarkQuality(Enum):
    """Qualidade da marcação detectada"""
    CLEAR = "clear"  # Marcação clara e confiável
    LOW_CONFIDENCE = "low_confidence"  # Baixa confiança
    BLANK = "blank"  # Questão em branco
    MULTIPLE = "multiple"  # Múltiplas marcações


@dataclass
class Answer:
    """Resposta detectada para uma questão"""
    question_number: int
    marked_choice: Optional[str]  # A, B, C, D, E ou None se em branco
    confidence: float  # 0.0 a 1.0
    quality: MarkQuality
    densities: Dict[str, float]  # Densidade de tinta por alternativa {"A": 0.1, "B": 0.8, ...}

    def is_valid(self) -> bool:
        """Verifica se a resposta é válida para correção"""
        return self.quality in [MarkQuality.CLEAR, MarkQuality.LOW_CONFIDENCE]

    def needs_review(self) -> bool:
        """Verifica se a resposta precisa de revisão manual"""
        return self.quality in [MarkQuality.LOW_CONFIDENCE, MarkQuality.BLANK, MarkQuality.MULTIPLE]


@dataclass
class OMRResult:
    """Resultado completo da leitura OMR"""
    answers: List[Answer]
    total_questions: int
    debug_images: Optional[Dict[str, str]] = None  # {"roi": "path", "binary": "path", ...}

    def get_answers_dict(self) -> Dict[str, Optional[str]]:
        """Retorna dicionário {questão: resposta}"""
        return {
            str(ans.question_number): ans.marked_choice
            for ans in self.answers
        }

    def get_confidence_dict(self) -> Dict[str, float]:
        """Retorna dicionário {questão: confiança}"""
        return {
            str(ans.question_number): ans.confidence
            for ans in self.answers
        }

    def get_flags(self) -> Dict[str, List[int]]:
        """Retorna flags de qualidade agrupadas"""
        flags = {
            "blank": [],
            "multiple": [],
            "lowConfidence": []
        }

        for ans in self.answers:
            if ans.quality == MarkQuality.BLANK:
                flags["blank"].append(ans.question_number)
            elif ans.quality == MarkQuality.MULTIPLE:
                flags["multiple"].append(ans.question_number)
            elif ans.quality == MarkQuality.LOW_CONFIDENCE:
                flags["lowConfidence"].append(ans.question_number)

        return flags


@dataclass
class Question:
    """Questão do gabarito"""
    number: int
    correct_answer: str  # A, B, C, D, E
    points: float

    def is_correct(self, student_answer: Optional[str]) -> bool:
        """Verifica se a resposta do aluno está correta"""
        if student_answer is None:
            return False
        return student_answer.upper() == self.correct_answer.upper()


@dataclass
class AnswerKey:
    """Gabarito da prova"""
    id: str
    name: str
    questions: List[Question]
    passing_score: float  # Percentual mínimo para aprovação (0-100)

    @property
    def total_points(self) -> float:
        """Pontuação total da prova"""
        return sum(q.points for q in self.questions)

    def get_question(self, number: int) -> Optional[Question]:
        """Busca questão por número"""
        for q in self.questions:
            if q.number == number:
                return q
        return None


@dataclass
class ExamCorrection:
    """Resultado da correção de uma prova"""
    answer_key_id: str
    detected_answers: Dict[str, Optional[str]]  # {questão: resposta detectada}
    correct_count: int
    errors: List[Dict[str, any]]  # [{"q": 3, "marcada": "B", "correta": "C"}]
    invalid_questions: List[int]  # Questões com flags (blank/multiple/low confidence)
    blank_questions: List[int]
    score: float
    percentage: float
    passed: bool
    review_needed: List[Dict[str, any]]  # [{"q": 5, "motivo": "baixa_confianca", ...}]

    def to_dict(self) -> dict:
        """Converte para dicionário para serialização"""
        return {
            "provaId": self.answer_key_id,
            "detectadas": self.detected_answers,
            "acertos": self.correct_count,
            "erros": self.errors,
            "invalidas": self.invalid_questions,
            "emBranco": self.blank_questions,
            "pontuacao": self.score,
            "percentual": self.percentage,
            "aprovado": self.passed,
            "revisao": self.review_needed
        }
