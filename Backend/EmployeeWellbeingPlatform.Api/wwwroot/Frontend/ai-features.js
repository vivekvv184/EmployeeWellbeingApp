/**
 * AI Features for Employee Wellbeing Platform
 * Integrates with UKG AI Service through our backend API
 */

// Initialize AI features when document is ready
$(document).ready(function() {
    console.log("Initializing AI features...");
    initAIFeatures();
});

/**
 * Initialize AI features on the dashboard
 */
function initAIFeatures() {
    // Check if the AI section exists (we're on the dashboard)
    if ($('#ai-insights-container').length === 0) {
        // If we're not on the dashboard, just return
        return;
    }
    
    // Add AI insights section to the dashboard
    addAISection();
    
    // Set up event handlers
    setupAIEventHandlers();
    
    // Check AI service status
    checkAIServiceStatus();
    
    // Set up periodic status check (every 30 seconds)
    setInterval(checkAIServiceStatus, 30000);
    
    // Check if we should load initial insights (if user already has mood data)
    checkForMoodData();
}

/**
 * Check AI service status and update the badge
 */
function checkAIServiceStatus() {
    $.ajax({
        url: '/api/AI/status',
        method: 'GET',
        timeout: 5000,
        success: function(data) {
            console.log('AI service status:', data);
            updateAIStatusBadge(data);
        },
        error: function(xhr, status, error) {
            console.error('Error checking AI status:', error);
            // Update badge to show offline status
            updateAIStatusBadge({
                status: 'offline',
                message: 'AI service is unavailable',
                isAvailable: false
            });
        }
    });
}

/**
 * Update the AI status badge based on service status
 */
function updateAIStatusBadge(statusData) {
    const badge = $('#ai-status-badge');
    
    // Remove all existing classes
    badge.removeClass('bg-success bg-danger bg-warning bg-secondary bg-info');
    
    // Set appropriate class and text based on status
    switch(statusData.status) {
        case 'online':
            badge.addClass('bg-success').text('Online');
            break;
            
        case 'offline':
            badge.addClass('bg-danger').text('Offline');
            break;
            
        case 'disabled':
            badge.addClass('bg-warning').text('Disabled');
            break;
            
        default:
            badge.addClass('bg-secondary').text('Unknown');
    }
    
    // Set tooltip with detailed message
    badge.attr('title', statusData.message || 'AI service status');
    
    // If bootstrap tooltip is initialized, update it
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        var tooltip = bootstrap.Tooltip.getInstance(badge[0]);
        if (tooltip) {
            tooltip.dispose();
        }
        new bootstrap.Tooltip(badge[0]);
    }
}

/**
 * Add AI section to the dashboard
 */
