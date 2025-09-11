// Enhanced Task Management System JavaScript

// Global variables
let tasks = [];
let currentView = 'dashboard';
let editingTaskId = null;
let socket = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadTasks();
    setupEventListeners();
    updateStats();
    setupSocketConnection();
    loadRecentActivity();
}

// Socket connection setup
function setupSocketConnection() {
    try {
        socket = io();
        
        socket.on('connect', function() {
            updateConnectionStatus(true);
        });
        
        socket.on('disconnect', function() {
            updateConnectionStatus(false);
        });
        
        socket.on('taskUpdated', function(data) {
            handleTaskUpdate(data);
        });
        
        socket.on('taskCreated', function(data) {
            handleTaskCreated(data);
        });
        
        socket.on('taskDeleted', function(data) {
            handleTaskDeleted(data);
        });
    } catch (error) {
        console.log('Socket.io not available, running in offline mode');
    }
}

// Navigation and view management
function showView(viewName) {
    // Hide all views
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.remove('active'));
    
    // Show selected view
    document.getElementById(viewName).classList.add('active');
    
    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard Overview',
        'tasks': 'Task Management',
        'projects': 'Project Board',
        'analytics': 'Analytics Dashboard'
    };
    document.getElementById('pageTitle').textContent = titles[viewName];
    
    currentView = viewName;
    
    // Load view-specific data
    if (viewName === 'dashboard') {
        updateStats();
        loadRecentActivity();
    } else if (viewName === 'tasks') {
        renderTasks();
    } else if (viewName === 'projects') {
        renderKanbanBoard();
    }
}

// Task management functions
function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    } else {
        // Initialize with sample tasks
        tasks = [
            {
                id: 1,
                title: 'Complete project documentation',
                description: 'Write comprehensive documentation for the enhanced task management system',
                status: 'in_progress',
                priority: 'high',
                assignedTo: 'John Doe',
                dueDate: '2024-01-15',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                title: 'Design new dashboard',
                description: 'Create mockups for the new analytics dashboard',
                status: 'pending',
                priority: 'medium',
                assignedTo: 'Jane Smith',
                dueDate: '2024-01-20',
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                title: 'Fix responsive issues',
                description: 'Address mobile responsiveness issues on the task board',
                status: 'completed',
                priority: 'low',
                assignedTo: 'Mike Johnson',
                dueDate: '2024-01-10',
                createdAt: new Date().toISOString()
            }
        ];
        saveTasks();
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function createTask(taskData) {
    const newTask = {
        id: Date.now(),
        ...taskData,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    saveTasks();
    
    if (socket) {
        socket.emit('taskCreated', newTask);
    }
    
    addActivity('Task created', taskData.title);
    updateStats();
    renderTasks();
    renderKanbanBoard();
    
    return newTask;
}

function updateTask(id, updatedData) {
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...updatedData };
        saveTasks();
        
        if (socket) {
            socket.emit('taskUpdated', tasks[taskIndex]);
        }
        
        addActivity('Task updated', tasks[taskIndex].title);
        updateStats();
        renderTasks();
        renderKanbanBoard();
    }
}

function deleteTask(id) {
    const task = tasks.find(t => t.id === id);
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    
    if (socket) {
        socket.emit('taskDeleted', { id });
    }
    
    if (task) {
        addActivity('Task deleted', task.title);
    }
    
    updateStats();
    renderTasks();
    renderKanbanBoard();
}

// Form handling
function setupEventListeners() {
    // Task form submission
    document.getElementById('taskForm').addEventListener('submit', handleTaskFormSubmit);
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });
    
    // Quick actions
    document.querySelectorAll('.quick-action').forEach(action => {
        action.addEventListener('click', handleQuickAction);
    });
}

function handleTaskFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const taskData = {
        title: formData.get('title'),
        description: formData.get('description'),
        status: formData.get('status'),
        priority: formData.get('priority'),
        assignedTo: formData.get('assignedTo'),
        dueDate: formData.get('dueDate')
    };
    
    if (editingTaskId) {
        updateTask(editingTaskId, taskData);
        editingTaskId = null;
        document.getElementById('formTitle').textContent = 'Create New Task';
        document.querySelector('button[type="submit"]').textContent = 'Create Task';
    } else {
        createTask(taskData);
    }
    
    e.target.reset();
    showNotification('Task saved successfully!', 'success');
}

function handleFilterClick(e) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    const filter = e.target.dataset.filter;
    renderTasks(filter);
}

function handleQuickAction(e) {
    const action = e.currentTarget.querySelector('h3').textContent.toLowerCase();
    
    switch(action) {
        case 'create task':
            showView('tasks');
            break;
        case 'project board':
            showView('projects');
            break;
        case 'view analytics':
            showView('analytics');
            break;
    }
}

// Rendering functions
function renderTasks(filter = 'all') {
    const tasksContainer = document.getElementById('tasksList');
    if (!tasksContainer) return;
    
    let filteredTasks = tasks;
    if (filter !== 'all') {
        filteredTasks = tasks.filter(task => task.status === filter);
    }
    
    tasksContainer.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        tasksContainer.innerHTML = '<p style="text-align: center; color: #6b7280;">No tasks found</p>';
        return;
    }
    
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksContainer.appendChild(taskElement);
    });
}

function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-card';
    taskDiv.innerHTML = `
        <div class="task-header">
            <h3 class="task-title">${task.title}</h3>
            <div class="task-actions">
                <button class="btn btn-small" onclick="editTask(${task.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
        <div class="task-meta">
            <span class="task-badge status-${task.status}">${task.status.replace('_', ' ')}</span>
            <span class="task-badge priority-${task.priority}">${task.priority}</span>
        </div>
        <p class="task-description">${task.description}</p>
        <div class="task-footer">
            <div class="assigned-user">
                <div class="user-avatar">${task.assignedTo.charAt(0)}</div>
                <span>${task.assignedTo}</span>
            </div>
            <span>Due: ${new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
    `;
    return taskDiv;
}

function renderKanbanBoard() {
    const columns = {
        pending: document.getElementById('pendingTasks'),
        in_progress: document.getElementById('inProgressTasks'),
        completed: document.getElementById('completedTasks')
    };
    
    // Clear all columns
    Object.values(columns).forEach(column => {
        if (column) column.innerHTML = '';
    });
    
    // Populate columns
    tasks.forEach(task => {
        const taskElement = createKanbanTaskElement(task);
        if (columns[task.status]) {
            columns[task.status].appendChild(taskElement);
        }
    });
    
    // Update task counts
    updateKanbanCounts();
}

function createKanbanTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'kanban-task';
    taskDiv.draggable = true;
    taskDiv.dataset.taskId = task.id;
    
    taskDiv.innerHTML = `
        <h4>${task.title}</h4>
        <p>${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}</p>
        <div style="margin-top: 0.5rem;">
            <span class="task-badge priority-${task.priority}">${task.priority}</span>
            <small style="color: #6b7280;">${task.assignedTo}</small>
        </div>
    `;
    
    // Add drag and drop functionality
    taskDiv.addEventListener('dragstart', handleDragStart);
    taskDiv.addEventListener('dragend', handleDragEnd);
    
    return taskDiv;
}

// Drag and drop functionality
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function allowDrop(e) {
    e.preventDefault();
}

function handleDrop(e, newStatus) {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('text/plain'));
    const task = tasks.find(t => t.id === taskId);
    
    if (task && task.status !== newStatus) {
        updateTask(taskId, { status: newStatus });
    }
}

// Statistics
function updateStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;
    document.getElementById('inProgressTasks').textContent = inProgressTasks;
}

