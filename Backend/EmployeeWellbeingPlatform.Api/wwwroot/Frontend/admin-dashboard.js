/**
 * Load dashboard data and statistics from the backend API
 */
function loadDashboardData() {
    console.log('Loading dashboard data...');
    // Show loading indicators
    $('#total-users-count').html('<span class="spinner-border spinner-border-sm" role="status"></span>');
    $('#total-moods-count').html('<span class="spinner-border spinner-border-sm" role="status"></span>');
    $('#average-mood-value').html('<span class="spinner-border spinner-border-sm" role="status"></span>');
    
    // Update API status check
    checkAPIStatus();
    
    // First check users count
    $.ajax({
        url: '/api/Users/count',
        method: 'GET',
        timeout: 3000,
        success: function(response) {
            $('#total-users-count').text(response.count || 0);
        },
        error: function() {
            $('#total-users-count').text('--');
        }
    });
    
    // Check wellbeing metrics
    $.ajax({
        url: '/api/Wellbeing/metrics',
        method: 'GET',
        timeout: 5000,
        success: function(metrics) {
            console.log('Metrics loaded:', metrics);
            
            // Update stats
            $('#total-moods-count').text(metrics.totalEntries || 0);
            
            if (metrics.averageMood) {
                $('#average-mood-value').text(metrics.averageMood);
            } else {
                $('#average-mood-value').text('--');
            }
            
            // Get data source info
            const usingMongoDB = metrics.dataSource && metrics.dataSource.includes('MongoDB');
            const dataSourceText = usingMongoDB ? 'MongoDB Atlas' : 'Static Data';
            const badgeClass = usingMongoDB ? 'bg-success' : 'bg-warning';
            
            // Update both data source indicators
            $('#data-source-badge').text(dataSourceText);
            $('#data-source-badge').parent().removeClass('bg-info bg-warning bg-success bg-danger').addClass(badgeClass);
            
            $('#data-source-info').html(`<span class="badge ${badgeClass}">${dataSourceText}</span>`);
            
            // Update last updated timestamp
            $('#last-updated-time').text(new Date().toLocaleTimeString());
            
            // Mark API as online since we got a response
            $('#api-status-badge').html('<span class="badge bg-success">Online</span>');
        },
        error: function(xhr, status, error) {
            console.error('Error fetching metrics:', error, status);
            $('#total-moods-count').text('--');
            $('#average-mood-value').text('--');
            $('#data-source-info').html('<span class="badge bg-danger">Unavailable</span>');
            
            // Try fetching recommendations as a fallback to test API connection
            testAPIConnection();
        }
    });
    
    /**
     * Test API connection by trying multiple endpoints
     */
    function testAPIConnection() {
        $.ajax({
            url: '/api/Wellbeing/recommendations',
            method: 'GET',
            timeout: 3000,
            success: function() {
                // API is working with other endpoints
                $('#api-status-badge').html('<span class="badge bg-success">Online</span>');
                $('#data-source-info').html('<span class="badge bg-warning">Static Data</span>');
                
                // Try to get some data for mood entries
                $.ajax({
                    url: '/api/Wellbeing/mood/1',
                    method: 'GET',
                    success: function(moodRecords) {
                        if (Array.isArray(moodRecords)) {
                            $('#total-moods-count').text(moodRecords.length);
                        }
                    }
                });
            },
            error: function() {
                // API is truly offline
                $('#api-status-badge').html('<span class="badge bg-danger">Offline</span>');
            }
        });
    }
    
    // Check MongoDB status
    $.ajax({
        url: '/api/Dashboard/stats',
        method: 'GET',
        timeout: 3000,
        success: function(stats) {
            // Update MongoDB status
            const dbStatusBadge = stats.databaseStatus === 'Connected' ? 
                '<span class="badge bg-success">Connected</span>' : 
                '<span class="badge bg-danger">Disconnected</span>';
            $('#db-status-badge').html(dbStatusBadge);
        },
        error: function() {
            $('#db-status-badge').html('<span class="badge bg-danger">Unavailable</span>');
        }
    });
    
    // Check AI service
    $.ajax({
        url: '/api/AI/status',
        method: 'GET',
        timeout: 3000,
        success: function(data) {
            const aiStatus = data.status === 'online' ? 'Online' : (data.status === 'disabled' ? 'Disabled' : 'Offline');
            const statusClass = data.status === 'online' ? 'bg-success' : (data.status === 'disabled' ? 'bg-warning' : 'bg-danger');
            
            $('#ai-status-badge').html(`<span class="badge ${statusClass}">${aiStatus}</span>`);
        },
        error: function() {
            $('#ai-status-badge').html('<span class="badge bg-danger">Unavailable</span>');
        }
    });
}

/**
 * Check if the API is online and update the status indicator
 */
function checkAPIStatus() {
    $.ajax({
        url: '/api/Wellbeing/metrics',
        method: 'GET',
        timeout: 3000,
        success: function() {
            $('#api-status-badge').html('<span class="badge bg-success">Online</span>');
        },
        error: function() {
            $('#api-status-badge').html('<span class="badge bg-danger">Offline</span>');
        }
    });
}

// Initialize dashboard when document is ready
$(document).ready(function() {
    console.log('Initializing admin dashboard...');
    
    // Load dashboard data immediately
    loadDashboardData();
    
    // Set interval to refresh dashboard data every minute
    setInterval(loadDashboardData, 60000);
    
    // Add click handler for refresh button if present
    $('#refresh-dashboard-btn').on('click', function() {
        loadDashboardData();
    });
});
