// Supabase Configuration
const SUPABASE_URL = 'https://cneoifzzhyvfpxvhsxgp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuZW9pZnp6aHl2ZnB4dmhzeGdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTU4MjksImV4cCI6MjA2OTk3MTgyOX0.oI7M_AqPADdAU_gdtn6r20zyotZQ2N1caiQkCmZXC_I';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variables
let currentUser = null;
let teamMembers = [];
let tasks = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

function initializeApp() {
    // Set minimum date for due date input to today
    const today = new Date().toISOString().split('T')[0];
    const taskDueDateInput = document.getElementById('taskDueDate');
    if (taskDueDateInput) {
        taskDueDateInput.min = today;
    }
}

function setupEventListeners() {
    // Authentication forms
    document.getElementById('signinForm').addEventListener('submit', handleSignIn);
    
    // App forms
    document.getElementById('memberForm').addEventListener('submit', handleAddMember);
    document.getElementById('taskForm').addEventListener('submit', handleAddTask);
    
    // Modal close events
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Authentication Functions
async function checkAuthStatus() {
    try {
        console.log('Checking auth status...');
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (user && !error) {
            console.log('User is logged in:', user.email);
            currentUser = user;
            showMainApp();
            await loadUserProfile();
            await loadTeamMembers();
            await loadTasks();
        } else {
            console.log('No user found, showing login screen');
            showLoginScreen();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        showLoginScreen();
    }
}

async function handleSignIn(event) {
    event.preventDefault();
    
    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value.trim();
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        showMainApp();
        await loadUserProfile();
        await loadTeamMembers();
        await loadTasks();
        
        showNotification('Successfully signed in!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}



async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        teamMembers = [];
        tasks = [];
        showLoginScreen();
        showNotification('Successfully signed out!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function loadUserProfile() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('userName').textContent = `Welcome, ${data.name}!`;
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// UI Functions
function showLoginScreen() {
    console.log('Showing login screen...');
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
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
async function handleAddMember(event) {
    event.preventDefault();
    
    const name = document.getElementById('memberName').value.trim();
    const email = document.getElementById('memberEmail').value.trim();
    const role = document.getElementById('memberRole').value.trim();
    
    if (!name || !email || !role) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('team_members')
            .insert([
                {
                    name: name,
                    email: email,
                    role: role,
                    created_by: currentUser.id
                }
            ])
            .select();
        
        if (error) throw error;
        
        await loadTeamMembers();
        closeModal('memberModal');
        showNotification('Team member added successfully!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function deleteMember(memberId) {
    if (!confirm('Are you sure you want to delete this team member?')) {
        return;
    }
    
    try {
        // Update tasks to unassigned
        const { error: taskError } = await supabase
            .from('tasks')
            .update({ assignee_id: null, assignee_name: 'Unassigned' })
            .eq('assignee_id', memberId);
        
        if (taskError) throw taskError;
        
        // Delete team member
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', memberId);
        
        if (error) throw error;
        
        await loadTeamMembers();
        await loadTasks();
        showNotification('Team member deleted successfully!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function loadTeamMembers() {
    try {
        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        teamMembers = data || [];
        renderTeamMembers();
    } catch (error) {
        console.error('Error loading team members:', error);
        showNotification('Error loading team members', 'error');
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
async function handleAddTask(event) {
    event.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const assigneeId = document.getElementById('taskAssignee').value;
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;
    
    if (!title || !description || !assigneeId || !priority || !dueDate) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    const assignee = teamMembers.find(member => member.id === assigneeId);
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .insert([
                {
                    title: title,
                    description: description,
                    assignee_id: assigneeId,
                    assignee_name: assignee ? assignee.name : 'Unassigned',
                    priority: priority,
                    due_date: dueDate,
                    status: 'todo',
                    created_by: currentUser.id
                }
            ])
            .select();
        
        if (error) throw error;
        
        await loadTasks();
        closeModal('taskModal');
        showNotification('Task created successfully!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function updateTaskStatus(taskId, newStatus) {
    try {
        const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', taskId);
        
        if (error) throw error;
        
        await loadTasks();
        showNotification('Task status updated!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);
        
        if (error) throw error;
        
        await loadTasks();
        showNotification('Task deleted successfully!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function loadTasks() {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        tasks = data || [];
        renderTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
        showNotification('Error loading tasks', 'error');
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
                <span class="task-assignee">${task.assignee_name}</span>
                <span class="task-due-date">${formatDate(task.due_date)}</span>
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

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#e53e3e' : '#4299e1'};
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
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
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
window.signOut = signOut; 