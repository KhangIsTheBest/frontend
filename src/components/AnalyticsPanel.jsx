import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../api';

export const AnalyticsPanel = ({ activeWorkflow }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    if (!activeWorkflow) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getWorkflowAnalytics(activeWorkflow.id);
      setData(result);
    } catch (err) {
      setError(err.message || 'Không thể tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // Tự động poll mỗi 5 giây để cập nhật thời gian thực khi chạy thử
    const interval = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(interval);
  }, [activeWorkflow?.id]);

  if (!activeWorkflow) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <h3>Thống Kê Kịch Bản</h3>
        <p>Vui lòng chọn hoặc tạo kịch bản để xem thống kê hiệu năng.</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(139, 92, 246, 0.2)',
          borderTop: '3px solid var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <p>Đang tải dữ liệu đo lường...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h3>Đã xảy ra lỗi</h3>
        <p>{error}</p>
        <button onClick={fetchAnalytics} className="btn-primary" style={{ marginTop: '12px', padding: '6px 12px', fontSize: '0.8rem' }}>Thử lại</button>
      </div>
    );
  }

  if (!data || data.totalExecutions === 0) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <h3>Chưa có dữ liệu</h3>
        <p>Kịch bản này chưa được thực thi lần nào. Hãy chuyển qua tab <strong>"Chạy thử"</strong> để chạy thử nghiệm trước.</p>
        <button onClick={fetchAnalytics} className="btn-primary" style={{ marginTop: '12px', padding: '6px 12px', fontSize: '0.8rem' }}>Cập nhật</button>
      </div>
    );
  }

  // Format các số liệu
  const formatCost = (cost) => {
    const vnd = Math.round(cost * 25000);
    return {
      usd: `$${cost.toFixed(4)}`,
      vnd: `${vnd.toLocaleString('vi-VN')} ₫`
    };
  };

  const formatDuration = (ms) => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${Math.round(ms)}ms`;
  };

  const cost = formatCost(data.totalCostSaved);
  const totalTokens = data.totalTokensInput + data.totalTokensOutput;
  const inputPercent = totalTokens > 0 ? (data.totalTokensInput / totalTokens) * 100 : 50;
  const outputPercent = totalTokens > 0 ? (data.totalTokensOutput / totalTokens) * 100 : 50;

  // SVG Circle parameters for Cache Hit Rate gauge
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (data.cacheHitRate / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px', overflowY: 'auto' }} className="scrollable">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
          Thống Kê Hiệu Năng
        </h3>
        <button 
          onClick={fetchAnalytics} 
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            opacity: loading ? 0.5 : 1
          }}
        >
          <svg 
            style={{ 
              width: '14px', 
              height: '14px', 
              animation: loading ? 'spin 1.5s linear infinite' : 'none'
            }} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          &nbsp;{loading ? 'Đang cập nhật...' : 'Làm mới'}
        </button>
      </div>

      {/* Grid metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-glass)',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tổng lượt chạy</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '4px' }}>
            {data.totalExecutions}
          </span>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-glass)',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Thời gian phản hồi TB</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--color-router)', marginTop: '4px' }}>
            {formatDuration(data.avgDurationMs)}
          </span>
        </div>
      </div>

      {/* Cost Saved Panel */}
      <div style={{
        background: 'radial-gradient(100% 100% at 0% 0%, rgba(16, 185, 129, 0.15) 0%, rgba(0,0,0,0) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Tiết kiệm tích lũy (Ollama/Cache)</span>
            <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981', textShadow: '0 0 10px rgba(16, 185, 129, 0.3)', display: 'inline-block', marginTop: '6px' }}>
              {cost.usd}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
              ≈ {cost.vnd}
            </span>
          </div>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg style={{ width: '20px', height: '20px', color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Cache Hit Rate circular indicator */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid var(--border-glass)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ position: 'relative', width: '96px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ transform: 'rotate(-90deg)', width: '96px', height: '96px' }}>
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="var(--color-primary)"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 0 6px var(--color-primary-glow))',
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </svg>
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {data.cacheHitRate}%
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '4px' }}>Tỉ lệ Cache Hit</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            Đã xử lý tức thời <strong>{data.cacheHits}</strong> lượt từ bộ nhớ đệm Redis, giảm thiểu hoàn toàn chi phí & độ trễ.
          </p>
        </div>
      </div>

      {/* Token Usage Graph */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid var(--border-glass)',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '14px' }}>
          Sử Dụng Token Tích Lũy
        </h4>
        
        {/* Token Horizontal Bar */}
        <div style={{ height: '24px', display: 'flex', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', marginBottom: '16px' }}>
          <div style={{
            width: `${inputPercent}%`,
            background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
            boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)',
            transition: 'width 0.8s ease'
          }} title={`Input: ${data.totalTokensInput}`} />
          <div style={{
            width: `${outputPercent}%`,
            background: 'linear-gradient(90deg, #a855f7, #ec4899)',
            boxShadow: '0 0 10px rgba(168, 85, 247, 0.2)',
            transition: 'width 0.8s ease'
          }} title={`Output: ${data.totalTokensOutput}`} />
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#06b6d4', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-secondary)' }}>
              Input: <strong>{data.totalTokensInput.toLocaleString()}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a855f7', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-secondary)' }}>
              Output: <strong>{data.totalTokensOutput.toLocaleString()}</strong>
            </span>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--border-glass)',
          marginTop: '14px',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'var(--text-primary)'
        }}>
          <span>Tổng token tiêu thụ:</span>
          <strong style={{ color: 'var(--color-validator)' }}>{totalTokens.toLocaleString()}</strong>
        </div>
      </div>
    </div>
  );
};
