// API Client for the Multi-Agent AI Platform
const API_BASE = 'http://localhost:8080/api';

/**
 * Helper to handle fetch responses and handle errors gracefully
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `API error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      // Ignore if parsing fails
    }
    throw new Error(errorMessage);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export const workflowApi = {
  // Get all workflows
  list: () => fetch(`${API_BASE}/workflows`).then(handleResponse),

  // Get workflow details with its nodes and edges
  get: (id) => fetch(`${API_BASE}/workflows/${id}`).then(handleResponse),

  // Create a new workflow
  create: (name, description) =>
    fetch(`${API_BASE}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    }).then(handleResponse),

  // Update a workflow
  update: (id, name, description) =>
    fetch(`${API_BASE}/workflows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    }).then(handleResponse),

  // Delete a workflow
  delete: (id) =>
    fetch(`${API_BASE}/workflows/${id}`, {
      method: 'DELETE',
    }).then(handleResponse),
};

export const nodeApi = {
  // Create a node (Agent)
  create: (workflowId, nodeName, agentType, systemPrompt, modelSource) =>
    fetch(`${API_BASE}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowId, nodeName, agentType, systemPrompt, modelSource }),
    }).then(handleResponse),

  // Update a node
  update: (id, workflowId, nodeName, agentType, systemPrompt, modelSource) =>
    fetch(`${API_BASE}/nodes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowId, nodeName, agentType, systemPrompt, modelSource }),
    }).then(handleResponse),

  // Delete a node
  delete: (id) =>
    fetch(`${API_BASE}/nodes/${id}`, {
      method: 'DELETE',
    }).then(handleResponse),
};

export const edgeApi = {
  // Create an edge (connect nodes)
  create: (workflowId, sourceNodeId, targetNodeId, conditionExpression = '') =>
    fetch(`${API_BASE}/edges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowId, sourceNodeId, targetNodeId, conditionExpression }),
    }).then(handleResponse),

  // Delete an edge
  delete: (id) =>
    fetch(`${API_BASE}/edges/${id}`, {
      method: 'DELETE',
    }).then(handleResponse),
};

export const chatApi = {
  // Execute the workflow chain
  execute: (workflowId, message, conversationId = null) =>
    fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowId, message, conversationId }),
    }).then(handleResponse),
};

export const analyticsApi = {
  // Get analytics for a workflow
  getWorkflowAnalytics: (workflowId) =>
    fetch(`${API_BASE}/analytics/workflow/${workflowId}`).then(handleResponse),
};
