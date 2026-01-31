// Application state
const app = {
    agents: [...mockAgents],
    conversations: {},
    currentView: 'dashboard',
    selectedAgent: null,
    editingAgent: null,
    filteredAgents: [],

    init() {
        // Load agents from localStorage when available to persist across sessions
        try {
            const stored = localStorage.getItem('rsaf_agents');
            if (stored) this.agents = JSON.parse(stored);
        } catch (e) {
            console.warn('Failed to parse stored agents', e);
        }
        try {
            const conv = localStorage.getItem('rsaf_conversations');
            if (conv) this.conversations = JSON.parse(conv);
        } catch (e) {
            console.warn('Failed to parse stored conversations', e);
        }

        this.filteredAgents = [...this.agents];
        this.renderDashboard();
    },

    // Generate realistic-looking metrics for a newly created agent
    // capabilities: array of strings
    // configuration: { model, temperature, maxTokens }
    // status: 'active'|'paused'|'training'|'error'
    generateAgentMetrics(capabilities = [], configuration = {}, status = 'active') {
        const capCount = (capabilities || []).length;
        const model = (configuration && configuration.model || '').toLowerCase();

        // avgResponseTime (ms) by model heuristic
        let respMin = 180, respMax = 800;
        if (model.includes('gpt-4')) { respMin = 300; respMax = 900; }
        else if (model.includes('gpt-3.5')) { respMin = 120; respMax = 420; }
        else if (model.includes('claude')) { respMin = 240; respMax = 750; }

        // status influences interactions and uptime
        let interactionsRange = [50, 800];
        let uptimeRange = [92, 99];
        let successBase = 75;
        if (status === 'training') { interactionsRange = [5, 80]; uptimeRange = [70, 95]; successBase = 60; }
        else if (status === 'paused') { interactionsRange = [0, 120]; uptimeRange = [50, 85]; successBase = 65; }
        else if (status === 'error') { interactionsRange = [0, 40]; uptimeRange = [20, 70]; successBase = 50; }

        // more capabilities usually means more interactions and possibly higher success
        const capBonus = Math.min(capCount * 0.06, 0.25); // up to +25%

        const randBetween = (a, b) => Math.round(a + Math.random() * (b - a));

        const totalInteractions = randBetween(interactionsRange[0], interactionsRange[1]) + Math.round(capCount * randBetween(5, 60));
        const uptime = Number((randBetween(uptimeRange[0], uptimeRange[1]) - Math.random() * 2).toFixed(1));
        // success rate influenced by base and capBonus, small random jitter
        const successRate = Math.max(30, Math.min(98, Math.round(successBase + capBonus * 100 - Math.random() * 8)));
        const avgResponseTime = randBetween(respMin, respMax - Math.round(capCount * 5));

        return {
            totalInteractions,
            successRate,
            avgResponseTime,
            uptime
        };
    },

    // View Management
    showDashboard() {
        this.currentView = 'dashboard';
        this.selectedAgent = null;
        this.updateViews();
        this.renderDashboard();
    },

    showDetails(agentId) {
        this.currentView = 'details';
        this.selectedAgent = this.agents.find(a => a.id === agentId);
        this.updateViews();
        this.renderAgentDetails();
    },

    showBuilder() {
        this.currentView = 'builder';
        this.updateViews();
        this.renderBuilder();
    },

    showConversation() {
        this.currentView = 'conversation';
        this.updateViews();
        this.renderConversation();
    },

    showAnalytics() {
        this.currentView = 'analytics';
        this.updateViews();
        this.renderAnalyticsPage();
    },

    updateViews() {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${this.currentView}View`).classList.add('active');
    },

    // Dashboard Rendering
    renderDashboard() {
        this.renderAnalytics();
        this.renderAgentsGrid();
        this.updateResultsCount();
    },

    renderAnalytics() {
        const activeAgents = this.agents.filter(a => a.status === 'active').length;
        const totalInteractions = this.agents.reduce((sum, a) => sum + a.metrics.totalInteractions, 0);
        const avgSuccessRate = Math.round(
            this.agents.reduce((sum, a) => sum + a.metrics.successRate, 0) / this.agents.length
        );
        const avgUptime = (
            this.agents.reduce((sum, a) => sum + a.metrics.uptime, 0) / this.agents.length
        ).toFixed(1);

        const html = `
            <div class="analytics-grid">
                <div class="stat-card">
                    <h3>Active Agents</h3>
                    <div class="stat-value">${activeAgents}</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i> ${this.agents.length} total
                    </div>
                </div>
                <div class="stat-card">
                    <h3>Total Interactions</h3>
                    <div class="stat-value">${totalInteractions.toLocaleString()}</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i> +12% this week
                    </div>
                </div>
                <div class="stat-card">
                    <h3>Avg Success Rate</h3>
                    <div class="stat-value">${avgSuccessRate}%</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i> +2.5% improvement
                    </div>
                </div>
                <div class="stat-card">
                    <h3>System Uptime</h3>
                    <div class="stat-value">${avgUptime}%</div>
                    <div class="stat-change positive">
                        <i class="fas fa-check"></i> Excellent
                    </div>
                </div>
            </div>
        `;
        document.getElementById('analyticsSection').innerHTML = html;
    },

    // Full analytics page (separate view)
    renderAnalyticsPage() {
        const totalAgents = this.agents.length;
        const active = this.agents.filter(a=>a.status==='active').length;
        const paused = this.agents.filter(a=>a.status==='paused').length;
        const training = this.agents.filter(a=>a.status==='training').length;
        const totalInteractions = this.agents.reduce((s,a)=>s+a.metrics.totalInteractions,0);

        const perAgentCards = this.agents.map(a=>{
            // build a tiny sparkline from recent conversation lengths (local simulation)
            const conv = (this.conversations[a.id] || []).filter(m=>m.sender).slice(-12);
            const sparkData = conv.map(m => (m.text || '').length || 1);
            const spark = this.renderSparkline(sparkData, 140, 32);
            return `
                <div class="agent-card">
                    <div class="agent-card-header">
                        <div class="agent-header-top">
                            ${a.avatar?`<img src="${a.avatar}" class="agent-avatar">`:`<div class="agent-avatar"><i class="fas fa-robot"></i></div>`}
                            <span class="status-badge ${a.status}">${a.status}</span>
                        </div>
                        <h3>${a.name}</h3>
                        <p>${a.description}</p>
                        <span class="agent-type">${a.type}</span>
                    </div>
                    <div class="agent-card-body">
                        <div class="metrics-grid">
                            <div class="metric"><div class="metric-value">${(a.metrics.totalInteractions).toLocaleString()}</div><div class="metric-label">Interactions</div></div>
                            <div class="metric"><div class="metric-value">${a.metrics.successRate}%</div><div class="metric-label">Success</div></div>
                            <div class="metric"><div class="metric-value">${a.metrics.avgResponseTime}ms</div><div class="metric-label">Avg Resp</div></div>
                        </div>
                        <div style="margin-top:0.75rem">${spark}</div>
                    </div>
                    <div class="agent-card-footer">
                        <button class="btn btn-outline" onclick="app.showDetails('${a.id}')">View</button>
                        <button class="btn btn-primary" onclick="app.openChat('${a.id}')">Chat</button>
                    </div>
                </div>
            `;
        }).join('');

        const html = `
            <div class="details-container">
                <div class="details-header">
                    <h2>Analytics</h2>
                    <p>System-wide and per-agent performance overview</p>
                    <button class="btn btn-outline" onclick="app.showDashboard()" style="margin-top:1rem;">Back to Dashboard</button>
                </div>
                <div class="details-body">
                    <div class="analytics-grid">
                        <div class="stat-card"><h3>Total Agents</h3><div class="stat-value">${totalAgents}</div></div>
                        <div class="stat-card"><h3>Active</h3><div class="stat-value">${active}</div></div>
                        <div class="stat-card"><h3>Paused</h3><div class="stat-value">${paused}</div></div>
                        <div class="stat-card"><h3>Training</h3><div class="stat-value">${training}</div></div>
                    </div>

                    <div style="margin-top:1.5rem;">
                        <h3>Overall Interactions</h3>
                        <div style="font-size:1.5rem; font-weight:700;">${totalInteractions.toLocaleString()}</div>
                        <p style="color:var(--muted)">Interactions summed across all agents</p>
                    </div>

                    <div style="margin-top:1.5rem;">
                        <h3>Per-Agent Metrics</h3>
                        <div class="agents-grid">
                            ${perAgentCards}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('analyticsContent').innerHTML = html;
    },

    // small inline sparkline renderer for analytics (returns SVG string)
    renderSparkline(values = [], width = 120, height = 32) {
        if (!values || values.length === 0) {
            return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="transparent"></rect></svg>`;
        }
        const max = Math.max(...values);
        const min = Math.min(...values);
        const pts = values.map((v, i) => {
            const x = (i / (values.length - 1 || 1)) * (width - 4) + 2;
            const norm = max === min ? 0.5 : (v - min) / (max - min);
            const y = height - (norm * (height - 6) + 3);
            return `${x},${y}`;
        }).join(' ');
        // polyline for sparkline and small filled area
        const poly = `<polyline fill="none" stroke="var(--primary)" stroke-width="2" points="${pts}" stroke-linecap="round" stroke-linejoin="round"></polyline>`;
        return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${poly}</svg>`;
    },

    // convenience helper to open the conversation view and start chat with an agent
    openChat(agentId) {
        this.showConversation();
        // small timeout to allow the conversation view to render
        setTimeout(() => this.startChatWithAgent(agentId), 60);
    },

    renderAgentsGrid() {
        const grid = document.getElementById('agentsGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.filteredAgents.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';

        grid.innerHTML = this.filteredAgents.map(agent => `
            <div class="agent-card">
                <div class="agent-card-header">
                    <div class="agent-header-top">
                        ${agent.avatar ? 
                            `<img src="${agent.avatar}" alt="${agent.name}" class="agent-avatar">` :
                            `<div class="agent-avatar"><i class="fas fa-robot"></i></div>`
                        }
                        <span class="status-badge ${agent.status}">${agent.status}</span>
                    </div>
                    <h3>${agent.name}</h3>
                    <p>${agent.description}</p>
                    <span class="agent-type">${agent.type}</span>
                </div>
                <div class="agent-card-body">
                    <div class="capabilities">
                        <h4>Capabilities</h4>
                        <div class="capability-tags">
                            ${agent.capabilities.slice(0, 3).map(cap => 
                                `<span class="capability-tag">${cap}</span>`
                            ).join('')}
                            ${agent.capabilities.length > 3 ? 
                                `<span class="capability-tag">+${agent.capabilities.length - 3}</span>` : 
                                ''
                            }
                        </div>
                    </div>
                    <div class="metrics-grid">
                        <div class="metric">
                            <div class="metric-value">${(agent.metrics.totalInteractions / 1000).toFixed(1)}k</div>
                            <div class="metric-label">Interactions</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${agent.metrics.successRate}%</div>
                            <div class="metric-label">Success Rate</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${agent.metrics.avgResponseTime}ms</div>
                            <div class="metric-label">Avg Response</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${agent.metrics.uptime}%</div>
                            <div class="metric-label">Uptime</div>
                        </div>
                    </div>
                </div>
                <div class="agent-card-footer">
                    <button class="btn btn-outline" onclick="app.showDetails('${agent.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-outline" onclick="app.editAgent('${agent.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="app.deleteAgent('${agent.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    // Filter Agents
    filterAgents() {
        const searchQuery = document.getElementById('searchInput').value.toLowerCase();
        const filterType = document.getElementById('filterType').value;
        const filterStatus = document.getElementById('filterStatus').value;

        this.filteredAgents = this.agents.filter(agent => {
            const matchesSearch = agent.name.toLowerCase().includes(searchQuery) ||
                agent.description.toLowerCase().includes(searchQuery);
            const matchesType = filterType === 'all' || agent.type === filterType;
            const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
            return matchesSearch && matchesType && matchesStatus;
        });

        this.renderAgentsGrid();
        this.updateResultsCount();
    },

    updateResultsCount() {
        document.getElementById('resultsText').textContent = 
            `Showing ${this.filteredAgents.length} of ${this.agents.length} agents`;
    },

    // Agent CRUD Operations
    openQuickCreateModal() {
        this.editingAgent = null;
        document.getElementById('modalTitle').textContent = 'Create New Agent';
        document.getElementById('agentForm').reset();
        document.getElementById('agentFormModal').classList.add('active');
    },

    editAgent(agentId) {
        this.editingAgent = this.agents.find(a => a.id === agentId);
        document.getElementById('modalTitle').textContent = 'Edit Agent';
        
        // Populate form
        document.getElementById('agentName').value = this.editingAgent.name;
        document.getElementById('agentDescription').value = this.editingAgent.description;
        document.getElementById('agentType').value = this.editingAgent.type;
        document.getElementById('agentAvatar').value = this.editingAgent.avatar || '';
        document.getElementById('agentCapabilities').value = this.editingAgent.capabilities.join(', ');
        document.getElementById('agentModel').value = this.editingAgent.configuration.model;
        document.getElementById('agentPrompt').value = this.editingAgent.configuration.systemPrompt || '';
    // set status select to current value
    const statusEl = document.getElementById('agentStatus');
    if (statusEl) statusEl.value = this.editingAgent.status || 'active';
        
        document.getElementById('agentFormModal').classList.add('active');
    },

    closeFormModal() {
        document.getElementById('agentFormModal').classList.remove('active');
        this.editingAgent = null;
    },

    saveAgent(event) {
        event.preventDefault();
        
        const formData = {
            name: document.getElementById('agentName').value,
            description: document.getElementById('agentDescription').value,
            type: document.getElementById('agentType').value,
            avatar: document.getElementById('agentAvatar').value,
            capabilities: document.getElementById('agentCapabilities').value
                .split(',')
                .map(c => c.trim())
                .filter(c => c),
            configuration: {
                temperature: 0.7,
                maxTokens: 2048,
                model: document.getElementById('agentModel').value,
                systemPrompt: document.getElementById('agentPrompt').value,
            },
            // include status from the modal (if present)
            status: (document.getElementById('agentStatus') || {}).value || 'training'
        };

        if (this.editingAgent) {
            // Update existing agent
            const index = this.agents.findIndex(a => a.id === this.editingAgent.id);
            this.agents[index] = {
                ...this.agents[index],
                ...formData
            };
        } else {
            // Create new agent
            // ensure status is present (fallback to training)
            const finalStatus = formData.status || 'training';
            // start modal-created agents with zeroed metrics
            const newAgent = {
                id: Date.now().toString(),
                ...formData,
                status: finalStatus,
                metrics: { totalInteractions: 0, successRate: 0, avgResponseTime: 0, uptime: 100 },
                createdAt: new Date().toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                }),
                lastActive: 'Just now',
            };
            this.agents.unshift(newAgent);
        }

        this.saveAgents();
        this.closeFormModal();
        this.filteredAgents = [...this.agents];
        this.renderDashboard();
    },

    deleteAgent(agentId) {
        if (confirm('Are you sure you want to delete this agent?')) {
            this.agents = this.agents.filter(a => a.id !== agentId);
            this.filteredAgents = [...this.agents];
            this.saveAgents();
            this.renderDashboard();
        }
    },

    saveAgents() {
        try {
            localStorage.setItem('rsaf_agents', JSON.stringify(this.agents));
        } catch (e) {
            console.warn('Failed to save agents to localStorage', e);
        }
    },

    // Agent Details View
    renderAgentDetails() {
        if (!this.selectedAgent) return;

        const agent = this.selectedAgent;
        const html = `
            <div class="details-container">
                <div class="details-header">
                    <div class="details-hero">
                        ${agent.avatar ? 
                            `<img src="${agent.avatar}" alt="${agent.name}" class="details-avatar">` :
                            `<div class="details-avatar"><i class="fas fa-robot"></i></div>`
                        }
                        <div class="details-info">
                            <h2>${agent.name}</h2>
                            <div class="details-meta">
                                <span class="status-badge ${agent.status}">${agent.status}</span>
                                <span class="agent-type">${agent.type}</span>
                            </div>
                            <p>${agent.description}</p>
                            <div class="details-actions">
                                <button class="btn btn-primary" onclick="app.editAgent('${agent.id}')">
                                    <i class="fas fa-edit"></i> Edit Agent
                                </button>
                                <button class="btn btn-outline" onclick="app.openChat('${agent.id}')">
                                    <i class="fas fa-play"></i> Test Agent
                                </button>
                                <button class="btn btn-danger" onclick="app.deleteAgent('${agent.id}'); app.showDashboard();">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="details-body">
                    <div class="details-section">
                        <h3>Performance Metrics</h3>
                        <div class="analytics-grid">
                            <div class="stat-card">
                                <h3>Total Interactions</h3>
                                <div class="stat-value">${agent.metrics.totalInteractions.toLocaleString()}</div>
                            </div>
                            <div class="stat-card">
                                <h3>Success Rate</h3>
                                <div class="stat-value">${agent.metrics.successRate}%</div>
                            </div>
                            <div class="stat-card">
                                <h3>Avg Response Time</h3>
                                <div class="stat-value">${agent.metrics.avgResponseTime}ms</div>
                            </div>
                            <div class="stat-card">
                                <h3>Uptime</h3>
                                <div class="stat-value">${agent.metrics.uptime}%</div>
                            </div>
                        </div>
                    </div>
                    <div class="details-section">
                        <h3>Capabilities</h3>
                        <div class="capability-tags">
                            ${agent.capabilities.map(cap => 
                                `<span class="capability-tag">${cap}</span>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="details-section">
                        <h3>Configuration</h3>
                        <div class="config-grid">
                            <div class="config-item">
                                <div class="config-label">Model</div>
                                <div class="config-value">${agent.configuration.model}</div>
                            </div>
                            <div class="config-item">
                                <div class="config-label">Temperature</div>
                                <div class="config-value">${agent.configuration.temperature}</div>
                            </div>
                            <div class="config-item">
                                <div class="config-label">Max Tokens</div>
                                <div class="config-value">${agent.configuration.maxTokens}</div>
                            </div>
                            <div class="config-item">
                                <div class="config-label">Created</div>
                                <div class="config-value">${agent.createdAt}</div>
                            </div>
                            <div class="config-item">
                                <div class="config-label">Last Active</div>
                                <div class="config-value">${agent.lastActive}</div>
                            </div>
                        </div>
                        ${agent.configuration.systemPrompt ? `
                            <div style="margin-top: 1rem; padding: 1rem; background: #f9fafb; border-radius: 6px;">
                                <div class="config-label">System Prompt</div>
                                <p style="margin-top: 0.5rem; color: #374151;">${agent.configuration.systemPrompt}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        // Render tabs: Overview | Configuration | Capabilities | Activity
        const tabsHtml = `
            <div style="padding:1rem 2rem;">
                <div class="tabs">
                    <button class="tab active" data-tab="overview" onclick="app.switchDetailsTab(event)">Overview</button>
                    <button class="tab" data-tab="configuration" onclick="app.switchDetailsTab(event)">Configuration</button>
                    <button class="tab" data-tab="capabilities" onclick="app.switchDetailsTab(event)">Capabilities</button>
                    <button class="tab" data-tab="activity" onclick="app.switchDetailsTab(event)">Activity</button>
                </div>
                <div id="tabContent">${html}</div>
            </div>
        `;
        document.getElementById('agentDetails').innerHTML = tabsHtml;
    },

    switchDetailsTab(e) {
        const tab = e.currentTarget.getAttribute('data-tab');
        document.querySelectorAll('.tabs .tab').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const agent = this.selectedAgent;
        if (!agent) return;
        let content = '';
        if (tab === 'overview') {
            content = `
                <div class="details-body">
                    <h3>Overview</h3>
                    <p>${agent.description}</p>
                    <div class="analytics-grid" style="margin-top:1rem;">
                        <div class="stat-card"><h3>Interactions</h3><div class="stat-value">${agent.metrics.totalInteractions.toLocaleString()}</div></div>
                        <div class="stat-card"><h3>Success Rate</h3><div class="stat-value">${agent.metrics.successRate}%</div></div>
                        <div class="stat-card"><h3>Avg Response</h3><div class="stat-value">${agent.metrics.avgResponseTime}ms</div></div>
                        <div class="stat-card"><h3>Uptime</h3><div class="stat-value">${agent.metrics.uptime}%</div></div>
                    </div>
                </div>
            `;
        } else if (tab === 'configuration') {
            content = `
                <div class="details-body">
                    <h3>Configuration</h3>
                    <div class="config-grid">
                        <div class="config-item"><div class="config-label">Model</div><div class="config-value">${agent.configuration.model}</div></div>
                        <div class="config-item"><div class="config-label">Temperature</div><div class="config-value">${agent.configuration.temperature}</div></div>
                        <div class="config-item"><div class="config-label">Max Tokens</div><div class="config-value">${agent.configuration.maxTokens}</div></div>
                    </div>
                    ${agent.configuration.systemPrompt ? `<div style="margin-top:1rem; padding:1rem; background:#f8fafc; border-radius:6px;"><pre style="white-space:pre-wrap">${escapeHtml(agent.configuration.systemPrompt)}</pre></div>` : ''}
                </div>
            `;
        } else if (tab === 'capabilities') {
            content = `
                <div class="details-body">
                    <h3>Capabilities</h3>
                    <div class="capability-tags" style="margin-top:0.5rem;">${agent.capabilities.map(c=>`<span class="capability-tag">${escapeHtml(c)}</span>`).join('')}</div>
                </div>
            `;
        } else if (tab === 'activity') {
            const conv = this.conversations[agent.id] || [];
            content = `
                <div class="details-body">
                    <h3>Activity Log</h3>
                    <div style="display:flex; flex-direction:column; gap:0.5rem;">
                        ${conv.map(m=>`<div style="padding:0.5rem; background:#fff; border-radius:6px;"><strong>${m.sender}</strong>: ${escapeHtml(m.text)} <span style="color:#6b7280; font-size:0.8rem; margin-left:0.5rem;">${new Date(m.time).toLocaleString()}</span></div>`).join('')}
                    </div>
                </div>
            `;
        }
        document.getElementById('tabContent').innerHTML = content;
    },

    // Agent Builder View
    renderBuilder() {
        // Enhanced 6-step builder matching the wireframe
        const templates = [
            { id: 'tpl_blank', name: 'Start from Scratch', category: 'Custom', desc: 'Build an agent from scratch', caps: [] },
            { id: 'tpl_support', name: 'Customer Support Agent', category: 'Business', desc: 'Handles inquiries, resolves issues, and provides excellent customer service', caps: ['Customer Service','Product Knowledge','Ticket Management','Email Support'], model: 'GPT-4', temp: 0.6 },
            { id: 'tpl_data', name: 'Data Analysis Agent', category: 'Analytics', desc: 'Analyzes data, generates insights, and creates visualizations', caps: ['Data Analysis','Visualization','Statistical Modeling'], model: 'GPT-4', temp: 0.3 },
            { id: 'tpl_content', name: 'Content Creator Agent', category: 'Marketing', desc: 'Generates engaging content, marketing copy, and creative writing', caps: ['Content Writing','Copywriting','Social Media'], model: 'GPT-4', temp: 0.9 },
            { id: 'tpl_workflow', name: 'Workflow Automation Agent', category: 'Productivity', desc: 'Automates tasks, manages workflows, and streamlines processes', caps: ['Task Automation','Workflow Management','Integration'], model: 'GPT-3.5', temp: 0.5 },
            { id: 'tpl_tutor', name: 'Educational Tutor Agent', category: 'Education', desc: 'Provides personalized learning assistance and explanations', caps: ['Teaching','Explanations','Quiz Generation'], model: 'GPT-4', temp: 0.5 },
            { id: 'tpl_ecom', name: 'E-commerce Assistant', category: 'E-commerce', desc: 'Helps customers find products, process orders, and track shipments', caps: ['Product Search','Order Management','Recommendations'], model: 'GPT-4', temp: 0.6 },
            { id: 'tpl_med', name: 'Medical Information Agent', category: 'Healthcare', desc: 'Provides general medical information and health guidance', caps: ['Health Information','Symptom Assessment','Appointment Scheduling'], model: 'GPT-4', temp: 0.4 },
            { id: 'tpl_code', name: 'Code Review Agent', category: 'Development', desc: 'Reviews code, identifies bugs, and suggests improvements', caps: ['Code Review','Debugging','Documentation'], model: 'Claude-3', temp: 0.4 }
        ];

        const capabilityOptions = ['Text Generation','Question Answering','Sentiment Analysis','Language Translation','Code Generation','Data Analysis','Image Understanding','Email Support','Document Summarization','Web Search','API Integration','Task Scheduling','Customer Service','Product Knowledge','Ticket Management','Order Management','Appointment Scheduling'];

        const stepTitles = ['Template','Basic Info','Type & Personality','Capabilities','Configuration','Review'];

        const html = `
            <div class="details-container">
                <div class="details-header" style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
                    <div>
                        <h2>Create New Agent</h2>
                        <p>Follow the steps to build your custom AI agent</p>
                    </div>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <button class="btn btn-outline" onclick="app.showDashboard()">Back to Dashboard</button>
                    </div>
                </div>
                <div class="details-body">
                    <div class="builder-header" style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1rem;">
                        ${stepTitles.map((t,i)=>`<div class="step-pill ${i===0? 'active':''}" data-step="${i+1}">${t}</div>`).join('')}
                    </div>

                    <div class="builder-steps">
                        <!-- Step 1: Template -->
                        <div class="step" data-step="1">
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem;">
                                <div>
                                    <h3>Choose a Template</h3>
                                    <p style="margin-top:0.25rem; color:var(--muted);">Start with a pre-configured template or build from scratch</p>
                                </div>
                                <div>
                                    <button class="btn btn-outline" onclick="app.builderSelectTemplate('tpl_blank')">Start from Scratch</button>
                                </div>
                            </div>
                            <div class="tpl-grid" style="margin-top:0.75rem;">
                                ${templates.map(t=>`
                                    <div class="tpl-card" data-tpl="${t.id}" onclick="app.builderSelectTemplate('${t.id}')">
                                        <div class="tpl-card-top">
                                            <div class="tpl-icon"><i class="fas fa-robot"></i></div>
                                            ${t.popular?`<div class="tpl-popular">Popular</div>`:''}
                                        </div>
                                        <div class="tpl-card-body">
                                            <div class="tpl-title">${t.name}</div>
                                            <div class="tpl-category">${t.category || ''}</div>
                                            <div class="tpl-desc" style="color:var(--muted);">${t.desc}</div>
                                            ${t.caps?`<div class="tpl-caps" style="margin-top:0.6rem;">${t.caps.slice(0,3).map(c=>`<span class="capability-tag">${c}</span>`).join('')} ${t.caps.length>3?`<span class="capability-tag">+${t.caps.length-3}</span>`:''}</div>`:''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-top:1rem;">
                                <div><button class="btn btn-outline" onclick="app.showDashboard()">Back</button></div>
                                <div><button class="btn btn-primary" onclick="app.builderNext(1)">Next</button></div>
                            </div>
                        </div>

                        <!-- Step 2: Basic Info -->
                        <div class="step" data-step="2" style="display:none">
                            <h3>Basic Info</h3>
                            <div class="form-group"><label>Agent Name *</label><input id="builderName" type="text" placeholder="e.g., Customer Support Agent"></div>
                            <div class="form-group"><label>Description</label><textarea id="builderDescription" rows="3" placeholder="Short description"></textarea></div>
                            <div style="display:flex; justify-content:space-between; margin-top:1rem;"><button class="btn btn-outline" onclick="app.builderPrev(2)">Back</button><button class="btn btn-primary" onclick="app.builderNext(2)">Next</button></div>
                        </div>

                        <!-- Step 3: Type & Personality -->
                        <div class="step" data-step="3" style="display:none">
                            <h3>Agent Type & Personality</h3>
                            <p>Choose the type that best fits your agent's purpose</p>
                            <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-top:0.5rem;">
                                <div style="min-width:220px;">
                                    <h4>Conversational</h4>
                                    <div class="type-list">
                                        <button class="btn btn-outline" onclick="app.selectSubtype(this,'Customer Support')">Customer Support</button>
                                        <button class="btn btn-outline" onclick="app.selectSubtype(this,'Virtual Assistant')">Virtual Assistant</button>
                                        <button class="btn btn-outline" onclick="app.selectSubtype(this,'Chatbot')">Chatbot</button>
                                    </div>
                                </div>
                                <div style="min-width:220px;">
                                    <h4>Analytical</h4>
                                    <div class="type-list">
                                        <button class="btn btn-outline" onclick="app.selectSubtype(this,'Data Analyst')">Data Analyst</button>
                                        <button class="btn btn-outline" onclick="app.selectSubtype(this,'Research Assistant')">Research Assistant</button>
                                        <button class="btn btn-outline" onclick="app.selectSubtype(this,'Code Reviewer')">Code Reviewer</button>
                                    </div>
                                </div>
                                <div style="min-width:220px;">
                                    <h4>Creative</h4>
                                    <div class="type-list">
                                        <button class="btn btn-outline" onclick="app.selectSubtype(this,'Content Writer')">Content Writer</button>
                                        <button class="btn btn-outline" onclick="app.selectSubtype(this,'Marketing Copy')">Marketing Copy</button>
                                        <button class="btn btn-outline" onclick="app.selectSubtype(this,'Story Generator')">Story Generator</button>
                                    </div>
                                </div>
                                <div style="min-width:220px;">
                                    <h4>Automation</h4>
                                    <div class="type-list">
                                        <button class="btn btn-outline" onclick="app.selectSubtype(this,'Task Scheduler')">Task Scheduler</button>
                                        <button class="btn btn-outline" onclick="app.selectSubtype(this,'Workflow Manager')">Workflow Manager</button>
                                        <button class="btn btn-outline" onclick="app.selectSubtype(this,'Process Automator')">Process Automator</button>
                                    </div>
                                </div>
                            </div>
                            <input id="builderType" type="hidden" value="conversational">
                            <div style="margin-top:1rem;">
                                <label>Personality — adjust creativity & focus</label>
                                <div style="display:flex; gap:0.5rem; align-items:center; margin-top:0.5rem;"><input id="builderTemp" type="range" min="0" max="1" step="0.01" value="0.6" oninput="app.builderSetTemp(this.value)"><span id="tempVal">0.60</span></div>
                                <div id="personalityBar" class="personality-bar" style="margin-top:0.5rem;"><div class="personality-fill" style="width:60%"></div></div>
                                <div class="personality-profile" style="margin-top:0.75rem; display:flex; gap:1rem;">
                                    <div style="flex:1"><div class="config-label">Creativity</div><div id="traitCreativity">60%</div></div>
                                    <div style="flex:1"><div class="config-label">Focus</div><div id="traitFocus">40%</div></div>
                                </div>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-top:1rem;"><button class="btn btn-outline" onclick="app.builderPrev(3)">Back</button><button class="btn btn-primary" onclick="app.builderNext(3)">Next</button></div>
                        </div>

                        <!-- Step 4: Capabilities -->
                        <div class="step" data-step="4" style="display:none">
                            <h3>Agent Capabilities</h3>
                            <p>Select or add capabilities for your agent</p>
                            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.5rem;" id="capabilityChoices">
                                ${capabilityOptions.map(c=>`<button class="cap-choice" type="button">${c}</button>`).join('')}
                            </div>
                            <div style="margin-top:0.75rem; display:flex; gap:0.5rem;">
                                <input id="builderCapabilitiesInput" type="text" placeholder="Enter custom capability...">
                                <button class="btn btn-outline" onclick="app.addCustomCapability()">Add</button>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-top:1rem;"><button class="btn btn-outline" onclick="app.builderPrev(4)">Back</button><button class="btn btn-primary" onclick="app.builderNext(4)">Next</button></div>
                        </div>

                        <!-- Step 5: Configuration -->
                        <div class="step" data-step="5" style="display:none">
                            <h3>Model Configuration</h3>
                            <p>Fine-tune your agent's behavior and personality</p>
                                            <div class="form-group"><label>Model</label><select id="builderModel"><option value="">Select model...</option><option>GPT-4</option><option>GPT-3.5</option><option>Claude-3</option></select></div>
                                            <div class="form-group"><label>Max Tokens</label><input id="builderMaxTokens" type="number" value="2048"></div>
                                            <div class="form-group"><label>Status</label><select id="builderStatus"><option value="active">Active</option><option value="paused">Paused</option><option value="training">Training</option><option value="error">Error</option></select></div>
                            <div class="form-group"><label>System Prompt</label><textarea id="builderPrompt" rows="4" placeholder="Describe how the agent should behave"></textarea></div>
                            <div style="margin-top:0.5rem; background:#fff; padding:0.75rem; border-radius:6px;"><h4>Personality Profile</h4><p id="personalitySummary" style="color:var(--muted)">This agent balances creativity and focus.</p></div>
                            <div style="display:flex; justify-content:space-between; margin-top:1rem;"><button class="btn btn-outline" onclick="app.builderPrev(5)">Back</button><button class="btn btn-primary" onclick="app.builderNext(5)">Next</button></div>
                        </div>

                        <!-- Step 6: Review -->
                        <div class="step" data-step="6" style="display:none">
                            <h3>Review & Launch</h3>
                            <div id="builderReview" style="background:#fff; padding:1rem; border-radius:8px;"></div>
                            <div style="display:flex; justify-content:space-between; margin-top:0.75rem;"><button class="btn btn-outline" onclick="app.builderPrev(6)">Back</button><button class="btn btn-primary" onclick="app.builderFinish()">Launch Agent</button></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('builderContent').innerHTML = html;
        // initialize default personality bar and step state
        this.currentBuilderStep = 1;
        this.updateBuilderPills && this.updateBuilderPills();
        const tmpEl = document.getElementById('builderTemp');
        if (tmpEl) this.builderSetTemp(tmpEl.value);

        // Ensure interactive buttons work even if inline handlers fail: attach event listeners
        const container = document.getElementById('builderContent');
        if (container) {
            // template cards
            container.querySelectorAll('.tpl-card').forEach(card => {
                card.setAttribute('role','button');
                card.tabIndex = 0;
                card.addEventListener('click', () => this.builderSelectTemplate(card.getAttribute('data-tpl')));
                card.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.builderSelectTemplate(card.getAttribute('data-tpl')); });
            });

            // type/subtype buttons
            container.querySelectorAll('.type-list .btn').forEach(btn => {
                btn.setAttribute('role','button');
                btn.setAttribute('aria-pressed', 'false');
                btn.addEventListener('click', (e) => {
                    const subtype = btn.textContent.trim();
                    this.selectSubtype(btn, subtype);
                });
            });

            // capability choices
            container.querySelectorAll('.cap-choice').forEach(cap => {
                cap.setAttribute('role','button');
                cap.setAttribute('aria-pressed', cap.classList.contains('selected') ? 'true' : 'false');
                cap.addEventListener('click', () => {
                    this.builderToggleCapability(cap);
                    cap.setAttribute('aria-pressed', cap.classList.contains('selected') ? 'true' : 'false');
                });
            });

            // if a builderType is already set, mark the corresponding subtype active
            const currentType = (document.getElementById('builderType')||{}).value;
            if (currentType) {
                container.querySelectorAll('.type-list .btn').forEach(b => {
                    if (b.textContent.trim() === currentType) {
                        b.classList.add('active');
                        b.setAttribute('aria-pressed','true');
                    } else {
                        b.classList.remove('active');
                        b.setAttribute('aria-pressed','false');
                    }
                });
            }
        }
    },

    builderNext(current) {
        const next = current + 1;
        const currentEl = document.querySelector(`.step[data-step="${current}"]`);
        const nextEl = document.querySelector(`.step[data-step="${next}"]`);
        if (!nextEl) return;
        currentEl.style.display = 'none';
        nextEl.style.display = 'block';
        this.currentBuilderStep = next;
        this.updateBuilderPills();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // if moved to review step, populate review
        if (next === 6) this.populateBuilderReview();
    },

    builderPrev(current) {
        const prev = current - 1;
        const currentEl = document.querySelector(`.step[data-step="${current}"]`);
        const prevEl = document.querySelector(`.step[data-step="${prev}"]`);
        if (!prevEl) return;
        currentEl.style.display = 'none';
        prevEl.style.display = 'block';
        this.currentBuilderStep = prev;
        this.updateBuilderPills();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    updateBuilderPills() {
        const step = this.currentBuilderStep || 1;
        document.querySelectorAll('.step-pill').forEach(p => {
            const s = Number(p.getAttribute('data-step'));
            if (s === step) p.classList.add('active');
            else p.classList.remove('active');
        });
    },

    builderFinish() {
        // gather final values
        const name = document.getElementById('builderName') ? document.getElementById('builderName').value.trim() : '';
        if (!name) { alert('Please provide an agent name.'); return; }
        const description = document.getElementById('builderDescription').value.trim();
        // capabilities: toggle buttons + custom field
    const picked = Array.from(document.querySelectorAll('.cap-choice.selected')).map(b => b.textContent.trim());
    const custom = (document.getElementById('builderCapabilitiesInput') ? document.getElementById('builderCapabilitiesInput').value : '').split(',').map(s=>s.trim()).filter(Boolean);
    const capabilities = [...new Set([...picked, ...custom])];
    const model = document.getElementById('builderModel').value || '';
    const temperature = parseFloat(document.getElementById('builderTemp').value || 0.6);
    const maxTokens = parseInt((document.getElementById('builderMaxTokens')||{}).value || '2048', 10);
    const systemPrompt = document.getElementById('builderPrompt').value.trim();
    const type = document.getElementById('builderType').value || 'conversational';
    // read status selection from builder (fallback to 'active')
    const status = (document.getElementById('builderStatus') || {}).value || 'active';

    // start agents with zeroed metrics until real interactions occur
    const newAgent = {
        id: Date.now().toString(),
        name,
        description,
        type,
        status,
        avatar: '',
        capabilities,
        metrics: { totalInteractions: 0, successRate: 0, avgResponseTime: 0, uptime: 100 },
        configuration: { temperature, maxTokens, model, systemPrompt },
        createdAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        lastActive: 'Just now'
    };

        this.agents.unshift(newAgent);
        this.filteredAgents = [...this.agents];
        this.saveAgents();
        this.showDashboard();
        setTimeout(() => alert('Agent created — ready to test in Conversations.'), 100);
    },

    builderSelectTemplate(tplId) {
        // mapping from template ids to data
        const mapping = {
            // blank template intentionally leaves fields empty for "Start from Scratch"
            'tpl_blank': { name: '', description: '', capabilities: [], model: '', temp: 0.6, type: '', status: 'active' },
            'tpl_support': { name: 'Customer Support Agent', description: 'Handles inquiries, resolves issues, and provides excellent customer service', capabilities: ['Customer Service','Product Knowledge','Ticket Management','Email Support'], model: 'GPT-4', temp: 0.6, type: 'conversational', status: 'active' },
            'tpl_data': { name: 'Data Analysis Agent', description: 'Analyzes data, generates insights, and creates visualizations', capabilities: ['Data Analysis','Visualization','Statistical Modeling'], model: 'GPT-4', temp: 0.3, type: 'analytical' },
            'tpl_content': { name: 'Content Creator Agent', description: 'Generates engaging content, marketing copy, and creative writing', capabilities: ['Content Writing','Copywriting','Social Media'], model: 'GPT-4', temp: 0.9, type: 'creative' },
            'tpl_data': { name: 'Data Analysis Agent', description: 'Analyzes data, generates insights, and creates visualizations', capabilities: ['Data Analysis','Visualization','Statistical Modeling'], model: 'GPT-4', temp: 0.3, type: 'analytical', status: 'active' },
            'tpl_content': { name: 'Content Creator Agent', description: 'Generates engaging content, marketing copy, and creative writing', capabilities: ['Content Writing','Copywriting','Social Media'], model: 'GPT-4', temp: 0.9, type: 'creative', status: 'active' },
            'tpl_workflow': { name: 'Workflow Automation Agent', description: 'Automates tasks, manages workflows, and streamlines processes', capabilities: ['Task Automation','Workflow Management','Integration'], model: 'GPT-3.5', temp: 0.5, type: 'automation', status: 'active' },
            'tpl_tutor': { name: 'Educational Tutor Agent', description: 'Provides personalized learning assistance and explanations', capabilities: ['Teaching','Explanations','Quiz Generation'], model: 'GPT-4', temp: 0.5, type: 'conversational' },
            'tpl_ecom': { name: 'E-commerce Assistant', description: 'Helps customers find products, process orders, and track shipments', capabilities: ['Product Search','Order Management','Recommendations'], model: 'GPT-4', temp: 0.6, type: 'conversational' },
            'tpl_tutor': { name: 'Educational Tutor Agent', description: 'Provides personalized learning assistance and explanations', capabilities: ['Teaching','Explanations','Quiz Generation'], model: 'GPT-4', temp: 0.5, type: 'conversational', status: 'active' },
            'tpl_ecom': { name: 'E-commerce Assistant', description: 'Helps customers find products, process orders, and track shipments', capabilities: ['Product Search','Order Management','Recommendations'], model: 'GPT-4', temp: 0.6, type: 'conversational', status: 'active' },
            'tpl_med': { name: 'Medical Information Agent', description: 'Provides general medical information and health guidance', capabilities: ['Health Information','Symptom Assessment','Appointment Scheduling'], model: 'GPT-4', temp: 0.4, type: 'conversational', status: 'paused' },
            'tpl_code': { name: 'Code Review Agent', description: 'Reviews code, identifies bugs, and suggests improvements', capabilities: ['Code Review','Debugging','Documentation'], model: 'Claude-3', temp: 0.4, type: 'analytical', status: 'active' }
        };
        const tpl = mapping[tplId];
        if (!tpl) return;
        // remember selection in app state
        this.selectedTemplate = tplId;
        // update visual selected state on template cards
        document.querySelectorAll('.tpl-card').forEach(card => {
            if (card.getAttribute('data-tpl') === tplId) card.classList.add('selected');
            else card.classList.remove('selected');
        });
        // populate fields (use a tiny timeout so DOM is ready)
        setTimeout(()=>{
            document.getElementById('builderName').value = tpl.name || '';
            document.getElementById('builderDescription').value = tpl.description || '';
            const modelEl = document.getElementById('builderModel');
            if (modelEl) {
                if (tpl.model) modelEl.value = tpl.model;
                else modelEl.value = '';
            }
            if (document.getElementById('builderTemp')) document.getElementById('builderTemp').value = (typeof tpl.temp !== 'undefined') ? tpl.temp : 0.6;
            this.builderSetTemp((typeof tpl.temp !== 'undefined') ? tpl.temp : 0.6);
            if (tpl.type) document.getElementById('builderType').value = tpl.type;
            // select capabilities
            document.querySelectorAll('.cap-choice').forEach(b => {
                if (tpl.capabilities && tpl.capabilities.includes(b.textContent.trim())) b.classList.add('selected');
                else b.classList.remove('selected');
            });
            // clear custom input
            const customInput = document.getElementById('builderCapabilitiesInput');
            if (customInput) customInput.value = '';
            // set builder status if template provides one
            const bs = document.getElementById('builderStatus');
            if (bs) bs.value = tpl.status || 'active';
        }, 10);
    },

    addCustomCapability() {
        const input = document.getElementById('builderCapabilitiesInput');
        if (!input) return;
        const val = input.value.trim();
        if (!val) return;
        // create a new capability button and mark selected
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cap-choice selected';
        btn.textContent = val;
        btn.setAttribute('role', 'button');
        btn.setAttribute('aria-pressed', 'true');
        btn.addEventListener('click', () => {
            btn.classList.toggle('selected');
            btn.setAttribute('aria-pressed', btn.classList.contains('selected') ? 'true' : 'false');
        });
        const container = document.getElementById('capabilityChoices');
        if (container) container.appendChild(btn);
        input.value = '';
    },

    builderToggleCapability(el) {
        el.classList.toggle('selected');
    },

    selectSubtype(el, subtype) {
        // clear previous active in this group
        try {
            // find the parent .type-list and clear active
            let parent = el && el.parentElement;
            if (parent) {
                parent.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
                el.classList.add('active');
            } else {
                // fallback: remove active from all type-list buttons
                document.querySelectorAll('.type-list .btn').forEach(b => b.classList.remove('active'));
            }
        } catch (e) { /* ignore */ }
        // set hidden builder type
        const typeEl = document.getElementById('builderType');
        if (typeEl) typeEl.value = subtype;
    },

    builderSetTemp(val) {
        const pct = Math.round(Number(val) * 100);
        const fill = document.querySelector('#personalityBar .personality-fill');
        if (fill) fill.style.width = pct + '%';
        const tempVal = document.getElementById('tempVal');
        if (tempVal) tempVal.textContent = parseFloat(val).toFixed(2);
        // update personality traits shown in step 3 and configuration
        const creativityEl = document.getElementById('traitCreativity');
        const focusEl = document.getElementById('traitFocus');
        const summary = document.getElementById('personalitySummary');
        const creativity = Math.round(Number(val) * 100);
        const focus = 100 - creativity;
        if (creativityEl) creativityEl.textContent = creativity + '%';
        if (focusEl) focusEl.textContent = focus + '%';
        if (summary) summary.textContent = `Creativity ${creativity}% — Focus ${focus}%`;
    },

    populateBuilderReview() {
        const name = document.getElementById('builderName').value || '';
        const desc = document.getElementById('builderDescription').value || '';
        const picked = Array.from(document.querySelectorAll('.cap-choice.selected')).map(b => b.textContent.trim());
        const custom = (document.getElementById('builderCapabilitiesInput') ? document.getElementById('builderCapabilitiesInput').value : '').split(',').map(s=>s.trim()).filter(Boolean);
        const capabilities = [...new Set([...picked, ...custom])];
        const model = document.getElementById('builderModel').value || '';
        const temp = document.getElementById('builderTemp').value || '0.7';
        const maxTokens = document.getElementById('builderMaxTokens') ? document.getElementById('builderMaxTokens').value : '2048';
        const prompt = document.getElementById('builderPrompt').value || '';

        const html = `
            <div class="review-grid">
                <div class="review-card">
                    <h4>Basic Information</h4>
                    <div class="review-meta">
                        <div>
                            <div style="font-size:0.9rem; color:#6b7280;">Name:</div>
                            <div style="font-weight:700; margin-top:0.25rem;">${escapeHtml(name)}</div>
                            <div style="margin-top:0.5rem; color:#6b7280;">${escapeHtml(desc)}</div>
                        </div>
                        <div style="text-align:right">
                            <div style="font-size:0.85rem; color:#6b7280;">Type:</div>
                            <div style="margin-top:0.25rem;"><span class="agent-type">${escapeHtml(document.getElementById('builderType').value || '')}</span></div>
                        </div>
                    </div>
                </div>

                <div class="review-card">
                    <h4>Capabilities (${capabilities.length})</h4>
                    <div class="review-capabilities" style="margin-top:0.5rem;">
                        ${capabilities.map(c => `<span class="capability-tag">${escapeHtml(c)}</span>`).join('')}
                    </div>
                </div>

                <div class="review-card">
                    <h4>Configuration</h4>
                    <div style="display:flex; gap:2rem; margin-top:0.5rem;">
                        <div>
                            <div style="font-size:0.8rem; color:#6b7280">Model</div>
                            <div style="font-weight:600; margin-top:0.25rem;">${escapeHtml(model || '—')}</div>
                        </div>
                        <div>
                            <div style="font-size:0.8rem; color:#6b7280">Temperature</div>
                            <div style="font-weight:600; margin-top:0.25rem;">${parseFloat(temp).toFixed(2)}</div>
                        </div>
                        <div>
                            <div style="font-size:0.8rem; color:#6b7280">Max Tokens</div>
                            <div style="font-weight:600; margin-top:0.25rem;">${escapeHtml(String(maxTokens))}</div>
                        </div>
                    </div>
                </div>

                <div class="review-card">
                    <h4>System Prompt</h4>
                    <div class="review-system" style="margin-top:0.5rem;">${prompt ? escapeHtml(prompt) : '<span style="color:#6b7280">(No system prompt specified)</span>'}</div>
                </div>
            </div>
        `;
        const area = document.getElementById('builderReview');
        if (area) area.innerHTML = html;
    },

    // Conversation Interface
    renderConversation() {
        const activeAgents = this.agents.filter(a => a.status === 'active');

        // Conversation layout: left agent list, right chat area
        const html = `
            <div class="details-container">
                <div class="details-header">
                    <h2>Test Conversation Interface</h2>
                    <p>Chat with your active agents</p>
                    <button class="btn btn-outline" onclick="app.showDashboard()" style="margin-top: 1rem;">
                        <i class="fas fa-arrow-left"></i> Back to Dashboard
                    </button>
                </div>
                <div class="details-body" style="display:flex; gap:1rem; flex-wrap:wrap;">
                    <div style="flex: 1 1 260px; max-width: 300px;">
                        <div style="padding:1rem;">
                            <h4>Active Agents</h4>
                            <div style="display:flex; flex-direction:column; gap:0.75rem; margin-top:0.75rem;">
                                ${activeAgents.map(agent => `
                                    <button class="btn btn-outline" style="text-align:left;" onclick="app.startChatWithAgent('${agent.id}')">
                                        <div style="display:flex; gap:0.75rem; align-items:center;">
                                            ${agent.avatar ? `<img src="${agent.avatar}" alt="${agent.name}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;">` : `<div style="width:40px;height:40px;border-radius:6px;background:#e5e7eb;display:flex;align-items:center;justify-content:center;"><i class='fas fa-robot'></i></div>`}
                                            <div>
                                                <div style="font-weight:600">${agent.name}</div>
                                                <div style="font-size:0.85rem;color:#6b7280">${agent.type} • ${agent.status}</div>
                                            </div>
                                        </div>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div style="flex: 2 1 560px; min-width:320px;">
                        <div id="chatArea">
                            <div style="text-align:center; padding:3rem; color:#6b7280;">
                                <i class="fas fa-comments" style="font-size:4rem; color:#2563eb; margin-bottom:1rem;"></i>
                                <h3>Select an agent to start chatting</h3>
                                <p style="margin-top:0.5rem;">Agent conversations are simulated locally for testing purposes.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('conversationContent').innerHTML = html;
    },

    // Start a simple local conversation session with an agent
    startChatWithAgent(agentId) {
        const agent = this.agents.find(a => a.id === agentId);
        if (!agent) return;
        this.selectedAgent = agent;
        if (!this.conversations[agentId]) this.conversations[agentId] = [];

        const chatHtml = `
            <div style="display:flex; flex-direction:column; height:600px; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; background:white;">
                <div style="padding:1rem; border-bottom:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; gap:0.75rem; align-items:center;">
                        ${agent.avatar ? `<img src="${agent.avatar}" alt="${agent.name}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;">` : `<div style="width:48px;height:48px;border-radius:8px;background:#e5e7eb;display:flex;align-items:center;justify-content:center;"><i class='fas fa-robot'></i></div>`}
                        <div>
                            <div style="font-weight:700">${agent.name}</div>
                            <div style="font-size:0.85rem;color:#6b7280">${agent.type} • ${agent.status}</div>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-outline" onclick="app.showConversation()">Back</button>
                    </div>
                </div>
                <div id="messagesContainer" style="flex:1; padding:1rem; overflow:auto; display:flex; flex-direction:column; gap:0.75rem; background:#f8fafc;"></div>
                <form id="chatForm" style="display:flex; gap:0.5rem; padding:0.75rem; border-top:1px solid #e5e7eb; background:white;" onsubmit="app.handleChatSend(event, '${agentId}')">
                    <input id="chatInput" type="text" placeholder="Write a message" style="flex:1; padding:0.5rem; border:1px solid #d1d5db; border-radius:6px;">
                    <button class="btn btn-primary" type="submit">Send</button>
                </form>
            </div>
        `;

        document.getElementById('chatArea').innerHTML = chatHtml;
        this.renderMessages(agentId);
        // focus input
        const input = document.getElementById('chatInput');
        if (input) input.focus();
    },

    handleChatSend(evt, agentId) {
        evt.preventDefault();
        const input = document.getElementById('chatInput');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;
        // append user message
        if (!this.conversations[agentId]) this.conversations[agentId] = [];
        this.conversations[agentId].push({ id: Date.now().toString(), sender: 'user', text, time: new Date().toISOString(), feedback: null });
        this.renderMessages(agentId);
        input.value = '';

        // simulate agent response
        const agent = this.agents.find(a => a.id === agentId);
        // show typing indicator
        this.conversations[agentId].push({ id: 'typing', sender: 'agent', typing: true });
        this.renderMessages(agentId);
        setTimeout(() => {
            // remove typing
            this.conversations[agentId] = this.conversations[agentId].filter(m => m.id !== 'typing');
            const reply = this.generateAgentReply(agent, text);
            const replyMsg = { id: Date.now().toString(), sender: 'agent', text: reply, time: new Date().toISOString(), feedback: null };
            this.conversations[agentId].push(replyMsg);
            this.saveConversations();
            this.renderMessages(agentId);

            // update metrics based on this interaction (zero-first -> update when chats happen)
            try {
                const prevCount = (agent.metrics && agent.metrics.totalInteractions) ? agent.metrics.totalInteractions : 0;
                const newCount = prevCount + 1;
                // find the last user message time prior to this reply
                const lastUser = Array.from(this.conversations[agentId]).reverse().find(m => m.sender === 'user' && m.time);
                let respMs = 0;
                if (lastUser && lastUser.time) {
                    respMs = new Date(replyMsg.time).getTime() - new Date(lastUser.time).getTime();
                }
                const prevAvg = (agent.metrics && agent.metrics.avgResponseTime) ? agent.metrics.avgResponseTime : 0;
                const newAvg = prevCount === 0 ? respMs : Math.round((prevAvg * prevCount + respMs) / newCount);

                agent.metrics = agent.metrics || { totalInteractions: 0, successRate: 0, avgResponseTime: 0, uptime: 100 };
                agent.metrics.totalInteractions = newCount;
                agent.metrics.avgResponseTime = newAvg;
                // leave successRate unchanged until user feedback is provided
                agent.lastActive = 'Just now';
                this.saveAgents();
            } catch (e) {
                console.warn('Failed to update metrics', e);
            }

            this.renderAnalytics();
            this.renderAgentsGrid();
        }, 700 + Math.random() * 1400);
    },

    renderMessages(agentId) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;
        const messages = this.conversations[agentId] || [];
        container.innerHTML = messages.map(m => `
            <div style="display:flex; ${m.sender === 'user' ? 'justify-content:flex-end' : 'justify-content:flex-start'};">
                <div style="max-width:75%; padding:0.5rem 0.75rem; border-radius:8px; background:${m.sender === 'user' ? '#2563eb' : '#fff'}; color:${m.sender === 'user' ? '#fff' : '#111'}; box-shadow:0 1px 2px rgba(0,0,0,0.04);">
                    ${m.typing ? `<div class="typing-indicator"><span></span><span></span><span></span></div>` : `<div style="font-size:0.95rem;">${escapeHtml(m.text || '')}</div>`}
                    ${m.time ? `<div style="font-size:0.7rem; color: ${m.sender === 'user' ? 'rgba(255,255,255,0.75)' : '#6b7280'}; margin-top:0.25rem; text-align:${m.sender === 'user' ? 'right' : 'left'};">${new Date(m.time).toLocaleTimeString()}</div>`: ''}
                    ${m.sender === 'agent' && !m.typing ? `<div style="display:flex; gap:0.25rem; margin-top:0.5rem; justify-content:${m.sender==='user'?'flex-end':'flex-start'};"><button class="btn btn-outline" onclick="app.copyMessage('${agentId}','${m.id}')">Copy</button><button class="btn btn-outline" onclick="app.feedbackMessage('${agentId}','${m.id}','like')">👍</button><button class="btn btn-outline" onclick="app.feedbackMessage('${agentId}','${m.id}','dislike')">👎</button></div>` : ''}
                </div>
            </div>
        `).join('');
        container.scrollTop = container.scrollHeight;
    },

    generateAgentReply(agent, userMessage) {
        // Simple canned/simulated responses — safe local simulation
        const lowers = userMessage.toLowerCase();
        if (lowers.includes('help') || lowers.includes('support')) return 'I can help — tell me more about the issue.';
        if (lowers.includes('price') || lowers.includes('cost')) return 'Pricing varies — can you tell me which product or plan you mean?';
        if (lowers.includes('how') || lowers.includes('what')) return 'Here is a step-by-step suggestion: 1) Clarify the requirement; 2) Gather data; 3) Propose a short solution.';
        // generic friendly reply
        return `Thanks — I received: "${userMessage}". I can take that and provide a concise answer or next steps.`;
    },

    // message feedback (like/dislike) and copy
    feedbackMessage(agentId, messageId, action) {
        const conv = this.conversations[agentId] || [];
        const msg = conv.find(m => m.id === messageId);
        if (!msg) return;
        msg.feedback = action;
        this.saveConversations();
        // update agent success rate based on feedback on agent messages
        try {
            const agent = this.agents.find(a => a.id === agentId);
            if (agent) {
                // consider only agent messages that have feedback
                const agentReplies = conv.filter(m => m.sender === 'agent' && m.feedback != null);
                const liked = agentReplies.filter(r => r.feedback === 'like').length;
                const totalWithFeedback = agentReplies.length;
                if (totalWithFeedback > 0) {
                    agent.metrics = agent.metrics || { totalInteractions: 0, successRate: 0, avgResponseTime: 0, uptime: 100 };
                    agent.metrics.successRate = Math.round((liked / totalWithFeedback) * 100);
                    this.saveAgents();
                    this.renderAnalytics();
                    this.renderAgentsGrid();
                }
            }
        } catch (e) {
            console.warn('Failed to update success rate', e);
        }
        this.renderMessages(agentId);
    },

    copyMessage(agentId, messageId) {
        const conv = this.conversations[agentId] || [];
        const msg = conv.find(m => m.id === messageId);
        if (!msg) return;
        if (navigator.clipboard) navigator.clipboard.writeText(msg.text || '');
    },

    saveConversations() {
        try { localStorage.setItem('rsaf_conversations', JSON.stringify(this.conversations)); } catch(e){console.warn('save conv failed', e)}
    },
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});