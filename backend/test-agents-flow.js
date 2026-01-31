// Test script to debug the /api/agents endpoint
const base = 'http://localhost:3000/api';

async function testFlow() {
  console.log('=== Testing Agents API Flow ===\n');

  try {
    // Step 1: Register a user
    console.log('1️⃣ Registering user...');
    const email = `test${Date.now()}@example.com`;
    const password = 'TestPass123!';
    
    const registerRes = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'Test User' })
    });
    
    const registerData = await registerRes.json();
    
    if (!registerData.success) {
      console.error('❌ Registration failed:', registerData);
      return;
    }
    
    const token = registerData.data.token;
    console.log('✅ User registered:', email);
    console.log('   Token:', token.substring(0, 20) + '...');

    // Step 2: Get agents without token (should fail with 401)
    console.log('\n2️⃣ Testing GET /agents WITHOUT token...');
    const noTokenRes = await fetch(`${base}/agents`);
    console.log(`   Status: ${noTokenRes.status}`);
    const noTokenData = await noTokenRes.json();
    console.log('   Response:', noTokenData);

    // Step 3: Get agents with token (should succeed)
    console.log('\n3️⃣ Testing GET /agents WITH token...');
    const withTokenRes = await fetch(`${base}/agents`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`   Status: ${withTokenRes.status}`);
    const withTokenData = await withTokenRes.json();
    console.log('   Response:', JSON.stringify(withTokenData, null, 2));

    if (withTokenRes.status !== 200) {
      console.error('❌ Failed to fetch agents with valid token!');
      return;
    }

    console.log('✅ All tests passed!');

    // Step 4: Create an agent
    console.log('\n4️⃣ Creating an agent...');
    const createRes = await fetch(`${base}/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Agent',
        description: 'A test agent',
        type: 'CONVERSATIONAL'
      })
    });
    console.log(`   Status: ${createRes.status}`);
    const createData = await createRes.json();
    
    if (createRes.status === 201) {
      console.log('✅ Agent created successfully!');
      console.log('   Agent ID:', createData.data.id);
    } else {
      console.error('❌ Failed to create agent:', createData);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testFlow();
