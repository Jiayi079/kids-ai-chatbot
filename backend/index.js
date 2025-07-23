const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from backend!');
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, topic } = req.body;
    
    if (!message || !topic) {
      return res.status(400).json({ error: 'Message and topic are required' });
    }

    // kid-friendly prompt with button options
    const prompt = `You are a friendly, educational AI assistant for kids aged 6-12. 
    The child is asking about: ${topic.label} (${topic.value})
    Child's message: ${message}
    
    Please respond in this EXACT format:
    
    RESPONSE: [Write 1-2 simple sentences that answer the child's question. Use simple words, be encouraging, and include relevant emojis. Keep it under 50 words.]
    
    BUTTONS: [Provide 3 short button options (5-8 words each) that kids can click to continue the conversation. Make them fun and related to the topic. Use simple words and emojis.]
    
    Example format:
    RESPONSE: Great question! 2+2 equals 4. Numbers are like building blocks for math! 🧱
    BUTTONS: Tell me more about numbers, Show me a fun math game, What about 3+3?
    
    Respond as if you're talking directly to a child:`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      
      // Parse the response to extract text and buttons
      const responseMatch = aiResponse.match(/RESPONSE:\s*(.+?)(?=\n|$)/i);
      const buttonsMatch = aiResponse.match(/BUTTONS:\s*(.+?)(?=\n|$)/i);
      
      let responseText = aiResponse;
      let buttons = [];
      
      if (responseMatch && buttonsMatch) {
        responseText = responseMatch[1].trim();
        const buttonsText = buttonsMatch[1].trim();
        // Split buttons by commas and clean them up
        buttons = buttonsText.split(',').map(btn => btn.trim()).filter(btn => btn.length > 0);
      }
      
      res.json({ 
        response: responseText,
        buttons: buttons.slice(0, 3) // Ensure max 3 buttons
      });
    } else {
      throw new Error('Invalid response from Gemini API');
    }

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Sorry, I had trouble thinking of a response. Try again!',
      buttons: ['Try again', 'Ask something else', 'Start over']
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
