"""
Application Layer - Interfaces (Ports)

Define contratos que a camada de infraestrutura deve implementar.
Seguindo o princípio de Inversão de Dependência.
"""

from abc import ABC, abstractmethod
from typing import BinaryIO
from app.domain.entities import OMRResult
from app.domain.value_objects import OMROptions, ImageMetadata


class IOMREngine(ABC):
    """Interface para o motor de processamento OMR"""

    @abstractmethod
    def process_image(self, image_data: bytes, options: OMROptions) -> OMRResult:
        """
        Processa uma imagem e retorna as respostas detectadas.

        Args:
            image_data: Bytes da imagem
            options: Configurações de processamento

        Returns:
            OMRResult com respostas detectadas

        Raises:
            ValueError: Se a imagem for inválida
            RuntimeError: Se houver erro no processamento
        """
        pass


class IImageValidator(ABC):
    """Interface para validação de imagens"""

    @abstractmethod
    def validate_file_type(self, file: BinaryIO, filename: str) -> bool:
        """Valida o tipo de arquivo"""
        pass

    @abstractmethod
    def validate_file_size(self, file: BinaryIO, max_mb: int = 5) -> bool:
        """Valida o tamanho do arquivo"""
        pass

    @abstractmethod
    def get_metadata(self, image_data: bytes) -> ImageMetadata:
        """Extrai metadados da imagem"""
        pass


class IDebugStorage(ABC):
    """Interface para armazenamento de imagens de debug"""

    @abstractmethod
    def save_debug_image(self, image_data: bytes, prefix: str, format: str = "jpg") -> str:
        """
        Salva imagem de debug e retorna o caminho.

        Args:
            image_data: Bytes da imagem
            prefix: Prefixo do nome do arquivo (roi, binary, nogrid)
            format: Formato da imagem

        Returns:
            Caminho completo do arquivo salvo
        """
        pass

    @abstractmethod
    def cleanup_old_files(self, max_age_hours: int = 24):
        """Remove arquivos de debug antigos"""
        pass
