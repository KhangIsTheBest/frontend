import React, { useState, useEffect } from 'react';

export const EdgeConfigPanel = ({
  selectedEdge,
  onUpdateEdgeCondition,
  onDeleteEdge,
}) => {
  const [conditionExpression, setConditionExpression] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state with selectedEdge change
  useEffect(() => {
    if (selectedEdge) {
      setConditionExpression(selectedEdge.data?.conditionExpression || '');
    }
  }, [selectedEdge]);

  if (!selectedEdge) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdateEdgeCondition(selectedEdge.id, conditionExpression);
    } catch (error) {
      alert('Không thể lưu điều kiện: ' + error.message);
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
          Cấu Hình Kết Nối (Edge)
        </h3>

        <div className="form-group">
          <label>Điều kiện rẽ nhánh (Condition Expression)</label>
          <input
            type="text"
            className="input-text"
            value={conditionExpression}
            onChange={(e) => setConditionExpression(e.target.value)}
            placeholder="Ví dụ: contains:yes hoặc default"
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Các định dạng hỗ trợ:</strong>
            <ul style={{ paddingLeft: '16px', marginTop: '4px' }}>
              <li><code>contains:keyword</code> - Nếu kết quả chứa từ khóa</li>
              <li><code>not_contains:keyword</code> - Nếu kết quả không chứa từ khóa</li>
              <li><code>starts_with:prefix</code> - Nếu kết quả bắt đầu bằng tiền tố</li>
              <li><code>equals:value</code> - Nếu kết quả bằng chính xác giá trị</li>
              <li><code>default</code> hoặc để trống - Nhánh mặc định (fallback)</li>
            </ul>
          </div>
        </div>

        <div className="flex-row" style={{ marginTop: '24px', justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn xóa kết nối này không?')) {
                onDeleteEdge(selectedEdge.id);
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
            Xóa Kết Nối
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang lưu...' : 'Cập nhật'}
          </button>
        </div>
      </form>
    </div>
  );
};
