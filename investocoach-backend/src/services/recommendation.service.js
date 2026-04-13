'use strict';

// ── Asset type definitions ────────────────────────────────────────────────────
const ASSET_TYPES = {
  ultraLow: {
    label: 'Ultra Low Risk',
    examples: ['Government Bonds', 'Fixed Deposits', 'Liquid Mutual Funds'],
    returnRange: '4–6% p.a.',
  },
  low: {
    label: 'Low Risk',
    examples: ['Debt Mutual Funds', 'Balanced Funds', 'Blue-chip ETFs'],
    returnRange: '6–10% p.a.',
  },
  balanced: {
    label: 'Balanced',
    examples: ['Index Funds (Nifty 50)', 'Hybrid Funds', 'Large-cap Stocks'],
    returnRange: '10–14% p.a.',
  },
  growth: {
    label: 'Growth',
    examples: ['Mid-cap Funds', 'Sectoral ETFs', 'US Tech ETFs'],
    returnRange: '14–20% p.a.',
  },
  aggressive: {
    label: 'Aggressive',
    examples: ['Small-cap Stocks', 'Crypto (BTC/ETH)', 'Leveraged ETFs'],
    returnRange: '20%+ (high risk)',
  },
};

/**
 * Determine recommended asset bucket based on fearScore + riskPreference.
 */
const getAssetBucket = (fearScore, riskPreference) => {
  if (fearScore >= 70 || riskPreference === 'low') return 'ultraLow';
  if (fearScore >= 50 || riskPreference === 'low') return 'low';
  if (fearScore >= 35 || riskPreference === 'medium') return 'balanced';
  if (fearScore >= 20 || riskPreference === 'medium') return 'growth';
  return 'aggressive';
};

/**
 * Suggest investment amount.
 * Simple heuristic: higher fear = smaller allocation to start.
 */
const suggestAmount = (fearScore, balance = 10000) => {
  let fraction;
  if (fearScore >= 70) fraction = 0.1;       // invest only 10%
  else if (fearScore >= 50) fraction = 0.2;
  else if (fearScore >= 35) fraction = 0.4;
  else if (fearScore >= 20) fraction = 0.6;
  else fraction = 0.8;

  return Math.round(balance * fraction);
};

/**
 * Generate a plain-English explanation of the recommendation.
 */
const buildReason = (fearScore, riskPreference, bucket, behaviorReport) => {
  const panicNote =
    behaviorReport && behaviorReport.panicFrequency > 50
      ? ` You've shown panic-selling behaviour in ${behaviorReport.panicFrequency}% of your decisions – starting with safer assets will build your confidence.`
      : '';

  const bucketName = ASSET_TYPES[bucket]?.label || bucket;

  return (
    `Based on your fear score of ${fearScore}/100 and a "${riskPreference}" risk preference, ` +
    `we recommend ${bucketName} assets.${panicNote} ` +
    `These instruments have historically delivered ${ASSET_TYPES[bucket]?.returnRange} with manageable volatility, ` +
    `making them ideal to begin your investment journey.`
  );
};

/**
 * Main recommendation generator.
 */
const generateRecommendation = (user, behaviorReport) => {
  const { fearScore, riskPreference, portfolio } = user;
  const balance = portfolio?.cashBalance ?? 10000;

  const bucket = getAssetBucket(fearScore, riskPreference);
  const assetType = ASSET_TYPES[bucket];
  const suggestedAmount = suggestAmount(fearScore, balance);
  const reason = buildReason(fearScore, riskPreference, bucket, behaviorReport);

  return {
    fearScore,
    investorType: user.investorType,
    riskPreference,
    recommendation: {
      assetBucket: bucket,
      assetType: assetType.label,
      examples: assetType.examples,
      expectedReturn: assetType.returnRange,
      suggestedAmount,
      currency: 'INR',
      reason,
    },
    behaviorSummary: behaviorReport
      ? {
          panicFrequency: behaviorReport.panicFrequency,
          avgReactionTimeMs: behaviorReport.avgReactionTimeMs,
          riskAversionScore: behaviorReport.riskAversionScore,
        }
      : null,
  };
};

module.exports = { generateRecommendation, ASSET_TYPES };