function addAISection() {
    const aiSection = `
        <div class="card shadow mb-4">
            <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                <h6 class="m-0 font-weight-bold text-primary">
                    <i class="fas fa-robot mr-2"></i>AI Insights
                    <span id="ai-status-badge" class="badge bg-secondary ms-2" title="Checking AI service status...">Checking...</span>
                </h6>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="ai-features-toggle" checked>
                    <label class="form-check-label" for="ai-features-toggle">Enable AI</label>
                </div>
            </div>
            <div class="card-body" id="ai-insights-content">
                <div id="ai-loading" class="text-center py-3 d-none">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Analyzing your wellbeing data...</p>
                </div>
                
                <div id="ai-no-data" class="text-center py-3">
                    <i class="fas fa-chart-line fa-3x text-gray-300 mb-3"></i>
                    <p>Record your mood to receive AI-powered insights</p>
                </div>
                
                <div id="ai-results" class="d-none">
                    <div id="ai-analysis-container" class="mb-4">
                        <h5><i class="fas fa-brain mr-2"></i>Mood Analysis</h5>
                        <div id="ai-analysis-content" class="p-3 border rounded">
                            <!-- Analysis content will be inserted here -->
                        </div>
                    </div>
                    
                    <div id="ai-recommendation-container">
                        <h5><i class="fas fa-lightbulb mr-2"></i>Personalized Recommendation</h5>
                        <div id="ai-recommendation-content" class="p-3 border rounded">
                            <!-- Recommendation content will be inserted here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insert the AI section after the mood chart
    $('#mood-chart-container').after(aiSection);
}

/**
 * Set up event handlers for AI features
 */
function setupAIEventHandlers() {
    // Toggle AI features
    $('#ai-features-toggle').on('change', function() {
        const isEnabled = $(this).prop('checked');
        
        if (isEnabled) {
            // Enable AI features
            $('#ai-insights-content').removeClass('text-muted opacity-50');
            checkForMoodData();
        } else {
            // Disable AI features
            $('#ai-insights-content').addClass('text-muted opacity-50');
            $('#ai-loading').addClass('d-none');
            $('#ai-results').addClass('d-none');
            $('#ai-no-data').removeClass('d-none');
        }
        
        // Save preference in localStorage
        localStorage.setItem('aiEnabled', isEnabled);
    });
    
    // Load saved preference
    const savedPreference = localStorage.getItem('aiEnabled');
    if (savedPreference !== null) {
        const isEnabled = savedPreference === 'true';
        $('#ai-features-toggle').prop('checked', isEnabled);
        
        if (!isEnabled) {
            $('#ai-insights-content').addClass('text-muted opacity-50');
        }
    }
    
    // When a new mood is submitted, update AI insights
    $(document).on('mood-submitted', function(e, moodData) {
        console.log("Mood submitted, updating AI insights...", moodData);
        updateAIInsights(moodData.id);
    });
}

/**
 * Check if user has mood data and load insights if available
 */
function checkForMoodData() {
    if (!$('#ai-features-toggle').prop('checked')) {
        return;
    }
    
    // Get latest mood entries
    $.ajax({
        url: '/api/Wellbeing/mood/1', // User ID 1 for demo
        method: 'GET',
        success: function(data) {
            if (data && data.length > 0) {
                // User has mood data, get insights for the latest entry
                const latestMood = data[0];
                updateAIInsights(latestMood.id);
            } else {
                // No mood data
                showNoDataMessage();
            }
        },
        error: function(xhr, status, error) {
            console.error("Error fetching mood data:", error);
            showNoDataMessage();
        }
    });
}

/**
 * Update AI insights based on mood data
 */
function updateAIInsights(moodId) {
    if (!$('#ai-features-toggle').prop('checked')) {
        return;
    }
    
    // Show loading state
    $('#ai-no-data').addClass('d-none');
    $('#ai-results').addClass('d-none');
    $('#ai-loading').removeClass('d-none');
    
    // Get analysis for the mood
    $.ajax({
        url: `/api/AI/analyze/${moodId}`,
        method: 'GET',
        timeout: 10000, // 10 second timeout
        success: function(analysisData) {
            console.log("AI analysis data received:", analysisData);
            
            // Get personalized recommendation
            $.ajax({
                url: '/api/AI/recommendation/1', // User ID 1 for demo
                method: 'GET',
                timeout: 10000, // 10 second timeout
                success: function(recommendationData) {
                    console.log("AI recommendation received:", recommendationData);
                    
                    // Update UI with both analysis and recommendation
                    updateAnalysisUI(analysisData);
                    updateRecommendationUI(recommendationData && recommendationData.recommendation ? 
                        recommendationData.recommendation : 
                        "Consider taking regular breaks during your workday to refresh your mind and maintain focus.");
                    
                    // Hide loading, show results
                    $('#ai-loading').addClass('d-none');
                    $('#ai-results').removeClass('d-none');
                },
                error: function(xhr, status, error) {
                    console.error("Error fetching recommendation:", error, status, xhr.responseText);
                    // Still show analysis, but with generic recommendation
                    updateAnalysisUI(analysisData);
                    updateRecommendationUI("Consider taking regular breaks during your workday to refresh your mind and maintain focus.");
                    
                    // Hide loading, show results
                    $('#ai-loading').addClass('d-none');
                    $('#ai-results').removeClass('d-none');
                }
            });
        },
        error: function(xhr, status, error) {
            console.error("Error fetching mood analysis:", error, status, xhr.responseText);
            // Hide loading, show no data message
            $('#ai-loading').addClass('d-none');
            $('#ai-results').addClass('d-none');
            $('#ai-no-data').removeClass('d-none');
            
            // Show error message with details
            $('#ai-no-data').html(`
                <div class="text-center py-3">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <p>Could not load AI insights. Please try again later.</p>
                    <small class="text-muted">Error: ${error || 'Unknown error'}</small>
                </div>
            `);
        }
    });
}

/**
 * Update the analysis UI with data from the API
 */
function updateAnalysisUI(analysisData) {
    // Ensure we have valid data
    if (!analysisData) {
        $('#ai-analysis-content').html('<div class="alert alert-warning">No analysis data available.</div>');
        return;
    }

    let htmlContent = '';
    
    // Add sentiment with appropriate icon and color
    let sentimentIcon = 'fas fa-meh text-warning';
    if (analysisData.sentiment === 'positive') {
        sentimentIcon = 'fas fa-smile text-success';
    } else if (analysisData.sentiment === 'negative') {
        sentimentIcon = 'fas fa-frown text-danger';
    }
    
    // Add sentiment info with null check
    const sentimentText = analysisData.sentiment ? capitalizeFirstLetter(analysisData.sentiment) : 'Neutral';
    htmlContent += `<p class="mb-3"><i class="${sentimentIcon} mr-2"></i><strong>Sentiment:</strong> ${sentimentText}</p>`;
    
    // Add main themes
    if (analysisData.mainThemes && analysisData.mainThemes.length > 0) {
        htmlContent += `<p class="mb-3"><strong>Key Themes:</strong> `;
        htmlContent += analysisData.mainThemes.map(theme => 
            `<span class="badge bg-primary text-white mr-1">${capitalizeFirstLetter(theme)}</span>`
        ).join(' ');
        htmlContent += `</p>`;
    }
    
    // Add insights
    if (analysisData.insights) {
        htmlContent += `<p class="mb-3"><strong>Insights:</strong> ${analysisData.insights}</p>`;
    }
    
    // Add suggested activities
    if (analysisData.suggestedActivities && analysisData.suggestedActivities.length > 0) {
        htmlContent += `<div class="mt-3">
            <strong>Suggested Activities:</strong>
            <ul class="mt-2">`;
        
        analysisData.suggestedActivities.forEach(activity => {
            htmlContent += `<li><i class="fas fa-check-circle text-success mr-2"></i>${activity}</li>`;
        });
        
        htmlContent += `</ul></div>`;
    }
    
    // Update the UI
    $('#ai-analysis-content').html(htmlContent);
}

/**
 * Update the recommendation UI with data from the API
 */
function updateRecommendationUI(recommendation) {
    // Handle null, undefined, or empty recommendation
    if (!recommendation) {
        recommendation = "Consider taking regular breaks during your workday to refresh your mind and maintain focus.";
    }
    
    const htmlContent = `
        <div class="d-flex">
            <div class="mr-3">
                <i class="fas fa-lightbulb text-warning fa-2x"></i>
            </div>
            <div>
                <p class="mb-0">${recommendation}</p>
            </div>
        </div>
    `;
    
    // Update the UI
    $('#ai-recommendation-content').html(htmlContent);
}

/**
 * Show message when no data is available
 */
function showNoDataMessage() {
    $('#ai-loading').addClass('d-none');
    $('#ai-results').addClass('d-none');
    $('#ai-no-data').removeClass('d-none');
}

/**
 * Helper function to capitalize the first letter of a string
 */
function capitalizeFirstLetter(string) {
    // Handle null, undefined, or empty string
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}
