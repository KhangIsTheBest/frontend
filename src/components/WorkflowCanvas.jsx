import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomAgentNode } from './CustomAgentNode';

// Map custom node types
const nodeTypes = {
  agentNode: CustomAgentNode,
};

export const WorkflowCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelectNode,
  onSelectEdge,
  onAddAgent,
  activeWorkflow,
}) => {
  // MiniMap node styling
  const nodeColor = (node) => {
    switch (node.data?.agentType) {
      case 'ROUTER':
        return 'var(--color-router)';
      case 'EXECUTOR':
        return 'var(--color-executor)';
      case 'VALIDATOR':
        return 'var(--color-validator)';
      default:
        return 'rgba(255, 255, 255, 0.2)';
    }
  };

  // Node click handler
  const onNodeClick = useCallback(
    (_, node) => {
      onSelectNode(node);
      onSelectEdge(null);
    },
    [onSelectNode, onSelectEdge]
  );

  // Edge click handler
  const onEdgeClick = useCallback(
    (_, edge) => {
      onSelectEdge(edge);
      onSelectNode(null);
    },
    [onSelectNode, onSelectEdge]
  );

  // Background click to deselect
  const onPaneClick = useCallback(() => {
    onSelectNode(null);
    onSelectEdge(null);
  }, [onSelectNode, onSelectEdge]);

  return (
    <div className="canvas-wrapper">
      {/* Top Toolbar */}
      <div className="canvas-toolbar">
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            alignSelf: 'center',
            marginRight: '10px',
          }}
        >
          Thêm Agent:
        </span>
        <button
          className="btn btn-secondary"
          onClick={() => onAddAgent('ROUTER')}
          style={{ padding: '6px 12px', fontSize: '0.75rem', borderLeft: '3px solid var(--color-router)' }}
        >
          + ROUTER
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => onAddAgent('EXECUTOR')}
          style={{ padding: '6px 12px', fontSize: '0.75rem', borderLeft: '3px solid var(--color-executor)' }}
        >
          + EXECUTOR
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => onAddAgent('VALIDATOR')}
          style={{ padding: '6px 12px', fontSize: '0.75rem', borderLeft: '3px solid var(--color-validator)' }}
        >
          + VALIDATOR
        </button>
      </div>

      {/* React Flow Editor */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'rgba(255, 255, 255, 0.25)', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'rgba(255, 255, 255, 0.4)',
            width: 16,
            height: 16,
          },
        }}
      >
        <Controls
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-primary)',
          }}
        />
        <MiniMap
          nodeColor={nodeColor}
          maskColor="rgba(0, 0, 0, 0.6)"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
          }}
        />
        <Background color="#222" gap={16} size={1} />
      </ReactFlow>
    </div>
  );
};
