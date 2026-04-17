// js/knowledge.js — Data structure for the Knowledge Book (Zerodha Varsity Integration)

const VARSITY_MODULES = [
  {
    id: 'intro',
    title: 'Introduction to Stock Markets',
    desc: 'The essential first step for every investor. Learn how markets work, what stocks represent, and the basics of index investing.',
    icon: '📈',
    link: 'https://zerodha.com/varsity/module/introduction-to-stock-markets/',
    level: 'Beginner',
    chapters: 15
  },
  {
    id: 'technical',
    title: 'Technical Analysis',
    desc: 'Learn to read charts, identify patterns, and understand price action. Essential for timing your entries and exits.',
    icon: '📊',
    link: 'https://zerodha.com/varsity/module/technical-analysis/',
    level: 'Intermediate',
    chapters: 22
  },
  {
    id: 'fundamental',
    title: 'Fundamental Analysis',
    desc: 'How to read financial statements, evaluate company performance, and find the intrinsic value of a business.',
    icon: '🏛️',
    link: 'https://zerodha.com/varsity/module/fundamental-analysis/',
    level: 'Intermediate',
    chapters: 16
  },
  {
    id: 'options',
    title: 'Options Theory',
    desc: 'Deep dive into call/put options, Greeks, and strategies. Highly advanced but crucial for risk hedging.',
    icon: '⛓️',
    link: 'https://zerodha.com/varsity/module/options-theory-for-everyone/',
    level: 'Advanced',
    chapters: 25
  },
  {
    id: 'innerworth',
    title: 'Innerworth: Trading Psychology',
    desc: 'The most important module for InvestIQ users. Understand the biases that make you panic-sell or over-trade.',
    icon: '🧠',
    link: 'https://zerodha.com/varsity/module/innerworth-behavioral-finance-trading-psychology/',
    level: 'All Levels',
    chapters: 600
  },
  {
    id: 'personal-finance',
    title: 'Personal Finance & Mutual Funds',
    desc: 'Beyond stocks. Learn about goal setting, emergency funds, and how to pick the right mutual funds.',
    icon: '💰',
    link: 'https://zerodha.com/varsity/module/personal-finance/',
    level: 'Beginner',
    chapters: 33
  }
];

const SEARCH_BASE_URL = 'https://zerodha.com/varsity/?s=';
