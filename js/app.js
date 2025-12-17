// app.js - Main Zikr App Logic (LocalStorage Based)

let zikrData = [];
let currentZikrIndex = 0;
let currentLanguage = 'romanArabic';
let currentLevel = 'wasat';

// DOM Elements
let zikrSlider = null;
let floatingCounter = null;

// Initialize DOM elements - ONLY check for absolutely required elements
function initializeDOMElements() {
    zikrSlider = document.getElementById('zikrSlider');
    floatingCounter = document.getElementById('floatingCounter');
    
    // Check only for absolutely required elements
    if (!zikrSlider) {
        console.error('zikrSlider element is missing. Please check the HTML structure.');
        return false;
    }
    
    // Floating counter is optional - it might not exist initially
    console.log('DOM elements initialized:', {
        zikrSlider: !!zikrSlider,
        floatingCounter: !!floatingCounter
    });
    
    return true;
}

// Load data from localStorage with fallback to data.json
async function loadZikrData() {
    try {
        // Try to load from localStorage first
        const savedData = localStorage.getItem('zikrAppData');
        
        if (savedData) {
            // Data exists in localStorage
            zikrData = JSON.parse(savedData);
            console.log('Loaded', zikrData.length, 'zikr records from localStorage');
            initializeApp();
        } else {
            // No data in localStorage, try to load from data.json
            console.log('No data in localStorage, trying data.json...');
            await loadFromJsonFile();
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        showErrorMessage('Error loading data. Please check if data.json file exists.');
    }
}

// Load data from data.json file
async function loadFromJsonFile() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Failed to load data.json');
        }
        
        const data = await response.json();
        zikrData = Array.isArray(data) ? data : data.zikrData || [];
        
        // Initialize totalCount to 0 for all records
        zikrData.forEach(zikr => {
            zikr.totalCount = 0;
        });
        
        // Save to localStorage for future use
        localStorage.setItem('zikrAppData', JSON.stringify(zikrData));
        localStorage.setItem('zikrAppLastSync', new Date().toISOString());
        
        console.log('Loaded', zikrData.length, 'records from data.json and saved to localStorage');
        initializeApp();
        
    } catch (error) {
        console.error('Error loading from JSON file:', error);
        showErrorMessage('Could not load data. Please make sure data.json file exists in the same folder.');
    }
}

// Initialize app with loaded data
function initializeApp() {
    // Remove loading message
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
    
    if (zikrData.length === 0) {
        showNoDataMessage();
        return;
    }
    
    // Load saved counts and preferences
    initializeFromStorage();
    loadSavedCounts();
    
    // Render the slider
    renderZikrSlider();
    setupEventListeners();
    
    // Initialize floating counter buttons after render
    setTimeout(initializeFloatingCounter, 100);
}

// Initialize floating counter buttons
function initializeFloatingCounter() {
    const floatingIncrementBtn = document.getElementById('floatingIncrementBtn');
    const floatingResetBtn = document.getElementById('floatingResetBtn');
    const floatingCounterDisplay = document.getElementById('floatingCounterDisplay');
    const counterInfo = document.getElementById('counterInfo');
    
    if (floatingIncrementBtn && floatingResetBtn && floatingCounter && floatingCounterDisplay && counterInfo) {
        // Update button events
        floatingIncrementBtn.onclick = () => incrementCount(zikrData[currentZikrIndex].id);
        floatingResetBtn.onclick = () => resetCount(zikrData[currentZikrIndex].id);
        
        // Update display
        updateFloatingCounter();
    }
}

// Show no data message
function showNoDataMessage() {
    if (!zikrSlider) return;
    
    zikrSlider.innerHTML = `
        <div style="padding: 40px; text-align: center;">
            <i class="fas fa-book-open" style="font-size: 50px; color: #ccc; margin-bottom: 20px;"></i>
            <h3 style="color: #002b5b; margin-bottom: 10px;">No Zikr Data Found</h3>
            <p style="color: #666; margin-bottom: 20px;">Please initialize data using the Admin Panel</p>
            <a href="admin.html" class="nav-btn" style="
                text-decoration: none; 
                display: inline-block;
                padding: 12px 30px;
                background: #1a5f7a;
                color: white;
                border-radius: 50px;
                font-weight: bold;
            ">
                <i class="fas fa-cog"></i> Go to Admin Panel
            </a>
        </div>
    `;
}

// Show error message
function showErrorMessage(message) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.innerHTML = `
            <div style="color: #ff6b6b; padding: 30px; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 40px; margin-bottom: 15px;"></i>
                <h3 style="margin-bottom: 10px;">⚠️ ${message}</h3>
                <p style="margin-bottom: 20px; font-size: 14px;">
                    Possible solutions:<br>
                    1. Make sure data.json file exists in the same folder<br>
                    2. Open Admin Panel first to initialize data<br>
                    3. Check browser console for errors
                </p>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="location.reload()" style="
                        padding: 10px 20px;
                        background: #159895;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    ">
                        <i class="fas fa-redo"></i> Reload Page
                    </button>
                    <a href="admin.html" style="
                        padding: 10px 20px;
                        background: #1a5f7a;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        text-decoration: none;
                    ">
                        <i class="fas fa-cog"></i> Open Admin
                    </a>
                </div>
            </div>
        `;
    }
}

// Decode HTML entities for display
function decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

// Initialize from localStorage
function initializeFromStorage() {
    // Load current level
    const savedLevel = localStorage.getItem('current_level');
    if (savedLevel) {
        currentLevel = savedLevel;
    }
    
    // Load language preference
    const savedLang = localStorage.getItem('current_language');
    if (savedLang) {
        currentLanguage = savedLang;
    }
}

// Load saved counts for zikr
function loadSavedCounts() {
    // Counts are already part of zikrData from localStorage
    // Ensure all zikr have totalCount
    zikrData.forEach(zikr => {
        if (typeof zikr.totalCount !== 'number') {
            zikr.totalCount = 0;
        }
    });
}

// Save to localStorage
function saveToStorage() {
    // Save counts for current zikr
    if (zikrData.length > 0 && currentZikrIndex < zikrData.length) {
        localStorage.setItem(`zikr_${zikrData[currentZikrIndex].id}_count`, zikrData[currentZikrIndex].totalCount.toString());
    }
    
    // Save preferences
    localStorage.setItem('current_level', currentLevel);
    localStorage.setItem('current_language', currentLanguage);
    
    // Update main data in localStorage
    try {
        localStorage.setItem('zikrAppData', JSON.stringify(zikrData));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// Clear all localStorage for zikr counts
function clearAllStorage() {
    zikrData.forEach(zikr => {
        localStorage.removeItem(`zikr_${zikr.id}_count`);
    });
    
    // Also clear preferences
    localStorage.removeItem('current_level');
    localStorage.removeItem('current_language');
    
    // Reset counts in data
    zikrData.forEach(zikr => {
        zikr.totalCount = 0;
    });
    
    // Save updated data
    localStorage.setItem('zikrAppData', JSON.stringify(zikrData));
}

// Reset all counts function
function resetAllCounts() {
    if (confirm("Are you sure you want to reset ALL counts?\n\nThis will set ALL zikr counts to 0.")) {
        clearAllStorage();
        
        // Update UI
        updateFloatingCounter();
        renderZikrSlider();
        
        alert("All counts have been reset to 0.");
    }
}

// Update floating counter
function updateFloatingCounter() {
    if (zikrData.length === 0 || !floatingCounter) return;
    
    const currentZikr = zikrData[currentZikrIndex];
    const maxCount = currentZikr[`${currentLevel}Threshold`];
    
    const floatingCounterDisplay = document.getElementById('floatingCounterDisplay');
    const counterInfo = document.getElementById('counterInfo');
    
    if (!floatingCounterDisplay || !counterInfo) return;
    
    if (currentZikr.isFixedLevel) {
        floatingCounter.style.display = 'none';
    } else {
        floatingCounter.style.display = 'block';
        counterInfo.textContent = `Target: ${maxCount} | Level: ${currentLevel.toUpperCase()}`;
        floatingCounterDisplay.textContent = currentZikr.totalCount;
    }
}

// Render Zikr Slider - Only ONE card visible at a time
function renderZikrSlider() {
    if (zikrData.length === 0 || !zikrSlider) {
        showNoDataMessage();
        return;
    }
    
    zikrSlider.innerHTML = '';
    
    // Create ONLY ONE active card
    const currentZikr = zikrData[currentZikrIndex];
    
    // Decode HTML content for display
    const arabicContent = currentZikr.arabic ? decodeHTML(currentZikr.arabic) : '';
    const romanArabicContent = currentZikr.romanArabic ? decodeHTML(currentZikr.romanArabic) : '';
    const romanUrduContent = currentZikr.romanUrdu ? decodeHTML(currentZikr.romanUrdu) : '';
    const descriptionContent = currentZikr.description ? decodeHTML(currentZikr.description) : '';
    
    // Get content based on current language
    let displayContent = '';
    let isArabic = false;
    
    if (currentLanguage === 'arabic' && arabicContent) {
        displayContent = arabicContent;
        isArabic = true;
    } else if (currentLanguage === 'romanArabic' && romanArabicContent) {
        displayContent = romanArabicContent;
    } else if (romanUrduContent) {
        displayContent = romanUrduContent;
    } else {
        displayContent = romanArabicContent || arabicContent || 'No content available';
    }
    
    const card = document.createElement('div');
    card.className = 'zikr-card active';
    
    card.innerHTML = `
        <div class="zikr-title">${currentZikr.title}</div>
        
        <div class="language-tabs">
            <button class="tab-btn ${currentLanguage === 'arabic' ? 'active' : ''}" data-lang="arabic">
                Arabic
            </button>
            <button class="tab-btn ${currentLanguage === 'romanArabic' ? 'active' : ''}" data-lang="romanArabic">
                Roman Arabic
            </button>
            <button class="tab-btn ${currentLanguage === 'romanUrdu' ? 'active' : ''}" data-lang="romanUrdu">
                Roman Urdu
            </button>
        </div>
        
        <div class="zikr-content">
            <div class="zikr-text ${isArabic ? 'arabic-text' : ''}">
                ${displayContent}
            </div>
        </div>
        
        ${descriptionContent ? `
            <div class="description-tooltip" title="${descriptionContent.replace(/"/g, '&quot;')}">
                <i class="fas fa-info-circle"></i> Hover for benefits and importance
            </div>
        ` : ''}
        
        ${currentZikr.isFixedLevel ? `
            <div class="fixed-zikr-notice">
                Read only once time
            </div>
        ` : ''}
    `;
    
    zikrSlider.appendChild(card);
    
    // Add tooltip functionality
    if (descriptionContent) {
        const tooltip = card.querySelector('.description-tooltip');
        if (tooltip) {
            tooltip.addEventListener('mouseenter', showTooltip);
            tooltip.addEventListener('mouseleave', hideTooltip);
        }
    }
    
    // Add navigation buttons
    const navDiv = document.createElement('div');
    navDiv.className = 'nav-buttons';
    navDiv.innerHTML = `
        <button class="nav-btn" id="prevBtn" ${currentZikrIndex === 0 ? 'disabled' : ''} onclick="prevZikr()">
            ⏮ Previous
        </button>
        <div class="progress">
            ${currentZikrIndex + 1} of ${zikrData.length}
        </div>
        <button class="nav-btn" id="nextBtn" ${currentZikrIndex === zikrData.length - 1 ? 'disabled' : ''} onclick="nextZikr()">
            Next ⏭
        </button>
    `;
    zikrSlider.appendChild(navDiv);
    
    updateLevelButtons();
}

// Show tooltip
function showTooltip(e) {
    const tooltip = e.target;
    const title = tooltip.getAttribute('title');
    
    if (title) {
        // Remove any existing tooltip
        hideTooltip(e);
        
        // Create tooltip element
        const tooltipEl = document.createElement('div');
        tooltipEl.className = 'custom-tooltip';
        tooltipEl.textContent = title;
        tooltipEl.style.cssText = `
            position: fixed;
            background: rgba(0, 43, 91, 0.95);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            max-width: 300px;
            z-index: 10000;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
            line-height: 1.5;
            pointer-events: none;
        `;
        
        // Position tooltip near cursor
        tooltipEl.style.left = (e.clientX + 10) + 'px';
        tooltipEl.style.top = (e.clientY - 10) + 'px';
        
        document.body.appendChild(tooltipEl);
        tooltip._tooltipEl = tooltipEl;
    }
}

// Hide tooltip
function hideTooltip(e) {
    const tooltip = e.target;
    if (tooltip._tooltipEl) {
        tooltip._tooltipEl.remove();
        tooltip._tooltipEl = null;
    }
}

// Update level buttons
function updateLevelButtons() {
    const levelButtons = document.querySelectorAll('.level-btn');
    if (levelButtons.length === 0) return;
    
    levelButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.level === currentLevel) {
            btn.classList.add('active');
        }
    });
}

// Navigation functions
function nextZikr() {
    if (currentZikrIndex < zikrData.length - 1) {
        currentZikrIndex++;
        renderZikrSlider();
        updateFloatingCounter();
        initializeFloatingCounter();
    }
}

function prevZikr() {
    if (currentZikrIndex > 0) {
        currentZikrIndex--;
        renderZikrSlider();
        updateFloatingCounter();
        initializeFloatingCounter();
    }
}

// Increment count
function incrementCount(zikrId) {
    const zikrIndex = zikrData.findIndex(z => z.id === zikrId);
    if (zikrIndex === -1) return;
    
    const zikr = zikrData[zikrIndex];
    const maxCount = zikr[`${currentLevel}Threshold`];
    
    if (zikr.totalCount < maxCount || zikr.isFixedLevel) {
        zikr.totalCount++;
        if (zikr.totalCount > maxCount && !zikr.isFixedLevel) {
            zikr.totalCount = maxCount;
        }
        
        saveToStorage();
        updateFloatingCounter();
        
        // Visual feedback
        const floatingCounterDisplay = document.getElementById('floatingCounterDisplay');
        if (floatingCounterDisplay) {
            floatingCounterDisplay.style.transform = 'scale(1.2)';
            setTimeout(() => {
                floatingCounterDisplay.style.transform = 'scale(1)';
            }, 200);
        }
    }
}

// Reset count
function resetCount(zikrId) {
    if (confirm("Are you sure you want to reset this count?")) {
        const zikrIndex = zikrData.findIndex(z => z.id === zikrId);
        if (zikrIndex === -1) return;
        
        zikrData[zikrIndex].totalCount = 0;
        
        saveToStorage();
        updateFloatingCounter();
    }
}

// Event Listeners setup
function setupEventListeners() {
    // Language tab click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('tab-btn')) {
            currentLanguage = e.target.dataset.lang;
            
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            
            renderZikrSlider();
            saveToStorage();
        }
        
        // Level button click
        if (e.target.classList.contains('level-btn')) {
            currentLevel = e.target.dataset.level;
            
            document.querySelectorAll('.level-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            
            renderZikrSlider();
            saveToStorage();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (zikrData.length === 0) return;
        
        if (e.key === 'ArrowRight') {
            nextZikr();
        } else if (e.key === 'ArrowLeft') {
            prevZikr();
        } else if (e.key === ' ' || e.key === 'Enter') {
            const currentZikr = zikrData[currentZikrIndex];
            incrementCount(currentZikr.id);
        }
    });
}

// Initialize app
function initApp() {
    console.log('Initializing Zikr App...');
    
    // Wait for DOM to be fully ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (initializeDOMElements()) {
                console.log('DOM elements initialized successfully');
                loadZikrData();
            }
        });
    } else {
        // DOM already loaded
        if (initializeDOMElements()) {
            console.log('DOM elements initialized successfully');
            loadZikrData();
        }
    }
}

// Start the app
initApp();

// Make functions available globally
window.nextZikr = nextZikr;
window.prevZikr = prevZikr;
window.incrementCount = incrementCount;
window.resetCount = resetCount;
window.resetAllCounts = resetAllCounts;