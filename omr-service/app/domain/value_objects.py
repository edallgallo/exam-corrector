"""
Domain Layer - Value Objects

Objetos de valor imutáveis que representam conceitos do domínio.
"""

from dataclasses import dataclass
from typing import List, Optional


@dataclass(frozen=True)
class ROI:
    """Region of Interest - área da imagem que contém o gabarito"""
    x: int
    y: int
    width: int
    height: int

    def is_valid(self) -> bool:
        """Verifica se o ROI tem dimensões válidas"""
        return self.width > 0 and self.height > 0 and self.x >= 0 and self.y >= 0


@dataclass(frozen=True)
class OMROptions:
    """Opções de configuração para leitura OMR"""
    num_questions: int
    choices: List[str]  # ["A", "B", "C", "D", "E"]
    template: str = "AUTO"  # "AUTO" ou "MANUAL_ROI"
    roi: Optional[ROI] = None
    debug: bool = False

    def __post_init__(self):
        """Validações após inicialização"""
        if self.num_questions < 1 or self.num_questions > 100:
            raise ValueError("num_questions deve estar entre 1 e 100")

        if not self.choices or len(self.choices) < 2:
            raise ValueError("choices deve ter pelo menos 2 alternativas")

        if self.template not in ["AUTO", "MANUAL_ROI"]:
            raise ValueError("template deve ser 'AUTO' ou 'MANUAL_ROI'")

        if self.template == "MANUAL_ROI" and self.roi is None:
            raise ValueError("ROI é obrigatório quando template é 'MANUAL_ROI'")

        if self.roi and not self.roi.is_valid():
            raise ValueError("ROI inválido")


@dataclass(frozen=True)
class ImageMetadata:
    """Metadados da imagem processada"""
    width: int
    height: int
    format: str  # "JPEG", "PNG", "WEBP"
    size_bytes: int

    def is_valid_size(self, max_mb: int = 5) -> bool:
        """Verifica se o tamanho está dentro do limite"""
        max_bytes = max_mb * 1024 * 1024
        return self.size_bytes <= max_bytes

    def is_valid_dimensions(self, min_width: int = 800, min_height: int = 600) -> bool:
        """Verifica se as dimensões são adequadas"""
        return self.width >= min_width and self.height >= min_height
