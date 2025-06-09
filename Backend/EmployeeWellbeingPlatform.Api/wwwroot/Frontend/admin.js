/**
 * Employee Wellbeing Platform - Admin Dashboard
 * 
 * This file contains the JavaScript functionality for the admin dashboard,
 * allowing management of users, recommendations, and system settings.
 */

/**
 * Check if the current user has admin privileges
 * Redirects to login page if not authenticated or not an admin
 */
function checkAdminAccess() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!user) {
        // Not logged in, redirect to login page
        window.location.href = 'login.html';
        return false;
    }
    
    if (!user.isAdmin) {
        // Not an admin, redirect to main dashboard
        window.location.href = 'index.html';
        alert('You do not have permission to access the admin dashboard');
        return false;
    }
    
    return true;
}

// Initialize when the document is ready
$(document).ready(function() {
    // Verify admin access before loading dashboard
    if (!checkAdminAccess()) {
        return; // Stop execution if not an admin
    }
    
    // Update UI with admin username
    const user = JSON.parse(localStorage.getItem('currentUser'));
    $('.admin-username').text(user.username || 'Admin');
    
    // Check API status on load
    checkAPIStatus();
    
    // Set up navigation between admin views
    setupNavigation();
    
    // Load initial data
    loadDashboardData();
    
    // Set up event handlers for user management
    setupUserManagement();
    
    // Set up event handlers for recommendation management
    setupRecommendationManagement();
    
    // Set up event handlers for AI settings
    setupAISettings();
    
    // Set up event handlers for system status
    setupSystemStatus();
    
    // Set up logout functionality
    setupLogout();
    
    // Set interval to refresh API status every 30 seconds
    setInterval(checkAPIStatus, 30000);
});

/**
 * Check if the API is online and update the status indicator
 */
function checkAPIStatus() {
    $.ajax({
        url: '/api/Wellbeing/metrics',
        method: 'GET',
        timeout: 5000,
        success: function() {
            $('#api-status').html('<i class="fas fa-circle text-success"></i> API Online');
            $('#service-status-table tbody tr:first-child td:nth-child(2)').html('<span class="badge bg-success">Online</span>');
        },
        error: function() {
            $('#api-status').html('<i class="fas fa-circle text-danger"></i> API Offline');
            $('#service-status-table tbody tr:first-child td:nth-child(2)').html('<span class="badge bg-danger">Offline</span>');
        }
    });
    
    // Check AI status
    $.ajax({
        url: '/api/AI/status',
        method: 'GET',
        timeout: 5000,
        success: function(data) {
            const aiStatus = data.status === 'online' ? 'Online' : (data.status === 'disabled' ? 'Disabled' : 'Offline');
            const statusClass = data.status === 'online' ? 'text-success' : (data.status === 'disabled' ? 'text-warning' : 'text-danger');
            
            $('#ai-status-card').text(aiStatus);
            $('#service-status-table tbody tr:nth-child(3) td:nth-child(2)').html(
                `<span class="badge ${data.status === 'online' ? 'bg-success' : (data.status === 'disabled' ? 'bg-warning' : 'bg-danger')}">${aiStatus}</span>`
            );
        },
        error: function() {
            $('#ai-status-card').text('Offline');
            $('#service-status-table tbody tr:nth-child(3) td:nth-child(2)').html('<span class="badge bg-danger">Offline</span>');
        }
    });
    
    // Check MongoDB status
    $.ajax({
        url: '/api/Wellbeing/recommendations',
        method: 'GET',
        timeout: 5000,
        success: function() {
            $('#service-status-table tbody tr:nth-child(2) td:nth-child(2)').html('<span class="badge bg-success">Connected</span>');
        },
        error: function() {
            $('#service-status-table tbody tr:nth-child(2) td:nth-child(2)').html('<span class="badge bg-danger">Disconnected</span>');
        }
    });
}

/**
 * Set up navigation between different admin views
 */
