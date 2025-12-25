// Main Salah Tracker Application - Complete Version with Charity

let currentDate = new Date();
let salahData = {
    date: null,
    farz: {
        fajr: { status: 'pending', time: 'Before Sunrise', rakats: 2, notes: '' },
        zuhr: { status: 'pending', time: 'After Zenith', rakats: 4, notes: '' },
        asr: { status: 'pending', time: 'Afternoon', rakats: 4, notes: '' },
        maghrib: { status: 'pending', time: 'After Sunset', rakats: 3, notes: '' },
        isha: { status: 'pending', time: 'Night', rakats: 4, notes: '' }
    },
    witr: { status: 'pending', rakats: 3, notes: '' },
    nafal: {
        tahajjud: { completed: false, rakats: '2-8', time: 'Last Third of Night' },
        ishraq: { completed: false, rakats: 2, time: '15-20 min after Sunrise' },
        chast: { completed: false, rakats: 4, time: 'Before Zuhr' },
        avabin: { completed: false, rakats: 6, time: 'After Maghrib' },
        sunnat: {
            fajr: { completed: false, rakats: 2 },
            zuhr: { before: false, after: false, rakats: '4+2' },
            maghrib: { completed: false, rakats: 2 },
            isha: { completed: false, rakats: 2 }
        }
    }
};

// Murakab feature variables
let murakabTimer = null;
let murakabSeconds = 0;
let murakabIsRunning = false;

// Roza tracking variables
let rozaData = {
    date: null,
    type: null,
    status: 'not_observed',
    schedule: { sehri: false, iftar: false },
    kaffara: { required: false, type: null, notes: '' },
    notes: ''
};

let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();

// Charity data structure
let charityData = {
    sadaqah: [],
    zakat: [],
    fitra: [],
    lillah: []
};

// Nisab values (current silver price in USD per gram)
const NISAB_SILVER_GRAMS = 612.36;
const NISAB_GOLD_GRAMS = 87.48;
const CURRENT_SILVER_PRICE = 1.0; // Update this with current silver price per gram

// DOM Elements
let farzSalahGrid, nafalGrid, progressCircles;

// Initialize the application
function initSalahTracker() {
    farzSalahGrid = document.getElementById('farzSalahGrid');
    nafalGrid = document.getElementById('nafalGrid');
    progressCircles = document.getElementById('progressCircles');
    
    // Load data and render UI
    loadSalahData();
    renderDate();
    renderFarzSalah();
    renderNafalPrayers();
    renderProgressSummary();
    renderMurakabSummary();
    
    // Initialize all features
    initRozaTracking();
    initMurakab();
    initCharityTracking();
    setupEventListeners();
}

// Load data from localStorage
function loadSalahData() {
    const dateKey = formatDateKey(currentDate);
    
    // Reset to default structure
    resetSalahData();
    
    const savedData = localStorage.getItem(`salah_${dateKey}`);
    
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            
            // Merge saved data with default structure
            if (parsedData.farz) {
                Object.keys(salahData.farz).forEach(key => {
                    if (parsedData.farz[key]) {
                        salahData.farz[key] = { ...salahData.farz[key], ...parsedData.farz[key] };
                    }
                });
            }
            
            if (parsedData.witr) {
                salahData.witr = { ...salahData.witr, ...parsedData.witr };
            }
            
            if (parsedData.nafal) {
                // Merge nafal data
                Object.keys(salahData.nafal).forEach(key => {
                    if (parsedData.nafal[key]) {
                        if (key === 'sunnat') {
                            Object.keys(salahData.nafal.sunnat).forEach(subKey => {
                                if (parsedData.nafal.sunnat[subKey]) {
                                    if (typeof parsedData.nafal.sunnat[subKey] === 'object') {
                                        Object.keys(salahData.nafal.sunnat[subKey]).forEach(innerKey => {
                                            if (parsedData.nafal.sunnat[subKey][innerKey] !== undefined) {
                                                salahData.nafal.sunnat[subKey][innerKey] = parsedData.nafal.sunnat[subKey][innerKey];
                                            }
                                        });
                                    } else {
                                        salahData.nafal.sunnat[subKey] = parsedData.nafal.sunnat[subKey];
                                    }
                                }
                            });
                        } else {
                            salahData.nafal[key] = { ...salahData.nafal[key], ...parsedData.nafal[key] };
                        }
                    }
                });
            }
        } catch (error) {
            // Keep default data if parsing fails
        }
    }
    
    // Set current date
    salahData.date = dateKey;
}

// Reset to default data structure
function resetSalahData() {
    salahData = {
        date: null,
        farz: {
            fajr: { status: 'pending', time: 'Before Sunrise', rakats: 2, notes: '' },
            zuhr: { status: 'pending', time: 'After Zenith', rakats: 4, notes: '' },
            asr: { status: 'pending', time: 'Afternoon', rakats: 4, notes: '' },
            maghrib: { status: 'pending', time: 'After Sunset', rakats: 3, notes: '' },
            isha: { status: 'pending', time: 'Night', rakats: 4, notes: '' }
        },
        witr: { status: 'pending', rakats: 3, notes: '' },
        nafal: {
            tahajjud: { completed: false, rakats: '2-8', time: 'Last Third of Night' },
            ishraq: { completed: false, rakats: 2, time: '15-20 min after Sunrise' },
            chast: { completed: false, rakats: 4, time: 'Before Zuhr' },
            avabin: { completed: false, rakats: 6, time: 'After Maghrib' },
            sunnat: {
                fajr: { completed: false, rakats: 2 },
                zuhr: { before: false, after: false, rakats: '4+2' },
                maghrib: { completed: false, rakats: 2 },
                isha: { completed: false, rakats: 2 }
            }
        }
    };
}

// Save data to localStorage
function saveSalahData() {
    const dateKey = formatDateKey(currentDate);
    salahData.date = dateKey;
    
    // Update summary before saving
    updateSummary();
    
    localStorage.setItem(`salah_${dateKey}`, JSON.stringify(salahData));
    
    // Update overall progress
    updateOverallProgress();
}

// Format date as YYYY-MM-DD for key
function formatDateKey(date) {
    return date.toISOString().split('T')[0];
}

// Format date for display
function formatDateDisplay(date) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
}

