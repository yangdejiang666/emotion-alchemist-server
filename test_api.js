const axios = require('axios');

const API_KEY = 'sk-OH925t4rVAgXwxrTN59gdU7apbVrzVMCpLXn82oMXTu3w8qY';
const API_URL = 'https://shell.wyzai.top/v1/chat/completions';

async function testModel(modelName) {
    console.log(`Testing model: ${modelName}...`);
    try {
        const response = await axios.post(
            API_URL,
            {
                model: modelName,
                messages: [{ role: 'user', content: 'Say hello' }],
                max_tokens: 10
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        console.log(`✅ ${modelName} SUCCESS:`, response.data.choices[0].message.content);
        return true;
    } catch (error) {
        console.log(`❌ ${modelName} FAILED:`, error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', JSON.stringify(error.response.data));
        }
        return false;
    }
}

async function runTests() {
    const models = ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o', 'gpt-4'];
    for (const model of models) {
        if (await testModel(model)) break;
    }
}

runTests();
