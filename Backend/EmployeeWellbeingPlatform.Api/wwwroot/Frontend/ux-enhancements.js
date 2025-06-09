/**
 * UX Enhancements Module for Employee Wellbeing Platform
 * Adds welcome messages, theme toggle, and other UX improvements
 */

// Initialize UX enhancements when document is ready
$(document).ready(function() {
    // Add theme toggle
    addThemeToggle();
    
    // Add welcome back message
    addWelcomeMessage();
    
    // Handle theme preference from localStorage
    applyThemePreference();
    
    // Add responsive optimizations
    enhanceMobileExperience();
    
    // Enhance form elements for better UX
    enhanceFormElements();
});

/**
 * Add theme toggle button to navbar
 */
function addThemeToggle() {
    const themeToggle = `
        <li class="nav-item ms-2 d-flex align-items-center">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="themeToggle">
                <label class="form-check-label ms-2" for="themeToggle">
                    <i class="fas fa-moon text-muted"></i>
                </label>
            </div>
        </li>
    `;
    
    // Add toggle to navbar
    $('.navbar-nav').append(themeToggle);
    
    // Add theme toggle handler
    $('#themeToggle').on('change', function() {
        if ($(this).is(':checked')) {
            enableDarkTheme();
        } else {
            enableLightTheme();
        }
    });
}

/**
 * Add personalized welcome message
 */
