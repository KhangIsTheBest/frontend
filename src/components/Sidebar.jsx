import React, { useState } from 'react';

export const Sidebar = ({
  workflows,
  activeWorkflow,
  onSelectWorkflow,
  onCreateWorkflow,
  onDeleteWorkflow,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateWorkflow(name, description);
      setName('');
      setDescription('');
      setShowCreateForm(false);
    } catch (error) {
      alert('Không thể tạo workflow: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="sidebar-panel glass-panel">
      <div className="panel-header">
        <h2>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--color-primary)' }}
          >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 6v6l4 2" />
          </svg>
          Multi-Agent Lab
        </h2>
        <p>Hệ thống Thiết kế Chuỗi Agent</p>
      </div>

      <div className="scrollable">
        <div className="flex-between mb-md">
          <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            Danh sách Kịch bản ({workflows.length})
          </h3>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            >
              + Mới
            </button>
          )}
        </div>

        {showCreateForm && (
          <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', background: 'rgba(0,0,0,0.2)' }}>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.7rem' }}>Tên kịch bản</label>
              <input
                type="text"
                className="input-text"
                placeholder="Ví dụ: Dịch và tóm tắt tin tức"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.7rem' }}>Mô tả kịch bản</label>
              <textarea
                className="textarea-input"
                placeholder="Kịch bản dịch tin từ tiếng Anh sang tiếng Việt..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.8rem', minHeight: '60px' }}
              />
            </div>
            <div className="flex-row" style={{ justifyContent: 'flex-end', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreateForm(false)}
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang tạo...' : 'Lưu'}
              </button>
            </div>
          </form>
        )}

        {workflows.length === 0 ? (
          <div className="text-center text-muted" style={{ padding: '20px 0' }}>
            Chưa có kịch bản nào. Bấm nút "+" để thêm mới.
          </div>
        ) : (
          workflows.map((wf) => (
            <div
              key={wf.id}
              className={`workflow-list-item ${
                activeWorkflow && activeWorkflow.id === wf.id ? 'active' : ''
              }`}
              onClick={() => onSelectWorkflow(wf)}
            >
              <div className="workflow-info">
                <span className="workflow-name">{wf.name}</span>
                <span className="workflow-desc">
                  {wf.description || 'Không có mô tả.'}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Bạn có chắc chắn muốn xóa kịch bản "${wf.name}" không?`)) {
                    onDeleteWorkflow(wf.id);
                  }
                }}
                className="btn btn-danger"
                style={{
                  padding: '4px 6px',
                  borderRadius: '4px',
                  background: 'transparent',
                  border: 'none',
                }}
                title="Xóa kịch bản"
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
              </button>
            </div>
          ))
        )}
      </div>
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-glass)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        <span>Master's Thesis Project © 2026</span>
      </div>
    </aside>
  );
};
