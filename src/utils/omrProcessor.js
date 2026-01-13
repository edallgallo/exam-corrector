/**
 * OMR Processor - Cliente para o microserviço OMR
 * 
 * Substitui o processamento OCR/AI por chamadas ao backend OMR.
 */

const OMR_SERVICE_URL = import.meta.env.VITE_OMR_SERVICE_URL || 'http://localhost:8000';

/**
 * Lê respostas de uma imagem usando OMR
 * @param {File} imageFile - Arquivo de imagem
 * @param {number} numQuestions - Número de questões
 * @param {string[]} choices - Alternativas (ex: ["A", "B", "C", "D", "E"])
 * @param {boolean} debug - Modo debug
 * @returns {Promise<Object>} Resultado com respostas, confiança e flags
 */
export const readAnswersWithOMR = async (imageFile, numQuestions, choices = ["A", "B", "C", "D", "E"], debug = false) => {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('options', JSON.stringify({
            numQuestions,
            choices,
            template: "AUTO",
            debug
        }));

        const response = await fetch(`${OMR_SERVICE_URL}/api/omr/read`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao processar imagem com OMR');
        }

        const result = await response.json();

        // Converter para array de respostas (compatível com o formato antigo)
        const answersArray = [];
        for (let i = 1; i <= numQuestions; i++) {
            answersArray.push(result.answers[i.toString()] || null);
        }

        return {
            answers: answersArray,
            confidence: result.confidence,
            flags: result.flags,
            debug: result.debug
        };
    } catch (error) {
        console.error('Erro no OMR:', error);
        throw new Error(
            error.message ||
            'Erro ao conectar com o serviço OMR. Verifique se o backend está rodando.'
        );
    }
};

/**
 * Corrige uma prova completa comparando com o gabarito
 * @param {File} imageFile - Arquivo de imagem
 * @param {Object} answerKey - Gabarito completo
 * @returns {Promise<Object>} Resultado da correção
 */
export const correctExamWithOMR = async (imageFile, answerKey) => {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('gabarito', JSON.stringify({
            id: answerKey.id,
            name: answerKey.name,
            questions: answerKey.questions.map(q => ({
                number: q.number,
                correctAnswer: q.correctAnswer,
                points: q.points
            })),
            passingScore: answerKey.passingScore
        }));

        const response = await fetch(`${OMR_SERVICE_URL}/api/corrigir`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao corrigir prova com OMR');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro na correção OMR:', error);
        throw new Error(
            error.message ||
            'Erro ao conectar com o serviço OMR. Verifique se o backend está rodando.'
        );
    }
};

/**
 * Verifica se o serviço OMR está disponível
 * @returns {Promise<boolean>}
 */
export const isOMRServiceAvailable = async () => {
    try {
        const response = await fetch(`${OMR_SERVICE_URL}/api/health`, {
            method: 'GET',
        });
        return response.ok;
    } catch (error) {
        console.error('Serviço OMR indisponível:', error);
        return false;
    }
};
