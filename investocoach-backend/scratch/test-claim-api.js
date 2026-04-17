const API_URL = 'http://localhost:5000';

async function testClaim() {
  console.log('1. Initializing guest auth...');
  const guestId = Math.random().toString(36).substring(2, 9);
  const authResp = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Claim Tester',
      email: `claim_${guestId}@example.com`,
      password: 'password123',
      riskPreference: 'low'
    })
  });
  const authData = await authResp.json();
  const token = authData.token;

  console.log('2. Analyzing claim...');
  const claimResp = await fetch(`${API_URL}/recommendations/analyze-claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      claimText: 'Invest in BitCoin now, it will double next week!'
    })
  });
  
  const claimData = await claimResp.json();
  console.log('   Response Status:', claimResp.status);
  console.log('   Analysis Result:', JSON.stringify(claimData.result, null, 2));
}

testClaim().catch(console.error);
