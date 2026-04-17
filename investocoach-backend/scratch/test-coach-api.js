const API_URL = 'http://localhost:5000';


async function testCoach() {
  console.log('1. Initializing guest auth...');
  const guestId = Math.random().toString(36).substring(2, 9);
  const authResp = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: `test_${guestId}@example.com`,
      password: 'password123',
      riskPreference: 'low'
    })
  });
  const authData = await authResp.json();
  const token = authData.token;
  if (!token) throw new Error('Auth failed');
  console.log('   Token received.');

  console.log('2. Sending message to Coach...');
  const coachResp = await fetch(`${API_URL}/recommendations/coach-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      userMessage: 'Why did my portfolio drop?',
      context: { lang: 'english', profile: 'Loss Avoider', disciplineScore: 60 }
    })
  });
  
  const coachData = await coachResp.json();
  console.log('   Response Status:', coachResp.status);
  console.log('   Coach Message:', coachData.reply || coachData.message);
}

testCoach().catch(console.error);
