# Kids AI Chatbot

A safe, educational AI chatbot web app designed for children aged 6-12, with parent controls and age-appropriate content.

## Features

### For Kids (Ages 6-12)
- **Simple Interface**: Tap buttons or type simple messages
- **Topic Selection**: Choose from Math, Science, Stories, Art, and more
- **Age-Appropriate AI**: Responses tailored to child's specific age
- **Safe Content**: All AI responses filtered for safety and good values
- **Fun Learning**: Encourages curiosity and creativity

### For Parents
- **Dashboard**: Manage all children's accounts in one place
- **Usage Tracking**: Monitor daily usage time and set limits
- **Chat History**: Review all conversations and learning topics
- **Subscription Plans**: Free, Basic ($9.99/month), Premium ($19.99/month)
- **Safety Controls**: Age-appropriate content filtering and supervision tools

## 💳 Subscription Plans

| Plan | Children | Daily Limit | Price |
|------|----------|-------------|-------|
| **Free** | 1 | 60 minutes | $0 |
| **Basic** | 3 | 120 minutes | $9.99/month |
| **Premium** | Unlimited | Unlimited | $19.99/month |

## Quick Start

### Prerequisites
- Node.js (v16+)
- PostgreSQL database
- Google Gemini API key
- Stripe account (for payments)

### Installation

1. **Clone and setup**
   ```bash
   git clone <your-repo-url>
   cd kids-ai-chatbot
   ```

2. **Backend setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Add your environment variables
   npm start
   ```

3. **Frontend setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the app**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## Configuration

### Backend Environment Variables
```env
# Database
PGHOST=localhost
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGDATABASE=your_db_name
PGPORT=5432

# Security
JWT_SECRET=your_jwt_secret_key

# APIs
GEMINI_API_KEY=your_gemini_api_key
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Frontend Environment Variables
```env
VITE_API_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

### API Keys Setup

#### Google Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to backend `.env`

#### Future Enhancements
- Support for additional AI providers (OpenAI, Claude, etc.)

#### Stripe API
1. Visit [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get Publishable key (frontend) and Secret key (backend)
3. Add to respective `.env` files

## How It Works

### For Parents
1. **Register** → Read safety rules → Create account
2. **Dashboard** → Manage children → Monitor usage
3. **Create Child** → Set age and daily limits
4. **View History** → Check chat sessions and usage
5. **Subscription** → Choose plan and manage payments

### For Kids
1. **Login** → Use username/password
2. **Choose Topic** → Math, Science, Stories, etc.
3. **Chat** → Type or tap buttons to talk with AI
4. **Learn** → Get age-appropriate, safe responses

## 🛡️ Safety Features

- **Age Detection**: AI knows child's exact age from database
- **Content Filtering**: All responses checked for appropriateness
- **Value Promotion**: Encourages kindness, honesty, respect
- **Usage Limits**: Daily time restrictions for healthy balance
- **Parent Oversight**: Full visibility and control for parents

## 🏗️ Tech Stack

- **Frontend**: React + Vite + Stripe Elements
- **Backend**: Node.js + Express + PostgreSQL
- **AI**: Google Gemini API (age-appropriate responses)
- **Payments**: Stripe (secure subscription processing)
- **Authentication**: JWT tokens
- **Database**: PostgreSQL with usage tracking

## 📁 Project Structure

```
kids-ai-chatbot/
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main app
│   │   ├── ParentRegister.jsx   # Registration with rules
│   │   ├── ParentDashboard.jsx  # Parent management
│   │   ├── ChildMain.jsx        # Topic selection
│   │   ├── ChildChat.jsx        # Chat interface
│   │   ├── PaymentSection.jsx   # Subscription plans
│   │   └── StripePaymentForm.jsx # Payment processing
│   └── package.json
├── backend/
│   ├── index.js                 # Main server + AI chat
│   ├── authMiddleware.js        # JWT authentication
│   ├── db.js                    # Database connection
│   ├── schema.sql               # Database structure
│   └── package.json
└── README.md
```

## Target Users

- **Primary**: Children aged 6-12
- **Secondary**: Parents and guardians
- **Platform**: Web browsers (optimized for iPad/tablet)

## Future Roadmap
- **Voice Interaction**: Microphone support for hands-free AI conversations
- **Payment Integration**: Complete Stripe payment processing implementation
- **Advanced Analytics**: Weekly learning summaries and progress reports
- **Custom Learning**: Personalized learning paths and topic creation
- **Multi-language**: Support for multiple languages and cultures

## 📄 License

ISC License

## 🆘 Support

Open an issue on GitHub for questions or problems.