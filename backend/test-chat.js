(async ()=>{
  const base = 'http://localhost:3000/api';
  const email = `test${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log('Registering user', email);
  let res = await fetch(`${base}/auth/register`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, password })});
  let body = await res.json();
  if(!body.success){
    console.error('Register failed', body); return;
  }
  const token = body.data.token;
  console.log('Got token');

  // create agent
  res = await fetch(`${base}/agents`, { method: 'POST', headers: {'Content-Type':'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify({ name: 'Test Agent', description: 'desc', type: 'test', model: 'mock' })});
  body = await res.json();
  console.log('Created agent', body.data.id);
  const agentId = body.data.id;

  // chat
  console.log('Starting chat stream');
  res = await fetch(`${base}/agents/${agentId}/chat`, { method: 'POST', headers: {'Content-Type':'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify({ message: 'Hello agent' })});
  console.log('Response status', res.status, res.headers.get('content-type'));
  if(!res.body){ console.error('No body'); return; }
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let done=false;
  let buffer='';
  while(!done){
    const { value, done: d } = await reader.read();
    done = d;
    if(value){
      buffer += decoder.decode(value, { stream: true });
      // print buffer
      process.stdout.write(buffer);
      buffer='';
    }
  }
  console.log('\nStream ended');
})();
