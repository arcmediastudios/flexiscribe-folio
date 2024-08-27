const express = require('express');
const router = express.Router();
const axios = require('axios');
const { chatGPTConfig } = require('../utils/config');

router.post('/ask', async (req, res) => {
    const { question, context } = req.body;
  
    const retryRequest = async (retries = 3, delay = 1000) => {
      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: context },
            { role: 'user', content: question }
          ]
        }, chatGPTConfig);
  
        return response;
      } catch (error) {
        if (error.response && error.response.status === 429 && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return retryRequest(retries - 1, delay * 2);
        } else {
          throw error;
        }
      }
    };
  
    try {
      const response = await retryRequest();
      res.json({ success: true, response: response.data.choices[0].message.content });
    } catch (error) {
      console.error('Error interacting with ChatGPT:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.response ? error.response.data : error.message });
    }
  });
  
module.exports = router;
