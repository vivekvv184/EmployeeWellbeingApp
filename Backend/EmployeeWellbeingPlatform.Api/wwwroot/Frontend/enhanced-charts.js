/**
 * Enhanced Charts Module for Employee Wellbeing Platform
 * Provides advanced visualizations for mood tracking and wellbeing metrics
 */

// Wait for document to be fully loaded
$(document).ready(function() {
    console.log('Enhanced charts module loaded');
    
    // Define apiBaseUrl if it's not already defined
    if (typeof apiBaseUrl === 'undefined') {
        window.apiBaseUrl = '/api';
        console.log('Setting default apiBaseUrl:', apiBaseUrl);
    }
    
    // Initialize enhanced charts when dashboard is shown
    $('.nav-link[href="#dashboard"]').on('click', function() {
        console.log('Dashboard tab clicked, initializing charts');
        setTimeout(initEnhancedCharts, 800);
    });
    
    // Also initialize on first load if dashboard is active
    if ($('#dashboard-page').hasClass('active')) {
        console.log('Dashboard active on page load, initializing charts');
        // Wait longer on initial load to ensure everything is ready
        setTimeout(initEnhancedCharts, 1000);
    } else {
        console.log('Dashboard not active on page load');
    }
    
    // Add a global initialization function that can be called from the console for debugging
    window.initCharts = function() {
        console.log('Manual chart initialization requested');
        initEnhancedCharts();
    };
});

/**
 * Initialize all enhanced charts
 */
function initEnhancedCharts() {
    createWeeklyMoodTrend();
    updateMoodDisplay();
}

/**
 * Create a weekly mood trend line chart
 */
function createWeeklyMoodTrend() {
    // Check if chart container exists, if not create it
    if ($('#weekly-mood-chart').length === 0) {
        $('#dashboard-metrics').after(
            `<div class="mt-4">
                <h5 class="text-primary">Weekly Mood Trend</h5>
                <div class="card shadow-sm">
                    <div class="card-body">
                        <canvas id="weekly-mood-chart" height="200"></canvas>
                    </div>
                </div>
            </div>`
        );
    }
    
    // Check if apiBaseUrl is defined, otherwise define it
    if (typeof apiBaseUrl === 'undefined') {
        console.log('apiBaseUrl not defined, setting default');
        window.apiBaseUrl = '/api';
    }
    
    console.log('Fetching mood data from API:', apiBaseUrl + '/Wellbeing/mood/1');
    
    // Get mood data from API
    $.ajax({
        url: apiBaseUrl + '/Wellbeing/mood/1',
        method: 'GET',
        success: function(moodData) {
            console.log('Received mood data:', moodData);
            // Process the data for the chart
            const processedData = processWeeklyMoodData(moodData);
            
            // Destroy existing chart if it exists
            if (window.weeklyMoodChart instanceof Chart) {
                window.weeklyMoodChart.destroy();
            }
            
            // Check if the canvas element exists
            const chartCanvas = document.getElementById('weekly-mood-chart');
            if (!chartCanvas) {
                console.error('Chart canvas element not found');
                return;
            }
            
            // Create the chart
            const ctx = chartCanvas.getContext('2d');
            window.weeklyMoodChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: processedData.labels,
                    datasets: [{
                        label: 'Mood Rating',
                        data: processedData.data,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        pointBackgroundColor: function(context) {
                            const value = context.dataset.data[context.dataIndex];
                            return value >= 4 ? '#28a745' : value <= 2 ? '#dc3545' : '#ffc107';
                        },
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 5,
                            title: {
                                display: true,
                                text: 'Mood Rating (1-5)'
                            },
                            ticks: {
                                callback: function(value) {
                                    const labels = ['', 'Very Low', 'Low', 'Neutral', 'Good', 'Excellent'];
                                    return labels[value] || value;
                                }
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                afterLabel: function(context) {
                                    const moodItem = moodData[context.dataIndex];
                                    return moodItem && moodItem.notes ? 'Notes: ' + moodItem.notes : '';
                                }
                            }
                        },
                        legend: {
                            display: false
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        },
        error: function(err) {
            console.error('Error fetching mood data:', err);
            $('#weekly-mood-chart').parent().html(
                '<div class="alert alert-warning">Could not load mood trend data. Please try again later.</div>'
            );
        }
    });
}

/**
 * Process raw mood data into weekly trends
 */
function processWeeklyMoodData(moodData) {
    // Log the data we're receiving (helpful for debugging)
    console.log('Processing mood data for chart:', moodData);
    
    // If no data, return sample data for demo
    if (!moodData || moodData.length === 0) {
        console.log('No mood data, using sample data');
        // Sample data for demonstration
        return {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today'],
            data: [3, 2, 3, 4, 3, 4]
        };
    }
    
    try {
        // Normalize the data structure based on what we receive
        const normalizedData = moodData.map(item => {
            // Handle different possible formats
            return {
                moodScore: item.moodScore !== undefined ? item.moodScore : 
                          (item.score !== undefined ? item.score : 3),
                recordedAt: item.recordedAt || item.date || new Date(),
                notes: item.notes || ''
            };
        });
        
        // Sort by date
        normalizedData.sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
        
        // Get the last 7 entries or fewer if not enough data
        const recentData = normalizedData.slice(-7);
        
        console.log('Processed data for chart:', {
            labels: recentData.map(item => formatDate(item.recordedAt)),
            data: recentData.map(item => item.moodScore)
        });
        
        return {
            labels: recentData.map(item => formatDate(item.recordedAt)),
            data: recentData.map(item => item.moodScore)
        };
    } catch (error) {
        console.error('Error processing mood data:', error);
        // Return fallback data
        return {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today'],
            data: [3, 3, 3, 3, 3, 3]
        };
    }
}

// Mood distribution chart removed as requested

/**
 * Calculate distribution of mood scores
 */
function calculateMoodDistribution(moodData) {
    // If no data, return sample data for demo
    if (!moodData || moodData.length === 0) {
        return { 1: 1, 2: 2, 3: 5, 4: 3, 5: 2 };
    }
    
    // Count occurrences of each mood score
    const distribution = {};
    moodData.forEach(item => {
        const score = item.moodScore;
        distribution[score] = (distribution[score] || 0) + 1;
    });
    
    return distribution;
}

/**
 * Update the main mood display with enhanced styling
 */
function updateMoodDisplay() {
    // Add a current mood section with trend indicator if it doesn't exist
    if ($('#current-mood-display').length === 0) {
        $('#mood-display').prepend(
            `<div id="current-mood-display" class="mb-4">
                <h5 class="text-primary">Current Wellbeing</h5>
                <div class="d-flex align-items-center">
                    <div id="mood-indicator" class="me-3">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    <div id="mood-trend" class="badge bg-secondary">Loading...</div>
                </div>
            </div>`
        );
    }
    
    // Get the most recent mood data
    $.ajax({
        url: apiBaseUrl + '/Wellbeing/mood/1',
        method: 'GET',
        success: function(moodData) {
            if (moodData && moodData.length > 0) {
                // Sort by date descending
                moodData.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
                
                const latestMood = moodData[0];
                const moodScore = latestMood.moodScore;
                
                // Create emoji mood indicator based on score
                let emoji, mood, colorClass;
                switch (moodScore) {
                    case 5:
                        emoji = '😀';
                        mood = 'Excellent';
                        colorClass = 'text-success';
                        break;
                    case 4:
                        emoji = '🙂';
                        mood = 'Good';
                        colorClass = 'text-primary';
                        break;
                    case 3:
                        emoji = '😐';
                        mood = 'Neutral';
                        colorClass = 'text-warning';
                        break;
                    case 2:
                        emoji = '😔';
                        mood = 'Low';
                        colorClass = 'text-orange';
                        break;
                    case 1:
                        emoji = '😢';
                        mood = 'Very Low';
                        colorClass = 'text-danger';
                        break;
                    default:
                        emoji = '❓';
                        mood = 'Unknown';
                        colorClass = 'text-secondary';
                }
                
                // Update the mood indicator
                $('#mood-indicator').html(
                    `<div class="mood-emoji ${colorClass}" style="font-size: 3rem;">${emoji}</div>`
                );
                
                // Calculate mood trend if we have enough data
                if (moodData.length > 1) {
                    const prevMood = moodData[1].moodScore;
                    let trendBadge, trendText;
                    
                    if (moodScore > prevMood) {
                        trendBadge = 'bg-success';
                        trendText = `<i class="fas fa-arrow-up"></i> Improving (${moodScore} vs ${prevMood})`;
                    } else if (moodScore < prevMood) {
                        trendBadge = 'bg-danger';
                        trendText = `<i class="fas fa-arrow-down"></i> Declining (${moodScore} vs ${prevMood})`;
                    } else {
                        trendBadge = 'bg-secondary';
                        trendText = `<i class="fas fa-equals"></i> Stable (${moodScore})`;
                    }
                    
                    $('#mood-trend').attr('class', `badge ${trendBadge}`).html(trendText);
                } else {
                    $('#mood-trend').attr('class', 'badge bg-info').text(`${mood} (${moodScore}/5)`);
                }
                
                // Add last recorded date
                const recordedDate = new Date(latestMood.recordedAt);
                $('#current-mood-display').append(
                    `<div class="text-muted mt-2 small">Last recorded: ${formatDate(latestMood.recordedAt)}</div>`
                );
                
                // If we have notes, show them
                if (latestMood.notes) {
                    $('#current-mood-display').append(
                        `<div class="mt-2 p-2 border-start border-4 border-${colorClass.replace('text-', '')} bg-light">
                            <em>${latestMood.notes}</em>
                        </div>`
                    );
                }
            } else {
                $('#mood-indicator').html(
                    `<div class="text-center">
                        <div class="mood-emoji text-secondary" style="font-size: 3rem;">❓</div>
                        <div>No mood data</div>
                    </div>`
                );
                $('#mood-trend').attr('class', 'badge bg-secondary').text('No data');
            }
        },
        error: function(err) {
            console.error('Error fetching mood data:', err);
            $('#mood-indicator').html(
                `<div class="alert alert-warning">Could not load mood data.</div>`
            );
        }
    });
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        // Get day name
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[date.getDay()] + ' ' + date.getDate() + '/' + (date.getMonth() + 1);
    }
}