function addWelcomeMessage() {
    // Get user data from localStorage
    const userData = localStorage.getItem('currentUser');
    if (!userData) return;
    
    const user = JSON.parse(userData);
    const username = user.username || 'there';
    
    // Create welcome message if dashboard page is active
    if ($('#dashboard-page').hasClass('active')) {
        const welcomeMessage = `
            <div class="welcome-banner mb-4">
                <div class="card bg-primary text-white shadow-sm">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div>
                                <h3>Welcome back, ${username}!</h3>
                                <p class="mb-0">Track your mood and get personalized wellbeing recommendations</p>
                            </div>
                            <div class="ms-auto text-center">
                                <div id="time-display" class="display-5"></div>
                                <div id="date-display" class="small"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add welcome banner to top of dashboard
        $('#dashboard-page').prepend(welcomeMessage);
        
        // Update time display
        updateTimeDisplay();
        setInterval(updateTimeDisplay, 60000);
    }
}

/**
 * Update time display in welcome banner
 */
function updateTimeDisplay() {
    const now = new Date();
    
    // Format the time
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    // Format the date
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    const dateStr = now.toLocaleDateString('en-US', options);
    
    // Update displays
    $('#time-display').text(timeStr);
    $('#date-display').text(dateStr);
}

/**
 * Apply theme based on user preference
 */
function applyThemePreference() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    
    if (darkMode) {
        enableDarkTheme();
        $('#themeToggle').prop('checked', true);
    } else {
        enableLightTheme();
        $('#themeToggle').prop('checked', false);
    }
}

/**
 * Enable dark theme
 */
function enableDarkTheme() {
    $('body').addClass('dark-mode');
    localStorage.setItem('darkMode', 'true');
    
    // Change icons and colors for dark mode
    $('.form-check-label i').removeClass('fa-moon').addClass('fa-sun');
    adjustColorsForDarkTheme();
}

/**
 * Enable light theme
 */
function enableLightTheme() {
    $('body').removeClass('dark-mode');
    localStorage.setItem('darkMode', 'false');
    
    // Change icons and colors for light mode
    $('.form-check-label i').removeClass('fa-sun').addClass('fa-moon');
    adjustColorsForLightTheme();
}

/**
 * Adjust colors for dark theme
 */
function adjustColorsForDarkTheme() {
    // Add CSS variables for dark theme - using a more vibrant color palette
    const darkThemeStyles = `
        <style id="dark-theme">
            :root {
                --bg-color: #121212;
                --text-color: #ffffff;
                --text-secondary: #e0e0e0;
                --card-bg: #1e1e2f;
                --card-header: #2a2a45;
                --border-color: #3a3a5a;
                
                /* Vibrant accent colors */
                --accent-primary: #4e85fd;
                --accent-secondary: #6c5dd3;
                --accent-success: #05cd99;
                --accent-warning: #ffcf5c;
                --accent-danger: #f25767;
                --accent-info: #56c0e0;
            }
            
            /* Main body */
            body.dark-mode {
                background-color: var(--bg-color);
                color: var(--text-color);
                transition: background-color 0.3s ease, color 0.3s ease;
            }
            
            /* Cards with subtle gradient */
            body.dark-mode .card {
                background: linear-gradient(145deg, var(--card-bg), #232342);
                border-color: var(--border-color);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            
            body.dark-mode .card:hover {
                box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
            }
            
            body.dark-mode .card-header {
                background-color: var(--card-header);
                border-bottom: 1px solid var(--border-color);
            }
            
            /* Typography & text elements */
            body.dark-mode .table {
                color: var(--text-color);
            }
            
            body.dark-mode h1, body.dark-mode h2, body.dark-mode h3,
            body.dark-mode h4, body.dark-mode h5, body.dark-mode h6 {
                color: var(--accent-info);
            }
            
            body.dark-mode .text-muted {
                color: #a0a0c0 !important;
            }
            
            /* Form elements */
            body.dark-mode .modal-content {
                background: linear-gradient(145deg, var(--card-bg), #232342);
                color: var(--text-color);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
            
            body.dark-mode .form-control,
            body.dark-mode .form-select {
                background-color: rgba(30, 30, 50, 0.8);
                border: 1px solid var(--border-color);
                color: var(--text-color);
            }
            
            body.dark-mode .form-control:focus,
            body.dark-mode .form-select:focus {
                background-color: rgba(40, 40, 70, 0.9);
                border-color: var(--accent-primary);
                box-shadow: 0 0 0 0.2rem rgba(78, 133, 253, 0.25);
            }
            
            /* Lists and components */
            body.dark-mode .list-group-item {
                background-color: var(--card-bg);
                color: var(--text-color);
                border-color: var(--border-color);
            }
            
            /* Navigation */
            body.dark-mode .navbar {
                background: linear-gradient(90deg, #1a1a2e, #16213e) !important;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            }
            
            body.dark-mode .navbar-brand {
                color: var(--accent-primary) !important;
            }
            
            body.dark-mode .nav-link {
                color: var(--text-secondary) !important;
            }
            
            body.dark-mode .nav-link.active {
                color: var(--accent-info) !important;
                font-weight: 500;
            }
            
            /* Buttons */
            body.dark-mode .btn-primary {
                background-color: var(--accent-primary);
                border-color: var(--accent-primary);
            }
            
            body.dark-mode .btn-success {
                background-color: var(--accent-success);
                border-color: var(--accent-success);
            }
            
            body.dark-mode .btn-warning {
                background-color: var(--accent-warning);
                border-color: var(--accent-warning);
            }
            
            body.dark-mode .btn-danger {
                background-color: var(--accent-danger);
                border-color: var(--accent-danger);
            }
            
            body.dark-mode .btn-info {
                background-color: var(--accent-info);
                border-color: var(--accent-info);
            }
            
            /* Chart styles */
            body.dark-mode .chartjs-render-monitor {
                filter: brightness(1.1) contrast(1.1);
            }
            
            /* Background adjustments */
            body.dark-mode .bg-light {
                background-color: #2d2d4d !important;
            }
            
            body.dark-mode .bg-dark {
                background-color: #12122a !important;
            }
            
            body.dark-mode .text-dark {
                color: var(--text-color) !important;
            }
            
            body.dark-mode .border {
                border-color: var(--border-color) !important;
            }
            
            /* Mood emojis in dark mode */
            body.dark-mode .mood-emoji {
                filter: brightness(1.2);
            }
            
            body.dark-mode .mood-emoji-container.active {
                background-color: rgba(78, 133, 253, 0.2);
                box-shadow: 0 0 15px rgba(78, 133, 253, 0.3);
            }
            
            /* Welcome banner in dark mode */
            body.dark-mode .welcome-banner .card {
                background: linear-gradient(145deg, #273468, #152958) !important;
            }
        </style>
    `;
    
    // Remove light theme styles if they exist
    $('#light-theme').remove();
    
    // Add dark theme styles if they don't exist
    if ($('#dark-theme').length === 0) {
        $('head').append(darkThemeStyles);
    }
}

/**
 * Adjust colors for light theme
 */
function adjustColorsForLightTheme() {
    // Remove dark theme styles
    $('#dark-theme').remove();
    
    // If needed, we could add light theme specific overrides here
    const lightThemeStyles = `
        <style id="light-theme">
            /* Any light theme specific overrides would go here */
        </style>
    `;
    
    $('head').append(lightThemeStyles);
}

/**
 * Enhance mobile experience
 */
function enhanceMobileExperience() {
    // Add responsive classes to key elements
    $('.table').addClass('table-responsive');
    
    // Add quick action buttons for mobile
    if (window.innerWidth < 768) {
        // Only add if not already present
        if ($('#mobile-quick-actions').length === 0) {
            const quickActions = `
                <div id="mobile-quick-actions" class="fixed-bottom bg-light p-2 d-flex justify-content-around">
                    <button class="btn btn-sm btn-primary" id="quickMoodBtn">
                        <i class="fas fa-plus"></i> Mood
                    </button>
                    <button class="btn btn-sm btn-info" id="quickRecsBtn">
                        <i class="fas fa-lightbulb"></i> Tips
                    </button>
                    <button class="btn btn-sm btn-secondary" id="quickSettingsBtn">
                        <i class="fas fa-cog"></i> Settings
                    </button>
                </div>
            `;
            $('body').append(quickActions);
            
            // Add handlers
            $('#quickMoodBtn').on('click', function() {
                // Navigate to mood tab and open form
                $('.nav-link[href="#mood"]').tab('show');
                $('#add-mood-btn').click();
            });
            
            $('#quickRecsBtn').on('click', function() {
                // Navigate to recommendations tab
                $('.nav-link[href="#recommendations"]').tab('show');
            });
            
            $('#quickSettingsBtn').on('click', function() {
                // Toggle theme as a quick setting
                $('#themeToggle').click();
            });
        }
    }
}

/**
 * Enhance form elements for better UX
 */
function enhanceFormElements() {
    // Add animated labels to forms
    $('.form-control').each(function() {
        const $this = $(this);
        const label = $this.prev('label');
        
        if (label.length) {
            // Wrap in a form-floating div if not already
            if (!$this.parent().hasClass('form-floating')) {
                $this.add(label).wrapAll('<div class="form-floating mb-3"></div>');
                label.insertAfter($this);
            }
        }
    });
    
    // Add feedback when form is submitted
    $('form').on('submit', function() {
        const $form = $(this);
        const $submitBtn = $form.find('button[type="submit"]');
        
        // Store original text
        const originalText = $submitBtn.html();
        
        // Show saving indicator
        $submitBtn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...');
        $submitBtn.prop('disabled', true);
        
        // Reset button after a delay (you would remove this in a real app)
        setTimeout(function() {
            $submitBtn.html('<i class="fas fa-check"></i> Saved!');
            
            setTimeout(function() {
                $submitBtn.html(originalText);
                $submitBtn.prop('disabled', false);
            }, 1000);
        }, 800);
    });
}

/**
 * Add styles needed for UI enhancements
 */
$(function() {
    const customStyles = `
        <style>
            .mood-emoji {
                font-size: 2rem;
                line-height: 1;
            }
            
            .welcome-banner .card {
                border-radius: 10px;
                overflow: hidden;
            }
            
            @media (max-width: 767px) {
                #mobile-quick-actions {
                    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
                }
                
                /* Add padding to prevent content from being hidden behind the quick action bar */
                body {
                    padding-bottom: 60px;
                }
            }
            
            /* Progress indicator for recommendations */
            .recommendation-progress {
                height: 5px;
                background-color: #e9ecef;
                border-radius: 3px;
                overflow: hidden;
                margin-top: 5px;
            }
            
            .recommendation-progress-bar {
                height: 100%;
                background-color: #0d6efd;
                transition: width 0.5s;
            }
            
            /* Animation for welcome banner */
            .welcome-banner {
                animation: fadeInDown 0.5s;
            }
            
            @keyframes fadeInDown {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* Hover effects on cards */
            .card {
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .card:hover {
                transform: translateY(-3px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
            }
            
            /* Improve recommendation cards */
            .recommendation-card {
                border-left: 4px solid #0d6efd;
            }
            
            .recommendation-card.mindfulness {
                border-left-color: #9c27b0;
            }
            
            .recommendation-card.exercise {
                border-left-color: #4caf50;
            }
            
            .recommendation-card.social {
                border-left-color: #ff9800;
            }
            
            .recommendation-card.work-life {
                border-left-color: #3f51b5;
            }
        </style>
    `;
    
    // Add custom styles to head
    $('head').append(customStyles);
});
