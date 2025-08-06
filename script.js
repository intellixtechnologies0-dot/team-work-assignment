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
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    console.log('Theme toggle element found:', themeToggle);
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        console.log('Theme toggle event listener added');
    } else {
        console.error('Theme toggle button not found!');
    }
    
    // Initialize theme from localStorage
    initializeTheme();
    
    // Authentication forms
    document.getElementById('signinForm').addEventListener('submit', handleSignIn);
    
    // App forms
    document.getElementById('memberForm').addEventListener('submit', handleAddMember);
    document.getElementById('taskForm').addEventListener('submit', handleAddTask);
    document.getElementById('workProofForm').addEventListener('submit', handleWorkProofUpload);
    
    // Navigation
    setupNavigation();
    
    // Modal close events
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Theme Management Functions
function initializeTheme() {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    let theme = savedTheme;
    
    // If no saved theme, use system preference
    if (!savedTheme) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'dark' : 'light';
    }
    
    setTheme(theme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a preference
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function setTheme(theme) {
    console.log('Setting theme to:', theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update theme toggle icon
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            console.log('Updated icon to:', icon.className);
        }
    }
    
    // Update theme toggle title
    if (themeToggle) {
        themeToggle.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
    
    console.log('Theme set successfully. Current data-theme:', document.documentElement.getAttribute('data-theme'));
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all sections
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => section.classList.remove('active'));
            
            // Show target section
            const targetSection = this.getAttribute('data-section');
            const targetElement = document.getElementById(targetSection);
            if (targetElement) {
                targetElement.classList.add('active');
                
                // Load member tasks data if dashboard is accessed and user is admin
                if (targetSection === 'dashboard' && window.isAdmin) {
                    loadMemberTasksData();
                }
            }
        });
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
        // Check if user is admin first
        const isAdmin = currentUser.email === 'vrreddypc143@gmail.com';
        console.log('User email:', currentUser.email);
        console.log('Is admin:', isAdmin);
        
        // Store admin status globally
        window.isAdmin = isAdmin;
        
        // Try to get user profile, but don't fail if it doesn't exist
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();
            
            if (error) {
                console.log('Profile not found, creating one...');
                // Create profile if it doesn't exist
                const { error: createError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: currentUser.id,
                            name: currentUser.email.split('@')[0], // Use email prefix as name
                            email: currentUser.email,
                            role: isAdmin ? 'Admin' : 'Member'
                        }
                    ]);
                
                if (createError) {
                    console.error('Error creating profile:', createError);
                }
                
                document.getElementById('userName').textContent = currentUser.email.split('@')[0];
            } else {
                document.getElementById('userName').textContent = data.name;
            }
        } catch (profileError) {
            console.error('Profile error:', profileError);
            document.getElementById('userName').textContent = currentUser.email.split('@')[0];
        }
        
        // Show/hide admin features based on role
        updateUIForUserRole(isAdmin);
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
    document.getElementById('mainApp').style.display = 'flex';
}

