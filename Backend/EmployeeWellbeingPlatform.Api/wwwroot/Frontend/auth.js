// API Configuration
const API_BASE_URL = '/api';

// Check if user is already logged in
function checkAuthStatus() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        // Redirect admin users to admin dashboard, regular users to index
        if (user.isAdmin) {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }
    }
}

// Login form submission
$('#loginForm').on('submit', function(e) {
    e.preventDefault();
    
    // Show spinner and disable button
    $('#loginBtnText').text('Logging in...');
    $('#loginSpinner').removeClass('d-none');
    $('#loginForm button[type="submit"]').prop('disabled', true);
    $('#loginError').addClass('d-none');
    
    const username = $('#loginUsername').val();
    const password = $('#loginPassword').val();
    
    // HACKATHON DEMO: Check for demo credentials
    if (username === 'admin' && password === 'password@123') {
        // Create admin user object
        const adminUser = {
            id: 3,
            name: 'Admin User',
            username: 'admin',
            role: 'Admin',
            isAdmin: true,
            lastLoginAt: new Date().toISOString()
        };
        
        // Save admin user to local storage
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        
        // Redirect to admin dashboard
        window.location.href = 'admin.html';
        return;
    } else if (username === 'Vivek' && password === 'password@123') {
        // Create admin user object
        const adminUser = {
            id: 2,
            name: 'Vivek Sharma',
            username: 'Vivek',
            role: 'Admin',
            isAdmin: true,
            lastLoginAt: new Date().toISOString()
        };
        
        // Save admin user to local storage
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        
        // Redirect to admin dashboard
        window.location.href = 'admin.html';
        return;
    } else if (username === 'john' && password === 'password@123') {
        // Create regular user object
        const regularUser = {
            id: 1,
            name: 'Ronaldo',
            username: 'john',
            role: 'Employee',
            isAdmin: false,
            lastLoginAt: new Date().toISOString()
        };
        
        // Save regular user to local storage
        localStorage.setItem('currentUser', JSON.stringify(regularUser));
        
        // Redirect to main dashboard
        window.location.href = 'index.html';
        return;
    } else if (username === 'messi' && password === 'password@123') {
        // Create regular user object
        const regularUser = {
            id: 4,
            name: 'Messi',
            username: 'messi',
            role: 'Employee',
            isAdmin: false,
            lastLoginAt: new Date().toISOString()
        };
        
        // Save regular user to local storage
        localStorage.setItem('currentUser', JSON.stringify(regularUser));
        
        // Redirect to main dashboard
        window.location.href = 'index.html';
        return;
    }
    
    // For non-demo credentials, call the real API
    fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Login failed');
        }
        return response.json();
    })
    .then(user => {
        // Make sure isAdmin property exists and is properly set
        // Check both IsAdmin boolean property and Role string property
        if (user.isAdmin === undefined) {
            // If isAdmin is missing, check the Role property or IsAdmin with capital I
            if (user.IsAdmin === true) {
                user.isAdmin = true;
            } else if (user.role === 'Admin' || user.Role === 'Admin') {
                user.isAdmin = true;
            } else {
                user.isAdmin = false;
            }
        }
        
        // Save user to local storage
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Redirect based on user role
        if (user.isAdmin) {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        $('#loginError').text('Invalid username or password. Please try again.').removeClass('d-none');
    })
    .finally(() => {
        // Hide spinner and enable button
        $('#loginBtnText').text('Login');
        $('#loginSpinner').addClass('d-none');
        $('#loginForm button[type="submit"]').prop('disabled', false);
    });
});

// Register form submission
$('#registerForm').on('submit', function(e) {
    e.preventDefault();
    
    // Show spinner and disable button
    $('#registerBtnText').text('Creating account...');
    $('#registerSpinner').removeClass('d-none');
    $('#registerForm button[type="submit"]').prop('disabled', true);
    $('#registerError').addClass('d-none');
    
    const name = $('#registerName').val();
    const email = $('#registerEmail').val();
    const username = $('#registerUsername').val();
    const password = $('#registerPassword').val();
    const department = $('#registerDepartment').val();
    
    // Call API for registration
    fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, username, password, department })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Registration failed');
        }
        return response.json();
    })
    .then(user => {
        // Save user to local storage
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Redirect to main app
        window.location.href = 'index.html';
    })
    .catch(error => {
        console.error('Registration error:', error);
        $('#registerError').text('Registration failed. Username may already exist.').removeClass('d-none');
    })
    .finally(() => {
        // Hide spinner and enable button
        $('#registerBtnText').text('Create Account');
        $('#registerSpinner').addClass('d-none');
        $('#registerForm button[type="submit"]').prop('disabled', false);
    });
});

// Check auth status on page load
$(document).ready(function() {
    checkAuthStatus();
});
