// Storage utilities for managing answer keys and results in localStorage

const STORAGE_KEYS = {
    ANSWER_KEYS: 'exam_corrector_answer_keys',
    RESULTS: 'exam_corrector_results',
};

// Answer Key Management
export const saveAnswerKey = (answerKey) => {
    try {
        const keys = getAllAnswerKeys();
        const existingIndex = keys.findIndex(k => k.id === answerKey.id);

        if (existingIndex >= 0) {
            keys[existingIndex] = answerKey;
        } else {
            keys.push(answerKey);
        }

        localStorage.setItem(STORAGE_KEYS.ANSWER_KEYS, JSON.stringify(keys));
        return true;
    } catch (error) {
        console.error('Error saving answer key:', error);
        return false;
    }
};

export const getAllAnswerKeys = () => {
    try {
        const keys = localStorage.getItem(STORAGE_KEYS.ANSWER_KEYS);
        return keys ? JSON.parse(keys) : [];
    } catch (error) {
        console.error('Error loading answer keys:', error);
        return [];
    }
};

export const getAnswerKeyById = (id) => {
    const keys = getAllAnswerKeys();
    return keys.find(k => k.id === id);
};

export const deleteAnswerKey = (id) => {
    try {
        const keys = getAllAnswerKeys();
        const filtered = keys.filter(k => k.id !== id);
        localStorage.setItem(STORAGE_KEYS.ANSWER_KEYS, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('Error deleting answer key:', error);
        return false;
    }
};

// Results Management
export const saveResult = (result) => {
    try {
        const results = getAllResults();
        results.unshift(result); // Add to beginning
        localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
        return true;
    } catch (error) {
        console.error('Error saving result:', error);
        return false;
    }
};

export const getAllResults = () => {
    try {
        const results = localStorage.getItem(STORAGE_KEYS.RESULTS);
        return results ? JSON.parse(results) : [];
    } catch (error) {
        console.error('Error loading results:', error);
        return [];
    }
};

export const clearAllResults = () => {
    try {
        localStorage.removeItem(STORAGE_KEYS.RESULTS);
        return true;
    } catch (error) {
        console.error('Error clearing results:', error);
        return false;
    }
};
