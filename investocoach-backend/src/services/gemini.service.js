'use strict';

const logger = require('../config/logger');

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

/**
 * Core Gemini API caller
 * @param {string} prompt - user message
 * @param {string} system - system instruction (optional)
 * @returns {Promise<string>} - AI response text
 */
const callGemini = async (prompt, system = '') => {
  if (!GEMINI_KEY) {
    logger.warn('Gemini API key is not configured.');
    throw new Error('AI functionality is disabled because GEMINI_API_KEY is missing.');
  }

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
  };
  
  if (system) {
    body.system_instruction = { parts: [{ text: system }] };
  }

  try {
    const resp = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error?.message || 'Gemini API call failed');
    }
    
    const data = await resp.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
  } catch (error) {
    logger.error('Gemini Service Error:', error);
    throw error;
  }
};

/**
 * Generate fresh Fear Assessment question for a given bias
 */
const generateFearQuestion = async (biasTarget, previousQuestions = []) => {
  const prompt = `Generate ONE original behavioral finance scenario question for a young Indian investor (age 20-28).
The question should specifically probe the bias: "${biasTarget}".
Format: 
QUESTION: [scenario question in 2 sentences max]
A: [answer text — maps to high bias]
B: [answer text — moderate bias]
C: [answer text — rational/no bias]
D: [answer text — opposite bias or other]

Make it realistic for India — mention rupee amounts (₹10,000-₹1,00,000 range), Indian platforms (Zerodha, Groww), or Indian market events.
Do NOT repeat any of these previously asked scenarios: ${previousQuestions.join('; ')}.
Return ONLY the formatted text above, nothing else.`;
  try {
    return await callGemini(prompt);
  } catch {
    return null;
  }
};

/**
 * Generate personalized behavioral debrief after simulation/crash
 */
const generateDebrief = async (sessionData) => {
  const { profile, biasScores, decisions, disciplineScore, crashesSurvived, simulationsDone, lang = 'english' } = sessionData;
  const system = `You are a warm, non-judgmental behavioral finance coach for young Indian investors. 
Write concise, specific, actionable feedback. Never say "you failed." 
Max 140 words total across 3 short paragraphs.
${lang === 'hindi' ? 'Respond entirely in Hindi.' : ''}
${lang === 'punjabi' ? 'Respond entirely in Punjabi.' : ''}`;

  const prompt = `Write a 3-paragraph personalized behavioral debrief:

Fear Profile: ${profile}
Discipline Score: ${disciplineScore}/100
Simulations completed: ${simulationsDone}
Crashes survived: ${crashesSurvived}
Recent decisions: ${JSON.stringify(decisions.slice(-4))}
Bias scores: ${JSON.stringify(biasScores)}

Paragraph 1: Reference 1-2 specific decisions (by portfolio value or drop%) — be precise.
Paragraph 2: Name the exact bias this reveals, explain it simply using a real-world Indian analogy.
Paragraph 3: One specific, concrete habit to build before the next session.`;

  return await callGemini(prompt, system);
};

/**
 * Coach chat response
 */
const coachChat = async (userMessage, context) => {
  const { lang = 'english', profile = 'Unknown', disciplineScore = 0 } = context;
  const langInstr = lang === 'hindi' ? 'Respond entirely in Hindi.' :
                    lang === 'punjabi' ? 'Respond entirely in Punjabi.' : 'Respond in English.';
  const system = `You are a friendly, calm financial coach for young Indian investors using InvestIQ simulation app. 
Rules:
- Simple language, no jargon. Max 90 words.
- Never give direct buy/sell advice for real stocks.
- Focus on behavioral insights and long-term thinking.
- ${langInstr}
- User's Fear Profile: ${profile}
- User's Discipline Score: ${disciplineScore}/100`;

  return await callGemini(userMessage, system);
};

/**
 * Finfluencer claim analyzer
 */
const analyzeClaim = async (claimText) => {
  const prompt = `Analyze this investment claim for manipulation and SEBI violations. Return ONLY valid JSON (no markdown):
{
  "risk_level": "low|medium|high",
  "flags": ["flag1", "flag2", "flag3"],
  "verdict": "2 sentence plain English verdict",
  "action": "2 sentence recommendation for the investor"
}

Check for: guaranteed returns, artificial urgency, pump-and-dump signals, unregistered advice, missing risk disclosure, FOMO manipulation, paid promotion without disclosure.

Claim: "${claimText}"`;
  
  const raw = await callGemini(prompt);
  try {
    return JSON.parse(raw.replace(/\`\`\`json|\`\`\`/g, '').trim());
  } catch (err) {
    logger.warn('Failed to parse gemini JSON response for finfluencer claim, applying fallback logic');
    // fallback parse
    return fallbackAnalysis(claimText);
  }
};

const fallbackAnalysis = (text) => {
  const lower = text.toLowerCase();
  const flags = [];
  if (lower.includes('guaranteed') || lower.includes('100%') || lower.includes('certain profit')) flags.push('Guaranteed return claim — illegal under SEBI regulations');
  if (lower.includes('now') || lower.includes('limited time') || lower.includes('hurry') || lower.includes('today only')) flags.push('Artificial urgency — designed to prevent rational thinking');
  if (lower.includes('3x') || lower.includes('10x') || lower.includes('multibagger')) flags.push('Extraordinary return promise without evidence or risk disclosure');
  if (lower.includes('dm') || lower.includes('whatsapp') || lower.includes('telegram') || lower.includes('join')) flags.push('Unsolicited contact request — common in paid promotion schemes');
  if (lower.includes('insider') || lower.includes('secret') || lower.includes('exclusive')) flags.push('Claims of insider information — illegal under SEBI regulations');
  if (!flags.length) flags.push('No obvious red flags detected in basic scan — exercise standard caution');
  const count = flags.length;
  return {
    risk_level: count >= 3 ? 'high' : count >= 1 ? 'medium' : 'low',
    flags,
    verdict: count >= 2 ? 'This message shows multiple characteristics of manipulative investment content. It uses psychological pressure tactics common in pump-and-dump schemes targeting retail investors.' : 'This message shows some potential concerns. Always independently verify any investment claim before acting on it.',
    action: 'Never invest based on social media tips alone. Verify if the advisor is SEBI-registered at sebi.gov.in. Remember: 91% of retail F&O traders in India lost money in FY25.'
  };
};

module.exports = {
  generateFearQuestion,
  generateDebrief,
  coachChat,
  analyzeClaim
};
