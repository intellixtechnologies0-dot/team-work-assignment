// Global variables
let teamMembers = JSON.parse(localStorage.getItem('teamMembers')) || [];
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    renderTeamMembers();
    renderTasks();
});

function initializeApp() {
    // Set minimum date for due date input to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('taskDueDate').min = today;
}

function setupEventListeners() {
    // Form submissions
    document.getElementById('memberForm').addEventListener('submit', handleAddMember);
    document.getElementById('taskForm').addEventListener('submit', handleAddTask);
    
    // Modal close events
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    if (modalId === 'taskModal') {
        updateAssigneeOptions();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.getElementById(modalId).querySelector('form').reset();
}

// Team Member functions
function handleAddMember(event) {
    event.preventDefault();
    
    const name = document.getElementById('memberName').value.trim();
    const email = document.getElementById('memberEmail').value.trim();
    const role = document.getElementById('memberRole').value.trim();
    
    if (!name || !email || !role) {
        alert('Please fill in all fields');
        return;
    }
    
    const newMember = {
        id: Date.now().toString(),
        name: name,
        email: email,
        role: role,
        createdAt: new Date().toISOString()
    };
    
    teamMembers.push(newMember);
    saveTeamMembers();
    renderTeamMembers();
    closeModal('memberModal');
    
    showNotification('Team member added successfully!', 'success');
}

function deleteMember(memberId) {
    if (confirm('Are you sure you want to delete this team member?')) {
        // Remove member from team
        teamMembers = teamMembers.filter(member => member.id !== memberId);
        
        // Reassign tasks to unassigned
        tasks = tasks.map(task => {
            if (task.assigneeId === memberId) {
                return { ...task, assigneeId: null, assigneeName: 'Unassigned' };
            }
            return task;
        });
        
        saveTeamMembers();
        saveTasks();
        renderTeamMembers();
        renderTasks();
        
        showNotification('Team member deleted successfully!', 'success');
    }
}

function renderTeamMembers() {
    const membersGrid = document.getElementById('membersGrid');
    
    if (teamMembers.length === 0) {
        membersGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-friends"></i>
                <p>No team members yet. Add your first team member to get started!</p>
            </div>
        `;
        return;
    }
    
    membersGrid.innerHTML = teamMembers.map(member => `
        <div class="member-card">
            <div class="member-info">
                <h3>${member.name}</h3>
                <p><i class="fas fa-envelope"></i> ${member.email}</p>
                <p><i class="fas fa-briefcase"></i> ${member.role}</p>
            </div>
            <div class="member-actions">
                <button class="btn btn-small btn-danger" onclick="deleteMember('${member.id}')">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        </div>
    `).join('');
}

// Task functions
function handleAddTask(event) {
    event.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const assigneeId = document.getElementById('taskAssignee').value;
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;
    
    if (!title || !description || !assigneeId || !priority || !dueDate) {
        alert('Please fill in all fields');
        return;
    }
    
    const assignee = teamMembers.find(member => member.id === assigneeId);
    
    const newTask = {
        id: Date.now().toString(),
        title: title,
        description: description,
        assigneeId: assigneeId,
        assigneeName: assignee ? assignee.name : 'Unassigned',
        priority: priority,
        dueDate: dueDate,
        status: 'todo',
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    closeModal('taskModal');
    
    showNotification('Task created successfully!', 'success');
}

function updateTaskStatus(taskId, newStatus) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = newStatus;
        saveTasks();
        renderTasks();
        showNotification('Task status updated!', 'success');
    }
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        showNotification('Task deleted successfully!', 'success');
    }
}

function renderTasks() {
    const todoTasks = tasks.filter(task => task.status === 'todo');
    const inProgressTasks = tasks.filter(task => task.status === 'inProgress');
    const completedTasks = tasks.filter(task => task.status === 'completed');
    
    renderTaskColumn('todoTasks', todoTasks);
    renderTaskColumn('inProgressTasks', inProgressTasks);
    renderTaskColumn('completedTasks', completedTasks);
    
    setupDragAndDrop();
}

function renderTaskColumn(columnId, taskList) {
    const column = document.getElementById(columnId);
    
    if (taskList.length === 0) {
        column.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No tasks here</p>
            </div>
        `;
        return;
    }
    
    column.innerHTML = taskList.map(task => `
        <div class="task-card ${task.priority}-priority" draggable="true" data-task-id="${task.id}">
            <div class="task-header">
                <div class="task-title">${task.title}</div>
                <div class="task-priority priority-${task.priority}">${task.priority}</div>
            </div>
            <div class="task-description">${task.description}</div>
            <div class="task-meta">
                <span class="task-assignee">${task.assigneeName}</span>
                <span class="task-due-date">${formatDate(task.dueDate)}</span>
            </div>
            <div class="task-actions">
                ${task.status !== 'completed' ? `
                    <button class="btn btn-small btn-primary" onclick="moveTask('${task.id}', '${getNextStatus(task.status)}')">
                        ${getNextStatusButtonText(task.status)}
                    </button>
                ` : ''}
                <button class="btn btn-small btn-danger" onclick="deleteTask('${task.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function moveTask(taskId, newStatus) {
    updateTaskStatus(taskId, newStatus);
}

function getNextStatus(currentStatus) {
    const statusFlow = {
        'todo': 'inProgress',
        'inProgress': 'completed',
        'completed': 'completed'
    };
    return statusFlow[currentStatus] || 'todo';
}

function getNextStatusButtonText(currentStatus) {
    const buttonTexts = {
        'todo': 'Start',
        'inProgress': 'Complete',
        'completed': 'Completed'
    };
    return buttonTexts[currentStatus] || 'Start';
}

function updateAssigneeOptions() {
    const assigneeSelect = document.getElementById('taskAssignee');
    assigneeSelect.innerHTML = '<option value="">Select a team member</option>';
    
    teamMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        assigneeSelect.appendChild(option);
    });
}

// Drag and Drop functionality
function setupDragAndDrop() {
    const taskCards = document.querySelectorAll('.task-card');
    const taskLists = document.querySelectorAll('.task-list');
    
    taskCards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });
    
    taskLists.forEach(list => {
        list.addEventListener('dragover', handleDragOver);
        list.addEventListener('drop', handleDrop);
        list.addEventListener('dragenter', handleDragEnter);
        list.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDragEnter(e) {
    e.preventDefault();
    e.target.closest('.task-list').classList.add('drag-over');
}

function handleDragLeave(e) {
    if (!e.target.closest('.task-list').contains(e.relatedTarget)) {
        e.target.closest('.task-list').classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const taskList = e.target.closest('.task-list');
    taskList.classList.remove('drag-over');
    
    const taskId = e.dataTransfer.getData('text/plain');
    const newStatus = getStatusFromColumn(taskList.id);
    
    if (newStatus) {
        updateTaskStatus(taskId, newStatus);
    }
}

function getStatusFromColumn(columnId) {
    const statusMap = {
        'todoTasks': 'todo',
        'inProgressTasks': 'inProgress',
        'completedTasks': 'completed'
    };
    return statusMap[columnId];
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString();
    }
}

function saveTeamMembers() {
    localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : '#4299e1'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Export functions for global access
window.openModal = openModal;
window.closeModal = closeModal;
window.deleteMember = deleteMember;
window.deleteTask = deleteTask;
window.moveTask = moveTask; 