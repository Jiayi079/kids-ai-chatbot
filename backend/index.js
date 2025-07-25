const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./authMiddleware');

const app = express();
const PORT = 3001;
app.use(cors());
app.use(express.json());

// // used to test db connection
// app.get('/api/test-db', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT NOW()');
//     res.json({ time: result.rows[0].now });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

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

// parentlogin
app.post('/api/parent-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // find user by email
    const result = await pool.query('SELECT id, email, password_hash, username FROM parents WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      console.log(`Failed parent login (not found): ${email}`);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const user = result.rows[0];

    // compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.log(`Failed parent login (wrong password): ${email}`);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '7d' }
    );

    console.log(`Parent login: ${email} at ${new Date().toISOString()}`);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// children login
app.post('/api/child-login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
      }
  
      // find child by username
      const result = await pool.query(
        'SELECT id, parent_id, username, password_hash, name, age, daily_limit_minutes, is_active FROM children WHERE username = $1',
        [username]
      );
      if (result.rows.length === 0) {
        console.log(`Failed child login (not found): ${username}`);
        return res.status(401).json({ error: 'Invalid username or password.' });
      }
      const child = result.rows[0];
  
      // compare password
      const isMatch = await bcrypt.compare(password, child.password_hash);
      if (!isMatch) {
        console.log(`Failed child login (wrong password): ${username}`);
        return res.status(401).json({ error: 'Invalid username or password.' });
      }
  
      // JWT token for child
      const token = jwt.sign(
        { id: child.id, username: child.username, parent_id: child.parent_id, type: 'child' },
        process.env.JWT_SECRET || 'dev_secret',
        { expiresIn: '7d' }
      );
  
      console.log(`Child login: ${username} at ${new Date().toISOString()}`);
      res.json({
        token,
        child: {
          id: child.id,
          username: child.username,
          name: child.name,
          age: child.age,
          daily_limit_minutes: child.daily_limit_minutes,
          is_active: child.is_active,
          parent_id: child.parent_id
        }
      });
    } catch (err) {
      console.error('Child login error:', err);
      res.status(500).json({ error: 'Login failed.' });
    }
  });
  
