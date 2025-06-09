// API Configuration
const API_BASE_URL = '/api';

// Function to check API status and update the indicator
function checkApiStatus() {
    const statusBadge = document.getElementById('api-status');
    
    // Start with checking status
    statusBadge.className = 'badge bg-secondary';
    statusBadge.textContent = 'Checking API...';
    
    fetch(`${API_BASE_URL}/wellbeing`, {
        method: 'GET',
        mode: 'cors',
        // Add a timeout using AbortController
        signal: AbortSignal.timeout(3000) // 3 second timeout
    })
    .then(response => {
        if (response.ok) {
            // API is online
            statusBadge.className = 'badge bg-success';
            statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> API Online';
            console.log('✅ API is working correctly!');
        } else {
            // API returned an error
            statusBadge.className = 'badge bg-warning';
            statusBadge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> API Error';
            console.log('⚠️ API returned an error:', response.status);
        }
    })
    .catch(error => {
        // API is offline or unreachable
        statusBadge.className = 'badge bg-danger';
        statusBadge.innerHTML = '<i class="fas fa-times-circle"></i> API Offline';
        console.log('❌ API is not available:', error.message);
    });
}

// API Service functions
const ApiService = {
    getWellbeingMetrics: async function() {
        const response = await fetch(`${API_BASE_URL}/wellbeing`, {
            signal: AbortSignal.timeout(5000), // 5 second timeout
            mode: 'cors'
        });
        
        if (!response.ok) throw new Error('Failed to fetch wellbeing metrics');
        return await response.json();
    },
    
    getRecommendations: async function() {
        const response = await fetch(`${API_BASE_URL}/wellbeing/recommendations`, {
            signal: AbortSignal.timeout(5000), // 5 second timeout
            mode: 'cors'
        });
        
        if (!response.ok) throw new Error('Failed to fetch recommendations');
        return await response.json();
    },
    
    recordMood: async function(moodRecord) {
        const response = await fetch(`${API_BASE_URL}/wellbeing/mood`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(moodRecord),
            signal: AbortSignal.timeout(5000), // 5 second timeout
            mode: 'cors'
        });
        
        if (!response.ok) throw new Error('Failed to record mood');
        return true;
    }
};

// Authentication Functions
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        // Redirect to login page if not logged in
        window.location.href = 'login.html';
        return false;
    }
    
    // Update UI with user info
    updateUserInfo(user);
    return true;
}

function updateUserInfo(user) {
    // Add user info to the navbar
    $('.navbar-nav').append(`
        <li class="nav-item dropdown ms-lg-3">
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                <i class="fas fa-user-circle me-1"></i> ${user.name}
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
                <li><span class="dropdown-item-text text-muted"><small>${user.role || 'Employee'}</small></span></li>
                ${user.isAdmin ? `<li><a class="dropdown-item" href="admin.html"><i class="fas fa-user-shield me-1"></i> Admin Dashboard</a></li>` : ''}
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" id="logout-btn"><i class="fas fa-sign-out-alt me-1"></i> Logout</a></li>
            </ul>
        </li>
    `);
    
    // Handle logout
    $('#logout-btn').on('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });
    
    // Dispatch custom event for chatbot to reset conversation for this user
    const userId = user.id || user.userId || 'user-' + Date.now();
    const userLoggedInEvent = new CustomEvent('userLoggedIn', {
        detail: { userId: userId, name: user.name }
    });
    window.dispatchEvent(userLoggedInEvent);
    console.log(`Dispatched userLoggedIn event for user: ${userId}`);
}

// Document Ready
$(document).ready(function() {
    console.log('Document ready - initializing application');
    
    // Remove any existing loaders before starting
    $('#loading-dashboard, #loading-recommendations').remove();
    
    // Check authentication status
    if (!checkAuth()) return;
    
    // Check API status immediately
    checkApiStatus();
    
    // Initialize the application with a slight delay to ensure DOM is ready
    setTimeout(() => {
        initializeDashboard();
        initializeMoodTracker();
        initializeRecommendations();
        setupNavigation();
    }, 100);
    
    // Set up periodic API status check every 30 seconds
    setInterval(checkApiStatus, 30000);
});

// Navigation
function setupNavigation() {
    // Navigation menu clicks
    $('.navbar-nav .nav-link').on('click', function(e) {
        e.preventDefault();
        
        // Update active nav link
        $('.navbar-nav .nav-link').removeClass('active');
        $(this).addClass('active');
        
        // Show corresponding page
        const targetPage = $(this).data('page');
        $('.page').removeClass('active');
        $(`#${targetPage}-page`).addClass('active');
    });
    
    // Quick action links
    $('[data-page-link]').on('click', function(e) {
        e.preventDefault();
        
        const targetPage = $(this).data('page-link');
        
        // Update active nav link
        $('.navbar-nav .nav-link').removeClass('active');
        $(`.navbar-nav .nav-link[data-page="${targetPage}"]`).addClass('active');
        
        // Show corresponding page
        $('.page').removeClass('active');
        $(`#${targetPage}-page`).addClass('active');
    });
}

// Loading utilities
const Loading = {
    show: function(containerId, message = 'Loading...') {
        // Force remove any existing loaders first
        this.hide(containerId);
        
        // Create loader and insert it
        const loaderId = `loader-${containerId}`;
        const loader = `
            <div id="${loaderId}" class="loader-container text-center my-3 py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">${message}</p>
            </div>
        `;
        $(`#${containerId}`).html(loader);
        console.log(`Loader shown: ${loaderId}`);
    },
    
    hide: function(containerId) {
        const loaderId = `loader-${containerId}`;
        $(`#${loaderId}`).remove();
        console.log(`Loader hidden: ${loaderId}`);
    }
};

// Dashboard Functions

// Store chart instance to properly update it
let moodChartInstance = null;

/**
 * Refreshes only the mood chart component without reloading the entire dashboard
 * This is used after submitting a new mood to ensure the chart stays visible
 */
async function refreshMoodChart() {
    console.log('Refreshing mood chart...');
    
    try {
        // Get latest metrics from API
        const wellbeingMetrics = await ApiService.getWellbeingMetrics();
        
        // Format data for chart
        const labels = wellbeingMetrics.moodTrends.map(trend => {
            const date = new Date(trend.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        const data = wellbeingMetrics.moodTrends.map(trend => trend.averageMood);
        
        // Check if chart canvas exists
        const chartCanvas = document.getElementById('moodChart');
        if (!chartCanvas) {
            console.log('Mood chart canvas not found, cannot refresh');
            return;
        }
        
        // If a chart instance already exists, destroy it first
        if (moodChartInstance) {
            console.log('Destroying existing chart instance');
            moodChartInstance.destroy();
        }
        
        // Create new chart
        console.log('Creating new chart instance');
        moodChartInstance = new Chart(chartCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Mood Trend',
                    data: data,
                    borderColor: '#4BC0C0',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 1,
                        max: 5
                    }
                },
                animation: {
                    duration: 1000 // Smooth animation for better UX
                }
            }
        });
        console.log('Mood chart refreshed successfully');
    } catch (error) {
        console.error('Error refreshing mood chart:', error);
    }
}

