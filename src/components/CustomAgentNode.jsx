import React from 'react';
import { Handle, Position } from '@xyflow/react';

// Custom React Flow Node for Multi-Agent UI
export const CustomAgentNode = ({ data, selected }) => {
  const { nodeName, agentType, systemPrompt, modelSource } = data;

  // CSS Class and Badge styling according to type
  const nodeTypeClass = `node-${agentType ? agentType.toLowerCase() : 'executor'}`;
  const badgeClass = `badge badge-${agentType ? agentType.toLowerCase() : 'executor'}`;

  // Formatter for Agent Type translation/display
  const getAgentTypeLabel = (type) => {
    switch (type) {
      case 'ROUTER':
        return 'Router (Định hướng)';
      case 'EXECUTOR':
        return 'Executor (Thực thi)';
      case 'VALIDATOR':
        return 'Validator (Kiểm chứng)';
      default:
        return type || 'Agent';
    }
  };

  return (
    <div className={`agent-node ${nodeTypeClass} ${selected ? 'selected' : ''}`}>
      {/* Target input handle (on the left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ borderRadius: '50%' }}
      />

      <div className="node-title-bar">
        <div className="node-title" title={nodeName}>
          {nodeName || 'Chưa đặt tên'}
        </div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <span className={badgeClass}>{getAgentTypeLabel(agentType)}</span>
      </div>

      <div className="node-prompt-summary" title={systemPrompt}>
        {systemPrompt || (
          <span style={{ fontStyle: 'italic', opacity: 0.5 }}>
            Không có prompt chỉ dẫn...
          </span>
        )}
      </div>

      <div className="node-footer">
        <span className="node-model-source">{modelSource || 'LOCAL'}</span>
        <span style={{ fontSize: '0.6rem', opacity: 0.4 }}>ID: {data.id?.substring(0, 5)}</span>
      </div>

      {/* Source output handle (on the right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ borderRadius: '50%' }}
      />
    </div>
  );
};
