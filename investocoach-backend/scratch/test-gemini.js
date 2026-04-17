require('dotenv').config();
require('dotenv').config();
// Node 18+ has global fetch


const KEY = process.env.GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${KEY}`;




async function test() {
  console.log('Testing Gemini API Key...');
  try {
    const resp = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello' }] }]
      })
    });
    const data = await resp.json();
    console.log('Response Status:', resp.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
