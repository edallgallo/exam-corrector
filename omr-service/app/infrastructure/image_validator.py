"""
Infrastructure Layer - Image Validator

Implementação concreta da interface IImageValidator.
"""

import io
from typing import BinaryIO
from PIL import Image
from app.application.interfaces import IImageValidator
from app.domain.value_objects import ImageMetadata


class ImageValidator(IImageValidator):
    """Validador de imagens usando Pillow"""

    ALLOWED_MIME_TYPES = {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    }

    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

    def validate_file_type(self, file: BinaryIO, filename: str) -> bool:
        """
        Valida o tipo de arquivo pela extensão e conteúdo.

        Args:
            file: Arquivo binário
            filename: Nome do arquivo

        Returns:
            True se válido, False caso contrário
        """
        # Verificar extensão
        extension = filename.lower().split('.')[-1] if '.' in filename else ''
        if f".{extension}" not in self.ALLOWED_EXTENSIONS:
            return False

        # Verificar conteúdo real com Pillow
        try:
            file.seek(0)
            img = Image.open(file)
            img.verify()  # Verifica se é uma imagem válida
            file.seek(0)
            return img.format.upper() in ["JPEG", "PNG", "WEBP"]
        except Exception:
            return False

    def validate_file_size(self, file: BinaryIO, max_mb: int = 5) -> bool:
        """
        Valida o tamanho do arquivo.

        Args:
            file: Arquivo binário
            max_mb: Tamanho máximo em MB

        Returns:
            True se válido, False caso contrário
        """
        file.seek(0, 2)  # Ir para o final
        size_bytes = file.tell()
        file.seek(0)  # Voltar ao início

        max_bytes = max_mb * 1024 * 1024
        return size_bytes <= max_bytes

    def get_metadata(self, image_data: bytes) -> ImageMetadata:
        """
        Extrai metadados da imagem.

        Args:
            image_data: Bytes da imagem

        Returns:
            ImageMetadata com informações da imagem

        Raises:
            ValueError: Se a imagem for inválida
        """
        try:
            img = Image.open(io.BytesIO(image_data))
            return ImageMetadata(
                width=img.width,
                height=img.height,
                format=img.format or "UNKNOWN",
                size_bytes=len(image_data)
            )
        except Exception as e:
            raise ValueError(f"Erro ao ler metadados da imagem: {str(e)}")
