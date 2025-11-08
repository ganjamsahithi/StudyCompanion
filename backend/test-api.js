const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    try {
        console.log('Testing API key...');
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent('Say "API works!"');
        console.log('Response:', result.response.text());
        console.log('✅ API key is valid!');
    } catch (error) {
        console.error('❌ API test failed:', error.message);
    }
}

test();