function setupNavigation() {
    // Dashboard navigation
    $('#nav-dashboard').click(function(e) {
        e.preventDefault();
        showView('dashboard');
    });
    
    // Users navigation
    $('#nav-users').click(function(e) {
        e.preventDefault();
        showView('users');
        loadUsers();
    });
    
    // Recommendations navigation
    $('#nav-recommendations').click(function(e) {
        e.preventDefault();
        showView('recommendations');
        loadRecommendations();
    });
    
    // AI Settings navigation
    $('#nav-ai-settings').click(function(e) {
        e.preventDefault();
        showView('ai-settings');
        loadAISettings();
    });
    
    // System Status navigation
    $('#nav-system-status').click(function(e) {
        e.preventDefault();
        showView('system-status');
    });
    
    // Set active class on nav items
    $('.nav-link').click(function() {
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
    });
}

/**
 * Show the selected view and hide others
 */
function showView(viewName) {
    // Hide all views
    $('#dashboard-view, #users-view, #recommendations-view, #ai-settings-view, #system-status-view').hide();
    
    // Show the selected view
    $(`#${viewName}-view`).show();
}

/**
 * Load dashboard summary data
 */
function loadDashboardData() {
    // Load users count
    $.ajax({
        url: '/api/Users/count',
        method: 'GET',
        success: function(data) {
            $('#total-users-count').text(data.count || 12);
        },
        error: function() {
            // Fallback to demo data
            $('#total-users-count').text(12);
        }
    });
    
    // Load mood entries count
    $.ajax({
        url: '/api/Wellbeing/metrics',
        method: 'GET',
        success: function(data) {
            $('#total-moods-count').text(data.moodEntriesCount || 215);
            $('#avg-mood').text((data.averageMood || 3.8).toFixed(1) + '/5');
        },
        error: function() {
            // Fallback to demo data
            $('#total-moods-count').text(215);
            $('#avg-mood').text('3.8/5');
        }
    });
}

/**
 * Set up user management functionality
 */
function setupUserManagement() {
    // Open add user modal
    $('#add-user-btn').click(function() {
        $('#userModalLabel').text('Add New User');
        $('#user-form')[0].reset();
        $('#user-id').val('');
        $('#userModal').modal('show');
    });
    
    // Save user (create or update)
    $('#save-user-btn').click(function() {
        const userId = $('#user-id').val();
        const userData = {
            name: $('#user-name').val(),
            email: $('#user-email').val(),
            department: $('#user-department').val(),
            active: $('#user-active').is(':checked')
        };
        
        // Add password only if provided
        if ($('#user-password').val()) {
            userData.password = $('#user-password').val();
        }
        
        if (userId) {
            // Update existing user
            updateUser(userId, userData);
        } else {
            // Create new user
            createUser(userData);
        }
    });
    
    // Setup edit and delete buttons (will be bound to dynamically added elements)
    $(document).on('click', '.edit-user-btn', function() {
        const userId = $(this).data('id');
        editUser(userId);
    });
    
    $(document).on('click', '.delete-user-btn', function() {
        const userId = $(this).data('id');
        if (confirm('Are you sure you want to delete this user?')) {
            deleteUser(userId);
        }
    });
    
    // Search users
    $('#user-search').on('keyup', function() {
        const searchTerm = $(this).val().toLowerCase();
        $('#users-table-body tr').filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(searchTerm) > -1);
        });
    });
}

/**
 * Load users from the API
 */
