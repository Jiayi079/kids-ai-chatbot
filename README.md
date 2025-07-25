# Kids AI Chatbot

A kid-friendly AI chatbot web app designed for children aged 6-12, featuring voice-friendly interactions and educational conversations.

## Features

### For Kids (Ages 6-12)
- Tap buttons instead of typing
- Colorful design with images and easy to understand
- Choose from topics show on the main page
- Age-appropriate conversations make sure kids can understand and have fun

### For Parents
- **Subscription Management**: Choose from Free, Basic, or Premium plans
- **Child Account Management**: Create and manage multiple child accounts
- **Usage Monitoring**: Track daily usage and set limits for each child
- **Chat History**: Review all chat sessions and conversations
- **Payment Processing**: Secure subscription payments with plan upgrades

## Subscription Plans

### Free Plan
- 1 child account
- 60 minutes daily usage limit
- Basic features

### Basic Plan ($9.99/month)
- Up to 3 child accounts
- 120 minutes daily usage limit per child
- Priority support
- Basic analytics

### Premium Plan ($19.99/month)
- Unlimited child accounts
- Unlimited daily usage
- Advanced analytics & reports
- Custom learning topics
- 24/7 priority support
- Progress tracking
- Educational content library

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd kids-ai-chatbot
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Create .env file
   # Add your GEMINI_API_KEY to .env file
   npm start
   ```

3. **Set up the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## Configuration

### Environment Variables

Create a `.env` file in the `backend` folder:

```env
# Database Configuration
PGHOST=localhost
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGDATABASE=your_db_name
PGPORT=5432

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

Create a `.env` file in the `frontend` folder:

```env
VITE_API_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### Getting API Keys

#### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your backend `.env` file

#### Stripe API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or sign in
3. Go to Developers → API keys
4. Copy your **Publishable key** (starts with `pk_test_`) to frontend `.env`
5. Copy your **Secret key** (starts with `sk_test_`) to backend `.env`
6. For webhooks (optional), go to Developers → Webhooks and create an endpoint

## 📱 Usage

1. **Welcome Screen**: Choose a topic to start chatting
2. **Chat Interface**: 
   - Type messages (microphone will be finished later)
   - Tap the buttons/type sentences/talk by using microphone to continue conversations
   - Switch between different topic chats using the sidebar
3. **Navigation**: Use the "← Back" button to return to topic selection

## Tech Stack

- **Frontend**: React + Vite + Stripe Elements
- **Backend**: Node.js + Express + Stripe API
- **AI**: Google Gemini API
- **Database**: PostgreSQL
- **Styling**: CSS3 with responsive design
- **Payments**: Stripe (secure payment processing)

## Project Structure

```
kids-ai-chatbot/
├── frontend/          # React app
│   ├── src/
│   │   ├── App.jsx    # Main app component
│   │   ├── App.css    # Styles
│   │   └── index.css  # Base styles
│   └── package.json
├── backend/           # Express server
│   ├── index.js       # Main server file
│   ├── .env          # Environment variables
│   └── package.json
└── README.md
```

## Target Users

- **Primary**: Children aged 6-12
- **Secondary**: Parents
- **Platform**: iPad and web browsers



## License

This project is licensed under the ISC License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.