async function initializeDashboard() {
    console.log('Initializing dashboard...');
    
    // Prepare containers
    const metricsContainer = 'dashboard-metrics';
    
    // First update the metrics container
    $('#mood-display').html(`
        <div id="${metricsContainer}"></div>
    `);
    
    // Make sure the chart canvas exists - but don't recreate it if it exists
    if ($('#moodChart').length === 0) {
        console.log('Chart canvas does not exist, creating it');
        $('.mood-chart-container').html(`<canvas id="moodChart"></canvas>`);
    } else {
        console.log('Chart canvas already exists, keeping it');
    }
    
    // Show loaders
    Loading.show(metricsContainer, 'Loading wellbeing metrics...');
    $('#moodChart').css('opacity', '0.5'); // Dim the chart while loading
    
    try {
        console.log('Fetching dashboard data...');
        // Get metrics from API
        const wellbeingMetrics = await ApiService.getWellbeingMetrics();
        console.log('Dashboard data received:', wellbeingMetrics);
        
        // Update metrics display
        Loading.hide(metricsContainer);
        $(`#${metricsContainer}`).html(`
            <h3 class="card-title">Overall Mood</h3>
            <p class="display-4">${wellbeingMetrics.averageMood.toFixed(1)}/5</p>
            <p class="text-muted">Based on your last ${wellbeingMetrics.moodEntriesCount} entries</p>
        `);
        
        // Format data for chart
        const labels = wellbeingMetrics.moodTrends.map(trend => {
            const date = new Date(trend.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        const data = wellbeingMetrics.moodTrends.map(trend => trend.averageMood);
        
        // If a chart instance already exists, destroy it first
        if (moodChartInstance) {
            console.log('Destroying existing chart instance');
            moodChartInstance.destroy();
        }
        
        // Create new chart
        const ctx = document.getElementById('moodChart');
        if (ctx) {
            console.log('Creating new chart instance in dashboard');
            moodChartInstance = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Mood Trend',
                        data: data,
                        borderColor: '#4BC0C0',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 1,
                            max: 5
                        }
                    },
                    animation: {
                        duration: 1000 // Smooth animation for better UX
                    }
                }
            });
            $('#moodChart').css('opacity', '1'); // Restore chart visibility
        } else {
            console.error('Chart canvas element not found!');
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Show error messages
        Loading.hide(metricsContainer);
        $('#moodChart').css('opacity', '1'); // Restore chart visibility even on error
        
        $(`#${metricsContainer}`).html(`
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i> 
                Unable to load wellbeing data. Please ensure the API is running.
                <div class="mt-2">
                    <button class="btn btn-sm btn-outline-danger" onclick="initializeDashboard()">Retry</button>
                </div>
            </div>
        `);
    }
}