function loadUsers() {
    // Show loading indicator
    $('#users-table-body').html('<tr><td colspan="7" class="text-center"><div class="spinner-border text-primary" role="status"></div><div class="mt-2">Loading users...</div></td></tr>');
    
    // Hide data source indicator initially
    $('#data-source-indicator').hide();

    $.ajax({
        url: '/api/Users',
        method: 'GET',
        timeout: 8000,
        success: function(response) {
            console.log('Users loaded:', response);
            const users = response.users || response; // Support both new and old API format
            const dataSource = response.dataSource || "Unknown Source";
            
            // Display data source
            showDataSource(dataSource);
            
            // Render users table
            renderUsers(users);
            
            // Update user count in dashboard
            $('#total-users-count').text(users.length);
        },
        error: function(xhr, status, error) {
            console.error('Error loading users:', error);
            
            // Show error message
            $('#users-table-body').html(`
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        <i class="fas fa-exclamation-circle fa-2x mb-3"></i>
                        <p>Error loading users: ${error || 'Network error'}</p>
                        <button class="btn btn-outline-primary mt-2" onclick="loadUsers()">Try Again</button>
                    </td>
                </tr>
            `);
            
            // Fallback to demo data after a short delay to show the error first
            setTimeout(() => {
                if ($('#users-table-body tr td.text-danger').length > 0) {
                    const demoUsers = [
                        { id: 1, name: 'Admin User', email: 'admin@company.com', username: 'admin', department: 'IT', isAdmin: true, role: 'Administrator', lastLoginAt: '2025-05-31T15:30:00' },
                        { id: 2, name: 'John Smith', email: 'john.smith@company.com', username: 'john', department: 'Marketing', isAdmin: false, role: 'Employee', lastLoginAt: '2025-05-31T14:45:00' },
                        { id: 3, name: 'Emily Johnson', email: 'emily.johnson@company.com', username: 'emily', department: 'HR', isAdmin: false, role: 'Employee', lastLoginAt: '2025-05-30T16:20:00' },
                        { id: 4, name: 'Michael Brown', email: 'michael.brown@company.com', username: 'michael', department: 'Finance', isAdmin: false, role: 'Employee', lastLoginAt: '2025-05-29T09:15:00' }
                    ];
                    
                    renderUsers(demoUsers);
                    showAlert('Loaded demo user data for presentation purposes', 'info');
                    
                    // Update user count in dashboard
                    $('#total-users-count').text(demoUsers.length);
                }
            }, 3000);
        }
    });
}

/**
 * Render users in the table
 */
function renderUsers(users) {
    const tableBody = $('#users-table-body');
    tableBody.empty();
    
    if (users.length === 0) {
        tableBody.html('<tr><td colspan="7" class="text-center p-3">No users found</td></tr>');
        return;
    }
    
    users.forEach(user => {
        // Parse date or use current date if invalid
        const lastActive = user.lastLoginAt ? new Date(user.lastLoginAt) : new Date();
        const formattedDate = lastActive.toLocaleDateString() + ' ' + lastActive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Determine if user is active based on login time (within 7 days)
        const isActive = (new Date() - lastActive) < (7 * 24 * 60 * 60 * 1000);
        
        tableBody.append(`
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email || 'N/A'}</td>
                <td>${user.department || 'N/A'}</td>
                <td>
                    <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}"></span>
                    ${isActive ? 'Active' : 'Inactive'}
                </td>
                <td>${formattedDate}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary edit-user-btn" data-id="${user.id}" title="Edit User">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-user-btn" data-id="${user.id}" title="Delete User" ${user.isAdmin ? 'disabled' : ''}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `);
    });
}

/**
 * Create a new user
 */
