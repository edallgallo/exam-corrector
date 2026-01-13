"""
Infrastructure Layer - OpenCV OMR Engine

Implementação do motor de processamento OMR usando OpenCV.
Este é o coração do sistema que detecta marcações em provas.
"""

import cv2
import numpy as np
import io
from typing import List, Tuple, Dict, Optional
from PIL import Image

from app.application.interfaces import IOMREngine, IDebugStorage
from app.domain.entities import OMRResult, Answer, MarkQuality
from app.domain.value_objects import OMROptions, ROI


class OpenCVOMREngine(IOMREngine):
    """Motor OMR usando OpenCV para detecção de marcações"""

    def __init__(
        self,
        debug_storage: Optional[IDebugStorage] = None,
        min_confidence: float = 0.2,  # Valor intermediário
        blank_threshold: float = 0.03,  # Valor intermediário - evitar falsos positivos
        multiple_threshold: float = 0.8  # Valor intermediário
    ):
        self.debug_storage = debug_storage
        self.min_confidence = min_confidence
        self.blank_threshold = blank_threshold
        self.multiple_threshold = multiple_threshold

    def process_image(self, image_data: bytes, options: OMROptions) -> OMRResult:
        """
        Processa imagem e detecta marcações.

        Pipeline:
        1. Pré-processamento (grayscale, blur, threshold)
        2. Detecção de ROI do gabarito
        3. Correção de perspectiva
        4. Remoção de linhas da grade
        5. Divisão em células
        6. Análise de densidade por célula
        7. Decisão e cálculo de confiança
        """
        # 1. Carregar imagem
        img_array = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Erro ao decodificar imagem")

        # 2. Pré-processamento
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        binary = cv2.adaptiveThreshold(
            blurred, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            11, 2
        )

        # 3. Detectar ROI
        if options.template == "MANUAL_ROI" and options.roi:
            roi_coords = options.roi
        else:
            roi_coords = self._detect_roi(binary, img.shape)

        if not roi_coords:
            raise RuntimeError(
                "Não foi possível detectar o gabarito automaticamente. "
                "Tente usar modo MANUAL_ROI."
            )

        # 4. Extrair e corrigir perspectiva
        roi_img = self._extract_and_warp_roi(
            binary, img, roi_coords
        )

        # 5. Remover grade
        no_grid = self._remove_grid(roi_img)

        # 6. Dividir em células e analisar
        answers = self._analyze_cells(
            no_grid,
            options.num_questions,
            options.choices
        )

        # 7. Salvar debug se solicitado
        debug_images = None
        if options.debug and self.debug_storage:
            debug_images = self._save_debug_images(
                img, roi_img, binary, no_grid, roi_coords
            )

        return OMRResult(
            answers=answers,
            total_questions=options.num_questions,
            debug_images=debug_images
        )

    def _detect_roi(
        self,
        binary: np.ndarray,
        img_shape: Tuple[int, int, int]
    ) -> Optional[ROI]:
        """
        Detecta automaticamente a região do gabarito.

        Estratégia:
        - Encontrar contornos retangulares grandes
        - Calcular "score de grade" (quantidade de linhas internas)
        - Escolher o contorno com maior score
        """
        # Encontrar contornos
        contours, _ = cv2.findContours(
            binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        if not contours:
            return None

        height, width = img_shape[:2]
        min_area = (width * height) * 0.1  # Pelo menos 10% da imagem

        candidates = []

        for contour in contours:
            area = cv2.contourArea(contour)
            if area < min_area:
                continue

            # Aproximar para retângulo
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.02 * peri, True)

            # Deve ter 4 pontos (retângulo)
            if len(approx) == 4:
                x, y, w, h = cv2.boundingRect(approx)

                # Calcular score de grade (linhas horizontais/verticais)
                roi_binary = binary[y:y+h, x:x+w]
                grid_score = self._calculate_grid_score(roi_binary)

                candidates.append({
                    "roi": ROI(x, y, w, h),
                    "score": grid_score,
                    "area": area
                })

        if not candidates:
            # Fallback: usar a maior área retangular
            largest = max(contours, key=cv2.contourArea)
            x, y, w, h = cv2.boundingRect(largest)
            return ROI(x, y, w, h)

        # Escolher candidato com maior score
        best = max(candidates, key=lambda c: c["score"])
        return best["roi"]

    def _calculate_grid_score(self, roi_binary: np.ndarray) -> float:
        """
        Calcula score de "característica de grade".
        Quanto mais linhas horizontais/verticais, maior o score.
        """
        h, w = roi_binary.shape

        # Detectar linhas horizontais
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (w // 10, 1))
        horizontal = cv2.morphologyEx(
            roi_binary, cv2.MORPH_OPEN, horizontal_kernel
        )
        h_lines = cv2.countNonZero(horizontal)

        # Detectar linhas verticais
        vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, h // 10))
        vertical = cv2.morphologyEx(
            roi_binary, cv2.MORPH_OPEN, vertical_kernel
        )
        v_lines = cv2.countNonZero(vertical)

        # Score = quantidade de pixels de linhas
        return h_lines + v_lines

    def _extract_and_warp_roi(
        self,
        binary: np.ndarray,
        img: np.ndarray,
        roi: ROI
    ) -> np.ndarray:
        """
        Extrai ROI e corrige perspectiva se necessário.
        """
        # Extrair região
        roi_img = binary[roi.y:roi.y+roi.height, roi.x:roi.x+roi.width]

        # TODO: Implementar correção de perspectiva mais sofisticada
        # Por enquanto, apenas retornar o ROI extraído
        return roi_img

    def _remove_grid(self, roi_img: np.ndarray) -> np.ndarray:
        """
        Remove linhas da grade para não contaminar a contagem de tinta.

        Estratégia:
        - Extrair linhas horizontais e verticais com morphology
        - Subtrair da imagem original
        """
        h, w = roi_img.shape

        # Linhas horizontais
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (w // 5, 1))
        horizontal_lines = cv2.morphologyEx(
            roi_img, cv2.MORPH_OPEN, horizontal_kernel, iterations=2
        )

        # Linhas verticais
        vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, h // 5))
        vertical_lines = cv2.morphologyEx(
            roi_img, cv2.MORPH_OPEN, vertical_kernel, iterations=2
        )

        # Combinar linhas
        grid = cv2.add(horizontal_lines, vertical_lines)

        # Subtrair da imagem original
        no_grid = cv2.subtract(roi_img, grid)

        return no_grid

    def _analyze_cells(
        self,
        no_grid: np.ndarray,
        num_questions: int,
        choices: List[str]
    ) -> List[Answer]:
        """
        Divide a imagem em células e analisa cada uma.
        
        IMPORTANTE: A tabela tem uma coluna de números à esquerda que deve ser ignorada.
        Estrutura: [Número] [A] [B] [C] [D] [E]
        
        Retorna lista de Answer com respostas detectadas.
        """
        h, w = no_grid.shape
        cell_height = h // num_questions
        
        # Total de colunas = alternativas + 1 (coluna de números)
        total_columns = len(choices) + 1
        cell_width = w // total_columns

        answers = []

        for q in range(num_questions):
            question_num = q + 1
            densities = {}

            # Analisar cada alternativa (pulando a primeira coluna de números)
            for c, choice in enumerate(choices):
                # Coordenadas da célula
                y1 = q * cell_height
                y2 = (q + 1) * cell_height
                
                # Pular a primeira coluna (números) - começar da coluna 1
                x1 = (c + 1) * cell_width  # +1 para pular coluna de números
                x2 = (c + 2) * cell_width

                # Aplicar padding interno (5% de margem - reduzido para capturar mais do X)
                padding_y = int(cell_height * 0.05)
                padding_x = int(cell_width * 0.05)

                y1 += padding_y
                y2 -= padding_y
                x1 += padding_x
                x2 -= padding_x

                # Extrair célula
                cell = no_grid[y1:y2, x1:x2]

                # Calcular densidade de tinta
                if cell.size > 0:
                    density = cv2.countNonZero(cell) / cell.size
                else:
                    density = 0.0

                densities[choice] = density

            # Decidir resposta baseado nas densidades
            answer = self._decide_answer(question_num, densities, choices)
            answers.append(answer)

        return answers

    def _decide_answer(
        self,
        question_num: int,
        densities: Dict[str, float],
        choices: List[str]
    ) -> Answer:
        """
        Decide a resposta baseado nas densidades.
        
        Nova lógica para detectar QUALQUER tipo de marcação:
        - Ponto, X, preenchimento completo, etc.
        - Usa comparação relativa em vez de threshold absoluto
        """
        # Ordenar por densidade (maior primeiro)
        sorted_choices = sorted(
            choices,
            key=lambda c: densities[c],
            reverse=True
        )

        best_choice = sorted_choices[0]
        best_density = densities[best_choice]
        
        second_density = densities[sorted_choices[1]] if len(sorted_choices) > 1 else 0.0
        
        # Calcular média das densidades para threshold adaptativo
        avg_density = sum(densities.values()) / len(densities)
        
        # Calcular confiança relativa
        if best_density > 0:
            confidence = (best_density - second_density) / best_density
        else:
            confidence = 0.0

        # Nova lógica de decisão baseada em comparação relativa
        # Se a melhor densidade é significativamente maior que a média, é uma marcação
        is_marked = best_density > (avg_density * 1.5)  # 50% acima da média
        
        # Detectar múltiplas marcações (segunda muito próxima da primeira)
        is_multiple = (second_density / best_density > 0.75) if best_density > 0 else False
        
        # Determinar qualidade e resposta
        if not is_marked or best_density < 0.01:  # Threshold mínimo absoluto muito baixo
            # Questão em branco
            quality = MarkQuality.BLANK
            marked_choice = None
        elif is_multiple:
            # Múltiplas marcações
            quality = MarkQuality.MULTIPLE
            marked_choice = best_choice  # Retornar a mais marcada mesmo assim
        elif confidence < 0.15:  # Confiança muito baixa
            # Baixa confiança
            quality = MarkQuality.LOW_CONFIDENCE
            marked_choice = best_choice
        else:
            # Marcação clara
            quality = MarkQuality.CLEAR
            marked_choice = best_choice

        return Answer(
            question_number=question_num,
            marked_choice=marked_choice,
            confidence=round(confidence, 2),
            quality=quality,
            densities=densities
        )

    def _save_debug_images(
        self,
        original: np.ndarray,
        roi_img: np.ndarray,
        binary: np.ndarray,
        no_grid: np.ndarray,
        roi: ROI
    ) -> Dict[str, str]:
        """Salva imagens de debug e retorna os caminhos"""
        if not self.debug_storage:
            return {}

        debug_paths = {}

        # ROI destacado na imagem original
        roi_debug = original.copy()
        cv2.rectangle(
            roi_debug,
            (roi.x, roi.y),
            (roi.x + roi.width, roi.y + roi.height),
            (0, 255, 0), 3
        )
        _, roi_encoded = cv2.imencode('.jpg', roi_debug)
        debug_paths["roiImageUrl"] = self.debug_storage.save_debug_image(
            roi_encoded.tobytes(), "roi", "jpg"
        )

        # Imagem binarizada
        _, binary_encoded = cv2.imencode('.jpg', binary)
        debug_paths["binaryUrl"] = self.debug_storage.save_debug_image(
            binary_encoded.tobytes(), "binary", "jpg"
        )

        # Imagem sem grade
        _, nogrid_encoded = cv2.imencode('.jpg', no_grid)
        debug_paths["noGridUrl"] = self.debug_storage.save_debug_image(
            nogrid_encoded.tobytes(), "nogrid", "jpg"
        )

        return debug_paths