// Format date short version
function formatDateShort(date) {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Render current date
function renderDate() {
    const dateDisplay = document.getElementById('currentDateDisplay');
    if (dateDisplay) {
        dateDisplay.textContent = formatDateDisplay(currentDate);
    }
}

// Render Farz Salah cards
function renderFarzSalah() {
    if (!farzSalahGrid) return;
    
    farzSalahGrid.innerHTML = '';
    
    Object.entries(salahData.farz).forEach(([salahName, salahInfo]) => {
        const card = document.createElement('div');
        card.className = 'salah-card';
        
        const status = salahInfo.status || 'pending';
        
        card.innerHTML = `
            <div class="salah-header">
                <div class="salah-name">${salahName.toUpperCase()}</div>
                <div class="salah-time">${salahInfo.time} • ${salahInfo.rakats} Rakats</div>
            </div>
            <div class="status-options" data-salah="${salahName}">
                <button class="status-btn status-missed ${status === 'missed' ? 'active' : ''}" 
                        data-status="missed">
                    <i class="fas fa-times-circle"></i> Missed
                </button>
                <button class="status-btn status-partial ${status === 'partial' ? 'active' : ''}" 
                        data-status="partial">
                    <i class="fas fa-clock"></i> With Qaza
                </button>
                <button class="status-btn status-completed ${status === 'completed' ? 'active' : ''}" 
                        data-status="completed">
                    <i class="fas fa-check-circle"></i> Completed
                </button>
            </div>
            <div class="notes">
                <label class="notes-label">
                    <i class="fas fa-sticky-note"></i> Notes
                </label>
                <textarea class="notes-input" 
                        placeholder="Add notes (e.g., Jamaat, Delay, Qaza time, Special circumstances)..." 
                        data-salah="${salahName}"
                        maxlength="200">${salahInfo.notes || ''}</textarea>
                <div class="notes-counter">
                    <span class="char-count">${(salahInfo.notes || '').length}</span>/200
                </div>
            </div>
        `;
        
        farzSalahGrid.appendChild(card);
    });
}

// Render Nafal Prayers
function renderNafalPrayers() {
    if (!nafalGrid) return;
    
    nafalGrid.innerHTML = '';
    
    // Sunnat Nafal
    const sunnatNafal = [
        { id: 'sunnat_fajr', name: 'Fajr Sunnat', rakats: '2', icon: 'sun', time: 'Before Fajr' },
        { id: 'sunnat_zuhr_before', name: 'Zuhr Before', rakats: '4', icon: 'sun', time: 'Before Zuhr' },
        { id: 'sunnat_zuhr_after', name: 'Zuhr After', rakats: '2', icon: 'sun', time: 'After Zuhr' },
        { id: 'sunnat_maghrib', name: 'Maghrib Sunnat', rakats: '2', icon: 'moon', time: 'After Maghrib' },
        { id: 'sunnat_isha', name: 'Isha Sunnat', rakats: '2', icon: 'moon', time: 'After Isha' }
    ];
    
    // Special Nafal
    const specialNafal = [
        { id: 'tahajjud', name: 'Tahajjud', rakats: '2-8', icon: 'moon', time: 'Last Third of Night', color: '#8a2be2' },
        { id: 'ishraq', name: 'Ishraq', rakats: '2', icon: 'sunrise', time: 'After Sunrise', color: '#ff6b6b' },
        { id: 'chast', name: 'Chast', rakats: '4', icon: 'sun', time: 'Before Zuhr', color: '#ffa726' },
        { id: 'avabin', name: 'Avabin', rakats: '6', icon: 'pray', time: 'After Maghrib', color: '#26a69a' }
    ];
    
    // Render Sunnat
    sunnatNafal.forEach(nafal => {
        const isCompleted = getNafalStatus(nafal.id);
        renderNafalItem(nafal, isCompleted);
    });
    
    // Render Special Nafal
    specialNafal.forEach(nafal => {
        const isCompleted = getNafalStatus(nafal.id);
        renderNafalItem(nafal, isCompleted);
    });
}

// Helper function to render nafal item
function renderNafalItem(nafal, isCompleted) {
    const item = document.createElement('div');
    item.className = `nafal-item ${isCompleted ? 'active' : ''}`;
    item.dataset.nafal = nafal.id;
    
    if (nafal.color) {
        item.style.borderColor = nafal.color;
    }
    
    item.innerHTML = `
        <div class="nafal-icon" ${nafal.color ? `style="color: ${nafal.color}"` : ''}>
            <i class="fas fa-${nafal.icon}"></i>
        </div>
        <div class="nafal-name">${nafal.name}</div>
        <div class="nafal-details">
            <small>${nafal.rakats} Rakats</small>
            <br>
            <small>${nafal.time}</small>
        </div>
        <div class="nafal-status">
            ${isCompleted ? '✓ Done' : 'Pending'}
        </div>
    `;
    
    nafalGrid.appendChild(item);
}

// Get Nafal status
function getNafalStatus(nafalId) {
    const parts = nafalId.split('_');
    
    if (parts[0] === 'sunnat') {
        if (parts[1] === 'fajr') return salahData.nafal.sunnat.fajr.completed;
        if (parts[1] === 'zuhr') {
            if (parts[2] === 'before') return salahData.nafal.sunnat.zuhr.before;
            if (parts[2] === 'after') return salahData.nafal.sunnat.zuhr.after;
        }
        if (parts[1] === 'maghrib') return salahData.nafal.sunnat.maghrib.completed;
        if (parts[1] === 'isha') return salahData.nafal.sunnat.isha.completed;
    } else {
        return salahData.nafal[nafalId]?.completed || false;
    }
    
    return false;
}

// Set Nafal status
function setNafalStatus(nafalId, completed) {
    const parts = nafalId.split('_');
    
    if (parts[0] === 'sunnat') {
        if (parts[1] === 'fajr') salahData.nafal.sunnat.fajr.completed = completed;
        else if (parts[1] === 'zuhr') {
            if (parts[2] === 'before') salahData.nafal.sunnat.zuhr.before = completed;
            else if (parts[2] === 'after') salahData.nafal.sunnat.zuhr.after = completed;
        }
        else if (parts[1] === 'maghrib') salahData.nafal.sunnat.maghrib.completed = completed;
        else if (parts[1] === 'isha') salahData.nafal.sunnat.isha.completed = completed;
    } else {
        if (salahData.nafal[nafalId]) {
            salahData.nafal[nafalId].completed = completed;
        }
    }
    
    saveSalahData();
    renderNafalPrayers();
    renderProgressSummary();
}

// Update summary calculations
function updateSummary() {
    if (!salahData.summary) {
        salahData.summary = {};
    }
    
    // Count Farz salah
    let totalFarz = 5; // Always 5 farz salah
    let completedFarz = 0;
    
    Object.values(salahData.farz).forEach(salah => {
        if (salah.status === 'completed') completedFarz++;
    });
    
    // Count Witr
    if (salahData.witr.status === 'completed') completedFarz++;
    totalFarz++; // Add Witr to total
    
    // Count Nafal
    let totalNafal = 0;
    let completedNafal = 0;
    
    // Sunnat Fajr
    if (salahData.nafal.sunnat.fajr.completed) completedNafal++;
    totalNafal++;
    
    // Sunnat Zuhr (before & after)
    if (salahData.nafal.sunnat.zuhr.before) completedNafal++;
    if (salahData.nafal.sunnat.zuhr.after) completedNafal++;
    totalNafal += 2;
    
    // Sunnat Maghrib & Isha
    if (salahData.nafal.sunnat.maghrib.completed) completedNafal++;
    if (salahData.nafal.sunnat.isha.completed) completedNafal++;
    totalNafal += 2;
    
    // Special Nafal
    const specialNafal = ['tahajjud', 'ishraq', 'chast', 'avabin'];
    specialNafal.forEach(nafal => {
        if (salahData.nafal[nafal]?.completed) completedNafal++;
        totalNafal++;
    });
    
    // Calculate percentages
    const farzPercentage = Math.round((completedFarz / totalFarz) * 100);
    const nafalPercentage = Math.round((completedNafal / totalNafal) * 100);
    const overallPercentage = Math.round(((completedFarz + completedNafal) / (totalFarz + totalNafal)) * 100);
    
    salahData.summary = {
        totalFarz,
        totalNafal,
        completedFarz,
        completedNafal,
        farzPercentage,
        nafalPercentage,
        overallPercentage
    };
}

// Render progress summary
function renderProgressSummary() {
    if (!progressCircles) return;
    
    updateSummary();

    // Render Murakab summary
    renderMurakabSummary();
    
    progressCircles.innerHTML = `
        <div class="progress-circle">
            <svg width="120" height="120" viewBox="0 0 120 120">
                <circle class="circle-bg" cx="60" cy="60" r="54"></circle>
                <circle class="circle-progress" cx="60" cy="60" r="54" 
                        stroke-dasharray="339.292" 
                        stroke-dashoffset="${339.292 * (1 - salahData.summary.farzPercentage / 100)}">
                </circle>
            </svg>
            <div class="circle-text">
                <div class="circle-value">${salahData.summary.farzPercentage}%</div>
                <div class="circle-label">Farz/Wajib</div>
            </div>
        </div>
        
        <div class="progress-circle">
            <svg width="120" height="120" viewBox="0 0 120 120">
                <circle class="circle-bg" cx="60" cy="60" r="54"></circle>
                <circle class="circle-progress" cx="60" cy="60" r="54" 
                        stroke-dasharray="339.292" 
                        stroke-dashoffset="${339.292 * (1 - salahData.summary.nafalPercentage / 100)}"
                        style="stroke: #002b5b">
                </circle>
            </svg>
            <div class="circle-text">
                <div class="circle-value">${salahData.summary.nafalPercentage}%</div>
                <div class="circle-label">Nafal/Sunnat</div>
            </div>
        </div>
        
        <div class="progress-circle">
            <svg width="120" height="120" viewBox="0 0 120 120">
                <circle class="circle-bg" cx="60" cy="60" r="54"></circle>
                <circle class="circle-progress" cx="60" cy="60" r="54" 
                        stroke-dasharray="339.292" 
                        stroke-dashoffset="${339.292 * (1 - salahData.summary.overallPercentage / 100)}"
                        style="stroke: #6a11cb">
                </circle>
            </svg>
            <div class="circle-text">
                <div class="circle-value">${salahData.summary.overallPercentage}%</div>
                <div class="circle-label">Overall</div>
            </div>
        </div>
    `;
    
    // Update summary stats
    const summaryStats = document.getElementById('summaryStats');
    if (summaryStats) {
        const murakabMinutes = Math.floor(murakabSeconds / 60);
        
        summaryStats.innerHTML = `
            <div class="summary-stats">
                <div class="stat-item">
                    <div class="stat-value">${salahData.summary.completedFarz}/${salahData.summary.totalFarz}</div>
                    <div class="stat-label">Farz Completed</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${salahData.summary.completedNafal}/${salahData.summary.totalNafal}</div>
                    <div class="stat-label">Nafal Completed</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${murakabMinutes}m</div>
                    <div class="stat-label">Murakab Time</div>
                </div>
            </div>
        `;
    }
}

// Render Murakab summary
function renderMurakabSummary() {
    const murakabMinutes = Math.floor(murakabSeconds / 60);
    
    // Update murakab timer display
    const timerDisplay = document.getElementById('murakabTimer');
    if (timerDisplay) {
        const minutes = Math.floor(murakabSeconds / 60);
        const seconds = murakabSeconds % 60;
        timerDisplay.textContent = 
            minutes.toString().padStart(2, '0') + ':' + 
            seconds.toString().padStart(2, '0');
    }
}

// Update overall progress in main app
function updateOverallProgress() {
    const overallProgress = salahData.summary.overallPercentage;
    const rozaProgress = calculateRozaProgress();
    
    localStorage.setItem('salahOverallProgress', overallProgress.toString());
    localStorage.setItem('rozaOverallProgress', rozaProgress.toString());
}

// ========== MURAKAB FUNCTIONS ==========

// Initialize Murakab
function initMurakab() {
    const startBtn = document.getElementById('startMurakabBtn');
    const stopBtn = document.getElementById('stopMurakabBtn');
    const notesInput = document.getElementById('murakabNotes');
    const charCount = document.getElementById('murakabCharCount');
    
    if (!startBtn || !stopBtn) return;
    
    // Load saved Murakab data
    loadMurakabData();
    
    // Start button event
    startBtn.addEventListener('click', () => {
        if (!murakabIsRunning) {
            startMurakab();
        }
    });
    
    // Stop button event
    stopBtn.addEventListener('click', () => {
        if (murakabIsRunning) {
            stopMurakab();
        }
    });
    
    // Notes input event
    if (notesInput) {
        notesInput.addEventListener('input', (e) => {
            const notes = e.target.value;
            charCount.textContent = notes.length;
            
            // Save notes
            saveMurakabData('notes', notes);
            
            // Visual feedback
            if (notes.length > 0) {
                notesInput.classList.add('has-content');
            } else {
                notesInput.classList.remove('has-content');
            }
        });
    }
}

// Load Murakab data
function loadMurakabData() {
    const dateKey = formatDateKey(currentDate);
    const savedData = localStorage.getItem(`murakab_${dateKey}`);
    
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            
            // Load notes
            const notesInput = document.getElementById('murakabNotes');
            const charCount = document.getElementById('murakabCharCount');
            if (notesInput && data.notes) {
                notesInput.value = data.notes;
                charCount.textContent = data.notes.length;
                
                if (data.notes.length > 0) {
                    notesInput.classList.add('has-content');
                }
            }
            
            // Load timer for current date
            murakabSeconds = data.seconds || 0;
            updateTimerDisplay();
        } catch (error) {
            murakabSeconds = 0; // Reset on error
            updateTimerDisplay();
        }
    } else {
        // Reset for new date
        murakabSeconds = 0;
        updateTimerDisplay();
        
        // Clear notes for new date
        const notesInput = document.getElementById('murakabNotes');
        const charCount = document.getElementById('murakabCharCount');
        if (notesInput) {
            notesInput.value = '';
            notesInput.classList.remove('has-content');
        }
        if (charCount) {
            charCount.textContent = '0';
        }
    }
}