// Mood Tracker Functions
function initializeMoodTracker() {
    // Set up clickable mood emojis
    $('.mood-emoji-container').on('click', function() {
        // Remove active class from all emojis
        $('.mood-emoji-container').removeClass('active');
        
        // Add active class to clicked emoji
        $(this).addClass('active');
        
        // Update the hidden input with the mood score
        const moodScore = $(this).data('mood-score');
        $('#mood-score').val(moodScore);
        
        console.log('Mood selected:', moodScore);
        
        // Add animation effect
        const emoji = $(this).find('.mood-emoji');
        emoji.css('transform', 'scale(1.2)');
        setTimeout(() => {
            emoji.css('transform', 'scale(1)');
        }, 200);
    });
    
    // Character count for notes
    $('#mood-notes').on('input', function() {
        const count = $(this).val().length;
        $('#notes-count').text(count);
        
        if (count > 200) {
            $('#notes-count').addClass('text-danger');
        } else {
            $('#notes-count').removeClass('text-danger');
        }
    });
    
    // Clear form
    $('#mood-clear-btn').on('click', function() {
        $('#mood-form')[0].reset();
        $('#mood-score').val(3);
        $('#mood-notes').val('');
        $('#notes-count').text('0');
        $('#mood-success-alert').addClass('d-none');
        $('#mood-error-alert').addClass('d-none');
    });
    
    // Submit form
    $('#mood-form').on('submit', async function(e) {
        e.preventDefault();
        
        // Disable submit button and show loading
        const submitBtn = $(this).find('button[type="submit"]');
        const originalBtnText = submitBtn.text();
        submitBtn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...');
        
        const moodRecord = {
            userId: 1, // Mock user ID
            moodScore: parseInt($('#mood-score').val()),
            notes: $('#mood-notes').val().trim(),
            recordedAt: new Date().toISOString()
        };
        
        try {
            // Send data to the backend API
            await ApiService.recordMood(moodRecord);
            
            // Show success message
            $('#mood-success-alert').removeClass('d-none');
            
            // Always refresh the mood chart data regardless of which tab is active
            refreshMoodChart();
            
            // Reset form after 3 seconds
            setTimeout(function() {
                $('#mood-clear-btn').click();
                // Refresh entire dashboard if we're on that tab
                if ($('.nav-link[data-page="dashboard"]').hasClass('active')) {
                    initializeDashboard();
                }
            }, 3000);
            
        } catch (error) {
            console.error('Error submitting mood:', error);
            $('#mood-error-alert').removeClass('d-none').text('Failed to record mood. Please ensure the API is running.');
        } finally {
            // Re-enable submit button
            submitBtn.prop('disabled', false).text(originalBtnText);
        }
    });
}

// Recommendations Functions
async function initializeRecommendations() {
    const container = 'recommendations-container';
    
    // Show loading state
    Loading.show(container, 'Loading recommendations...');
    
    try {
        console.log('Fetching recommendations...');
        // Fetch recommendations from API
        const recommendations = await ApiService.getRecommendations();
        console.log('Recommendations received:', recommendations.length);
        
        // Clear loading indicator
        Loading.hide(container);
        
        // Display recommendations
        displayRecommendations(recommendations);
        
        // Setup filtering
        $('.category-filter').on('click', function() {
            $('.category-filter').removeClass('btn-primary').addClass('btn-outline-primary');
            $(this).removeClass('btn-outline-primary').addClass('btn-primary');
            
            const category = $(this).data('category');
            
            if (category === 'all') {
                displayRecommendations(recommendations);
            } else {
                const filteredRecommendations = recommendations.filter(rec => rec.category === category);
                displayRecommendations(filteredRecommendations);
            }
        });
    } catch (error) {
        console.error('Error loading recommendations:', error);
        
        // Hide loading indicator and show error message
        Loading.hide(container);
        
        $(`#${container}`).html(`
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i> 
                Unable to load recommendations. Please ensure the API is running.
                <div class="mt-2">
                    <button class="btn btn-sm btn-outline-danger" onclick="initializeRecommendations()">Retry</button>
                </div>
            </div>
        `);
    }
}

function displayRecommendations(recs) {
    const containerId = 'recommendations-container';
    const containerElement = $(`#${containerId}`);
    
    // Clear container
    containerElement.empty();
    
    // Check if we have recommendations
    if (recs.length === 0) {
        containerElement.html('<div class="col-12 text-center my-5"><p>No recommendations found for the selected category.</p></div>');
        return;
    }
    
    // Create a row for the cards
    const row = $('<div class="row"></div>');
    containerElement.append(row);
    
    // Add each recommendation card
    recs.forEach(rec => {
        const card = `
            <div class="col-md-6 mb-4">
                <div class="card h-100 recommendation-card">
                    <div class="card-body">
                        <span class="badge bg-info mb-2">${rec.category}</span>
                        <h3 class="card-title">${rec.title}</h3>
                        <p class="card-text">${rec.description}</p>
                    </div>
                    <div class="card-footer bg-white border-top-0">
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-sm btn-outline-secondary">Save for Later</button>
                            <button class="btn btn-sm btn-success">Try This</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        row.append(card);
    });
    
    // Log that we're done displaying recommendations
    console.log(`Displayed ${recs.length} recommendations`);
}
