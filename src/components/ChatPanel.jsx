import React, { useState, useRef, useEffect } from 'react';

export const ChatPanel = ({
  activeWorkflow,
  onRunWorkflow,
  activeConversationId,
  setActiveConversationId,
  liveExecutionSteps = [],
  currentRunningNode = null,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isRunning, liveExecutionSteps, currentRunningNode]);

  // Clear messages when workflow changes
  useEffect(() => {
    setMessages([]);
    setActiveConversationId(null);
  }, [activeWorkflow]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isRunning) return;

    const userMsg = {
      role: 'USER',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const originalInput = inputMessage;
    setInputMessage('');
    setIsRunning(true);

    try {
      const response = await onRunWorkflow(originalInput, activeConversationId);
      
      // Update the active conversation session if it's new
      if (response.conversationId && !activeConversationId) {
        setActiveConversationId(response.conversationId);
      }

      const assistantMsg = {
        role: 'ASSISTANT',
        content: response.finalOutput,
        executionLog: response.executionLog || [],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      const errorMsg = {
        role: 'SYSTEM',
        content: `Lỗi khi thực thi workflow: ${error.message}`,
        isError: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsRunning(false);
    }
  };

  if (!activeWorkflow) {
    return (
      <div className="empty-state">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h3>Bảng Điều Khiển Chạy</h3>
        <p>Vui lòng tạo hoặc chọn một kịch bản workflow để bắt đầu kiểm thử trò chuyện.</p>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Messages area */}
      <div className="chat-messages scrollable">
        {messages.length === 0 && (
          <div className="empty-state" style={{ height: 'auto', padding: '20px 10px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Bắt đầu chuỗi Agent
            </h4>
            <p style={{ fontSize: '0.75rem', maxWidth: '280px' }}>
              Nhập tin nhắn vào ô chat bên dưới để gửi đến Agent đầu tiên trong sơ đồ.
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === 'USER';
          const isSystem = msg.role === 'SYSTEM';

          return (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <div
                className={`chat-bubble ${
                  isUser ? 'user' : 'assistant'
                }`}
                style={isSystem ? {
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  alignSelf: 'center',
                  maxWidth: '95%'
                } : {}}
              >
                <div>{msg.content}</div>
                
                {/* Render execution step trace for AI output */}
                {!isUser && !isSystem && msg.executionLog && msg.executionLog.length > 0 && (
                  <div className="execution-steps-wrapper">
                    <div className="execution-step-title">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                      </svg>
                      Nhật ký thực thi ({msg.executionLog.length} bước)
                    </div>
                    {msg.executionLog.map((step) => (
                      <div key={step.stepOrder} className="execution-step-item">
                        <div className={`execution-step-dot step-${step.agentType}`} />
                        <div className="execution-step-header">
                          <span className="execution-step-name">
                            Bao gồm: {step.nodeName || 'Agent'}
                          </span>
                          <span className="execution-step-type">
                            #{step.stepOrder} ({step.agentType})
                          </span>
                        </div>
                        <div className="execution-step-content">{step.output}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isRunning && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div className="chat-bubble assistant" style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '85%' }}>
              {/* Show live execution steps so far */}
              {liveExecutionSteps && liveExecutionSteps.length > 0 && (
                <div className="execution-steps-wrapper" style={{ marginTop: 0, marginBottom: '12px' }}>
                  <div className="execution-step-title">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    Nhật ký thực thi (Đang cập nhật...)
                  </div>
                  {liveExecutionSteps.map((step) => (
                    <div key={step.stepOrder} className="execution-step-item">
                      <div className={`execution-step-dot step-${step.agentType}`} />
                      <div className="execution-step-header">
                        <span className="execution-step-name">
                          Bao gồm: {step.nodeName || 'Agent'}
                        </span>
                        <span className="execution-step-type">
                          #{step.stepOrder} ({step.agentType})
                        </span>
                      </div>
                      <div className="execution-step-content">{step.output}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Show current running node status */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div className="spinner" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {currentRunningNode 
                    ? `Agent [${currentRunningNode.name}] (${currentRunningNode.type}) đang xử lý...`
                    : 'Đang khởi chạy luồng Multi-Agent...'}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="chat-input-bar">
        <input
          type="text"
          className="input-text"
          placeholder="Nhập câu lệnh để chạy chuỗi Multi-Agent..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isRunning}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isRunning || !inputMessage.trim()}
          style={{ padding: '10px 20px' }}
        >
          {isRunning ? 'Chạy...' : 'Gửi'}
        </button>
      </form>
    </div>
  );
};
