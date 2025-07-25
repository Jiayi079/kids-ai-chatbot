const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./authMiddleware');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = 3001;
app.use(cors());
app.use(express.json());

// aI Chat endpoint with age-appropriate, safe responses for children
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message, topic } = req.body;
    
    if (!message || !topic) {
      return res.status(400).json({ error: 'Message and topic are required' });
    }

    // get child's age from database
    let childAge = 8; // default age
    if (req.user.type === 'child') {
      const childResult = await pool.query(
        'SELECT age FROM children WHERE id = $1',
        [req.user.id]
      );
      if (childResult.rows.length > 0) {
        childAge = childResult.rows[0].age;
      }
    }

    // enhanced kid-friendly prompt with age-specific guidance and safety requirements
    const prompt = `You are a friendly, educational AI assistant for a ${childAge}-year-old child. 
    The child is asking about: ${topic.label} (${topic.value})
    Child's message: ${message}
    
    IMPORTANT GUIDELINES:
    - Your response must be SAFE, AGE-APPROPRIATE for a ${childAge}-year-old, and completely free from harmful content
    - Promote GOOD VALUES like kindness, honesty, respect, and empathy
    - Encourage CURIOSITY and CREATIVITY in learning
    - Use language and concepts suitable for a ${childAge}-year-old child
    - Keep responses positive, encouraging, and educational
    - Avoid any content that could be scary, inappropriate, or confusing for a ${childAge}-year-old
    
    Please respond in this EXACT format:
    
    RESPONSE: [Write 1-2 simple sentences that answer the child's question. Use simple words appropriate for a ${childAge}-year-old, be encouraging, and include relevant emojis. Keep it under 50 words.]
    
    BUTTONS: [Provide 3 short button options (5-8 words each) that kids can click to continue the conversation. Make them fun, educational, and related to the topic. Use simple words and emojis.]
    
    Example format:
    RESPONSE: Great question! 2+2 equals 4. Numbers are like building blocks for math! 🧱
    BUTTONS: Tell me more about numbers, Show me a fun math game, What about 3+3?
    
    Respond as if you're talking directly to a ${childAge}-year-old child:`;

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
        
        // Additional safety check: ensure response is appropriate
        if (responseText.length > 200) {
          responseText = responseText.substring(0, 200) + '...';
        }
        
        // Filter out any potentially inappropriate button text
        buttons = buttons.filter(btn => {
          const lowerBtn = btn.toLowerCase();
          return !lowerBtn.includes('inappropriate') && 
                 !lowerBtn.includes('harmful') && 
                 btn.length <= 50;
        });
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
      { id: user.id, email: user.email, username: user.username, type: 'parent' },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '7d' }
    );

    console.log(`Parent login: ${email} at ${new Date().toISOString()}`);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        subscription_status: user.subscription_status
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
  
      // check if child has exceeded daily usage limit
      const today = new Date().toISOString().split('T')[0];
      const usageResult = await pool.query(
        `SELECT event_type, event_time 
         FROM usage_logs 
         WHERE child_id = $1 
         AND date = $2 
         ORDER BY event_time ASC`,
        [child.id, today]
      );
      
      // calculate total usage from login/logout pairs
      let totalMinutes = 0;
      let loginTime = null;
      
      for (const event of usageResult.rows) {
        if (event.event_type === 'login') {
          loginTime = new Date(event.event_time);
        } else if (event.event_type === 'logout' && loginTime) {
          const logoutTime = new Date(event.event_time);
          const sessionMinutes = Math.ceil((logoutTime - loginTime) / (1000 * 60));
          totalMinutes += Math.max(0, sessionMinutes);
          loginTime = null; // reset for next session
        }
      }
      
      // if there's an unclosed session (login without logout), calculate until now
      if (loginTime) {
        const now = new Date();
        const sessionMinutes = Math.ceil((now - loginTime) / (1000 * 60));
        totalMinutes += Math.max(0, sessionMinutes);
      }
      
      // check if usage limit is exceeded
      if (totalMinutes >= child.daily_limit_minutes) {
        console.log(`Child ${username} login blocked - daily limit exceeded: ${totalMinutes}/${child.daily_limit_minutes} minutes`);
        return res.status(403).json({ 
          error: 'Daily usage limit exceeded. Please try again tomorrow.',
          usageInfo: {
            todayUsage: totalMinutes,
            dailyLimit: child.daily_limit_minutes,
            remainingMinutes: 0
          }
        });
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
        },
        usageInfo: {
          todayUsage: totalMinutes,
          dailyLimit: child.daily_limit_minutes,
          remainingMinutes: Math.max(0, child.daily_limit_minutes - totalMinutes)
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
    
    // Get parent's subscription status
    const parentResult = await pool.query('SELECT subscription_status FROM parents WHERE id = $1', [parentId]);
    const subscriptionStatus = parentResult.rows[0]?.subscription_status || 'free';
    
    // Check if username exists
    const existing = await pool.query('SELECT id FROM children WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken.' });
    }
    
    // Check child limit based on subscription
    const childrenCount = await pool.query('SELECT COUNT(*) FROM children WHERE parent_id = $1', [parentId]);
    const currentChildrenCount = parseInt(childrenCount.rows[0].count);
    
    if (subscriptionStatus === 'free' && currentChildrenCount >= 1) {
      return res.status(403).json({ error: 'Free plan allows only 1 child. Upgrade to add more children.' });
    }
    
    if (subscriptionStatus === 'basic' && currentChildrenCount >= 3) {
      return res.status(403).json({ error: 'Basic plan allows up to 3 children. Upgrade to Premium for unlimited children.' });
    }
    
    // Set default daily limit based on subscription
    let defaultLimit = 60; // free
    if (subscriptionStatus === 'basic') defaultLimit = 120;
    if (subscriptionStatus === 'premium') defaultLimit = 999; // effectively unlimited
    
    const finalLimit = daily_limit_minutes || defaultLimit;
    
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO children (parent_id, name, age, username, password_hash, daily_limit_minutes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, age, username, daily_limit_minutes, is_active, created_at`,
      [parentId, name, age, username, password_hash, finalLimit]
    );
    
    console.log(`Child created for parent ${parentId} (${subscriptionStatus} plan): ${name}`);
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

// // get parent subscription status
// app.get('/api/parent/subscription', authenticateToken, async (req, res) => {
//   try {
//     if (req.user.type !== 'parent') {
//       return res.status(403).json({ error: 'Parent access required.' });
//     }
    
//     const result = await pool.query(
//       'SELECT subscription_status, created_at FROM parents WHERE id = $1',
//       [req.user.id]
//     );
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Parent not found.' });
//     }
    
//     res.json({ subscription: result.rows[0] });
//   } catch (err) {
//     console.error('Get subscription error:', err);
//     res.status(500).json({ error: 'Failed to fetch subscription status.' });
//   }
// });

// // update parent subscription status
// app.put('/api/parent/subscription', authenticateToken, async (req, res) => {
//   try {
//     const { subscription_status } = req.body;
    
//     if (req.user.type !== 'parent') {
//       return res.status(403).json({ error: 'Parent access required.' });
//     }
    
//     if (!['free', 'basic', 'premium'].includes(subscription_status)) {
//       return res.status(400).json({ error: 'Invalid subscription status.' });
//     }
    
//     const result = await pool.query(
//       'UPDATE parents SET subscription_status = $1 WHERE id = $2 RETURNING subscription_status, created_at',
//       [subscription_status, req.user.id]
//     );
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Parent not found.' });
//     }
    
//     console.log(`Parent ${req.user.id} subscription updated to: ${subscription_status}`);
//     res.json({ subscription: result.rows[0] });
//   } catch (err) {
//     console.error('Update subscription error:', err);
//     res.status(500).json({ error: 'Failed to update subscription status.' });
//   }
// });

// // create payment intent for Stripe
// app.post('/api/payment/create-intent', authenticateToken, async (req, res) => {
//   try {
//     const { plan } = req.body;
    
//     if (req.user.type !== 'parent') {
//       return res.status(403).json({ error: 'Parent access required.' });
//     }
    
//     // Validate plan and get price
//     const validPlans = {
//       'basic': { price: 999, currency: 'usd', features: ['Unlimited children', 'Extended daily limits', 'Priority support'] },
//       'premium': { price: 1999, currency: 'usd', features: ['All basic features', 'Advanced analytics', 'Custom topics', '24/7 support'] }
//     };
    
//     if (!validPlans[plan]) {
//       return res.status(400).json({ error: 'Invalid plan selected.' });
//     }
    
//     // Create payment intent with Stripe
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: validPlans[plan].price, // Amount in cents
//       currency: validPlans[plan].currency,
//       metadata: {
//         parent_id: req.user.id,
//         plan: plan,
//         email: req.user.email
//       }
//     });
    
//     res.json({
//       clientSecret: paymentIntent.client_secret,
//       plan: plan,
//       price: validPlans[plan].price / 100, // Convert back to dollars for display
//       features: validPlans[plan].features
//     });
//   } catch (err) {
//     console.error('Payment intent creation error:', err);
//     res.status(500).json({ error: 'Failed to create payment intent.' });
//   }
// });

// // process payment with Stripe
// app.post('/api/payment/process', authenticateToken, async (req, res) => {
//   try {
//     const { paymentIntentId, plan } = req.body;
    
//     if (req.user.type !== 'parent') {
//       return res.status(403).json({ error: 'Parent access required.' });
//     }
    
//     // Verify the payment intent
//     const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
//     if (paymentIntent.status !== 'succeeded') {
//       return res.status(400).json({ error: 'Payment not completed.' });
//     }
    
//     // Verify the payment belongs to this parent
//     if (paymentIntent.metadata.parent_id !== req.user.id) {
//       return res.status(403).json({ error: 'Payment verification failed.' });
//     }
    
//     // Update subscription status in database
//     const paymentResult = await pool.query(
//       'UPDATE parents SET subscription_status = $1 WHERE id = $2 RETURNING subscription_status',
//       [plan, req.user.id]
//     );
    
//     console.log(`Stripe payment processed for parent ${req.user.id}: ${plan} plan (Payment Intent: ${paymentIntentId})`);
    
//     res.json({
//       success: true,
//       message: 'Payment processed successfully!',
//       subscription: {
//         status: paymentResult.rows[0].subscription_status,
//         plan: plan,
//         paymentIntentId: paymentIntentId
//       }
//     });
//   } catch (err) {
//     console.error('Payment processing error:', err);
//     res.status(500).json({ error: 'Payment processing failed.' });
//   }
// });

// // Stripe webhook handler (for subscription management)
// app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
//   const sig = req.headers['stripe-signature'];
//   let event;
  
//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
//   } catch (err) {
//     console.error('Webhook signature verification failed:', err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }
  
//   // Handle the event
//   switch (event.type) {
//     case 'payment_intent.succeeded':
//       const paymentIntent = event.data.object;
//       console.log('Payment succeeded:', paymentIntent.id);
//       // You can add additional logic here for subscription management
//       break;
//     case 'payment_intent.payment_failed':
//       const failedPayment = event.data.object;
//       console.log('Payment failed:', failedPayment.id);
//       break;
//     default:
//       console.log(`Unhandled event type ${event.type}`);
//   }
  
//   res.json({ received: true });
// });

// helper function to only allow child JWT
function requireChildJWT(req, res, next) {
    if (!req.user || req.user.type !== 'child') {
      return res.status(403).json({ error: 'Child authentication required.' });
    }
    next();
}

// track child login time
app.post('/api/child-login-start', authenticateToken, requireChildJWT, async (req, res) => {
  try {
    const childId = req.user.id;
    
    // record login event
    const loginEvent = await pool.query(
      'INSERT INTO usage_logs (child_id, event_type, event_time) VALUES ($1, $2, $3) RETURNING *',
      [childId, 'login', new Date()]
    );
    
    console.log(`Child ${childId} login event recorded: ${loginEvent.rows[0].id}`);
    res.json({ success: true, message: 'Login event recorded', eventId: loginEvent.rows[0].id });
  } catch (err) {
    console.error('Login event recording error:', err);
    res.status(500).json({ error: 'Failed to record login event.' });
  }
});

// track child logout and calculate usage
app.post('/api/child-logout', authenticateToken, requireChildJWT, async (req, res) => {
  try {
    const childId = req.user.id;
    
    // record logout event
    const logoutEvent = await pool.query(
      'INSERT INTO usage_logs (child_id, event_type, event_time) VALUES ($1, $2, $3) RETURNING *',
      [childId, 'logout', new Date()]
    );
    
    console.log(`Child ${childId} logout event recorded: ${logoutEvent.rows[0].id}`);
    res.json({ success: true, message: 'Logout event recorded', eventId: logoutEvent.rows[0].id });
  } catch (err) {
    console.error('Logout event recording error:', err);
    res.status(500).json({ error: 'Failed to record logout event.' });
  }
});



// check if child has exceeded daily usage limit
app.get('/api/children/:child_id/usage-limit-check', authenticateToken, async (req, res) => {
  try {
    const { child_id } = req.params;
    
    // verify access to this child
    if (req.user.type === 'child') {
      if (req.user.id !== child_id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    } else if (req.user.type === 'parent') {
      const childCheck = await pool.query('SELECT id FROM children WHERE id = $1 AND parent_id = $2', [child_id, req.user.id]);
      if (childCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    } else {
      return res.status(403).json({ error: 'Invalid token.' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // get all session events for today
    const eventsResult = await pool.query(
      `SELECT event_type, event_time 
       FROM usage_logs 
       WHERE child_id = $1 
       AND date = $2 
       ORDER BY event_time ASC`,
      [child_id, today]
    );
    
    // calculate total usage from login/logout pairs
    let totalMinutes = 0;
    let loginTime = null;
    
    for (const event of eventsResult.rows) {
      if (event.event_type === 'login') {
        loginTime = new Date(event.event_time);
      } else if (event.event_type === 'logout' && loginTime) {
        const logoutTime = new Date(event.event_time);
        const sessionMinutes = Math.ceil((logoutTime - loginTime) / (1000 * 60));
        totalMinutes += Math.max(0, sessionMinutes);
        loginTime = null; // reset for next session
      }
    }
    
    // if there's an unclosed session (login without logout), calculate until now
    if (loginTime) {
      const now = new Date();
      const sessionMinutes = Math.ceil((now - loginTime) / (1000 * 60));
      totalMinutes += Math.max(0, sessionMinutes);
    }
    
    // get child's daily limit
    const childResult = await pool.query(
      'SELECT daily_limit_minutes FROM children WHERE id = $1',
      [child_id]
    );
    
    const dailyLimit = childResult.rows[0] ? childResult.rows[0].daily_limit_minutes : 60;
    const usagePercentage = dailyLimit > 0 ? Math.round((totalMinutes / dailyLimit) * 100) : 0;
    const isExceeded = totalMinutes >= dailyLimit;
    
    res.json({
      todayUsage: totalMinutes,
      dailyLimit,
      usagePercentage,
      isExceeded,
      remainingMinutes: Math.max(0, dailyLimit - totalMinutes)
    });
  } catch (err) {
    console.error('Usage limit check error:', err);
    res.status(500).json({ error: 'Failed to check usage limit.' });
  }
});

// get usage data for parent dashboard (calculated from usage_logs events)
app.get('/api/children/:child_id/usage', authenticateToken, async (req, res) => {
  try {
    const { child_id } = req.params;
    
    // verify parent has access to this child (only parent can see usage data)
    if (req.user.type === 'parent') {
      const childCheck = await pool.query('SELECT id FROM children WHERE id = $1 AND parent_id = $2', [child_id, req.user.id]);
      if (childCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    } else if (req.user.type === 'child') {
      if (req.user.id !== child_id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    } else {
      return res.status(403).json({ error: 'Invalid token.' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // get all session events for today
    const eventsResult = await pool.query(
      `SELECT event_type, event_time 
       FROM usage_logs 
       WHERE child_id = $1 
       AND date = $2 
       ORDER BY event_time ASC`,
      [child_id, today]
    );
    
    // calculate total usage from login/logout pairs
    let totalMinutes = 0;
    let loginTime = null;
    const sessions = [];
    
    for (const event of eventsResult.rows) {
      if (event.event_type === 'login') {
        loginTime = new Date(event.event_time);
      } else if (event.event_type === 'logout' && loginTime) {
        const logoutTime = new Date(event.event_time);
        const sessionMinutes = Math.ceil((logoutTime - loginTime) / (1000 * 60));
        totalMinutes += Math.max(0, sessionMinutes);
        
        sessions.push({
          login: loginTime,
          logout: logoutTime,
          minutes: sessionMinutes
        });
        
        loginTime = null; // reset for next session
      }
    }
    
    // if there's an unclosed session (login without logout), calculate until now
    if (loginTime) {
      const now = new Date();
      const sessionMinutes = Math.ceil((now - loginTime) / (1000 * 60));
      totalMinutes += Math.max(0, sessionMinutes);
      
      sessions.push({
        login: loginTime,
        logout: now,
        minutes: sessionMinutes,
        active: true
      });
    }
    
    // get child's daily limit
    const childResult = await pool.query(
      'SELECT daily_limit_minutes FROM children WHERE id = $1',
      [child_id]
    );
    
    const dailyLimit = childResult.rows[0] ? childResult.rows[0].daily_limit_minutes : 60;
    const usagePercentage = dailyLimit > 0 ? Math.round((totalMinutes / dailyLimit) * 100) : 0;
    
    console.log(`Usage calculation for child ${child_id}: ${totalMinutes} minutes from ${sessions.length} sessions`);
    
    res.json({
      todayUsage: totalMinutes,
      dailyLimit,
      usagePercentage,
      sessionsCount: sessions.length,
      sessions: sessions,
      eventsCount: eventsResult.rows.length
    });
  } catch (err) {
    console.error('Get usage error:', err);
    res.status(500).json({ error: 'Failed to fetch usage data.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
