require('dotenv').config();

const chatGPTConfig = {
  headers: {
    'Authorization': `Bearer ${process.env.CHATGPT_API_KEY}`,
    'Content-Type': 'application/json'
  }
};

module.exports = { chatGPTConfig };