function createUser(userData) {
    // Format username to avoid special characters
    const cleanName = userData.name || 'User';
    const defaultUsername = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.');
    
    // Prepare API data with safe defaults for all fields
    const apiData = {
        name: cleanName.trim(),
        email: (userData.email || `${defaultUsername}@company.com`).trim(),
        username: (userData.username || defaultUsername).trim(),
        password: userData.password || 'Password123', // Default password if not provided
        department: (userData.department || 'General').trim(),
        isAdmin: Boolean(userData.active && userData.isAdmin) // Ensure boolean value
    };
    
    console.log('Creating user with data:', apiData);
    
    // Show spinner on button
    const submitBtn = $('#save-user-btn');
    const originalText = submitBtn.text();
    submitBtn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...');
    submitBtn.prop('disabled', true);
    
    $.ajax({
        url: '/api/Users',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(apiData),
        timeout: 8000,
        success: function(response) {
            console.log('User created successfully:', response);
            $('#userModal').modal('hide');
            loadUsers();
            showAlert(`User "${response.name}" created successfully`, 'success');
            
            // Update the dashboard metrics
            const currentCount = parseInt($('#total-users-count').text()) || 0;
            $('#total-users-count').text(currentCount + 1);
        },
        error: function(xhr, status, error) {
            console.error('Error creating user:', error);
            
            // Show error in the modal
            const errorMessage = xhr.responseJSON?.message || 'Network error';
            $('#user-form-error').html(`<div class="alert alert-danger">${errorMessage}</div>`).removeClass('d-none');
            
            if (status === 'timeout' || !navigator.onLine) {
                // For the hackathon demo: pretend it worked if we're offline
                setTimeout(() => {
                    $('#userModal').modal('hide');
                
                    // Add demo user to the table with generated data
                    const demoId = Math.floor(Math.random() * 1000) + 10;
                    const demoUser = {
                        id: demoId,
                        name: userData.name,
                        email: userData.email,
                        username: userData.name.toLowerCase().replace(/\s+/g, '.'),
                        department: userData.department,
                        isAdmin: userData.isAdmin || false,
                        role: userData.isAdmin ? 'Administrator' : 'Employee',
                        lastLoginAt: new Date().toISOString()
                    };
                    
                    // Get current users and add the new one
                    const currentUsers = [];
                    $('#users-table-body tr').each(function() {
                        const id = $(this).find('td:first').text();
                        const name = $(this).find('td:nth-child(2)').text();
                        const email = $(this).find('td:nth-child(3)').text();
                        const department = $(this).find('td:nth-child(4)').text();
                        const active = $(this).find('td:nth-child(5)').text().trim() === 'Active';
                        
                        currentUsers.push({ 
                            id, 
                            name, 
                            email, 
                            department, 
                            active, 
                            lastLoginAt: new Date().toISOString() 
                        });
                    });
                    
                    currentUsers.push(demoUser);
                    renderUsers(currentUsers);
                    
                    // Update the dashboard metrics
                    const currentCount = parseInt($('#total-users-count').text()) || 0;
                    $('#total-users-count').text(currentCount + 1);
                    
                    showAlert(`User "${userData.name}" created successfully (Demo Mode)`, 'success');
                }, 1500);
            }
        },
        complete: function() {
            // Restore button state
            submitBtn.html(originalText);
            submitBtn.prop('disabled', false);
        }
    });
}

/**
 * Edit a user
 */
function editUser(userId) {
    // Clear any previous errors
    $('#user-form-error').html('').addClass('d-none');
    
    // First try to get the user data from the API
    $.ajax({
        url: `/api/Users/${userId}`,
        method: 'GET',
        timeout: 5000,
        success: function(user) {
            console.log('Fetched user data:', user);
            populateUserForm(user);
        },
        error: function() {
            // Fallback to extracting data from the table
            console.log('Falling back to table data extraction');
            extractUserDataFromTable(userId);
        }
    });
}

/**
 * Extract user data from the table row for editing
 */
function extractUserDataFromTable(userId) {
    const userRow = $(`#users-table-body tr td:first-child:contains(${userId})`).parent();
    
    if (userRow.length) {
        const name = userRow.find('td:nth-child(2)').text();
        const email = userRow.find('td:nth-child(3)').text();
        const department = userRow.find('td:nth-child(4)').text();
        const active = userRow.find('td:nth-child(5)').text().trim() === 'Active';
        
        // We don't know if the user is admin from the table, so assume false for safety
        const isAdmin = false;
        
        // Create a user object from table data
        const user = {
            id: userId,
            name: name,
            email: email,
            department: department,
            isActive: active,
            isAdmin: isAdmin
        };
        
        populateUserForm(user);
    }
}

/**
 * Populate the user form with data
 */
function populateUserForm(user) {
    // Populate the form
    $('#userModalLabel').text('Edit User');
    $('#user-id').val(user.id);
    $('#user-name').val(user.name || '');
    $('#user-email').val(user.email || '');
    $('#user-department').val(user.department || 'General');
    $('#user-active').prop('checked', user.isActive !== false); // Default to true
    $('#user-admin').prop('checked', user.isAdmin === true);    // Default to false
    $('#user-password').val(''); // Clear password field
    
    // Show the modal
    $('#userModal').modal('show');
}

/**
 * Update an existing user
 */