function updateKanbanCounts() {
    const pendingCount = tasks.filter(t => t.status === 'pending').length;
    const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    
    const pendingBadge = document.querySelector('#pendingColumn .task-count');
    const inProgressBadge = document.querySelector('#inProgressColumn .task-count');
    const completedBadge = document.querySelector('#completedColumn .task-count');
    
    if (pendingBadge) pendingBadge.textContent = pendingCount;
    if (inProgressBadge) inProgressBadge.textContent = inProgressCount;
    if (completedBadge) completedBadge.textContent = completedCount;
}

// Task editing
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    editingTaskId = id;
    document.getElementById('formTitle').textContent = 'Edit Task';
    document.querySelector('button[type="submit"]').textContent = 'Update Task';
    
    // Fill form with task data
    document.getElementById('title').value = task.title;
    document.getElementById('description').value = task.description;
    document.getElementById('status').value = task.status;
    document.getElementById('priority').value = task.priority;
    document.getElementById('assignedTo').value = task.assignedTo;
    document.getElementById('dueDate').value = task.dueDate;
    
    showView('tasks');
}

// Activity tracking
function addActivity(action, taskTitle) {
    const activity = {
        action,
        taskTitle,
        timestamp: new Date().toISOString()
    };
    
    let activities = JSON.parse(localStorage.getItem('activities') || '[]');
    activities.unshift(activity);
    activities = activities.slice(0, 10); // Keep only last 10 activities
    localStorage.setItem('activities', JSON.stringify(activities));
    
    loadRecentActivity();
}

function loadRecentActivity() {
    const activities = JSON.parse(localStorage.getItem('activities') || '[]');
    const activityList = document.getElementById('activityList');
    
    if (!activityList) return;
    
    activityList.innerHTML = '';
    
    if (activities.length === 0) {
        activityList.innerHTML = '<p style="text-align: center; color: #6b7280;">No recent activity</p>';
        return;
    }
    
    activities.forEach(activity => {
        const activityItem = createActivityElement(activity);
        activityList.appendChild(activityItem);
    });
}

function createActivityElement(activity) {
    const div = document.createElement('div');
    div.className = 'activity-item';
    
    const timeAgo = getTimeAgo(new Date(activity.timestamp));
    
    div.innerHTML = `
        <div class="activity-icon">
            <i class="fas fa-tasks"></i>
        </div>
        <div class="activity-content">
            <div class="activity-text">${activity.action}: ${activity.taskTitle}</div>
            <div class="activity-time">${timeAgo}</div>
        </div>
    `;
    
    return div;
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }
    
    return 'just now';
}

// Utility functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

// Connection status
function updateConnectionStatus(connected) {
    const statusDot = document.getElementById('statusDot');
    const connectionText = document.getElementById('connectionText');
    
    if (statusDot && connectionText) {
        statusDot.style.background = connected ? '#10b981' : '#ef4444';
        connectionText.textContent = connected ? 'Connected' : 'Offline';
    }
}

// Handle socket events
function handleTaskUpdate(data) {
    const taskIndex = tasks.findIndex(t => t.id === data.id);
    if (taskIndex !== -1) {
        tasks[taskIndex] = data;
        saveTasks();
        updateStats();
        renderTasks();
        renderKanbanBoard();
    }
}

function handleTaskCreated(data) {
    tasks.push(data);
    saveTasks();
    updateStats();
    renderTasks();
    renderKanbanBoard();
}

function handleTaskDeleted(data) {
    tasks = tasks.filter(t => t.id !== data.id);
    saveTasks();
    updateStats();
    renderTasks();
    renderKanbanBoard();
}

// Initialize drag and drop for kanban board
function initializeKanbanDragDrop() {
    const columns = document.querySelectorAll('.kanban-column');
    
    columns.forEach(column => {
        column.addEventListener('dragover', allowDrop);
        column.addEventListener('drop', (e) => {
            const status = column.id.replace('Column', '').toLowerCase();
            handleDrop(e, status);
        });
    });
}

// Export functions for global access
window.showView = showView;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.toggleSidebar = toggleSidebar;