function updateUIForUserRole(isAdmin) {
    console.log('Updating UI for user role. Is admin:', isAdmin);
    
    const addMemberBtns = document.querySelectorAll('#addMemberBtn, #addMemberBtn2');
    const createTaskBtns = document.querySelectorAll('#createTaskBtn, #createTaskBtn2');
    const memberTasksOverview = document.getElementById('memberTasksOverview');
    
    if (isAdmin) {
        // Admin can see all features
        addMemberBtns.forEach(btn => {
            if (btn) {
                btn.style.display = 'inline-flex';
                console.log('Showing add member button');
            }
        });
        createTaskBtns.forEach(btn => {
            if (btn) {
                btn.style.display = 'inline-flex';
                console.log('Showing create task button');
            }
        });
        
        // Show member tasks overview for admin
        if (memberTasksOverview) {
            memberTasksOverview.style.display = 'block';
            console.log('Showing member tasks overview');
            
            // Load member tasks data for admin on initial load
            loadMemberTasksData();
        }
    } else {
        // Regular users can only view their tasks
        addMemberBtns.forEach(btn => {
            if (btn) {
                btn.style.display = 'none';
                console.log('Hiding add member button');
            }
        });
        createTaskBtns.forEach(btn => {
            if (btn) {
                btn.style.display = 'none';
                console.log('Hiding create task button');
            }
        });
        
        // Hide member tasks overview for regular users
        if (memberTasksOverview) {
            memberTasksOverview.style.display = 'none';
            console.log('Hiding member tasks overview');
        }
    }
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
    
    if (!window.isAdmin) {
        showNotification('Only administrators can add team members', 'error');
        return;
    }
    
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
    if (!window.isAdmin) {
        showNotification('Only administrators can delete team members', 'error');
        return;
    }
    
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
        // All users can see team members list
        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        teamMembers = data || [];
        renderTeamMembers();
        updateDashboardCounts();
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
            ${window.isAdmin ? `
                <div class="member-actions">
                    <button class="btn btn-small btn-danger" onclick="deleteMember('${member.id}')">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Task functions
async function handleAddTask(event) {
    event.preventDefault();
    
    if (!window.isAdmin) {
        showNotification('Only administrators can create tasks', 'error');
        return;
    }
    
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
    
    if (!assignee) {
        showNotification('Selected team member not found', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .insert([
                {
                    title: title,
                    description: description,
                    assignee_id: assigneeId,
                    assignee_name: assignee.name,
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
        console.log('🔄 Updating task status:', taskId, 'to', newStatus);
        
        const { data, error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', taskId)
            .select();
        
        if (error) {
            console.error('❌ Error updating task status:', error);
            throw error;
        }
        
        console.log('✅ Task status updated successfully:', data);
        
        // Reload tasks to refresh the display
        await loadTasks();
        showNotification('Task status updated!', 'success');
    } catch (error) {
        console.error('❌ Failed to update task status:', error);
        showNotification('Failed to update task status: ' + error.message, 'error');
    }
}

async function deleteTask(taskId) {
    if (!window.isAdmin) {
        showNotification('Only administrators can delete tasks', 'error');
        return;
    }
    
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
        console.log('🔄 Loading tasks...');
        let query = supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });
        
        // If not admin, only show tasks assigned to current user
        if (!window.isAdmin) {
            console.log('👤 Not admin, filtering tasks for user:', currentUser.email);
            // For team members, we need to find tasks assigned to them by email
            // First, let's get the team member record for the current user
            const { data: memberData, error: memberError } = await supabase
                .from('team_members')
                .select('id')
                .eq('email', currentUser.email)
                .single();
            
            if (memberError) {
                console.log('❌ No team member record found for:', currentUser.email);
                console.log('❌ Member error:', memberError);
                tasks = [];
                renderTasks();
                return;
            }
            
            console.log('✅ Found team member ID:', memberData.id);
            // Now filter tasks by the team member ID
            query = query.eq('assignee_id', memberData.id);
        }
        
        console.log('🔄 Executing query...');
        const { data, error } = await query;
        
        if (error) {
            console.error('❌ Database error:', error);
            throw error;
        }
        
        console.log('✅ Tasks loaded successfully:', data?.length || 0);
        console.log('📋 Tasks:', data);
        tasks = data || [];
        renderTasks();
        updateDashboardCounts();
    } catch (error) {
        console.error('❌ Error loading tasks:', error);
        console.error('❌ Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        showNotification('Error loading tasks: ' + error.message, 'error');
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
    
    column.innerHTML = taskList.map(task => {
        const hasProof = hasWorkProof(task);
        const workProofHtml = hasProof ? formatWorkProof(task.work_proof) : '';
        const isInProgress = task.status === 'inProgress';
        const canComplete = task.status === 'inProgress' && hasProof;
        
        return `
            <div class="task-card ${task.priority}-priority" draggable="true" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-title">${task.title}</div>
                    <div class="task-priority priority-${task.priority}">${task.priority}</div>
                </div>
                <div class="task-description">${task.description}</div>
                <div class="task-meta">
                    <span class="task-assignee">${task.assignee_name}</span>
                    <span class="task-due-date">${formatDate(task.due_date)}</span>
                    ${hasProof ? '<span class="work-proof-badge">✅ Proof Added</span>' : ''}
                </div>
                ${hasProof ? `
                    <div class="work-proof-section">
                        ${workProofHtml}
                    </div>
                ` : ''}
                <div class="task-actions">
                    ${task.status === 'todo' ? `
                        <button class="btn btn-small btn-primary" onclick="moveTask('${task.id}', 'inProgress')">
                            🚀 Start
                        </button>
                    ` : task.status === 'inProgress' ? `
                                                         <button class="btn btn-small btn-primary" onclick="openWorkProofModal('${task.id}')">
                                     📎 ${hasProof ? 'Update Proof' : 'Attach'}
                                 </button>
                                                         <button class="btn btn-small ${canComplete ? 'btn-primary' : 'btn-secondary complete-btn-disabled'}" 
                                         onclick="${canComplete ? `moveTask('${task.id}', 'completed')` : 'showNotification(\'Please attach work proof before completing the task\', \'error\')'}"
                                         ${!canComplete ? 'disabled' : ''}>
                                     ✅ Completed
                                 </button>
                    ` : task.status === 'completed' ? `
                        <span style="color: #28a745; font-weight: bold;">✅ Completed</span>
                    ` : ''}
                    ${window.isAdmin ? `
                        <button class="btn btn-small btn-danger" onclick="deleteTask('${task.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
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

// Dashboard Functions
function updateDashboardCounts() {
    // Update member count
    const memberCountElement = document.getElementById('memberCount');
    if (memberCountElement) {
        memberCountElement.textContent = teamMembers.length;
    }
    
    // Update task counts
    const taskCountElement = document.getElementById('taskCount');
    const inProgressCountElement = document.getElementById('inProgressCount');
    const completedCountElement = document.getElementById('completedCount');
    const todoCountElement = document.getElementById('todoCount');
    const inProgressColumnCountElement = document.getElementById('inProgressColumnCount');
    const completedColumnCountElement = document.getElementById('completedColumnCount');
    
    if (taskCountElement) {
        taskCountElement.textContent = tasks.length;
    }
    
    if (inProgressCountElement) {
        const inProgressCount = tasks.filter(task => task.status === 'inProgress').length;
        inProgressCountElement.textContent = inProgressCount;
    }
    
    if (completedCountElement) {
        const completedCount = tasks.filter(task => task.status === 'completed').length;
        completedCountElement.textContent = completedCount;
    }
    
    if (todoCountElement) {
        const todoCount = tasks.filter(task => task.status === 'todo').length;
        todoCountElement.textContent = todoCount;
    }
    
    if (inProgressColumnCountElement) {
        const inProgressCount = tasks.filter(task => task.status === 'inProgress').length;
        inProgressColumnCountElement.textContent = inProgressCount;
    }
    
    if (completedColumnCountElement) {
        const completedCount = tasks.filter(task => task.status === 'completed').length;
        completedColumnCountElement.textContent = completedCount;
    }
}

// Work Proof Functions
function openWorkProofModal(taskId) {
    document.getElementById('workProofTaskId').value = taskId;
    document.getElementById('workProofType').value = '';
    document.getElementById('workProofLink').value = '';
    document.getElementById('workProofScreenshot').value = '';
    document.getElementById('workProofNotes').value = '';
    document.getElementById('linkInputGroup').style.display = 'none';
    document.getElementById('screenshotInputGroup').style.display = 'none';
    openModal('workProofModal');
}

function toggleProofInput() {
    const proofType = document.getElementById('workProofType').value;
    const linkGroup = document.getElementById('linkInputGroup');
    const screenshotGroup = document.getElementById('screenshotInputGroup');
    
    linkGroup.style.display = 'none';
    screenshotGroup.style.display = 'none';
    
    if (proofType === 'link') {
        linkGroup.style.display = 'block';
    } else if (proofType === 'screenshot') {
        screenshotGroup.style.display = 'block';
    }
}

async function handleWorkProofUpload(event) {
    event.preventDefault();
    
    const taskId = document.getElementById('workProofTaskId').value;
    const proofType = document.getElementById('workProofType').value;
    const proofLink = document.getElementById('workProofLink').value;
    const proofScreenshot = document.getElementById('workProofScreenshot').value;
    const notes = document.getElementById('workProofNotes').value;
    
    if (!proofType) {
        showNotification('Please select a proof type', 'error');
        return;
    }
    
    let workProof = '';
    if (proofType === 'link' && proofLink) {
        workProof = `LINK: ${proofLink}`;
    } else if (proofType === 'screenshot' && proofScreenshot) {
        workProof = `SCREENSHOT: ${proofScreenshot}`;
    } else {
        showNotification('Please provide a valid link or screenshot URL', 'error');
        return;
    }
    
    if (notes) {
        workProof += ` | NOTES: ${notes}`;
    }
    
    try {
        const { error } = await supabase
            .from('tasks')
            .update({ 
                work_proof: workProof,
                work_proof_updated_at: new Date().toISOString()
            })
            .eq('id', taskId);
        
        if (error) throw error;
        
        closeModal('workProofModal');
        await loadTasks();
        showNotification('Work proof uploaded successfully!', 'success');
    } catch (error) {
        showNotification('Failed to upload work proof: ' + error.message, 'error');
    }
}

function hasWorkProof(task) {
    return task.work_proof && task.work_proof.trim() !== '';
}

function formatWorkProof(workProof) {
    if (!workProof) return '';
    
    const parts = workProof.split(' | ');
    let result = '';
    
    parts.forEach(part => {
        if (part.startsWith('LINK: ')) {
            const link = part.replace('LINK: ', '');
            result += `<div><strong>🔗 Work Link:</strong> <a href="${link}" target="_blank" class="work-proof-link">${link}</a></div>`;
        } else if (part.startsWith('SCREENSHOT: ')) {
            const screenshot = part.replace('SCREENSHOT: ', '');
            result += `<div><strong>📸 Screenshot:</strong> <a href="${screenshot}" target="_blank" class="work-proof-link">${screenshot}</a></div>`;
        } else if (part.startsWith('NOTES: ')) {
            const notes = part.replace('NOTES: ', '');
            result += `<div><strong>📝 Notes:</strong> ${notes}</div>`;
        }
    });
    
    return result;
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

// Member Tasks Functions
async function loadMemberTasksData() {
    try {
        await Promise.all([
            loadTeamMembers(),
            loadTasks()
        ]);
        
        renderMemberTasksOverview();
    } catch (error) {
        console.error('Error loading member tasks data:', error);
        showNotification('Error loading member tasks data', 'error');
    }
}

function renderMemberTasksOverview() {
    const memberTasksGrid = document.getElementById('memberTasksGrid');
    if (!memberTasksGrid) return;

    memberTasksGrid.innerHTML = '';

    teamMembers.forEach(member => {
        const memberTasks = tasks.filter(task => task.assignee === member.email);
        const memberCard = createMemberTaskCard(member, memberTasks);
        memberTasksGrid.appendChild(memberCard);
    });
}

function createMemberTaskCard(member, memberTasks) {
    const card = document.createElement('div');
    card.className = 'member-task-card';

    const todoTasks = memberTasks.filter(task => task.status === 'todo');
    const inProgressTasks = memberTasks.filter(task => task.status === 'inProgress');
    const completedTasks = memberTasks.filter(task => task.status === 'completed');
    const overdueTasks = memberTasks.filter(task => {
        if (task.status === 'completed') return false;
        const dueDate = new Date(task.due_date);
        const today = new Date();
        return dueDate < today;
    });

    const memberInitials = member.name.split(' ').map(n => n[0]).join('').toUpperCase();

    card.innerHTML = `
        <div class="member-header">
            <div class="member-avatar">${memberInitials}</div>
            <div class="member-info">
                <h4>${member.name}</h4>
                <p>${member.role}</p>
            </div>
        </div>
        
        <div class="member-stats">
            <div class="member-stat">
                <span class="member-stat-number">${todoTasks.length}</span>
                <span class="member-stat-label">To Do</span>
            </div>
            <div class="member-stat">
                <span class="member-stat-number">${inProgressTasks.length}</span>
                <span class="member-stat-label">In Progress</span>
            </div>
            <div class="member-stat">
                <span class="member-stat-number">${completedTasks.length}</span>
                <span class="member-stat-label">Completed</span>
            </div>
            <div class="member-stat">
                <span class="member-stat-number">${overdueTasks.length}</span>
                <span class="member-stat-label">Overdue</span>
            </div>
        </div>
        
        <div class="member-tasks-list">
            ${memberTasks.map(task => createMemberTaskItem(task)).join('')}
        </div>
    `;

    return card;
}

function createMemberTaskItem(task) {
    const isOverdue = task.status !== 'completed' && new Date(task.due_date) < new Date();
    const priorityClass = task.priority ? `${task.priority}-priority` : '';
    const overdueClass = isOverdue ? 'overdue' : '';
    const statusClass = `status-${task.status.replace(' ', '-')}`;

    return `
        <div class="member-task-item ${priorityClass} ${overdueClass}">
            <div class="member-task-title">${task.title}</div>
            <div class="member-task-meta">
                <span class="member-task-status ${statusClass}">${task.status}</span>
                <span>Due: ${formatDate(task.due_date)}</span>
            </div>
        </div>
    `;
}

function refreshMemberTasksView() {
    loadMemberTasksData();
    showNotification('Member tasks view refreshed', 'success');
}

function exportMemberTasks() {
    const csvData = generateMemberTasksCSV();
    downloadCSV(csvData, 'member-tasks-report.csv');
    showNotification('Report exported successfully', 'success');
}

function generateMemberTasksCSV() {
    let csv = 'Member Name,Email,Role,Task Title,Status,Priority,Due Date,Description\n';
    
    teamMembers.forEach(member => {
        const memberTasks = tasks.filter(task => task.assignee === member.email);
        
        if (memberTasks.length === 0) {
            csv += `"${member.name}","${member.email}","${member.role}","No tasks assigned","","","",""\n`;
        } else {
            memberTasks.forEach(task => {
                csv += `"${member.name}","${member.email}","${member.role}","${task.title}","${task.status}","${task.priority}","${task.due_date}","${task.description.replace(/"/g, '""')}"\n`;
            });
        }
    });
    
    return csv;
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Export member tasks functions for global access
window.refreshMemberTasksView = refreshMemberTasksView;
window.exportMemberTasks = exportMemberTasks; 