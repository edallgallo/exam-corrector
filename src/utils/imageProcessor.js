import Tesseract from 'tesseract.js';

// Process image and extract text - using Tesseract.recognize directly
export const processImage = async (imageFile, onProgress) => {
    try {
        if (onProgress) onProgress(10);

        console.log('Converting image to data URL...');
        // Convert file to data URL
        const imageUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
        });

        if (onProgress) onProgress(20);
        console.log('Starting OCR with Tesseract.recognize...');

        // Use Tesseract.recognize directly instead of worker
        const result = await Tesseract.recognize(
            imageUrl,
            'eng',
            {
                logger: (m) => {
                    console.log('OCR Progress:', m);
                    if (m.status === 'recognizing text' && onProgress) {
                        const progress = 20 + Math.round(m.progress * 70);
                        onProgress(progress);
                    }
                },
            }
        );

        console.log('OCR completed. Text length:', result.data.text.length);
        console.log('Extracted text:', result.data.text);
        if (onProgress) onProgress(100);

        return result.data.text;
    } catch (error) {
        console.error('Error processing image:', error);
        throw new Error('Erro ao processar a imagem: ' + error.message);
    }
};

// Extract answers from OCR text
export const extractAnswers = (text, numberOfQuestions) => {
    const answers = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    // Pattern to match question numbers and answers (e.g., "1. A", "1) B", "1 - C", etc.)
    const patterns = [
        /(\d+)[.):\-\s]+([A-E])/gi,  // Matches: 1. A, 1) B, 1: C, 1 - D, etc.
        /([A-E])\s*[\-–]\s*(\d+)/gi,  // Matches: A - 1, B – 2, etc.
    ];

    const foundAnswers = new Map();

    // Try standard patterns first
    for (const pattern of patterns) {
        for (const line of lines) {
            let match;
            while ((match = pattern.exec(line)) !== null) {
                let questionNum, answer;

                // Check which group is the question number
                if (!isNaN(match[1])) {
                    questionNum = parseInt(match[1]);
                    answer = match[2].toUpperCase();
                } else {
                    questionNum = parseInt(match[2]);
                    answer = match[1].toUpperCase();
                }

                if (questionNum >= 1 && questionNum <= numberOfQuestions &&
                    ['A', 'B', 'C', 'D', 'E'].includes(answer)) {
                    foundAnswers.set(questionNum, answer);
                }
            }
        }
    }

    // Try to detect table format with filled spaces
    if (foundAnswers.size < numberOfQuestions / 2) {
        const tableAnswers = detectTableFormat(text, numberOfQuestions);
        tableAnswers.forEach((answer, questionNum) => {
            if (!foundAnswers.has(questionNum)) {
                foundAnswers.set(questionNum, answer);
            }
        });
    }

    // Convert map to array, filling missing answers with null
    for (let i = 1; i <= numberOfQuestions; i++) {
        answers.push(foundAnswers.get(i) || null);
    }

    return answers;
};

// Detect table format where a filled space marks the correct answer
const detectTableFormat = (text, numberOfQuestions) => {
    const foundAnswers = new Map();
    const lines = text.split('\n');

    console.log('=== TABLE DETECTION START ===');
    console.log('Total lines:', lines.length);
    console.log('Looking for', numberOfQuestions, 'questions');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Look for lines with question numbers
        const questionMatch = line.match(/^\s*(\d+)\s/);
        if (questionMatch) {
            const questionNum = parseInt(questionMatch[1]);
            if (questionNum >= 1 && questionNum <= numberOfQuestions) {
                console.log(`\n--- Question ${questionNum} ---`);
                console.log('Line:', line);

                // Remove question number to analyze alternatives
                const lineWithoutNum = line.replace(/^\s*\d+\s*/, '');
                console.log('Without number:', lineWithoutNum);

                const alternatives = ['A', 'B', 'C', 'D', 'E'];

                // Strategy: Find which alternative has filling characters near it
                // When a space is filled (X, scribbles, etc.), OCR reads extra chars

                // Find positions of all alternatives
                const altPositions = [];
                for (const alt of alternatives) {
                    const idx = lineWithoutNum.toUpperCase().indexOf(alt);
                    if (idx !== -1) {
                        altPositions.push({ alt, pos: idx });
                    }
                }

                console.log('Alternative positions:', altPositions);

                // For each alternative, check if there are filling characters nearby
                let maxFillingScore = 0;
                let markedAlt = null;

                for (let j = 0; j < altPositions.length; j++) {
                    const current = altPositions[j];
                    const nextPos = j < altPositions.length - 1 ? altPositions[j + 1].pos : lineWithoutNum.length;

                    // Get the segment between this alternative and the next
                    const segment = lineWithoutNum.substring(current.pos + 1, nextPos);

                    // Count filling characters (anything that's not a space or letter)
                    // Common filling chars: X, /, \, -, |, _, ~, =, +, *, #, @
                    const fillingChars = segment.match(/[X\/\\\-|_~=+*#@<>]/gi);
                    const fillingScore = fillingChars ? fillingChars.length : 0;

                    console.log(`${current.alt}: segment="${segment}", filling chars:`, fillingChars, `score: ${fillingScore}`);

                    if (fillingScore > maxFillingScore && fillingScore > 0) {
                        maxFillingScore = fillingScore;
                        markedAlt = current.alt;
                    }
                }

                if (markedAlt) {
                    console.log(`✓ Detected filled space at: ${markedAlt} (score: ${maxFillingScore})`);
                    foundAnswers.set(questionNum, markedAlt);
                } else {
                    console.log('✗ No filled space detected');
                }
            }
        }
    }

    console.log('\n=== FINAL RESULTS ===');
    console.log('Detected answers:', Object.fromEntries(foundAnswers));
    console.log('=== TABLE DETECTION END ===\n');

    return foundAnswers;
};

// Cleanup - not needed with Tesseract.recognize
export const terminateWorker = async () => {
    console.log('No worker to terminate');
};
