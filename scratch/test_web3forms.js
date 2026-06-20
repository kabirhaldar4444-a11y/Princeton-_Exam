async function testWeb3Forms() {
  const accessKey = '4c65807a-e5d0-46e0-9cbd-70d264618cf1';
  console.log('Testing Web3Forms with Access Key:', accessKey);
  
  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: 'TEST SUBMISSION FROM PORTAL DIAGNOSTICS',
        from_name: 'Princeton Exam Portal Diagnostic',
        message: 'This is a diagnostic test to see if the key is valid.'
      })
    });
    
    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch Error:', error);
  }
}

testWeb3Forms();
