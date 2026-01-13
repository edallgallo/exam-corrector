// Função para listar modelos disponíveis (para debug)
export const listModels = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return;

    try {
        console.log('Verificando modelos disponíveis para esta chave...');
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            { method: 'GET' }
        );
        const data = await response.json();
        console.log('Modelos disponíveis:', data.models?.map(m => m.name));
    } catch (error) {
        console.error('Erro ao listar modelos:', error);
    }
};

// Processar imagem com IA usando API REST direta do Gemini
export const processImageWithAI = async (imageFile, numberOfQuestions, onProgress) => {
    try {
        if (onProgress) onProgress(10);
        console.log('Iniciando processamento com IA...');

        // Verificar API key
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('API key não configurada');
        }

        // Converter imagem para base64
        console.log('Convertendo imagem para base64...');
        const base64Image = await fileToBase64(imageFile);
        if (onProgress) onProgress(30);

        // Criar prompt
        const prompt = `Analise esta imagem de um gabarito de prova com ${numberOfQuestions} questões.
Cada questão tem alternativas A, B, C, D, E e a resposta marcada está indicada com X ou preenchimento.
Retorne APENAS um JSON no formato: {"1": "B", "2": "C", ...}`;

        if (onProgress) onProgress(40);

        // Usaremos o modelo "Lite" que as vezes tem quota liberada quando o principal não tem
        const modelId = "gemini-2.0-flash-lite";

        // Chamar API REST diretamente (versão v1beta)
        console.log(`Chamando API Gemini (v1beta) com modelo ${modelId}...`);
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    /*************/
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: imageFile.type,
                                    data: base64Image
                                }
                            }
                        ]
                    }]
                })
            }
        );

        if (onProgress) onProgress(70);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('ERRO DETALHADO DA API GEMINI:', JSON.stringify(errorData, null, 2));

            // Tentar um fallback automático se o 1.5-flash falhar
            console.log('Tentando fallback para gemini-1.5-flash-8b...');
            // Verificaremos se o erro foi de "modelo não encontrado"
            if (response.status === 404) {
                // Implementaríamos outro fetch aqui, mas vamos primeiro ver o log do listModels
            }

            if (errorData.error) {
                if (errorData.error.message.includes('API key not valid')) {
                    throw new Error('API key inválida. Verifique se copiou a chave correta no arquivo .env');
                }
                throw new Error(`Erro da IA: ${errorData.error.message}`);
            }
            throw new Error('Erro desconhecido ao processar com IA. Use o modo Manual.');
        }

        const data = await response.json();
        console.log('Dados recebidos da API:', data);

        if (onProgress) onProgress(85);

        // Extrair texto da resposta
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('Texto extraído:', text);

        // Extrair JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('IA não retornou formato esperado. Use o modo Manual.');
        }

        const answersObj = JSON.parse(jsonMatch[0]);
        console.log('Respostas detectadas:', answersObj);

        // Converter para array
        const answers = [];
        for (let i = 1; i <= numberOfQuestions; i++) {
            const answer = answersObj[i.toString()] || answersObj[i];
            answers.push(answer ? answer.toUpperCase() : null);
        }

        if (onProgress) onProgress(100);
        return answers;

    } catch (error) {
        console.error('Erro ao processar com IA:', error);
        throw new Error(error.message || 'Erro ao processar com IA. Use o modo Manual para digitar as respostas.');
    }
};

// Converter arquivo para base64
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Verificar se API key está configurada
export const isAIConfigured = () => {
    return !!import.meta.env.VITE_GEMINI_API_KEY;
};
