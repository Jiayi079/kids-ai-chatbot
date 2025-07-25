-- 1. Parents table
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100),
  subscription_status VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Children table
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  age INTEGER,
  daily_limit_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Chat sessions
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  topic VARCHAR(100),
  started_at TIMESTAMP DEFAULT NOW(),
  total_messages INTEGER DEFAULT 0
);

-- 4. Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  from_type VARCHAR(10) CHECK (from_type IN ('kid', 'ai')),
  message_text TEXT,
  buttons_offered JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Usage logs (event-based tracking)
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  event_type VARCHAR(10) CHECK (event_type IN ('login', 'logout')),
  event_time TIMESTAMP DEFAULT NOW(),
  date DATE GENERATED ALWAYS AS (event_time::date) STORED,
  session_id UUID, -- Optional: link to specific chat session
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_usage_logs_child_date ON usage_logs(child_id, date);
CREATE INDEX idx_usage_logs_event_type ON usage_logs(event_type);
CREATE INDEX idx_usage_logs_event_time ON usage_logs(event_time);