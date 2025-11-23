const axios = require('axios');

// Test direct backend API connection
const api = axios.create({
  baseURL: 'http://localhost:3001/api || "https://hrms-backend-w91k.onrender.com/api"'
});

async function testRegistration() {
  try {
    console.log('Testing direct API registration with /api/auth/register');
    const response = await api.post('/auth/register', {
      username: 'testuser7',
      password: 'testpass',
      orgName: 'Test Organization 7'
    });
    console.log('Direct API registration successful:', response.data);
  } catch (error) {
    console.log('Direct API registration failed:', error.response?.status);
    console.log('Error data:', error.response?.data);
    console.log('Error message:', error.message);
  }
}

testRegistration();