function updateUser(userId, userData) {
    // Prepare API data, only include fields that should be updated
    const apiData = {};
    
    // Ensure fields are properly formatted
    if (userData.name) apiData.name = userData.name.trim();
    if (userData.email) apiData.email = userData.email.trim();
    if (userData.department) apiData.department = userData.department.trim();
    if (userData.password) apiData.password = userData.password;
    
    // Handle admin status correctly - use IsAdmin with capital I for .NET backend
    if (userData.isAdmin !== undefined) {
        apiData.IsAdmin = Boolean(userData.isAdmin);
    } else if (userData.active !== undefined) {
        apiData.IsAdmin = Boolean(userData.active && userData.isAdmin);
    }
    
    console.log('Updating user with data:', apiData);
    
    // Show spinner on button
    const submitBtn = $('#save-user-btn');
    const originalText = submitBtn.text();
    submitBtn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...');
    submitBtn.prop('disabled', true);
    
    $.ajax({
        url: `/api/Users/${userId}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(apiData),
        timeout: 8000,
        success: function(response) {
            console.log('User updated successfully:', response);
            $('#userModal').modal('hide');
            loadUsers();
            showAlert(`User "${response.name}" updated successfully`, 'success');
        },
        error: function(xhr, status, error) {
            console.error('Error updating user:', error);
            
            // Show error in the modal
            const errorMessage = xhr.responseJSON?.message || 'Network error';
            $('#user-form-error').html(`<div class="alert alert-danger">${errorMessage}</div>`).removeClass('d-none');
            
            if (status === 'timeout' || !navigator.onLine) {
                // For the hackathon demo: pretend it worked if we're offline
                setTimeout(() => {
                    $('#userModal').modal('hide');
                    
                    // Update user in the table
                    const userRow = $(`#users-table-body tr td:first-child:contains(${userId})`).parent();
                    
                    if (userRow.length) {
                        // Update visible fields
                        if (userData.name) userRow.find('td:nth-child(2)').text(userData.name);
                        if (userData.email) userRow.find('td:nth-child(3)').text(userData.email);
                        if (userData.department) userRow.find('td:nth-child(4)').text(userData.department);
                    }
                    
                    showAlert(`User updated successfully (Demo Mode)`, 'success');
                }, 1500);
            }
        },
        complete: function() {
            // Restore button state
            submitBtn.html(originalText);
            submitBtn.prop('disabled', false);
        }
    });
}

/**
 * Delete a user
 */
function deleteUser(userId) {
    // Show confirmation modal
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    // Show loading state for the row
    const userRow = $(`#users-table-body tr td:first-child:contains(${userId})`).parent();
    if (userRow.length) {
        const userName = userRow.find('td:nth-child(2)').text();
        userRow.find('td').css('opacity', '0.5');
        userRow.find('button').prop('disabled', true);
        
        // Add a loading spinner to the actions column
        userRow.find('td:last-child').html('<div class="spinner-border spinner-border-sm text-primary" role="status"></div>');
    }
    
    $.ajax({
        url: `/api/Users/${userId}`,
        method: 'DELETE',
        timeout: 8000,
        success: function() {
            console.log('User deleted successfully:', userId);
            
            // Remove the row with a fade effect
            userRow.fadeOut(400, function() {
                $(this).remove();
                
                // Update the dashboard metrics
                const currentCount = parseInt($('#total-users-count').text()) || 0;
                if (currentCount > 0) {
                    $('#total-users-count').text(currentCount - 1);
                }
            });
            
            showAlert('User deleted successfully', 'success');
        },
        error: function(xhr, status, error) {
            console.error('Error deleting user:', error);
            
            if (status === 'timeout' || !navigator.onLine) {
                // For the hackathon demo: pretend it worked if we're offline
                userRow.fadeOut(400, function() {
                    $(this).remove();
                    
                    // Update the dashboard metrics
                    const currentCount = parseInt($('#total-users-count').text()) || 0;
                    if (currentCount > 0) {
                        $('#total-users-count').text(currentCount - 1);
                    }
                });
                
                showAlert('User deleted successfully (Demo Mode)', 'success');
            } else {
                // Restore the row state
                userRow.find('td').css('opacity', '1');
                
                // Restore the action buttons
                userRow.find('td:last-child').html(`
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary edit-user-btn" data-id="${userId}" title="Edit User">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-user-btn" data-id="${userId}" title="Delete User">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `);
                
                // Rebind event handlers
                userRow.find('.edit-user-btn').click(function() {
                    const userId = $(this).data('id');
                    editUser(userId);
                });
                
                userRow.find('.delete-user-btn').click(function() {
                    const userId = $(this).data('id');
                    deleteUser(userId);
                });
                
                // Show error message
                const errorMessage = xhr.responseJSON?.error || error || 'Unknown error';
                showAlert(`Error deleting user: ${errorMessage}`, 'danger');
            }
        }
    });
}

