import { useState, useRef, useEffect } from 'react';
import './App.css';

const TOPICS = [
  { label: '📚 Math', value: 'math' },
  { label: '📝 Vocab', value: 'vocab' },
  { label: '📖 Story', value: 'story' },
  { label: '🎨 Art', value: 'art' },
  { label: '🎮 Game', value: 'game' },
];

function App() {
  const [view, setView] = useState('welcome');
  const [currentTopic, setCurrentTopic] = useState(null);
  const [chatHistories, setChatHistories] = useState({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const handleTopic = (topic) => {
    setCurrentTopic(topic);
    setView('chat');
    setChatHistories((prev) => {
      if (prev[topic.value]) return prev;
      return {
        ...prev,
        [topic.value]: [
          { from: 'ai', text: `Hi! I'm your friend. Let's talk about ${topic.label}!` }
        ]
      };
    });
  };

  const handleSend = async (messageText = null) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || !currentTopic || isLoading) return;
    
    setInput('');
    setIsLoading(true);

    setChatHistories((prev) => {
      const prevMsgs = prev[currentTopic.value] || [];
      return {
        ...prev,
        [currentTopic.value]: [...prevMsgs, { from: 'kid', text: textToSend }]
      };
    });

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          topic: currentTopic
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      setChatHistories((prev) => {
        const prevMsgs = prev[currentTopic.value] || [];
        return {
          ...prev,
          [currentTopic.value]: [...prevMsgs, { 
            from: 'ai', 
            text: data.response,
            buttons: data.buttons || []
          }]
        };
      });

    } catch (error) {
      console.error('Error sending message:', error);
      setChatHistories((prev) => {
        const prevMsgs = prev[currentTopic.value] || [];
        return {
          ...prev,
          [currentTopic.value]: [...prevMsgs, { 
            from: 'ai', 
            text: 'Sorry, I had trouble thinking of a response. Try again!',
            buttons: ['Try again', 'Ask something else', 'Start over']
          }]
        };
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = (buttonText) => {
    handleSend(buttonText);
  };

  const handleMic = () => {
    alert('Voice input coming soon!');
  };

  const handleSwitchChat = (topic) => {
    setCurrentTopic(topic);
    setView('chat');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistories, currentTopic]);

  if (view === 'welcome') {
    return (
      <div className="ipad-app-bg welcome-bg">
        <header className="app-header-fixed">🦄 Kids Chatbot</header>
        <div className="welcome-center">
          <div className="welcome-title">What do you want to talk about?</div>
          <div className="welcome-topics">
            {TOPICS.map(topic => (
              <button
                key={topic.value}
                className="topic-btn big"
                onClick={() => handleTopic(topic)}
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ipad-app-bg chat-layout">
      <header className="app-header-fixed">🦄 Kids Chatbot</header>
      <div className="chat-main-row">
        <aside className="chat-sidebar">
          <div className="sidebar-title">Your Chats</div>
          {Object.keys(chatHistories).length === 0 && (
            <div className="sidebar-empty">No chats yet</div>
          )}
          {Object.keys(chatHistories).map(topicValue => {
            const topic = TOPICS.find(t => t.value === topicValue);
            return (
              <div
                key={topicValue}
                className={
                  'sidebar-chat-item' +
                  (currentTopic && currentTopic.value === topicValue ? ' active' : '')
                }
                onClick={() => handleSwitchChat(topic)}
              >
                {topic ? topic.label : topicValue}
              </div>
            );
          })}
          <button className="sidebar-back-btn" onClick={() => setView('welcome')}>← Back</button>
        </aside>
        <main className="chat-main-area">
          <div className="chat-topic-title">
            {currentTopic ? currentTopic.label : ''}
          </div>
          <div className="chat-area-scroll chat-area-chat">
            {(chatHistories[currentTopic.value] || []).map((msg, idx) => (
              <div key={idx} className="msg-container">
                <div className={`msg msg-${msg.from}`}>{msg.text}</div>
                {msg.buttons && msg.buttons.length > 0 && (
                  <div className="msg-buttons">
                    {msg.buttons.map((buttonText, btnIdx) => (
                      <button
                        key={btnIdx}
                        className="msg-btn"
                        onClick={() => handleButtonClick(buttonText)}
                        disabled={isLoading}
                      >
                        {buttonText}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="msg-container">
                <div className="msg msg-ai loading">🤔 Thinking...</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="input-row-fixed chat-input-row">
            <button className="mic-btn" onClick={handleMic}>🎤</button>
            <input
              className="chat-input"
              type="text"
              placeholder="Type here..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <button className="send-btn" onClick={() => handleSend()} disabled={isLoading}>
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
