// js/gemini.js — Gemini AI integration (Backend API Proxies)

/**
 * Generate fresh Fear Assessment question for a given bias
 */
async function generateFearQuestion(biasTarget, previousQuestions = []) {
  try {
    const res = await API.generateFearQuestion(biasTarget, previousQuestions);
    return res.text;
  } catch (err) {
    console.error('generateFearQuestion error:', err);
    return null;
  }
}

/**
 * Generate personalized behavioral debrief after simulation/crash
 */
async function generateDebrief(sessionData) {
  try {
    // Inject lang into sessionData to allow backend to configure prompts natively
    sessionData.lang = STATE.lang;
    const res = await API.generateDebrief(sessionData);
    return res.text;
  } catch (err) {
    console.error('generateDebrief error:', err);
    return 'We had an issue generating your debrief, but remember to stay calm during market volatility and always trust your long term plan!';
  }
}

/**
 * Coach chat response
 */
async function coachChat(userMessage, context) {
  try {
    context.lang = STATE.lang;
    const res = await API.coachChat(userMessage, context);
    return res.text;
  } catch (err) {
    console.error('coachChat error:', err);
    return 'I am currently having trouble connecting to my analysis brain. Could you ask me again later?';
  }
}

/**
 * Finfluencer claim analyzer
 */
async function analyzeClaim(claimText) {
  try {
    const res = await API.analyzeClaim(claimText);
    return res.result;
  } catch (err) {
    console.error('analyzeClaim error:', err);
    return fallbackAnalysis(claimText);
  }
}

function fallbackAnalysis(text) {
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
}
