"""
Application Layer - Use Cases

Orquestram a lógica de negócio usando as entidades de domínio
e as interfaces de infraestrutura.
"""

from typing import BinaryIO
from app.domain.entities import OMRResult, AnswerKey, ExamCorrection, Answer
from app.domain.value_objects import OMROptions
from app.application.interfaces import IOMREngine, IImageValidator, IDebugStorage


class ReadAnswersUseCase:
    """
    Use Case: Ler respostas de uma imagem de prova usando OMR.

    Responsabilidades:
    - Validar a imagem de entrada
    - Processar a imagem com o motor OMR
    - Salvar imagens de debug se solicitado
    - Retornar resultado estruturado
    """

    def __init__(
        self,
        omr_engine: IOMREngine,
        image_validator: IImageValidator,
        debug_storage: IDebugStorage
    ):
        self.omr_engine = omr_engine
        self.image_validator = image_validator
        self.debug_storage = debug_storage

    def execute(
        self,
        image_file: BinaryIO,
        filename: str,
        options: OMROptions
    ) -> OMRResult:
        """
        Executa a leitura de respostas.

        Args:
            image_file: Arquivo de imagem
            filename: Nome do arquivo
            options: Opções de processamento OMR

        Returns:
            OMRResult com respostas detectadas

        Raises:
            ValueError: Se a imagem for inválida
            RuntimeError: Se houver erro no processamento
        """
        # 1. Validar tipo de arquivo
        if not self.image_validator.validate_file_type(image_file, filename):
            raise ValueError(
                "Tipo de arquivo inválido. Use JPG, PNG ou WEBP."
            )

        # 2. Validar tamanho
        if not self.image_validator.validate_file_size(image_file):
            raise ValueError(
                "Arquivo muito grande. Tamanho máximo: 5MB."
            )

        # 3. Ler bytes da imagem
        image_file.seek(0)
        image_data = image_file.read()

        # 4. Validar metadados
        metadata = self.image_validator.get_metadata(image_data)
        if not metadata.is_valid_dimensions():
            raise ValueError(
                f"Dimensões insuficientes: {metadata.width}x{metadata.height}. "
                "Mínimo recomendado: 800x600."
            )

        # 5. Processar com OMR engine
        result = self.omr_engine.process_image(image_data, options)

        # 6. Salvar imagens de debug se solicitado
        if options.debug and result.debug_images:
            # As imagens já foram salvas pelo engine, apenas fazer cleanup
            self.debug_storage.cleanup_old_files(max_age_hours=24)

        return result


class CorrectExamUseCase:
    """
    Use Case: Corrigir uma prova completa comparando com o gabarito.

    Responsabilidades:
    - Ler respostas da imagem usando ReadAnswersUseCase
    - Comparar com o gabarito oficial
    - Calcular pontuação e percentual
    - Identificar questões que precisam revisão
    - Retornar resultado completo da correção
    """

    def __init__(self, read_answers_use_case: ReadAnswersUseCase):
        self.read_answers_use_case = read_answers_use_case

    def execute(
        self,
        image_file: BinaryIO,
        filename: str,
        answer_key: AnswerKey
    ) -> ExamCorrection:
        """
        Executa a correção completa da prova.

        Args:
            image_file: Arquivo de imagem da prova
            filename: Nome do arquivo
            answer_key: Gabarito oficial

        Returns:
            ExamCorrection com resultado completo

        Raises:
            ValueError: Se a imagem for inválida
            RuntimeError: Se houver erro no processamento
        """
        # 1. Preparar opções OMR baseadas no gabarito
        options = OMROptions(
            num_questions=len(answer_key.questions),
            choices=["A", "B", "C", "D", "E"],  # Padrão
            template="AUTO",
            debug=False
        )

        # 2. Ler respostas da imagem
        omr_result = self.read_answers_use_case.execute(
            image_file, filename, options
        )

        # 3. Comparar com gabarito e calcular resultados
        detected_answers = omr_result.get_answers_dict()
        flags = omr_result.get_flags()

        correct_count = 0
        errors = []
        invalid_questions = []
        blank_questions = flags["blank"]
        review_needed = []
        score = 0.0

        # Processar cada questão
        for answer in omr_result.answers:
            question = answer_key.get_question(answer.question_number)
            if not question:
                continue

            # Verificar se precisa revisão
            if answer.needs_review():
                invalid_questions.append(answer.question_number)
                review_needed.append({
                    "q": answer.question_number,
                    "motivo": self._get_review_reason(answer),
                    "confianca": answer.confidence
                })

            # Verificar se está correta (apenas se for válida)
            if answer.is_valid():
                if question.is_correct(answer.marked_choice):
                    correct_count += 1
                    score += question.points
                else:
                    errors.append({
                        "q": answer.question_number,
                        "marcada": answer.marked_choice or "em branco",
                        "correta": question.correct_answer
                    })

        # 4. Calcular percentual e aprovação
        total_points = answer_key.total_points
        percentage = (score / total_points * 100) if total_points > 0 else 0.0
        passed = percentage >= answer_key.passing_score

        # 5. Criar resultado
        return ExamCorrection(
            answer_key_id=answer_key.id,
            detected_answers=detected_answers,
            correct_count=correct_count,
            errors=errors,
            invalid_questions=invalid_questions,
            blank_questions=blank_questions,
            score=score,
            percentage=round(percentage, 2),
            passed=passed,
            review_needed=review_needed
        )

    def _get_review_reason(self, answer: Answer) -> str:
        """Retorna o motivo da revisão baseado na qualidade"""
        from app.domain.entities import MarkQuality

        if answer.quality == MarkQuality.BLANK:
            return "em_branco"
        elif answer.quality == MarkQuality.MULTIPLE:
            return "dupla_marcacao"
        elif answer.quality == MarkQuality.LOW_CONFIDENCE:
            return "baixa_confianca"
        else:
            return "desconhecido"