// Save Murakab data
function saveMurakabData(type, value) {
    const dateKey = formatDateKey(currentDate);
    let savedData = localStorage.getItem(`murakab_${dateKey}`);
    let data = savedData ? JSON.parse(savedData) : {};
    
    if (type === 'notes') {
        data.notes = value;
    } else if (type === 'time') {
        data.seconds = murakabSeconds;
        data.lastUpdated = new Date().toISOString();
    }
    
    localStorage.setItem(`murakab_${dateKey}`, JSON.stringify(data));
}

// Start Murakab
function startMurakab() {
    if (murakabIsRunning) return;
    
    murakabIsRunning = true;
    document.getElementById('startMurakabBtn').disabled = true;
    document.getElementById('stopMurakabBtn').disabled = false;
    
    // Start timer
    murakabTimer = setInterval(() => {
        murakabSeconds++;
        updateTimerDisplay();
        
        // Auto-save every 30 seconds
        if (murakabSeconds % 30 === 0) {
            saveMurakabData('time');
        }
    }, 1000);
    
    // Show notification
    showNotification('Murakab started! Focus on your meditation.', 'success');
}

// Stop Murakab
function stopMurakab() {
    if (!murakabIsRunning) return;
    
    murakabIsRunning = false;
    clearInterval(murakabTimer);
    murakabTimer = null;
    
    document.getElementById('startMurakabBtn').disabled = false;
    document.getElementById('stopMurakabBtn').disabled = true;
    
    // Save final time
    saveMurakabData('time');
    
    // Calculate minutes
    const minutes = Math.floor(murakabSeconds / 60);
    
    // Show summary
    showNotification(`Murakab completed! You meditated for ${minutes} minutes.`, 'success');
}

// Update timer display
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('murakabTimer');
    if (!timerDisplay) return;
    
    const minutes = Math.floor(murakabSeconds / 60);
    const seconds = murakabSeconds % 60;
    
    timerDisplay.textContent = 
        minutes.toString().padStart(2, '0') + ':' + 
        seconds.toString().padStart(2, '0');
}

// Get monthly Murakab report
function getMurakabMonthlyReport() {
    const now = new Date();
    let totalMinutes = 0;
    let totalDays = 0;
    
    // Check last 30 days
    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const dateKey = formatDateKey(date);
        const savedData = localStorage.getItem(`murakab_${dateKey}`);
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.seconds && data.seconds > 0) {
                    totalMinutes += Math.floor(data.seconds / 60);
                    totalDays++;
                }
            } catch (error) {
                // Silently handle errors
            }
        }
    }
    
    return {
        totalMinutes,
        totalDays,
        averagePerDay: totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0
    };
}

