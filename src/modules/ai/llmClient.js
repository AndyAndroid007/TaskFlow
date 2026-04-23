const logger = require('../../utils/logger');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

function mapRole(role) {
    return role === 'model' ? 'model' : 'user';
}

async function callGemini(systemPrompt, history, options = {}) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = options.model || DEFAULT_MODEL;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
            contents: history.map((message) => ({
                role: mapRole(message.role),
                parts: [{ text: message.content }],
            })),
            generationConfig: {
                temperature: options.temperature ?? 0.2,
                maxOutputTokens: options.maxOutputTokens ?? 256,
            },
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        logger.warn('Gemini API request failed', {
            status: response.status,
            body: errorBody,
        });
        throw new Error(`Gemini API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')
        .trim();

    if (!text) {
        throw new Error('Gemini returned an empty response');
    }

    return text;
}

module.exports = {
    callGemini,
};
