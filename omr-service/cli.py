"""
CLI Tool para testar o motor OMR localmente.

Uso:
    python cli.py --image ./sample.jpg --numQuestions 10 --choices A,B,C,D,E --debug
"""

import argparse
import sys
from pathlib import Path

from app.infrastructure.omr_engine import OpenCVOMREngine
from app.infrastructure.image_validator import ImageValidator
from app.infrastructure.debug_storage import DebugStorage
from app.domain.value_objects import OMROptions


def main():
    parser = argparse.ArgumentParser(
        description="OMR CLI - Testar leitura de marcações localmente"
    )
    parser.add_argument(
        "--image",
        required=True,
        help="Caminho para a imagem da prova"
    )
    parser.add_argument(
        "--numQuestions",
        type=int,
        required=True,
        help="Número de questões"
    )
    parser.add_argument(
        "--choices",
        required=True,
        help="Alternativas separadas por vírgula (ex: A,B,C,D,E)"
    )
    parser.add_argument(
        "--template",
        default="AUTO",
        choices=["AUTO", "MANUAL_ROI"],
        help="Modo de detecção (AUTO ou MANUAL_ROI)"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Salvar imagens de debug"
    )

    args = parser.parse_args()

    # Validar imagem
    image_path = Path(args.image)
    if not image_path.exists():
        print(f"❌ Erro: Arquivo não encontrado: {args.image}")
        sys.exit(1)

    # Preparar opções
    choices = [c.strip().upper() for c in args.choices.split(",")]
    options = OMROptions(
        num_questions=args.numQuestions,
        choices=choices,
        template=args.template,
        debug=args.debug
    )

    # Criar engine
    debug_storage = DebugStorage() if args.debug else None
    engine = OpenCVOMREngine(debug_storage=debug_storage)

    # Processar imagem
    print(f"📄 Processando: {image_path.name}")
    print(f"📊 Questões: {args.numQuestions}")
    print(f"🔤 Alternativas: {', '.join(choices)}")
    print(f"🔍 Modo: {args.template}")
    print()

    try:
        with open(image_path, "rb") as f:
            image_data = f.read()

        result = engine.process_image(image_data, options)

        # Exibir resultados
        print("✅ Processamento concluído!\n")
        print("=" * 50)
        print("RESPOSTAS DETECTADAS")
        print("=" * 50)

        for answer in result.answers:
            status_icon = "✓" if answer.quality.value == "clear" else "⚠"
            quality_text = answer.quality.value.replace("_", " ").title()

            print(f"{status_icon} Questão {answer.question_number}: {answer.marked_choice or 'EM BRANCO'}")
            print(f"   Confiança: {answer.confidence:.2f}")
            print(f"   Qualidade: {quality_text}")

            if args.debug:
                densities_str = ", ".join(
                    f"{k}={v:.3f}" for k, v in answer.densities.items()
                )
                print(f"   Densidades: {densities_str}")

            print()

        # Flags
        flags = result.get_flags()
        if any(flags.values()):
            print("=" * 50)
            print("FLAGS DE REVISÃO")
            print("=" * 50)

            if flags["blank"]:
                print(f"📝 Em branco: {flags['blank']}")
            if flags["multiple"]:
                print(f"⚠️  Múltiplas marcações: {flags['multiple']}")
            if flags["lowConfidence"]:
                print(f"❓ Baixa confiança: {flags['lowConfidence']}")
            print()

        # Debug images
        if args.debug and result.debug_images:
            print("=" * 50)
            print("IMAGENS DE DEBUG")
            print("=" * 50)
            for key, path in result.debug_images.items():
                print(f"📸 {key}: {path}")
            print()

        print("✨ Concluído com sucesso!")

    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
