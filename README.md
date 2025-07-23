# Kids AI Chatbot

A kid-friendly AI chatbot web app designed for children aged 6-12, featuring voice-friendly interactions and educational conversations.

## Features

### For Kids (Ages 6-12)
- Tap buttons instead of typing
- Colorful design with images and easy to understand
- Choose from topics show on the main page
- Age-appropriate conversations make sure kids can understand and have fun

### For Parents


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
GEMINI_API_KEY=your_gemini_api_key_here
```

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

## 📱 Usage

1. **Welcome Screen**: Choose a topic to start chatting
2. **Chat Interface**: 
   - Type messages (microphone will be finished later)
   - Tap the buttons/type sentences/talk by using microphone to continue conversations
   - Switch between different topic chats using the sidebar
3. **Navigation**: Use the "← Back" button to return to topic selection

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **AI**: Google Gemini API
- **Styling**: CSS3 with responsive design

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