// Show monthly report
function showMonthlyReport() {
    const report = getMurakabMonthlyReport();
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-chart-bar"></i> Monthly Murakab Report</h3>
            
            <div class="report-stats">
                <div class="report-item">
                    <span>Total Time:</span>
                    <strong>${report.totalMinutes} minutes</strong>
                </div>
                <div class="report-item">
                    <span>Days Practiced:</span>
                    <strong>${report.totalDays} days</strong>
                </div>
                <div class="report-item">
                    <span>Average Daily:</span>
                    <strong>${report.averagePerDay} minutes</strong>
                </div>
                <div class="report-item">
                    <span>Consistency:</span>
                    <strong>${Math.round((report.totalDays / 30) * 100)}%</strong>
                </div>
            </div>
            
            <button id="closeReportBtn" class="modal-close-btn">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add modal styles
    addModalStyles();
    
    // Add close event listener
    const closeBtn = document.getElementById('closeReportBtn');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Add modal styles
function addModalStyles() {
    if (!document.querySelector('#modal-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            }
            .modal-content {
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            .report-stats {
                display: grid;
                gap: 15px;
                margin-bottom: 25px;
            }
            .report-item {
                display: flex;
                justify-content: space-between;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            .modal-close-btn {
                padding: 10px 25px;
                background: #159895;
                color: white;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                font-weight: bold;
                width: 100%;
            }
        `;
        document.head.appendChild(style);
    }
}

// ========== ROZA TRACKING FUNCTIONS ==========

// Initialize Roza Tracking
function initRozaTracking() {
    // Load roza data
    loadRozaData();
    
    // Render roza interface
    renderRozaInterface();
    renderFastingCalendar();
    
    // Setup event listeners
    setupRozaEventListeners();
}

// Load roza data
function loadRozaData() {
    const dateKey = formatDateKey(currentDate);
    const savedData = localStorage.getItem(`roza_${dateKey}`);
    
    // Reset to default
    rozaData = {
        date: dateKey,
        type: getDefaultFastType(),
        status: 'not_observed',
        schedule: { sehri: false, iftar: false },
        kaffara: { required: false, type: null, notes: '' },
        notes: ''
    };
    
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            rozaData = { ...rozaData, ...parsedData };
        } catch (error) {
            // Silently handle error
        }
    }
}

// Save roza data
function saveRozaData() {
    const dateKey = formatDateKey(currentDate);
    rozaData.date = dateKey;
    localStorage.setItem(`roza_${dateKey}`, JSON.stringify(rozaData));
    
    // Update monthly stats
    updateMonthlyRozaStats();
}

// Get default fast type based on date
function getDefaultFastType() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const month = today.getMonth();
    const date = today.getDate();
    
    // Check if it's Ramzan (assuming Ramzan is in 9th month)
    if (month === 8) {
        return 'ramzan';
    }
    
    // Check if it's Moharram 9th or 10th
    if (month === 0 && (date === 9 || date === 10)) {
        return 'moharram';
    }
    
    // Check if it's Monday or Thursday (Sunnat fasts)
    if (dayOfWeek === 1 || dayOfWeek === 4) {
        return 'sunnat';
    }
    
    return null;
}

// Kaffara option selection
function setupKaffaraSelection() {
    const kaffaraOptions = document.querySelectorAll('.kaffara-option-card');
    const kaffaraNotesInput = document.getElementById('kaffaraNotes');
    const kaffaraCharCount = document.getElementById('kaffaraCharCount');
    
    // Load saved selection
    if (rozaData.kaffara.type) {
        document.querySelectorAll('.kaffara-option-card').forEach(card => {
            if (card.dataset.type === rozaData.kaffara.type) {
                card.classList.add('selected');
            }
        });
    }
    
    // Setup card selection
    kaffaraOptions.forEach(card => {
        card.addEventListener('click', () => {
            // Remove selection from all cards
            kaffaraOptions.forEach(c => c.classList.remove('selected'));
            
            // Add selection to clicked card
            card.classList.add('selected');
            
            // Update data
            rozaData.kaffara.type = card.dataset.type;
            saveRozaData();
        });
    });
    
    // Setup notes input
    if (kaffaraNotesInput) {
        // Load saved notes
        if (rozaData.kaffara.notes) {
            kaffaraNotesInput.value = rozaData.kaffara.notes;
            kaffaraCharCount.textContent = rozaData.kaffara.notes.length;
        }
        
        // Character counter
        kaffaraNotesInput.addEventListener('input', (e) => {
            const text = e.target.value;
            kaffaraCharCount.textContent = text.length;
            
            // Save notes
            rozaData.kaffara.notes = text;
            saveRozaData();
        });
    }
}

// Render roza interface
function renderRozaInterface() {
    // Update fast type buttons
    document.querySelectorAll('.fast-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === rozaData.type) {
            btn.classList.add('active');
        }
    });
    
    // Update status buttons
    document.querySelectorAll('.status-controls .status-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.classList.contains('fast-not-observed') && rozaData.status === 'not_observed') {
            btn.classList.add('active');
        }
        if (btn.classList.contains('fast-partial') && rozaData.status === 'partial') {
            btn.classList.add('active');
        }
        if (btn.classList.contains('fast-completed') && rozaData.status === 'completed') {
            btn.classList.add('active');
        }
    });
    
    // Update kaffara section
    const kaffaraSection = document.getElementById('kaffaraSection');
    const kaffaraRequired = document.getElementById('kaffaraRequired');
    const kaffaraOptions = document.getElementById('kaffaraOptions');
    
    if (kaffaraRequired) {
        kaffaraRequired.checked = rozaData.kaffara.required;
        
        if (rozaData.kaffara.required) {
            kaffaraSection.style.display = 'block';
            kaffaraOptions.style.display = 'block';
            
            // Setup kaffara selection
            setTimeout(setupKaffaraSelection, 100);
        } else {
            kaffaraSection.style.display = 'block';
            kaffaraOptions.style.display = 'none';
        }
    }
    
    // Update timeline
    document.querySelectorAll('.timeline-item').forEach(item => {
        const time = item.dataset.time;
        const btn = item.querySelector('.timeline-btn');
        
        if (rozaData.schedule[time]) {
            item.classList.add('completed');
            btn.textContent = '✓ Done';
            btn.classList.add('done');
            btn.classList.remove('not-done');
        } else {
            item.classList.remove('completed');
            btn.textContent = 'Mark as Done';
            btn.classList.remove('done');
            btn.classList.add('not-done');
        }
    });
}

// Render fasting calendar
function renderFastingCalendar() {
    const calendar = document.getElementById('fastingCalendar');
    const currentMonthEl = document.getElementById('currentMonth');
    
    if (!calendar || !currentMonthEl) return;
    
    // Update month display
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    currentMonthEl.textContent = `${monthNames[calendarMonth]} ${calendarYear}`;
    
    // Calculate first day of month
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const startingDay = firstDay.getDay();
    
    // Calculate days in month
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    
    // Calculate days in previous month
    const prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();
    
    // Clear calendar
    calendar.innerHTML = '';
    
    // Add day headers
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.textAlign = 'center';
        dayHeader.style.padding = '10px 0';
        calendar.appendChild(dayHeader);
    });
    
    // Add previous month days
    for (let i = startingDay - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = prevMonthDays - i;
        calendar.appendChild(day);
    }
    
    // Add current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.textContent = i;
        day.dataset.date = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        // Check if it's today
        if (calendarYear === today.getFullYear() && 
            calendarMonth === today.getMonth() && 
            i === today.getDate()) {
            day.classList.add('today');
        }
        
        // Check if fast is scheduled for this day
        const dateKey = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const fastData = getRozaDataForDate(dateKey);
        
        if (fastData && fastData.type) {
            day.classList.add('fast-day');
            day.classList.add(fastData.type);
            
            // Add status indicator
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'day-status';
            
            if (fastData.status === 'completed') {
                day.classList.add('completed');
            } else if (fastData.status === 'partial') {
                day.classList.add('partial');
            } else if (fastData.status === 'not_observed') {
                day.classList.add('missed');
            }
            
            day.appendChild(statusIndicator);
            
            // Add click event to view details
            day.addEventListener('click', () => {
                showDayDetails(dateKey, fastData);
            });
        }
        
        calendar.appendChild(day);
    }
    
    // Add next month days to complete grid (42 cells total)
    const totalCells = 42;
    const currentCells = startingDay + daysInMonth;
    const nextMonthDays = totalCells - currentCells;
    
    for (let i = 1; i <= nextMonthDays; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = i;
        calendar.appendChild(day);
    }
    
    // Update stats
    updateCalendarStats();
}

// Get roza data for specific date
function getRozaDataForDate(dateKey) {
    const savedData = localStorage.getItem(`roza_${dateKey}`);
    if (savedData) {
        try {
            return JSON.parse(savedData);
        } catch (error) {
            return null;
        }
    }
    return null;
}

// Update calendar statistics
function updateCalendarStats() {
    let totalFasts = 0;
    let completedFasts = 0;
    let qazaFasts = 0;
    
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateKey = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const fastData = getRozaDataForDate(dateKey);
        
        if (fastData && fastData.type) {
            totalFasts++;
            
            if (fastData.status === 'completed') {
                completedFasts++;
            }
            
            if (fastData.type === 'qaza') {
                qazaFasts++;
            }
        }
    }
    
    // Update stat displays
    const totalFastsEl = document.getElementById('totalFasts');
    const completedFastsEl = document.getElementById('completedFasts');
    const qazaFastsEl = document.getElementById('qazaFasts');
    
    if (totalFastsEl) totalFastsEl.textContent = totalFasts;
    if (completedFastsEl) completedFastsEl.textContent = completedFasts;
    if (qazaFastsEl) qazaFastsEl.textContent = qazaFasts;
}

// Update monthly roza statistics
function updateMonthlyRozaStats() {
    const date = new Date();
    const month = date.getMonth();
    const year = date.getFullYear();
    
    let totalFasts = 0;
    let completedFasts = 0;
    let totalMinutes = 0;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const fastData = getRozaDataForDate(dateKey);
        
        if (fastData && fastData.type) {
            totalFasts++;
            
            if (fastData.status === 'completed') {
                completedFasts++;
                totalMinutes += 15 * 60; // 15 hours in minutes
            }
        }
    }
    
    // Save to localStorage for reporting
    localStorage.setItem(`roza_stats_${year}_${month}`, JSON.stringify({
        totalFasts,
        completedFasts,
        totalMinutes
    }));
    
    return { totalFasts, completedFasts, totalMinutes };
}

// Calculate roza progress for the month
function calculateRozaProgress() {
    const monthlyStats = updateMonthlyRozaStats();
    if (monthlyStats.totalFasts === 0) return 0;
    
    return Math.round((monthlyStats.completedFasts / monthlyStats.totalFasts) * 100);
}

// Show roza report
function showRozaReport() {
    const report = updateMonthlyRozaStats();
    const rozaProgress = calculateRozaProgress();
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-calendar-alt"></i> Monthly Roza Report</h3>
            
            <div class="report-stats">
                <div class="report-item">
                    <span>Total Fasts:</span>
                    <strong>${report.totalFasts}</strong>
                </div>
                <div class="report-item">
                    <span>Completed Fasts:</span>
                    <strong>${report.completedFasts}</strong>
                </div>
                <div class="report-item">
                    <span>Success Rate:</span>
                    <strong>${rozaProgress}%</strong>
                </div>
                <div class="report-item">
                    <span>Total Fasting Time:</span>
                    <strong>${Math.floor(report.totalMinutes / 60)} hours</strong>
                </div>
            </div>
            
            <div class="info-box">
                <h4><i class="fas fa-info-circle"></i> Fasting Statistics</h4>
                <div class="info-content">
                    <div>• Daily fasting target: 1 fast</div>
                    <div>• Monthly target: 8 Sunnat fasts (Mondays & Thursdays)</div>
                    <div>• Ramzan: 30 consecutive fasts</div>
                    <div>• Moharram: Recommended 9th & 10th</div>
                </div>
            </div>
            
            <button id="closeRozaReportBtn" class="modal-close-btn">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add info box styles
    if (!document.querySelector('#info-box-styles')) {
        const style = document.createElement('style');
        style.id = 'info-box-styles';
        style.textContent = `
            .info-box {
                margin-bottom: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 10px;
            }
            .info-box h4 {
                color: #666;
                margin-bottom: 10px;
            }
            .info-content {
                font-size: 14px;
                color: #666;
            }
            .info-content div {
                margin-bottom: 5px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add close event listener
    const closeBtn = document.getElementById('closeRozaReportBtn');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Setup roza event listeners
function setupRozaEventListeners() {
    // Fast type selection
    document.querySelectorAll('.fast-option').forEach(btn => {
        btn.addEventListener('click', () => {
            rozaData.type = btn.dataset.type;
            renderRozaInterface();
            saveRozaData();
        });
    });
    
    // Status selection
    document.querySelectorAll('.status-controls .status-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            document.querySelectorAll('.status-controls .status-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Add active to clicked
            btn.classList.add('active');
            
            // Set status based on button class
            if (btn.classList.contains('fast-not-observed')) {
                rozaData.status = 'not_observed';
            } else if (btn.classList.contains('fast-partial')) {
                rozaData.status = 'partial';
            } else if (btn.classList.contains('fast-completed')) {
                rozaData.status = 'completed';
            }
            
            saveRozaData();
        });
    });
    
    // Kaffara checkbox
    const kaffaraRequired = document.getElementById('kaffaraRequired');
    if (kaffaraRequired) {
        kaffaraRequired.addEventListener('change', (e) => {
            rozaData.kaffara.required = e.target.checked;
            renderRozaInterface();
            saveRozaData();
        });
    }
    
    // Timeline buttons
    document.querySelectorAll('.timeline-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = e.target.closest('.timeline-btn').dataset.action;
            
            if (action && rozaData.schedule.hasOwnProperty(action)) {
                rozaData.schedule[action] = !rozaData.schedule[action];
                renderRozaInterface();
                saveRozaData();
            }
        });
    });
    
    // Calendar navigation
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            calendarMonth--;
            if (calendarMonth < 0) {
                calendarMonth = 11;
                calendarYear--;
            }
            renderFastingCalendar();
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            calendarMonth++;
            if (calendarMonth > 11) {
                calendarMonth = 0;
                calendarYear++;
            }
            renderFastingCalendar();
        });
    }
}

