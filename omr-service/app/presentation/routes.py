"""
Presentation Layer - API Routes

Controllers FastAPI que recebem requests HTTP e delegam para use cases.
"""

import json
from typing import BinaryIO
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse

from app.presentation.dtos import (
    OMROptionsDto, OMRResultDto, AnswerKeyDto,
    ExamCorrectionDto, ErrorResponseDto
)
from app.application.use_cases import ReadAnswersUseCase, CorrectExamUseCase
from app.domain.entities import AnswerKey, Question
from app.domain.value_objects import OMROptions, ROI


router = APIRouter()


def get_read_answers_use_case() -> ReadAnswersUseCase:
    """Dependency injection para ReadAnswersUseCase"""
    from app.infrastructure.omr_engine import OpenCVOMREngine
    from app.infrastructure.image_validator import ImageValidator
    from app.infrastructure.debug_storage import DebugStorage

    debug_storage = DebugStorage()
    omr_engine = OpenCVOMREngine(debug_storage=debug_storage)
    image_validator = ImageValidator()

    return ReadAnswersUseCase(omr_engine, image_validator, debug_storage)


def get_correct_exam_use_case() -> CorrectExamUseCase:
    """Dependency injection para CorrectExamUseCase"""
    read_answers_use_case = get_read_answers_use_case()
    return CorrectExamUseCase(read_answers_use_case)


@router.post("/omr/read", response_model=OMRResultDto)
async def read_answers(
    image: UploadFile = File(...),
    options: str = Form(...),
    use_case: ReadAnswersUseCase = Depends(get_read_answers_use_case)
):
    """
    Endpoint para ler respostas de uma imagem usando OMR.

    Args:
        image: Arquivo de imagem (JPG/PNG/WEBP)
        options: JSON string com configurações OMROptionsDto
        use_case: Use case injetado

    Returns:
        OMRResultDto com respostas detectadas

    Raises:
        HTTPException 400: Dados inválidos
        HTTPException 500: Erro no processamento
    """
    try:
        # Parse options JSON
        options_dict = json.loads(options)
        options_dto = OMROptionsDto(**options_dict)

        # Converter DTO para Value Object
        roi = None
        if options_dto.roi:
            roi = ROI(
                x=options_dto.roi.x,
                y=options_dto.roi.y,
                width=options_dto.roi.w,
                height=options_dto.roi.h
            )

        omr_options = OMROptions(
            num_questions=options_dto.numQuestions,
            choices=options_dto.choices,
            template=options_dto.template,
            roi=roi,
            debug=options_dto.debug
        )

        # Executar use case
        result = use_case.execute(
            image_file=image.file,
            filename=image.filename or "image.jpg",
            options=omr_options
        )

        # Converter resultado para DTO
        return OMRResultDto(
            answers=result.get_answers_dict(),
            confidence=result.get_confidence_dict(),
            flags=result.get_flags(),
            debug=result.debug_images
        )

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Options deve ser um JSON válido"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro inesperado: {str(e)}"
        )


@router.post("/corrigir", response_model=ExamCorrectionDto)
async def correct_exam(
    image: UploadFile = File(...),
    gabarito: str = Form(...),
    use_case: CorrectExamUseCase = Depends(get_correct_exam_use_case)
):
    """
    Endpoint para corrigir uma prova completa.

    Args:
        image: Arquivo de imagem da prova
        gabarito: JSON string com gabarito (AnswerKeyDto)
        use_case: Use case injetado

    Returns:
        ExamCorrectionDto com resultado completo

    Raises:
        HTTPException 400: Dados inválidos
        HTTPException 500: Erro no processamento
    """
    try:
        # Parse gabarito JSON
        gabarito_dict = json.loads(gabarito)
        gabarito_dto = AnswerKeyDto(**gabarito_dict)

        # Converter DTO para Entity
        questions = [
            Question(
                number=q.number,
                correct_answer=q.correctAnswer,
                points=q.points
            )
            for q in gabarito_dto.questions
        ]

        answer_key = AnswerKey(
            id=gabarito_dto.id,
            name=gabarito_dto.name,
            questions=questions,
            passing_score=gabarito_dto.passingScore
        )

        # Executar use case
        result = use_case.execute(
            image_file=image.file,
            filename=image.filename or "image.jpg",
            answer_key=answer_key
        )

        # Retornar resultado como dict
        return result.to_dict()

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Gabarito deve ser um JSON válido"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro inesperado: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "omr-service"}
