"""
Infrastructure Layer - Debug Storage

Implementação concreta da interface IDebugStorage.
"""

import os
import time
import uuid
from pathlib import Path
from app.application.interfaces import IDebugStorage


class DebugStorage(IDebugStorage):
    """Armazenamento de imagens de debug no sistema de arquivos"""

    def __init__(self, debug_dir: str = "/tmp/omr_debug"):
        self.debug_dir = Path(debug_dir)
        self.debug_dir.mkdir(parents=True, exist_ok=True)

    def save_debug_image(
        self,
        image_data: bytes,
        prefix: str,
        format: str = "jpg"
    ) -> str:
        """
        Salva imagem de debug e retorna o caminho.

        Args:
            image_data: Bytes da imagem
            prefix: Prefixo do nome do arquivo (roi, binary, nogrid)
            format: Formato da imagem

        Returns:
            Caminho completo do arquivo salvo
        """
        # Gerar nome único
        unique_id = uuid.uuid4().hex[:8]
        timestamp = int(time.time())
        filename = f"{prefix}_{timestamp}_{unique_id}.{format}"
        filepath = self.debug_dir / filename

        # Salvar arquivo
        with open(filepath, 'wb') as f:
            f.write(image_data)

        return str(filepath)

    def cleanup_old_files(self, max_age_hours: int = 24):
        """
        Remove arquivos de debug antigos.

        Args:
            max_age_hours: Idade máxima em horas
        """
        if not self.debug_dir.exists():
            return

        current_time = time.time()
        max_age_seconds = max_age_hours * 3600

        for file_path in self.debug_dir.iterdir():
            if file_path.is_file():
                file_age = current_time - file_path.stat().st_mtime
                if file_age > max_age_seconds:
                    try:
                        file_path.unlink()
                    except Exception:
                        pass  # Ignorar erros de remoção
