import React, { useState, useEffect, useCallback } from 'react';
import { useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import { Sidebar } from './components/Sidebar';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { NodeConfigPanel } from './components/NodeConfigPanel';
import { EdgeConfigPanel } from './components/EdgeConfigPanel';
import { ChatPanel } from './components/ChatPanel';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { workflowApi, nodeApi, edgeApi, chatApi, analyticsApi } from './api';

export default function App() {
  const [workflows, setWorkflows] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  
  // React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Selection states
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [activeTab, setActiveTab] = useState('config'); // 'config' or 'chat'
  
  // Conversation session state
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Real-time execution states via WebSocket
  const [liveExecutionSteps, setLiveExecutionSteps] = useState([]);
  const [currentRunningNode, setCurrentRunningNode] = useState(null);

  // Lắng nghe thông điệp từ WebSocket
  const handleWebSocketMessage = useCallback((event) => {
    if (!activeWorkflow || event.workflowId !== activeWorkflow.id) return;

    if (event.type === 'NODE_RUNNING') {
      setCurrentRunningNode({
        id: event.nodeId,
        name: event.nodeName,
        type: event.agentType
      });

      // Kích hoạt trạng thái nhấp nháy phát sáng trên Canvas cho Node này
      setNodes((prevNodes) =>
        prevNodes.map((n) =>
          n.id === event.nodeId
            ? { ...n, data: { ...n.data, activeRunning: true } }
            : { ...n, data: { ...n.data, activeRunning: false } }
        )
      );
    } else if (event.type === 'NODE_COMPLETED') {
      if (event.step) {
        setLiveExecutionSteps((prev) => {
          if (prev.some((s) => s.stepOrder === event.step.stepOrder)) return prev;
          return [...prev, event.step];
        });
      }

      // Tắt trạng thái nhấp nháy cho Node này
      setNodes((prevNodes) =>
        prevNodes.map((n) =>
          n.id === event.nodeId
            ? { ...n, data: { ...n.data, activeRunning: false } }
            : n
        )
      );
    } else if (event.type === 'WORKFLOW_COMPLETED' || event.type === 'WORKFLOW_FAILED') {
      setCurrentRunningNode(null);

      // Tắt trạng thái nhấp nháy cho toàn bộ Node
      setNodes((prevNodes) =>
        prevNodes.map((n) =>
          n.data.activeRunning ? { ...n, data: { ...n.data, activeRunning: false } } : n
        )
      );
    }
  }, [activeWorkflow, setNodes]);

  // Thiết lập kết nối WebSocket với reconnection
  useEffect(() => {
    let ws;
    let reconnectTimeout;

    const connect = () => {
      ws = new WebSocket('ws://localhost:8080/ws/execution');

      ws.onopen = () => {
        console.log('🔌 Đã kết nối thành công với Spring Boot WebSocket');
      };

      ws.onmessage = (messageEvent) => {
        try {
          const data = JSON.parse(messageEvent.data);
          handleWebSocketMessage(data);
        } catch (err) {
          console.error('Lỗi phân tích cú pháp dữ liệu WebSocket:', err);
        }
      };

      ws.onclose = () => {
        console.log('🔌 Kết nối WebSocket bị ngắt. Thử lại sau 3 giây...');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('Lỗi WebSocket:', err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, [handleWebSocketMessage]);

  // Load all workflows on mount
  useEffect(() => {
    loadWorkflows();
  }, []);

  // Show auto-dismiss notification
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const loadWorkflows = async () => {
    try {
      const data = await workflowApi.list();
      setWorkflows(data || []);
      // If there's an active workflow, refresh it from list, otherwise select first
      if (data && data.length > 0) {
        if (activeWorkflow) {
          const current = data.find(w => w.id === activeWorkflow.id);
          if (current) {
            selectWorkflow(current);
          } else {
            selectWorkflow(data[0]);
          }
        } else {
          selectWorkflow(data[0]);
        }
      } else {
        setActiveWorkflow(null);
        setNodes([]);
        setEdges([]);
      }
    } catch (err) {
      showNotification('Lỗi khi tải danh sách: ' + err.message);
    }
  };

  // Select a workflow and map its nodes/edges for React Flow
  const selectWorkflow = async (workflow) => {
    try {
      const details = await workflowApi.get(workflow.id);
      setActiveWorkflow(details);
      setSelectedNode(null);
      setSelectedEdge(null);

      // Map Nodes with saved positions or layout columns
      const savedPositions = JSON.parse(
        localStorage.getItem(`workflow_node_positions_${workflow.id}`) || '{}'
      );
      const counts = { ROUTER: 0, EXECUTOR: 0, VALIDATOR: 0 };
      
      const mappedNodes = (details.nodes || []).map((node) => {
        let position = savedPositions[node.id];
        if (!position) {
          const type = node.agentType || 'EXECUTOR';
          const index = counts[type];
          counts[type] += 1;
          
          let x = 400;
          if (type === 'ROUTER') x = 120;
          if (type === 'VALIDATOR') x = 680;
          
          position = { x, y: 100 + index * 180 };
        }
        return {
          id: node.id,
          type: 'agentNode',
          data: {
            id: node.id,
            nodeName: node.nodeName,
            agentType: node.agentType,
            systemPrompt: node.systemPrompt,
            modelSource: node.modelSource,
            workflowId: node.workflowId,
          },
          position,
        };
      });

      // Map Edges
      const mappedEdges = (details.edges || []).map((edge) => ({
        id: edge.id,
        source: edge.sourceNodeId,
        target: edge.targetNodeId,
        data: {
          id: edge.id,
          conditionExpression: edge.conditionExpression,
          workflowId: edge.workflowId,
        },
        label: edge.conditionExpression || '',
        animated: true,
      }));

      setNodes(mappedNodes);
      setEdges(mappedEdges);
    } catch (err) {
      showNotification('Lỗi khi tải chi tiết kịch bản: ' + err.message);
    }
  };

  // Monitor node position changes and save to localStorage
  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      
      // Save position on drag commit
      const dragEndChange = changes.find((c) => c.type === 'position' && c.dragging === false);
      if (dragEndChange && activeWorkflow) {
        const nodeToUpdate = nodes.find((n) => n.id === dragEndChange.id);
        if (nodeToUpdate) {
          const key = `workflow_node_positions_${activeWorkflow.id}`;
          const currentPositions = JSON.parse(localStorage.getItem(key) || '{}');
          currentPositions[dragEndChange.id] = dragEndChange.position;
          localStorage.setItem(key, JSON.stringify(currentPositions));
        }
      }
    },
    [onNodesChange, activeWorkflow, nodes]
  );

  // Workflow CRUD
  const handleCreateWorkflow = async (name, description) => {
    const newWf = await workflowApi.create(name, description);
    await loadWorkflows();
    selectWorkflow(newWf);
    showNotification('Đã tạo kịch bản mới');
  };

  const handleDeleteWorkflow = async (id) => {
    await workflowApi.delete(id);
    localStorage.removeItem(`workflow_node_positions_${id}`);
    await loadWorkflows();
    showNotification('Đã xóa kịch bản');
  };

  // Node CRUD
  const handleAddAgent = async (type) => {
    if (!activeWorkflow) return;
    
    let defaultPrompt = '';
    let name = '';
    if (type === 'ROUTER') {
      name = 'Định Hướng';
      defaultPrompt = 'Phân loại câu hỏi của người dùng và chọn kết nối đầu ra phù hợp. Output của bạn phải chứa từ khóa phân loại.';
    } else if (type === 'EXECUTOR') {
      name = 'Xử Lý';
      defaultPrompt = 'Thực thi câu lệnh dựa trên dữ liệu đầu vào. Trả về câu trả lời chi tiết.';
    } else {
      name = 'Kiểm Chứng';
      defaultPrompt = 'Đánh giá độ chính xác và tính hợp lệ của câu trả lời trước đó. Nếu không đạt yêu cầu, ghi rõ lỗi.';
    }

    try {
      await nodeApi.create(
        activeWorkflow.id,
        name,
        type,
        defaultPrompt,
        'LOCAL'
      );
      await loadWorkflows(); // Refresh
      showNotification('Đã thêm Agent mới');
    } catch (err) {
      showNotification('Lỗi khi thêm Agent: ' + err.message);
    }
  };

  const handleUpdateNode = async (id, updatedFields) => {
    if (!activeWorkflow) return;
    try {
      await nodeApi.update(
        id,
        activeWorkflow.id,
        updatedFields.nodeName,
        updatedFields.agentType,
        updatedFields.systemPrompt,
        updatedFields.modelSource
      );
      await loadWorkflows();
      setSelectedNode(null);
      showNotification('Đã cập nhật thông tin Agent');
    } catch (err) {
      showNotification('Lỗi cập nhật Agent: ' + err.message);
    }
  };

  const handleDeleteNode = async (id) => {
    try {
      await nodeApi.delete(id);
      
      // Clear position cache
      if (activeWorkflow) {
        const key = `workflow_node_positions_${activeWorkflow.id}`;
        const positions = JSON.parse(localStorage.getItem(key) || '{}');
        delete positions[id];
        localStorage.setItem(key, JSON.stringify(positions));
      }

      await loadWorkflows();
      setSelectedNode(null);
      showNotification('Đã xóa Agent');
    } catch (err) {
      showNotification('Lỗi xóa Agent: ' + err.message);
    }
  };

  // Edge CRUD
  const handleConnect = async (params) => {
    if (!activeWorkflow) return;
    try {
      await edgeApi.create(
        activeWorkflow.id,
        params.source,
        params.target,
        '' // Default empty condition
      );
      await loadWorkflows();
      showNotification('Đã kết nối hai Agent');
    } catch (err) {
      showNotification('Lỗi khi nối Agent: ' + err.message);
    }
  };

  const handleUpdateEdgeCondition = async (id, expression) => {
    if (!activeWorkflow) return;
    const edgeObj = edges.find((e) => e.id === id);
    if (!edgeObj) return;

    try {
      // Recreate edge since there is no PUT endpoint in EdgeController
      await edgeApi.delete(id);
      await edgeApi.create(
        activeWorkflow.id,
        edgeObj.source,
        edgeObj.target,
        expression
      );
      await loadWorkflows();
      setSelectedEdge(null);
      showNotification('Đã cập nhật điều kiện kết nối');
    } catch (err) {
      showNotification('Lỗi cập nhật kết nối: ' + err.message);
    }
  };

  const handleDeleteEdge = async (id) => {
    try {
      await edgeApi.delete(id);
      await loadWorkflows();
      setSelectedEdge(null);
      showNotification('Đã xóa kết nối');
    } catch (err) {
      showNotification('Lỗi xóa kết nối: ' + err.message);
    }
  };

  // Execution
  const handleRunWorkflow = async (message, conversationId) => {
    if (!activeWorkflow) return;
    setLiveExecutionSteps([]);
    setCurrentRunningNode(null);
    return await chatApi.execute(activeWorkflow.id, message, conversationId);
  };

  return (
    <div className="app-container">
      <h1 style={{ display: 'none' }}>Multi-Agent AI Platform - Hệ thống Thiết kế Chuỗi Agent</h1>
      <div className="app-bg-glow" />

      {/* 1. Left Panel: Sidebar */}
      <Sidebar
        workflows={workflows}
        activeWorkflow={activeWorkflow}
        onSelectWorkflow={selectWorkflow}
        onCreateWorkflow={handleCreateWorkflow}
        onDeleteWorkflow={handleDeleteWorkflow}
      />

      {/* 2. Middle Panel: Flow Canvas */}
      <main style={{ height: '100vh', width: '100%', position: 'relative' }}>
        {activeWorkflow ? (
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onSelectNode={setSelectedNode}
            onSelectEdge={setSelectedEdge}
            onAddAgent={handleAddAgent}
            activeWorkflow={activeWorkflow}
          />
        ) : (
          <div className="empty-state">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <h3>Chào mừng bạn đến với Multi-Agent Platform</h3>
            <p>Vui lòng tạo một kịch bản mới ở menu bên trái để bắt đầu thiết kế.</p>
          </div>
        )}
      </main>

      {/* 3. Right Panel: Configuration & Chat Console */}
      <section className="control-panel glass-panel">
        <div className="tab-buttons">
          <button
            onClick={() => setActiveTab('config')}
            className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
          >
            Cấu hình
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          >
            Chạy thử
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            Thống kê
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          {activeTab === 'config' ? (
            selectedEdge ? (
              <EdgeConfigPanel
                selectedEdge={selectedEdge}
                onUpdateEdgeCondition={handleUpdateEdgeCondition}
                onDeleteEdge={handleDeleteEdge}
              />
            ) : (
              <NodeConfigPanel
                selectedNode={selectedNode}
                onUpdateNode={handleUpdateNode}
                onDeleteNode={handleDeleteNode}
              />
            )
          ) : activeTab === 'chat' ? (
            <ChatPanel
              activeWorkflow={activeWorkflow}
              onRunWorkflow={handleRunWorkflow}
              activeConversationId={activeConversationId}
              setActiveConversationId={setActiveConversationId}
              liveExecutionSteps={liveExecutionSteps}
              currentRunningNode={currentRunningNode}
            />
          ) : (
            <AnalyticsPanel activeWorkflow={activeWorkflow} />
          )}
        </div>
      </section>

      {/* Toast Notification */}
      {notification && <div className="notification">{notification}</div>}
    </div>
  );
}
