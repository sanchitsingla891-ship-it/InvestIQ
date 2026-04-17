require('dotenv').config();

const KEY = process.env.GEMINI_API_KEY;

async function test(model, version = 'v1beta') {
  const URL = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${KEY}`;
  console.log(`Testing ${model} with version ${version}...`);
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
    if (resp.ok) {
        console.log('Success!');
        return true;
    } else {
        console.log('Error:', data.error.message);
        return false;
    }
  } catch (err) {
    console.error('Fetch Error:', err);
    return false;
  }
}

async function runTests() {
    const results = [];
    results.push(await test('gemini-1.5-flash', 'v1beta'));
    results.push(await test('gemini-1.5-flash-latest', 'v1beta'));
    results.push(await test('gemini-1.5-pro', 'v1beta'));
    results.push(await test('gemini-1.0-pro', 'v1'));
    results.push(await test('gemini-pro', 'v1'));
    console.log('\nResults:', results);
}

runTests();