// registration
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required.' });
    }

    // check if email already exists
    const existing = await pool.query('SELECT id FROM parents WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log(`Registration failed (email exists): ${email}`);
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // hash the password
    const password_hash = await bcrypt.hash(password, 10);

    // add to db
    const result = await pool.query(
        'INSERT INTO parents (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id, email, username, created_at',
        [email, password_hash, username]
    );

    console.log(`Parent registered: ${email} at ${new Date().toISOString()}`);
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// create a child account
app.post('/api/children', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.id;
    const { name, age, username, password, daily_limit_minutes } = req.body;
    if (!name || !age || !username || !password) {
      return res.status(400).json({ error: 'Name, age, username, and password are required.' });
    }
    // Check if username exists
    const existing = await pool.query('SELECT id FROM children WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken.' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO children (parent_id, name, age, username, password_hash, daily_limit_minutes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, age, username, daily_limit_minutes, is_active, created_at`,
      [parentId, name, age, username, password_hash, daily_limit_minutes || 60]
    );
    res.status(201).json({ child: result.rows[0] });
  } catch (err) {
    console.error('Create child error:', err);
    res.status(500).json({ error: 'Failed to create child account.' });
  }
});

// get a list all children for the logged in parent
app.get('/api/children', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.id;
    const result = await pool.query(
      `SELECT id, name, age, daily_limit_minutes, is_active, created_at
       FROM children WHERE parent_id = $1 ORDER BY created_at DESC`,
      [parentId]
    );
    res.json({ children: result.rows });
  } catch (err) {
    console.error('List children error:', err);
    res.status(500).json({ error: 'Failed to fetch children.' });
  }
});

// create a new chat session
app.post('/api/chat-session', authenticateToken, requireChildJWT, async (req, res) => {
  try {
    const { child_id, topic } = req.body;
    if (!child_id || !topic) {
      return res.status(400).json({ error: 'child_id and topic are required.' });
    }
    const newSession = await pool.query(
      `INSERT INTO chat_sessions (child_id, topic)
       VALUES ($1, $2)
       RETURNING *`,
      [child_id, topic]
    );
    console.log(`Chat session created: child ${child_id}, topic ${topic}, session ${newSession.rows[0].id}`);
    res.status(201).json({ session: newSession.rows[0] });
  } catch (err) {
    console.error('Chat session error:', err);
    res.status(500).json({ error: 'Failed to create chat session.' });
  }
});

// get all chat sessions
app.get('/api/chat-session/:child_id', authenticateToken, async (req, res) => {
  try {
    const { child_id } = req.params;
    if (req.user.type === 'child') {
      if (req.user.id !== child_id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    } else if (req.user.type === 'parent') {
      // Check if this child belongs to the parent
      const result = await pool.query('SELECT id FROM children WHERE id = $1 AND parent_id = $2', [child_id, req.user.id]);
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    } else {
      return res.status(403).json({ error: 'Invalid token.' });
    }
    const sessions = await pool.query(
      `SELECT * FROM chat_sessions WHERE child_id = $1 ORDER BY started_at DESC`,
      [child_id]
    );
    res.json({ sessions: sessions.rows });
  } catch (err) {
    console.error('Get chat sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch chat sessions.' });
  }
});

// get messages for a chat session
app.get('/api/chat-message/:session_id', authenticateToken, async (req, res) => {
  try {
    const { session_id } = req.params;
    
    // Verify access to this session
    const sessionCheck = await pool.query(
      `SELECT cs.child_id, c.parent_id 
       FROM chat_sessions cs 
       JOIN children c ON cs.child_id = c.id 
       WHERE cs.id = $1`,
      [session_id]
    );
    
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    
    const session = sessionCheck.rows[0];
    
    // check if user has access to this session
    if (req.user.type === 'child') {
      if (req.user.id !== session.child_id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    } else if (req.user.type === 'parent') {
      if (req.user.id !== session.parent_id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    } else {
      return res.status(403).json({ error: 'Invalid token.' });
    }
    
    const messages = await pool.query(
      `SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
      [session_id]
    );
    
    console.log(`Chat messages fetched: session ${session_id}, count ${messages.rows.length}`);
    res.json({ messages: messages.rows });
  } catch (err) {
    console.error('Get chat messages error:', err);
    res.status(500).json({ error: 'Failed to fetch chat messages.' });
  }
});

// store a chat message
app.post('/api/chat-message', authenticateToken, requireChildJWT, async (req, res) => {
  try {
    const { session_id, from_type, message_text, buttons_offered } = req.body;
    if (!session_id || !from_type || !message_text) {
      return res.status(400).json({ error: 'session_id, from_type, and message_text are required.' });
    }

    const result = await pool.query(
      `INSERT INTO chat_messages (session_id, from_type, message_text, buttons_offered)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [session_id, from_type, message_text, buttons_offered ? JSON.stringify(buttons_offered) : null]
    );

    //increment total_messages in chat_sessions
    await pool.query(
      `UPDATE chat_sessions SET total_messages = total_messages + 1 WHERE id = $1`,
      [session_id]
    );

    console.log(`Chat message stored: session ${session_id}, from ${from_type}`);
    res.status(201).json({ message: result.rows[0] });
  } catch (err) {
    console.error('Chat message error:', err);
    res.status(500).json({ error: 'Failed to store chat message.' });
  }
});

// update usage limit for a child
app.put('/api/children/:child_id/usage-limit', authenticateToken, async (req, res) => {
    const { child_id } = req.params;
    const { daily_limit_minutes } = req.body;
    // only allow parent to update their own child's limit
    const parentId = req.user.id;
    const result = await pool.query('UPDATE children SET daily_limit_minutes = $1 WHERE id = $2 AND parent_id = $3 RETURNING *', [daily_limit_minutes, child_id, parentId]);
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Not allowed or child not found.' });
    }
    res.json({ child: result.rows[0] });
});

// helper function to only allow child JWT
function requireChildJWT(req, res, next) {
    if (!req.user || req.user.type !== 'child') {
      return res.status(403).json({ error: 'Child authentication required.' });
    }
    next();
}

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