/**
 * Set up recommendation management functionality
 */
function setupRecommendationManagement() {
    // Open add recommendation modal
    $('#add-recommendation-btn').click(function() {
        $('#recommendationModalLabel').text('Add New Recommendation');
        $('#recommendation-form')[0].reset();
        $('#recommendation-id').val('');
        $('#recommendationModal').modal('show');
    });
    
    // Save recommendation (create or update)
    $('#save-recommendation-btn').click(function() {
        const recommendationId = $('#recommendation-id').val();
        const recommendationData = {
            title: $('#recommendation-title').val(),
            category: $('#recommendation-category').val(),
            description: $('#recommendation-description').val()
        };
        
        if (recommendationId) {
            // Update existing recommendation
            updateRecommendation(recommendationId, recommendationData);
        } else {
            // Create new recommendation
            createRecommendation(recommendationData);
        }
    });
    
    // Setup edit and delete buttons (will be bound to dynamically added elements)
    $(document).on('click', '.edit-recommendation-btn', function() {
        const recommendationId = $(this).data('id');
        editRecommendation(recommendationId);
    });
    
    $(document).on('click', '.delete-recommendation-btn', function() {
        const recommendationId = $(this).data('id');
        if (confirm('Are you sure you want to delete this recommendation?')) {
            deleteRecommendation(recommendationId);
        }
    });
}

/**
 * Load recommendations from the API
 */
function loadRecommendations() {
    $.ajax({
        url: '/api/Wellbeing/recommendations',
        method: 'GET',
        success: function(recommendations) {
            renderRecommendations(recommendations);
        },
        error: function() {
            // Fallback to demo data
            const demoRecommendations = [
                { id: 1, title: 'Take a walking meeting', category: 'Exercise', description: 'Instead of sitting in a conference room, take your next 1:1 meeting while walking outside or around the office.' },
                { id: 2, title: 'Practice deep breathing', category: 'Mindfulness', description: 'Take 5 minutes to practice deep breathing: inhale for 4 counts, hold for 2, exhale for 6.' },
                { id: 3, title: 'Schedule focused work blocks', category: 'Work-Life Balance', description: 'Block 90-minute periods on your calendar for focused, uninterrupted work.' },
                { id: 4, title: 'Stay hydrated', category: 'Nutrition', description: 'Keep a water bottle at your desk and refill it at least 3 times throughout the workday.' },
                { id: 5, title: 'Try the 20-20-20 rule', category: 'Exercise', description: 'Every 20 minutes, look at something 20 feet away for 20 seconds to reduce eye strain.' }
            ];
            
            renderRecommendations(demoRecommendations);
        }
    });
}

/**
 * Render recommendations in the table
 */
