"""
Testes Unitários - Domain Layer

Testa entidades e value objects do domínio.
"""

import pytest
from app.domain.entities import (
    Answer, MarkQuality, OMRResult, Question, AnswerKey, ExamCorrection
)
from app.domain.value_objects import ROI, OMROptions, ImageMetadata


class TestAnswer:
    """Testes para a entidade Answer"""

    def test_answer_is_valid_when_clear(self):
        answer = Answer(
            question_number=1,
            marked_choice="B",
            confidence=0.8,
            quality=MarkQuality.CLEAR,
            densities={"A": 0.1, "B": 0.9, "C": 0.05}
        )
        assert answer.is_valid() is True

    def test_answer_is_invalid_when_blank(self):
        answer = Answer(
            question_number=1,
            marked_choice=None,
            confidence=0.0,
            quality=MarkQuality.BLANK,
            densities={"A": 0.01, "B": 0.02, "C": 0.01}
        )
        assert answer.is_valid() is False

    def test_answer_needs_review_when_low_confidence(self):
        answer = Answer(
            question_number=1,
            marked_choice="B",
            confidence=0.2,
            quality=MarkQuality.LOW_CONFIDENCE,
            densities={"A": 0.4, "B": 0.5, "C": 0.3}
        )
        assert answer.needs_review() is True


class TestOMRResult:
    """Testes para a entidade OMRResult"""

    def test_get_answers_dict(self):
        answers = [
            Answer(1, "B", 0.8, MarkQuality.CLEAR, {}),
            Answer(2, "C", 0.9, MarkQuality.CLEAR, {}),
            Answer(3, None, 0.0, MarkQuality.BLANK, {})
        ]
        result = OMRResult(answers=answers, total_questions=3)

        answers_dict = result.get_answers_dict()
        assert answers_dict == {"1": "B", "2": "C", "3": None}

    def test_get_flags(self):
        answers = [
            Answer(1, "B", 0.8, MarkQuality.CLEAR, {}),
            Answer(2, None, 0.0, MarkQuality.BLANK, {}),
            Answer(3, "A", 0.2, MarkQuality.LOW_CONFIDENCE, {}),
            Answer(4, "D", 0.1, MarkQuality.MULTIPLE, {})
        ]
        result = OMRResult(answers=answers, total_questions=4)

        flags = result.get_flags()
        assert flags["blank"] == [2]
        assert flags["lowConfidence"] == [3]
        assert flags["multiple"] == [4]


class TestQuestion:
    """Testes para a entidade Question"""

    def test_is_correct_when_matches(self):
        question = Question(number=1, correct_answer="B", points=10)
        assert question.is_correct("B") is True
        assert question.is_correct("b") is True  # Case insensitive

    def test_is_incorrect_when_different(self):
        question = Question(number=1, correct_answer="B", points=10)
        assert question.is_correct("A") is False

    def test_is_incorrect_when_none(self):
        question = Question(number=1, correct_answer="B", points=10)
        assert question.is_correct(None) is False


class TestAnswerKey:
    """Testes para a entidade AnswerKey"""

    def test_total_points(self):
        questions = [
            Question(1, "A", 10),
            Question(2, "B", 15),
            Question(3, "C", 20)
        ]
        key = AnswerKey("key1", "Test", questions, 60)
        assert key.total_points == 45

    def test_get_question(self):
        questions = [
            Question(1, "A", 10),
            Question(2, "B", 15)
        ]
        key = AnswerKey("key1", "Test", questions, 60)

        q = key.get_question(2)
        assert q is not None
        assert q.correct_answer == "B"

        q = key.get_question(99)
        assert q is None


class TestROI:
    """Testes para o value object ROI"""

    def test_roi_is_valid(self):
        roi = ROI(x=10, y=20, width=100, height=200)
        assert roi.is_valid() is True

    def test_roi_is_invalid_with_zero_dimensions(self):
        roi = ROI(x=10, y=20, width=0, height=200)
        assert roi.is_valid() is False

    def test_roi_is_invalid_with_negative_coords(self):
        roi = ROI(x=-10, y=20, width=100, height=200)
        assert roi.is_valid() is False


class TestOMROptions:
    """Testes para o value object OMROptions"""

    def test_valid_options(self):
        options = OMROptions(
            num_questions=10,
            choices=["A", "B", "C", "D", "E"]
        )
        assert options.num_questions == 10
        assert len(options.choices) == 5

    def test_invalid_num_questions(self):
        with pytest.raises(ValueError):
            OMROptions(num_questions=0, choices=["A", "B"])

        with pytest.raises(ValueError):
            OMROptions(num_questions=101, choices=["A", "B"])

    def test_invalid_choices(self):
        with pytest.raises(ValueError):
            OMROptions(num_questions=10, choices=["A"])  # Menos de 2

    def test_manual_roi_requires_roi(self):
        with pytest.raises(ValueError):
            OMROptions(
                num_questions=10,
                choices=["A", "B"],
                template="MANUAL_ROI",
                roi=None
            )


class TestImageMetadata:
    """Testes para o value object ImageMetadata"""

    def test_is_valid_size(self):
        metadata = ImageMetadata(800, 600, "JPEG", 2 * 1024 * 1024)  # 2MB
        assert metadata.is_valid_size(max_mb=5) is True

        metadata = ImageMetadata(800, 600, "JPEG", 6 * 1024 * 1024)  # 6MB
        assert metadata.is_valid_size(max_mb=5) is False

    def test_is_valid_dimensions(self):
        metadata = ImageMetadata(1024, 768, "JPEG", 1024)
        assert metadata.is_valid_dimensions(min_width=800, min_height=600) is True

        metadata = ImageMetadata(640, 480, "JPEG", 1024)
        assert metadata.is_valid_dimensions(min_width=800, min_height=600) is False
