/**
 * Chatbot functionality for Employee Wellbeing Platform
 */

// Store chat history
let chatHistory = [];

// Current user ID for personalized chat history
let currentUserId = null;

// Basic responses for the chatbot
const defaultResponses = {
    greeting: [
        "Hello! I'm your wellbeing assistant. How are you feeling today?",
        "Hi there! I'm here to support your wellbeing journey. How can I help?",
        "Welcome! I'm your AI wellbeing companion. What's on your mind today?"
    ],
    feelingGood: [
        "That's wonderful to hear! What's contributing to your positive mood today?",
        "Great! It's important to recognize what makes us feel good. Anything specific you'd like to share?",
        "Excellent! Would you like some tips to maintain this positive energy?"
    ],
    feelingBad: [
        "I'm sorry to hear that. Would you like to talk about what's bothering you?",
        "Thank you for sharing. Sometimes acknowledging our feelings is the first step. What do you think might help?",
        "I understand. Would you like me to suggest some simple wellbeing exercises that might help?"
    ],
    stress: [
        "Stress can be challenging. Have you tried any relaxation techniques recently?",
        "Managing stress is important. Deep breathing, short walks, or even stretching can help in the moment.",
        "I understand. The 5-5-5 technique might help: breathe in for 5 seconds, hold for 5, exhale for 5. Would you like more techniques?"
    ],
    thankYou: [
        "You're welcome! I'm here anytime you need support.",
        "Happy to help! Remember, taking care of your wellbeing is important.",
        "Anytime! Don't hesitate to reach out whenever you need assistance."
    ],
    default: [
        "I'm still learning about wellbeing. Could you tell me more about what you're looking for?",
        "That's an interesting point. Would you like me to find some wellbeing resources related to this topic?",
        "I appreciate you sharing that. How else can I support your wellbeing today?"
    ]
};

// Initialize chatbot UI when document is ready
$(document).ready(function() {
    initChatbot();
});

/**
 * Initialize the chatbot UI
 */
function initChatbot() {
    console.log('Initializing chatbot...');
    
    // Get current user info from localStorage
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        currentUserId = user.id || user.userId || 'anonymous';
        console.log(`Initializing chatbot for user ID: ${currentUserId}`);
    } else {
        currentUserId = 'anonymous';
        console.log('No user logged in, using anonymous chat session');
    }
    
    // Add chatbot HTML to the page
    addChatbotHTML();
    
    // Set up event listeners
    setupChatbotEvents();
    
    // Load chat history from local storage if available
    const hasExistingChat = loadChatHistory();
    
    // Only add welcome message if there's no existing chat history
    if (!hasExistingChat) {
        setTimeout(() => {
            addBotMessage(getRandomResponse('greeting'));
        }, 1000);
    }
    
    // Listen for user login/logout events
    window.addEventListener('userLoggedIn', function(e) {
        if (e.detail && e.detail.userId) {
            console.log(`User changed, resetting chat for user ID: ${e.detail.userId}`);
            resetChatForNewUser(e.detail.userId);
        }
    });
}

/**
 * Add chatbot HTML to the page
 */
function addChatbotHTML() {
    const chatbotHTML = `
        <div class="chat-button" id="chat-button">
            <i class="fas fa-comments fa-lg"></i>
        </div>
        
        <div class="chat-container hidden" id="chat-container">
            <div class="chat-header">
                <div>
                    <i class="fas fa-robot me-2"></i>
                    Wellbeing Assistant
                </div>
                <div>
                    <i class="fas fa-chevron-up toggle-chat"></i>
                </div>
            </div>
            <div class="chat-body" id="chat-body">
                <!-- Messages will be added here -->
            </div>
            <div class="chat-footer">
                <input type="text" id="chat-input" placeholder="Type your message..." aria-label="Chat message">
                <button id="chat-send">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    
    $('body').append(chatbotHTML);
}

/**
 * Set up chatbot event listeners
 */
function setupChatbotEvents() {
    // Toggle chat window visibility
    $('#chat-button').on('click', function() {
        $('#chat-button').addClass('hidden');
        $('#chat-container').removeClass('hidden');
    });
    
    // Toggle chat window collapse
    $('.chat-header').on('click', function() {
        $('#chat-container').toggleClass('collapsed');
        $('.toggle-chat').toggleClass('fa-chevron-up fa-chevron-down');
    });
    
    // Send message on button click
    $('#chat-send').on('click', sendMessage);
    
    // Send message on Enter key
    $('#chat-input').on('keypress', function(e) {
        if (e.which === 13) {
            sendMessage();
        }
    });
}

/**
 * Process and send a user message
 */
function sendMessage() {
    const input = $('#chat-input');
    const message = input.val().trim();
    
    if (message.length === 0) return;
    
    // Clear input
    input.val('');
    
    // Add user message to chat
    addUserMessage(message);
    
    // Process the message and get a response
    processMessage(message);
}

/**
 * Process a user message and generate a response
 */
async function processMessage(message) {
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // First try to get a response from the backend API
        const response = await getChatbotResponse(message);
        
        // Hide typing indicator after a short delay
        setTimeout(() => {
            hideTypingIndicator();
            addBotMessage(response);
        }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds for natural feel
    } catch (error) {
        console.error('Error getting chatbot response:', error);
        
        // Fallback to local responses
        setTimeout(() => {
            hideTypingIndicator();
            addBotMessage(getLocalResponse(message));
        }, 1000);
    }
}

/**
 * Get a response from the backend API
 */
async function getChatbotResponse(message) {
    try {
        const response = await $.ajax({
            url: '/api/Chat/message',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                message: message,
                history: chatHistory.slice(-5) // Send last 5 messages for context
            }),
            timeout: 5000 // 5 second timeout
        });
        
        return response.message || getLocalResponse(message);
    } catch (error) {
        console.error('Failed to get response from backend:', error);
        return getLocalResponse(message);
    }
}

/**
 * Get a local response based on the message content
 */
function getLocalResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Simple keyword matching
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return getRandomResponse('greeting');
    } else if (lowerMessage.includes('good') || lowerMessage.includes('great') || lowerMessage.includes('happy')) {
        return getRandomResponse('feelingGood');
    } else if (lowerMessage.includes('bad') || lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('unhappy')) {
        return getRandomResponse('feelingBad');
    } else if (lowerMessage.includes('stress') || lowerMessage.includes('anxious') || lowerMessage.includes('overwhelmed')) {
        return getRandomResponse('stress');
    } else if (lowerMessage.includes('thank')) {
        return getRandomResponse('thankYou');
    } else {
        return getRandomResponse('default');
    }
}

/**
 * Get a random response from the specified category
 */
function getRandomResponse(category) {
    const responses = defaultResponses[category] || defaultResponses.default;
    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Add a user message to the chat
 * @param {string} message - The message content
 * @param {boolean} saveToHistory - Whether to save this message to history (default: true)
 */
function addUserMessage(message, saveToHistory = true) {
    const chatBody = $('#chat-body');
    chatBody.append(`
        <div class="chat-message user">
            ${escapeHTML(message)}
        </div>
    `);
    
    // Add to chat history and save (if requested)
    if (saveToHistory) {
        chatHistory.push({ role: 'user', content: message });
        saveChatHistory();
    }
    
    // Scroll to bottom
    scrollToBottom();
}

/**
 * Add a bot message to the chat
 * @param {string} message - The message content
 * @param {boolean} saveToHistory - Whether to save this message to history (default: true)
 */
function addBotMessage(message, saveToHistory = true) {
    const chatBody = $('#chat-body');
    chatBody.append(`
        <div class="chat-message bot">
            ${escapeHTML(message)}
        </div>
    `);
    
    // Add to chat history and save (if requested)
    if (saveToHistory) {
        chatHistory.push({ role: 'assistant', content: message });
        saveChatHistory();
    }
    
    // Scroll to bottom
    scrollToBottom();
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    const chatBody = $('#chat-body');
    chatBody.append(`
        <div class="typing-indicator" id="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `);
    
    // Scroll to bottom
    scrollToBottom();
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
    $('#typing-indicator').remove();
}

/**
 * Scroll the chat to the bottom
 */
function scrollToBottom() {
    const chatBody = $('#chat-body');
    chatBody.scrollTop(chatBody[0].scrollHeight);
}

/**
 * Save chat history to local storage with user-specific key
 */
function saveChatHistory() {
    // Limit history to last 50 messages
    if (chatHistory.length > 50) {
        chatHistory = chatHistory.slice(-50);
    }
    
    // Save to local storage with user-specific key
    const storageKey = `chatHistory_${currentUserId}`;
    localStorage.setItem(storageKey, JSON.stringify(chatHistory));
    console.log(`Saved chat history for user: ${currentUserId}`);
}

/**
 * Load chat history from local storage based on current user
 * @returns {boolean} True if chat history was found and loaded, false otherwise
 */
function loadChatHistory() {
    // Use user-specific storage key
    const storageKey = `chatHistory_${currentUserId}`;
    const savedHistory = localStorage.getItem(storageKey);
    
    // Clear the chat body first
    $('#chat-body').empty();
    
    if (savedHistory) {
        try {
            chatHistory = JSON.parse(savedHistory);
            console.log(`Loaded ${chatHistory.length} messages for user: ${currentUserId}`);
            
            // Only consider non-empty chat history as existing
            if (chatHistory.length === 0) {
                return false;
            }
            
            // Display last 10 messages
            const recentMessages = chatHistory.slice(-10);
            for (const message of recentMessages) {
                if (message.role === 'user') {
                    addUserMessage(message.content, false); // false = don't save again
                } else {
                    addBotMessage(message.content, false); // false = don't save again
                }
            }
            
            return true; // Chat history exists and was loaded
        } catch (e) {
            console.error('Error loading chat history:', e);
            chatHistory = [];
            return false;
        }
    } else {
        console.log(`No existing chat history for user: ${currentUserId}`);
        chatHistory = [];
        return false;
    }
}

/**
 * Reset chat for a new user
 */
function resetChatForNewUser(userId) {
    // Update current user ID
    currentUserId = userId || 'anonymous';
    
    // Clear in-memory chat history for previous user
    chatHistory = [];
    
    // Clear chat display
    $('#chat-body').empty();
    
    // Check if the new user has existing chat history
    const hasExistingChat = loadChatHistory();
    
    // Only add welcome message if no chat history exists
    if (!hasExistingChat) {
        addBotMessage(getRandomResponse('greeting'));
    }
    
    console.log(`Chat reset for new user: ${currentUserId}`);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