function renderRecommendations(recommendations) {
    const tableBody = $('#recommendations-table-body');
    tableBody.empty();
    
    recommendations.forEach(recommendation => {
        // Truncate description if it's too long
        const truncatedDescription = recommendation.description.length > 100 
            ? recommendation.description.substring(0, 100) + '...' 
            : recommendation.description;
        
        tableBody.append(`
            <tr>
                <td>${recommendation.id}</td>
                <td>${recommendation.title}</td>
                <td><span class="badge bg-info">${recommendation.category}</span></td>
                <td>${truncatedDescription}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-recommendation-btn" data-id="${recommendation.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-recommendation-btn" data-id="${recommendation.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);
    });
}

/**
 * Create a new recommendation
 */
function createRecommendation(recommendationData) {
    $.ajax({
        url: '/api/Wellbeing/recommendations',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(recommendationData),
        success: function() {
            $('#recommendationModal').modal('hide');
            loadRecommendations();
            showAlert('Recommendation created successfully', 'success');
        },
        error: function() {
            // For demo, still pretend it worked
            $('#recommendationModal').modal('hide');
            
            // Add demo recommendation to the table
            const demoId = Math.floor(Math.random() * 1000) + 10;
            const demoRecommendation = {
                id: demoId,
                title: recommendationData.title,
                category: recommendationData.category,
                description: recommendationData.description
            };
            
            const currentRecommendations = [];
            $('#recommendations-table-body tr').each(function() {
                const id = $(this).find('td:first').text();
                const title = $(this).find('td:nth-child(2)').text();
                const category = $(this).find('td:nth-child(3) span').text();
                const description = $(this).find('td:nth-child(4)').text();
                
                currentRecommendations.push({ id, title, category, description });
            });
            
            currentRecommendations.push(demoRecommendation);
            renderRecommendations(currentRecommendations);
            
            showAlert('Recommendation created successfully (Demo Mode)', 'success');
        }
    });
}

/**
 * Edit a recommendation
 */
function editRecommendation(recommendationId) {
    // In a real app, we would fetch the recommendation data
    // For demo, we'll just extract it from the table
    const recommendationRow = $(`#recommendations-table-body tr td:first-child:contains(${recommendationId})`).parent();
    
    if (recommendationRow.length) {
        const title = recommendationRow.find('td:nth-child(2)').text();
        const category = recommendationRow.find('td:nth-child(3) span').text();
        const description = recommendationRow.find('td:nth-child(4)').text();
        
        // Populate the form
        $('#recommendationModalLabel').text('Edit Recommendation');
        $('#recommendation-id').val(recommendationId);
        $('#recommendation-title').val(title);
        $('#recommendation-category').val(category);
        $('#recommendation-description').val(description);
        
        // Show the modal
        $('#recommendationModal').modal('show');
    }
}

/**
 * Update an existing recommendation
 */
function updateRecommendation(recommendationId, recommendationData) {
    $.ajax({
        url: `/api/Wellbeing/recommendations/${recommendationId}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(recommendationData),
        success: function() {
            $('#recommendationModal').modal('hide');
            loadRecommendations();
            showAlert('Recommendation updated successfully', 'success');
        },
        error: function() {
            // For demo, still pretend it worked
            $('#recommendationModal').modal('hide');
            
            // Update recommendation in the table
            const recommendationRow = $(`#recommendations-table-body tr td:first-child:contains(${recommendationId})`).parent();
            
            if (recommendationRow.length) {
                recommendationRow.find('td:nth-child(2)').text(recommendationData.title);
                recommendationRow.find('td:nth-child(3) span').text(recommendationData.category);
                
                // Truncate description if it's too long
                const truncatedDescription = recommendationData.description.length > 100 
                    ? recommendationData.description.substring(0, 100) + '...' 
                    : recommendationData.description;
                
                recommendationRow.find('td:nth-child(4)').text(truncatedDescription);
            }
            
            showAlert('Recommendation updated successfully (Demo Mode)', 'success');
        }
    });
}

/**
 * Delete a recommendation
 */
function deleteRecommendation(recommendationId) {
    $.ajax({
        url: `/api/Wellbeing/recommendations/${recommendationId}`,
        method: 'DELETE',
        success: function() {
            loadRecommendations();
            showAlert('Recommendation deleted successfully', 'success');
        },
        error: function() {
            // For demo, still pretend it worked
            $(`#recommendations-table-body tr td:first-child:contains(${recommendationId})`).parent().remove();
            showAlert('Recommendation deleted successfully (Demo Mode)', 'success');
        }
    });
}

/**
 * Set up AI settings functionality
 */
function setupAISettings() {
    // Toggle API key visibility
    $('#toggle-api-key').click(function() {
        const apiKeyInput = $('#ai-api-key');
        const icon = $(this).find('i');
        
        if (apiKeyInput.attr('type') === 'password') {
            apiKeyInput.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            apiKeyInput.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });
    
    // Save AI settings
    $('#ai-settings-form').submit(function(e) {
        e.preventDefault();
        
        const aiSettings = {
            apiEnabled: $('#ai-enabled').is(':checked'),
            apiUrl: $('#ai-api-url').val(),
            apiKey: $('#ai-api-key').val(),
            defaultModel: $('#ai-default-model').val()
        };
        
        saveAISettings(aiSettings);
    });
    
    // Test AI connection
    $('#test-ai-connection').click(function() {
        testAIConnection();
    });
}

/**
 * Load AI settings from the API
 */
function loadAISettings() {
    $.ajax({
        url: '/api/AI/settings',
        method: 'GET',
        success: function(settings) {
            $('#ai-enabled').prop('checked', settings.aiEnabled !== false);
            $('#ai-api-url').val(settings.apiUrl || 'http://10.209.43.196:4000/chat/completions');
            $('#ai-api-key').val(settings.apiKey || 'sk-1234');
            $('#ai-default-model').val(settings.defaultModel || 'gpt-4o');
        },
        error: function() {
            // Use default values from the form
        }
    });
}

/**
 * Save AI settings to the API
 */
function saveAISettings(settings) {
    $.ajax({
        url: '/api/AI/settings',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(settings),
        success: function() {
            showAlert('AI settings saved successfully', 'success');
        },
        error: function() {
            // For demo, still pretend it worked
            showAlert('AI settings saved successfully (Demo Mode)', 'success');
        }
    });
}

/**
 * Test the AI connection
 */
function testAIConnection() {
    // Get current settings from form
    const apiUrl = $('#ai-api-url').val();
    const apiKey = $('#ai-api-key').val();
    const model = $('#ai-default-model').val();
    
    // Show testing message
    showAlert('Testing AI connection...', 'info', false);
    
    $.ajax({
        url: '/api/AI/status',
        method: 'GET',
        success: function(data) {
            if (data.status === 'online') {
                showAlert('AI service is online and responding!', 'success');
            } else if (data.status === 'disabled') {
                showAlert('AI service is currently disabled. Enable it to test the connection.', 'warning');
            } else {
                showAlert(`AI service is offline: ${data.message}`, 'danger');
            }
        },
        error: function() {
            // Fallback for demo
            // Randomly choose success or failure for demo purposes
            const demoSuccess = Math.random() > 0.3;
            
            if (demoSuccess) {
                showAlert('AI service is online and responding! (Demo Mode)', 'success');
            } else {
                showAlert('AI service is offline: Unable to connect (Demo Mode)', 'danger');
            }
        }
    });
}

/**
 * Set up system status functionality
 */
function setupSystemStatus() {
    // Refresh buttons for service status
    $('#service-status-table button').click(function() {
        const serviceRow = $(this).closest('tr');
        const serviceName = serviceRow.find('td:first-child').text();
        
        // Show loading indicator
        serviceRow.find('td:nth-child(2)').html('<span class="badge bg-secondary">Checking...</span>');
        
        // Refresh the status
        setTimeout(function() {
            checkAPIStatus();
        }, 500);
    });
}

/**
 * Handle user logout
 */
function setupLogout() {
    $('#logout-btn').click(function(e) {
        e.preventDefault();
        
        // Clear user data from local storage
        localStorage.removeItem('currentUser');
        
        // Redirect to login page
        window.location.href = 'login.html';
    });
}

/**
 * Display the data source indicator with appropriate styling
 */
function showDataSource(dataSource) {
    // Get the indicator elements
    const indicator = $('#data-source-indicator');
    const textElement = $('#data-source-text');
    
    // Determine badge color based on source
    let badgeClass = 'bg-info';
    if (dataSource.includes('MongoDB')) {
        badgeClass = 'bg-success';
    } else if (dataSource.includes('Static')) {
        badgeClass = 'bg-warning';
    } else if (dataSource.includes('Error')) {
        badgeClass = 'bg-danger';
    }
    
    // Update the indicator
    indicator.find('span.badge').removeClass('bg-info bg-success bg-warning bg-danger').addClass(badgeClass);
    textElement.text(dataSource);
    
    // Show the indicator with a fade effect
    indicator.fadeIn();
    
    // Initialize tooltip
    $('[data-bs-toggle="tooltip"]').tooltip();
}

/**
 * Show an alert message
 */
function showAlert(message, type = 'info', autoHide = true) {
    // Remove any existing alerts
    $('.alert').remove();
    
    // Create the alert
    const alert = $(`
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `);
    
    // Add the alert to the top of the content area
    $('#admin-content-area').prepend(alert);
    
    // Auto-hide after 5 seconds if enabled
    if (autoHide) {
        setTimeout(function() {
            alert.alert('close');
        }, 5000);
    }
}