// ========== CHARITY TRACKING FUNCTIONS ==========

// Initialize Charity Tracking
function initCharityTracking() {
    // Load charity data
    loadCharityData();
    
    // Setup tabs
    setupCharityTabs();
    
    // Setup form handlers
    setupCharityForms();
    
    // Render initial data
    renderCharityData();
}

// Load charity data
function loadCharityData() {
    // Load each charity type
    ['sadaqah', 'zakat', 'fitra', 'lillah'].forEach(type => {
        const savedData = localStorage.getItem(`charity_${type}`);
        if (savedData) {
            try {
                charityData[type] = JSON.parse(savedData);
            } catch (error) {
                charityData[type] = [];
            }
        } else {
            charityData[type] = [];
        }
    });
}

// Save charity data
function saveCharityData(type) {
    if (charityData[type]) {
        localStorage.setItem(`charity_${type}`, JSON.stringify(charityData[type]));
    }
}

// Setup charity tabs
function setupCharityTabs() {
    const tabs = document.querySelectorAll('.charity-tab');
    const contents = document.querySelectorAll('.charity-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding content
            contents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}Content`) {
                    content.classList.add('active');
                }
            });
            
            // Load data for the tab
            if (tabId === 'report') {
                renderCharityReport();
            } else {
                renderCharityTab(tabId);
            }
        });
    });
}

// Setup charity forms
function setupCharityForms() {
    // Sadaqah form
    const saveSadaqahBtn = document.getElementById('saveSadaqahBtn');
    const resetSadaqahBtn = document.getElementById('resetSadaqahBtn');
    const sadaqahNotes = document.getElementById('sadaqahNotes');
    const sadaqahCharCount = document.getElementById('sadaqahCharCount');
    
    if (saveSadaqahBtn) {
        saveSadaqahBtn.addEventListener('click', saveSadaqah);
    }
    
    if (resetSadaqahBtn) {
        resetSadaqahBtn.addEventListener('click', resetSadaqahForm);
    }
    
    if (sadaqahNotes) {
        sadaqahNotes.addEventListener('input', (e) => {
            sadaqahCharCount.textContent = e.target.value.length;
        });
    }
    
    // Zakat form
    const calculateZakatBtn = document.getElementById('calculateZakatBtn');
    if (calculateZakatBtn) {
        calculateZakatBtn.addEventListener('click', calculateZakat);
    }
    
    // Fitra form
    const saveFitraBtn = document.getElementById('saveFitraBtn');
    const resetFitraBtn = document.getElementById('resetFitraBtn');
    const fitraDetails = document.getElementById('fitraDetails');
    const fitraCharCount = document.getElementById('fitraCharCount');
    
    if (saveFitraBtn) {
        saveFitraBtn.addEventListener('click', saveFitra);
    }
    
    if (resetFitraBtn) {
        resetFitraBtn.addEventListener('click', resetFitraForm);
    }
    
    if (fitraDetails) {
        fitraDetails.addEventListener('input', (e) => {
            fitraCharCount.textContent = e.target.value.length;
        });
    }
    
    // Lillah form
    const saveLillahBtn = document.getElementById('saveLillahBtn');
    const resetLillahBtn = document.getElementById('resetLillahBtn');
    const lillahPurpose = document.getElementById('lillahPurpose');
    const lillahCharCount = document.getElementById('lillahCharCount');
    
    if (saveLillahBtn) {
        saveLillahBtn.addEventListener('click', saveLillah);
    }
    
    if (resetLillahBtn) {
        resetLillahBtn.addEventListener('click', resetLillahForm);
    }
    
    if (lillahPurpose) {
        lillahPurpose.addEventListener('input', (e) => {
            lillahCharCount.textContent = e.target.value.length;
        });
    }
    
    // Report period buttons
    const periodBtns = document.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            periodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCharityReport(btn.dataset.period);
        });
    });
}

// Save Sadaqah
function saveSadaqah() {
    const type = document.getElementById('sadaqahType').value;
    const amount = parseFloat(document.getElementById('sadaqahAmount').value);
    const date = document.getElementById('sadaqahDate').value;
    const recipient = document.getElementById('sadaqahRecipient').value;
    const notes = document.getElementById('sadaqahNotes').value;
    
    // Validation
    if (!amount || amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }
    
    if (!date) {
        showNotification('Please select a date', 'error');
        return;
    }
    
    // Create record
    const record = {
        id: Date.now(),
        type: type,
        amount: amount,
        date: date,
        recipient: recipient,
        notes: notes,
        timestamp: new Date().toISOString()
    };
    
    // Add to data
    charityData.sadaqah.push(record);
    saveCharityData('sadaqah');
    
    // Reset form
    resetSadaqahForm();
    
    // Update UI
    renderCharityTab('sadaqah');
    
    // Show success
    showNotification('Sadaqah saved successfully!', 'success');
}

// Reset Sadaqah form
function resetSadaqahForm() {
    document.getElementById('sadaqahType').value = 'money';
    document.getElementById('sadaqahAmount').value = '';
    document.getElementById('sadaqahDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('sadaqahRecipient').value = '';
    document.getElementById('sadaqahNotes').value = '';
    document.getElementById('sadaqahCharCount').textContent = '0';
}

// Calculate Zakat
function calculateZakat() {
    const savings = parseFloat(document.getElementById('totalSavings').value) || 0;
    const gold = parseFloat(document.getElementById('goldValue').value) || 0;
    const silver = parseFloat(document.getElementById('silverValue').value) || 0;
    const business = parseFloat(document.getElementById('businessAssets').value) || 0;
    const liabilities = parseFloat(document.getElementById('liabilities').value) || 0;
    
    // Calculate total assets
    const totalAssets = savings + gold + silver + business;
    const netWealth = Math.max(0, totalAssets - liabilities);
    
    // Calculate Nisab (silver value)
    const nisab = NISAB_SILVER_GRAMS * CURRENT_SILVER_PRICE;
    
    // Calculate Zakat
    let zakatDue = 0;
    let isZakatDue = netWealth >= nisab;
    
    if (isZakatDue) {
        zakatDue = netWealth * 0.025; // 2.5%
    }
    
    // Show result
    const resultDiv = document.getElementById('zakatResult');
    document.getElementById('totalAssets').textContent = `$${totalAssets.toFixed(2)}`;
    document.getElementById('netWealth').textContent = `$${netWealth.toFixed(2)}`;
    document.getElementById('nisabAmount').textContent = `$${nisab.toFixed(2)}`;
    document.getElementById('zakatDue').textContent = `$${zakatDue.toFixed(2)}`;
    
    resultDiv.style.display = 'block';
    
    // Ask to save if Zakat is due
    if (isZakatDue && zakatDue > 0) {
        setTimeout(() => {
            if (confirm(`Your Zakat due is $${zakatDue.toFixed(2)}. Would you like to save this as a Zakat record?`)) {
                saveZakatRecord(zakatDue);
            }
        }, 500);
    }
}

// Save Zakat record
function saveZakatRecord(amount) {
    const currentYear = new Date().getFullYear();
    
    // Check if already paid for this year
    const alreadyPaid = charityData.zakat.some(record => {
        const recordYear = new Date(record.date).getFullYear();
        return recordYear === currentYear;
    });
    
    if (alreadyPaid) {
        if (!confirm('You already have a Zakat record for this year. Add another record?')) {
            return;
        }
    }
    
    const record = {
        id: Date.now(),
        year: currentYear,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
    };
    
    charityData.zakat.push(record);
    saveCharityData('zakat');
    renderCharityTab('zakat');
    showNotification('Zakat record saved!', 'success');
}

// Save Fitra
function saveFitra() {
    const persons = parseInt(document.getElementById('fitraPersons').value);
    const method = document.getElementById('fitraMethod').value;
    const amount = parseFloat(document.getElementById('fitraAmount').value) || 0;
    const date = document.getElementById('fitraDate').value;
    const details = document.getElementById('fitraDetails').value;
    
    // Validation
    if (persons < 1) {
        showNotification('Please enter number of persons', 'error');
        return;
    }
    
    if (!date) {
        showNotification('Please select Eid date', 'error');
        return;
    }
    
    // Calculate total amount based on method
    let totalAmount = amount;
    if (method !== 'cash') {
        // Use standard rates
        const rates = {
            'wheat': 10, // Approximate USD value for 3.5kg wheat
            'barley': 15, // Approximate USD value for 7kg barley
            'dates': 20, // Approximate USD value for 3.5kg dates
            'raisins': 25 // Approximate USD value for 3.5kg raisins
        };
        totalAmount = rates[method] || 10;
    }
    
    totalAmount = totalAmount * persons;
    
    // Create record
    const record = {
        id: Date.now(),
        year: new Date(date).getFullYear(),
        persons: persons,
        method: method,
        amount: totalAmount,
        date: date,
        details: details,
        timestamp: new Date().toISOString()
    };
    
    // Add to data
    charityData.fitra.push(record);
    saveCharityData('fitra');
    
    // Reset form
    resetFitraForm();
    
    // Update UI
    renderCharityTab('fitra');
    
    // Show success
    showNotification(`Fitra saved for ${persons} persons!`, 'success');
}

// Reset Fitra form
function resetFitraForm() {
    document.getElementById('fitraPersons').value = '1';
    document.getElementById('fitraMethod').value = 'wheat';
    document.getElementById('fitraAmount').value = '';
    document.getElementById('fitraDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('fitraDetails').value = '';
    document.getElementById('fitraCharCount').textContent = '0';
}

// Save Lillah
function saveLillah() {
    const type = document.getElementById('lillahType').value;
    const amount = parseFloat(document.getElementById('lillahAmount').value);
    const date = document.getElementById('lillahDate').value;
    const organization = document.getElementById('lillahOrganization').value;
    const purpose = document.getElementById('lillahPurpose').value;
    
    // Validation
    if (!amount || amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }
    
    if (!date) {
        showNotification('Please select a date', 'error');
        return;
    }
    
    if (!organization) {
        showNotification('Please enter organization name', 'error');
        return;
    }
    
    // Create record
    const record = {
        id: Date.now(),
        type: type,
        amount: amount,
        date: date,
        organization: organization,
        purpose: purpose,
        timestamp: new Date().toISOString()
    };
    
    // Add to data
    charityData.lillah.push(record);
    saveCharityData('lillah');
    
    // Reset form
    resetLillahForm();
    
    // Update UI
    renderCharityTab('lillah');
    
    // Show success
    showNotification('Lillah donation saved successfully!', 'success');
}

// Reset Lillah form
function resetLillahForm() {
    document.getElementById('lillahType').value = 'masjid';
    document.getElementById('lillahAmount').value = '';
    document.getElementById('lillahDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('lillahOrganization').value = '';
    document.getElementById('lillahPurpose').value = '';
    document.getElementById('lillahCharCount').textContent = '0';
}

// Render charity data
function renderCharityData() {
    // Render all tabs initially
    renderCharityTab('sadaqah');
    renderCharityTab('zakat');
    renderCharityTab('fitra');
    renderCharityTab('lillah');
    
    // Initial report
    renderCharityReport();
}

// Render charity tab
function renderCharityTab(tabType) {
    const data = charityData[tabType] || [];
    const recordsContainer = document.getElementById(`${tabType}Records`);
    const emptyState = document.getElementById(`empty${tabType.charAt(0).toUpperCase() + tabType.slice(1)}`);
    
    if (!recordsContainer) return;
    
    // Clear container
    recordsContainer.innerHTML = '';
    
    if (data.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    // Sort by date (newest first)
    const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Render records
    sortedData.forEach(record => {
        const recordEl = document.createElement('div');
        recordEl.className = 'record-item';
        recordEl.dataset.id = record.id;
        
        if (tabType === 'sadaqah') {
            const typeNames = {
                'money': 'Money',
                'food': 'Food',
                'clothes': 'Clothes',
                'education': 'Education',
                'medical': 'Medical',
                'other': 'Other'
            };
            
            recordEl.innerHTML = `
                <div class="record-type">
                    <i class="fas fa-${record.type === 'money' ? 'money-bill-wave' : 
                                      record.type === 'food' ? 'utensils' : 
                                      record.type === 'clothes' ? 'tshirt' :
                                      record.type === 'education' ? 'graduation-cap' :
                                      record.type === 'medical' ? 'briefcase-medical' : 'heart'}"></i>
                    ${typeNames[record.type] || 'Sadaqah'}
                </div>
                <div class="record-amount">$${record.amount.toFixed(2)}</div>
                <div class="record-date">${formatDateShort(new Date(record.date))}</div>
                <div class="record-actions">
                    <button class="action-btn edit-btn" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        } else if (tabType === 'zakat') {
            recordEl.innerHTML = `
                <div class="record-type">
                    <i class="fas fa-scale-balanced"></i>
                    Zakat ${record.year}
                </div>
                <div class="record-amount">$${record.amount.toFixed(2)}</div>
                <div class="record-date">${formatDateShort(new Date(record.date))}</div>
                <div class="record-actions">
                    <button class="action-btn delete-btn" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        } else if (tabType === 'fitra') {
            recordEl.innerHTML = `
                <div class="record-type">
                    <i class="fas fa-wheat-awn"></i>
                    Fitra ${record.year}
                </div>
                <div class="record-date">${record.persons} persons</div>
                <div class="record-amount">$${record.amount.toFixed(2)}</div>
                <div class="record-actions">
                    <button class="action-btn delete-btn" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        } else if (tabType === 'lillah') {
            const typeNames = {
                'masjid': 'Masjid',
                'school': 'Islamic School',
                'orphan': 'Orphan Support',
                'water': 'Water Project',
                'book': 'Islamic Books',
                'other': 'Lillah'
            };
            
            recordEl.innerHTML = `
                <div class="record-type">
                    <i class="fas fa-${record.type === 'masjid' ? 'mosque' : 
                                      record.type === 'school' ? 'school' : 
                                      record.type === 'orphan' ? 'child' :
                                      record.type === 'water' ? 'faucet-droplet' :
                                      record.type === 'book' ? 'book-open' : 'hands-praying'}"></i>
                    ${typeNames[record.type] || 'Lillah'}
                </div>
                <div class="record-date">${record.organization.substring(0, 20)}${record.organization.length > 20 ? '...' : ''}</div>
                <div class="record-amount">$${record.amount.toFixed(2)}</div>
                <div class="record-actions">
                    <button class="action-btn edit-btn" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }
        
        recordsContainer.appendChild(recordEl);
        
        // Add event listeners for action buttons
        const editBtn = recordEl.querySelector('.edit-btn');
        const deleteBtn = recordEl.querySelector('.delete-btn');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => editCharityRecord(tabType, record.id));
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteCharityRecord(tabType, record.id));
        }
    });
    
    // Update summary if sadaqah tab
    if (tabType === 'sadaqah') {
        updateSadaqahSummary();
    }
}

// Update Sadaqah summary
function updateSadaqahSummary() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter this month's sadaqah
    const thisMonthSadaqah = charityData.sadaqah.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth && 
               recordDate.getFullYear() === currentYear;
    });
    
    // Calculate totals
    const totalAmount = thisMonthSadaqah.reduce((sum, record) => sum + record.amount, 0);
    const totalCount = thisMonthSadaqah.length;
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;
    const largestAmount = thisMonthSadaqah.length > 0 ? 
        Math.max(...thisMonthSadaqah.map(r => r.amount)) : 0;
    
    // Update summary display
    const summaryContainer = document.getElementById('sadaqahSummary');
    if (summaryContainer) {
        summaryContainer.innerHTML = `
            <div class="summary-item">
                <div class="icon">
                    <i class="fas fa-hand-holding-dollar"></i>
                </div>
                <div class="value">$${totalAmount.toFixed(2)}</div>
                <div class="label">Total Given</div>
            </div>
            <div class="summary-item">
                <div class="icon">
                    <i class="fas fa-list-check"></i>
                </div>
                <div class="value">${totalCount}</div>
                <div class="label">Total Acts</div>
            </div>
            <div class="summary-item">
                <div class="icon">
                    <i class="fas fa-calculator"></i>
                </div>
                <div class="value">$${averageAmount.toFixed(2)}</div>
                <div class="label">Average Per Act</div>
            </div>
            <div class="summary-item">
                <div class="icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="value">$${largestAmount.toFixed(2)}</div>
                <div class="label">Largest Amount</div>
            </div>
        `;
    }
}

// Edit charity record
function editCharityRecord(type, id) {
    const record = charityData[type].find(r => r.id === id);
    if (!record) return;
    
    // For simplicity, we'll delete and let user re-add
    // In a full implementation, you would populate the form with record data
    if (confirm('Edit this record? You will need to re-enter the information.')) {
        deleteCharityRecord(type, id);
        
        // Switch to appropriate tab
        document.querySelector(`[data-tab="${type}"]`).click();
        
        // Populate form fields (simplified - would need to match form structure)
        if (type === 'sadaqah') {
            document.getElementById('sadaqahType').value = record.type;
            document.getElementById('sadaqahAmount').value = record.amount;
            document.getElementById('sadaqahDate').value = record.date;
            document.getElementById('sadaqahRecipient').value = record.recipient || '';
            document.getElementById('sadaqahNotes').value = record.notes || '';
        } else if (type === 'lillah') {
            document.getElementById('lillahType').value = record.type;
            document.getElementById('lillahAmount').value = record.amount;
            document.getElementById('lillahDate').value = record.date;
            document.getElementById('lillahOrganization').value = record.organization || '';
            document.getElementById('lillahPurpose').value = record.purpose || '';
        }
    }
}

// Delete charity record
function deleteCharityRecord(type, id) {
    if (confirm('Are you sure you want to delete this record?')) {
        charityData[type] = charityData[type].filter(record => record.id !== id);
        saveCharityData(type);
        renderCharityTab(type);
        showNotification('Record deleted', 'success');
    }
}

// Render charity report
function renderCharityReport(period = 'month') {
    const now = new Date();
    let filteredData = {
        sadaqah: [],
        zakat: [],
        fitra: [],
        lillah: []
    };
    
    // Filter data based on period
    Object.keys(charityData).forEach(type => {
        filteredData[type] = charityData[type].filter(record => {
            const recordDate = new Date(record.date);
            
            if (period === 'month') {
                return recordDate.getMonth() === now.getMonth() && 
                       recordDate.getFullYear() === now.getFullYear();
            } else if (period === 'year') {
                return recordDate.getFullYear() === now.getFullYear();
            } else {
                return true; // 'all' period
            }
        });
    });
    
    // Calculate totals
    const totals = {};
    Object.keys(filteredData).forEach(type => {
        totals[type] = filteredData[type].reduce((sum, record) => sum + record.amount, 0);
    });
    
    const totalAll = Object.values(totals).reduce((a, b) => a + b, 0);
    
    // Update chart
    renderCharityChart(totals);
    
    // Update summary
    const summaryContainer = document.getElementById('charityReportSummary');
    if (summaryContainer) {
        summaryContainer.innerHTML = `
            <div class="report-item">
                <div class="value">$${totalAll.toFixed(2)}</div>
                <div class="stat-label">Total Charity</div>
            </div>
            <div class="report-item">
                <div class="value">$${totals.sadaqah.toFixed(2)}</div>
                <div class="stat-label">Sadaqah</div>
            </div>
            <div class="report-item">
                <div class="value">$${totals.zakat.toFixed(2)}</div>
                <div class="stat-label">Zakat</div>
            </div>
            <div class="report-item">
                <div class="value">$${(totals.fitra + totals.lillah).toFixed(2)}</div>
                <div class="stat-label">Fitra & Lillah</div>
            </div>
        `;
    }
    
    // Update breakdown
    const breakdownContainer = document.getElementById('charityBreakdown');
    if (breakdownContainer) {
        breakdownContainer.innerHTML = '';
        
        Object.keys(totals).forEach(type => {
            if (totals[type] > 0) {
                const count = filteredData[type].length;
                const average = count > 0 ? totals[type] / count : 0;
                
                const typeNames = {
                    'sadaqah': 'Sadaqah',
                    'zakat': 'Zakat',
                    'fitra': 'Fitra',
                    'lillah': 'Lillah'
                };
                
                const breakdownEl = document.createElement('div');
                breakdownEl.className = 'record-item';
                breakdownEl.innerHTML = `
                    <div class="record-type">
                        <i class="fas fa-${type === 'sadaqah' ? 'heart' : 
                                          type === 'zakat' ? 'scale-balanced' : 
                                          type === 'fitra' ? 'wheat-awn' : 'hands-praying'}"></i>
                        ${typeNames[type]}
                    </div>
                    <div class="record-amount">$${totals[type].toFixed(2)}</div>
                    <div class="record-date">${count}</div>
                    <div class="record-amount">$${average.toFixed(2)}</div>
                `;
                breakdownContainer.appendChild(breakdownEl);
            }
        });
    }
}

// Render charity chart
function renderCharityChart(totals) {
    const chartContainer = document.getElementById('charityChart');
    if (!chartContainer) return;
    
    // Clear container
    chartContainer.innerHTML = '';
    
    // Get max value for scaling
    const maxValue = Math.max(...Object.values(totals));
    
    // Create bars for each type
    const types = [
        { key: 'sadaqah', name: 'Sadaqah', color: '#4CAF50' },
        { key: 'zakat', name: 'Zakat', color: '#2196F3' },
        { key: 'fitra', name: 'Fitra', color: '#FF9800' },
        { key: 'lillah', name: 'Lillah', color: '#9C27B0' }
    ];
    
    types.forEach(type => {
        if (totals[type.key] > 0) {
            const height = maxValue > 0 ? (totals[type.key] / maxValue) * 100 : 0;
            
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.height = `${height}%`;
            bar.style.background = `linear-gradient(to top, ${type.color}, ${type.color}99)`;
            bar.title = `${type.name}: $${totals[type.key].toFixed(2)}`;
            
            const label = document.createElement('div');
            label.className = 'chart-bar-label';
            label.textContent = type.name.substring(0, 3);
            
            bar.appendChild(label);
            chartContainer.appendChild(bar);
        }
    });
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    // Date navigation
    document.getElementById('prevDayBtn').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        handleDateChange();
    });
    
    document.getElementById('nextDayBtn').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        handleDateChange();
    });
    
    document.getElementById('resetTodayBtn').addEventListener('click', () => {
        currentDate = new Date();
        handleDateChange();
    });

    // Monthly Report Button
    document.getElementById('monthlyReportBtn').addEventListener('click', showMonthlyReport);

    // Roza Report Button
    document.getElementById('rozaReportBtn').addEventListener('click', showRozaReport);

    // Clear All Records button
    document.getElementById('clearAllBtn').addEventListener('click', clearAllSalahRecords);
    
    // Status button clicks
    document.addEventListener('click', (e) => {
        // Farz status buttons
        if (e.target.classList.contains('status-btn')) {
            const container = e.target.closest('.status-options');
            if (container) {
                const salahName = container.dataset.salah;
                const status = e.target.dataset.status;
                
                // Remove active class from all buttons
                container.querySelectorAll('.status-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Update data
                if (salahName === 'witr') {
                    salahData.witr.status = status;
                } else if (salahData.farz[salahName]) {
                    salahData.farz[salahName].status = status;
                }
                
                saveSalahData();
                renderProgressSummary();
            }
        }
        
        // Nafal item clicks
        if (e.target.closest('.nafal-item')) {
            const nafalItem = e.target.closest('.nafal-item');
            const nafalId = nafalItem.dataset.nafal;
            const isActive = nafalItem.classList.contains('active');
            
            // Toggle status
            setNafalStatus(nafalId, !isActive);
        }
    });
    
    // Notes input
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('notes-input')) {
            const salahName = e.target.dataset.salah;
            const notes = e.target.value;
            
            // Update character counter
            const counter = e.target.nextElementSibling?.querySelector('.char-count');
            if (counter) {
                counter.textContent = notes.length;
            }
            
            // Visual feedback
            if (notes.length > 0) {
                e.target.classList.add('has-content');
                e.target.classList.remove('saved');
            } else {
                e.target.classList.remove('has-content', 'saved');
            }
            
            // Save data
            if (salahName === 'witr') {
                salahData.witr.notes = notes;
            } else if (salahData.farz[salahName]) {
                salahData.farz[salahName].notes = notes;
            }
            
            saveSalahData();
            
            // Show saved indicator
            e.target.classList.add('saved');
            setTimeout(() => {
                e.target.classList.remove('saved');
            }, 1000);
        }
    });
}

// Handle date change
function handleDateChange() {
    loadSalahData();
    loadMurakabData();
    loadRozaData();
    loadCharityData();
    renderDate();
    renderFarzSalah();
    renderNafalPrayers();
    renderProgressSummary();
    renderRozaInterface();
    renderCharityData();
}

// Clear ALL records function
function clearAllSalahRecords() {
    if (confirm("⚠️ WARNING: This will delete ALL Salah records!\n\nThis action cannot be undone.\nAre you absolutely sure?")) {
        // Remove all salah data from localStorage
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key.startsWith('salah_') || key.startsWith('murakab_') || key.startsWith('roza_') || key.startsWith('charity_')) {
                localStorage.removeItem(key);
            }
        }
        
        // Also remove overall progress
        localStorage.removeItem('salahOverallProgress');
        localStorage.removeItem('rozaOverallProgress');
        
        // Reset current date data
        resetSalahData();
        saveSalahData();
        
        // Reset roza data
        loadRozaData();

        // Reset charity data
        charityData = { sadaqah: [], zakat: [], fitra: [], lillah: [] };
        
        // Update UI
        renderFarzSalah();
        renderNafalPrayers();
        renderProgressSummary();
        renderRozaInterface();
        renderCharityData();
        
        // Show success message
        showNotification('All records have been cleared!', 'success');
    }
}

// Show notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Set icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : 
                     type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    // Add CSS for animation if not exists
    if (!document.querySelector('#notification-animation')) {
        const style = document.createElement('style');
        style.id = 'notification-animation';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSalahTracker);