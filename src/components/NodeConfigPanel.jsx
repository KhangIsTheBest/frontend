import React, { useState, useEffect } from 'react';

export const NodeConfigPanel = ({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
}) => {
  const [nodeName, setNodeName] = useState('');
  const [agentType, setAgentType] = useState('EXECUTOR');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [modelSource, setModelSource] = useState('LOCAL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state with selectedNode change
  useEffect(() => {
    if (selectedNode) {
      setNodeName(selectedNode.data.nodeName || '');
      setAgentType(selectedNode.data.agentType || 'EXECUTOR');
      setSystemPrompt(selectedNode.data.systemPrompt || '');
      setModelSource(selectedNode.data.modelSource || 'LOCAL');
    }
  }, [selectedNode]);

  if (!selectedNode) {
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
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
        </svg>
        <h3>Cấu hình Agent</h3>
        <p>Chọn một Agent (Node) trên sơ đồ canvas để điều chỉnh thông số hoặc prompts.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdateNode(selectedNode.id, {
        nodeName,
        agentType,
        systemPrompt,
        modelSource,
      });
    } catch (error) {
      alert('Không thể lưu thông tin node: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <form onSubmit={handleSubmit} className="scrollable" style={{ flex: 1 }}>
        <h3
          style={{
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-secondary)',
            marginBottom: '16px',
          }}
        >
          Thông Số Agent
        </h3>

        <div className="form-group">
          <label>Tên Agent</label>
          <input
            type="text"
            className="input-text"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            required
            placeholder="Ví dụ: Dịch Giả, Duyệt Tin..."
          />
        </div>

        <div className="form-group">
          <label>Loại Agent (Agent Type)</label>
          <select
            className="select-input"
            value={agentType}
            onChange={(e) => setAgentType(e.target.value)}
          >
            <option value="ROUTER">ROUTER (Định hướng luồng)</option>
            <option value="EXECUTOR">EXECUTOR (Thực thi nhiệm vụ)</option>
            <option value="VALIDATOR">VALIDATOR (Kiểm định kết quả)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Nguồn AI Model (Model Source)</label>
          <select
            className="select-input"
            value={modelSource}
            onChange={(e) => setModelSource(e.target.value)}
          >
            <option value="LOCAL">LOCAL (Ollama - qwen2.5:7b)</option>
            <option value="CLOUD">CLOUD (OpenAI - GPT-4o / Azure)</option>
          </select>
        </div>

        <div className="form-group">
          <label>System Prompt (Chỉ Dẫn Hệ Thống)</label>
          <textarea
            className="textarea-input"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            required
            placeholder="Bạn là một trợ lý dịch thuật chuyên nghiệp. Hãy dịch đoạn văn sau sang tiếng Việt và giữ nguyên các thuật ngữ chuyên ngành..."
            style={{ minHeight: '180px' }}
          />
        </div>

        <div className="flex-row" style={{ marginTop: '24px', justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn xóa Agent này không?')) {
                onDeleteNode(selectedNode.id);
              }
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Xóa Node
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner" />
                Đang lưu...
              </>
            ) : (
              'Cập nhật'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
