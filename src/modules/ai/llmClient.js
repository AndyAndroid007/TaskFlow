const logger = require('../../utils/logger');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

function mapRole(role) {
    return role === 'model' ? 'model' : 'user';
}

function formatHistoryForLLM(history) {
    if (!history || history.length === 0) return [];
    
    const formatted = [];
    let currentRole = null;
    let currentParts = [];

    for (const message of history) {
        const role = mapRole(message.role);
        if (!message.content) continue; // Skip empty messages
        
        if (role === currentRole) {
            // Concatenate text for same role to ensure strict alternation
            currentParts.push({ text: message.content });
        } else {
            if (currentRole) {
                formatted.push({ role: currentRole, parts: currentParts });
            }
            currentRole = role;
            currentParts = [{ text: message.content }];
        }
    }
    if (currentRole) {
        formatted.push({ role: currentRole, parts: currentParts });
    }

    // History must strictly start with 'user'
    if (formatted.length > 0 && formatted[0].role !== 'user') {
        formatted.shift();
    }

    return formatted;
}

async function callGemini(systemPrompt, history, options = {}) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = options.model || DEFAULT_MODEL;
    const formattedHistory = formatHistoryForLLM(history);

    const body = {
        ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
        contents: formattedHistory,
        generationConfig: {
            temperature: options.temperature ?? 0.2,
            maxOutputTokens: options.maxOutputTokens ?? 256,
        },
    };

    if (options.tools) {
        body.tools = options.tools;
    }
    if (options.toolConfig) {
        body.toolConfig = options.toolConfig;
    }

    // --- DEBUG LOGS FOR LLM INJECTION ---
    /*
    console.log('\n--- LLM INJECTION START ---');
    if (systemPrompt) {
        console.log('[SYSTEM PROMPT]:\n', systemPrompt);
    }
    console.log('[CONVERSATION HISTORY]:\n', JSON.stringify(formattedHistory, null, 2));
    if (options.tools) {
        console.log('[TOOLS]:\n', JSON.stringify(options.tools, null, 2));
    }
    console.log('--- LLM INJECTION END ---\n');
    */
    // ------------------------------------

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
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
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const functionCallPart = parts.find(p => p.functionCall);
    if (functionCallPart) {
        return {
            type: 'function_call',
            functionCall: functionCallPart.functionCall,
        };
    }

    const text = parts.map((part) => part.text || '').join('').trim();
    if (!text && parts.length === 0) {
        throw new Error('Gemini returned an empty response');
    }

    return { type: 'text', text };
}

module.exports = {
    callGemini,
    formatHistoryForLLM,
};
