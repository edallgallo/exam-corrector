// Grade calculation utilities

export const calculateGrade = (studentAnswers, answerKey) => {
    const results = [];
    let totalScore = 0;
    let maxScore = 0;

    answerKey.questions.forEach((question) => {
        const studentAnswer = studentAnswers[question.number - 1];
        const isCorrect = studentAnswer === question.correctAnswer;
        const score = isCorrect ? question.weight : 0;

        results.push({
            questionNumber: question.number,
            correctAnswer: question.correctAnswer,
            studentAnswer: studentAnswer || 'N/A',
            isCorrect,
            weight: question.weight,
            score,
        });

        totalScore += score;
        maxScore += question.weight;
    });

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    return {
        results,
        totalScore: totalScore.toFixed(2),
        maxScore: maxScore.toFixed(2),
        percentage: percentage.toFixed(2),
        correctCount: results.filter(r => r.isCorrect).length,
        totalQuestions: answerKey.questions.length,
    };
};

export const getGradeStatus = (percentage, minPassingScore = 60) => {
    if (percentage >= minPassingScore) {
        if (percentage >= 90) return { label: 'Excelente - Aprovado', color: 'success' };
        if (percentage >= 70) return { label: 'Bom - Aprovado', color: 'success' };
        return { label: 'Aprovado', color: 'info' };
    }
    return { label: 'Reprovado', color: 'error' };
};
