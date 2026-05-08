import { config } from 'dotenv';
config({ path: '.env.local' });

async function testLogin() {
  console.log('🧪 Testing login API...');

  const loginData = {
    email: 'dean@college.edu',
    password: 'password123'
  };

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('Response body:', result);

    if (result.token) {
      console.log('✅ Login successful! Token:', result.token.substring(0, 20) + '...');

      // Test the event API with this token
      console.log();
      console.log('🎪 Testing event API with token...');

      const eventResponse = await fetch('http://localhost:3000/api/events/cmn8yp8ly0000g4w0f1hx36rq', {
        headers: {
          'Authorization': `Bearer ${result.token}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('Event API status:', eventResponse.status);
      const eventResult = await eventResponse.json();
      console.log('Event API result:', eventResult.success ? 'SUCCESS' : 'FAILED');

      if (!eventResult.success) {
        console.log('Event API error:', eventResult.error);
      } else {
        console.log('Event title:', eventResult.event.title);
      }

    } else {
      console.log('❌ Login failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();