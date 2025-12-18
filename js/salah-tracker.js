// salah-tracker.js - Salah & Nafal Tracking System

let currentDate = new Date();
let salahData = {
    date: null,
    farz: {
        fajr: { status: 'pending', time: 'Before Sunrise', rakats: 2 },
        zuhr: { status: 'pending', time: 'After Zenith', rakats: 4 },
        asr: { status: 'pending', time: 'Afternoon', rakats: 4 },
        maghrib: { status: 'pending', time: 'After Sunset', rakats: 3 },
        isha: { status: 'pending', time: 'Night', rakats: 4 }
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
    },
    summary: {
        totalFarz: 0,
        totalNafal: 0,
        completedFarz: 0,
        completedNafal: 0
    }
};

// MURAKAB FEATURE
let murakabTimer = null;
let murakabSeconds = 0;
let murakabIsRunning = false;

// DOM Elements
let farzSalahGrid, nafalGrid, progressCircles;

// Initialize
function initSalahTracker() {
    farzSalahGrid = document.getElementById('farzSalahGrid');
    nafalGrid = document.getElementById('nafalGrid');
    progressCircles = document.getElementById('progressCircles');
    
    // Load today's data
    loadSalahData();
    renderDate();
    renderFarzSalah();
    renderNafalPrayers();
    renderProgressSummary();
    renderMurakabSummary();
    initRozaTracking();
    setupEventListeners();
    
    // Initialize Murakab feature
    setTimeout(initMurakab, 100);
    
    console.log('Salah Tracker initialized with Murakab');
}

// Load data from localStorage
function loadSalahData() {
    const dateKey = formatDateKey(currentDate);
    const savedData = localStorage.getItem(`salah_${dateKey}`);
    
    // Reset to default structure
    resetSalahData();
    
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
                if (parsedData.nafal.sunnat) {
                    Object.keys(salahData.nafal.sunnat).forEach(key => {
                        if (parsedData.nafal.sunnat[key]) {
                            if (typeof parsedData.nafal.sunnat[key] === 'object') {
                                Object.keys(salahData.nafal.sunnat[key]).forEach(subKey => {
                                    if (parsedData.nafal.sunnat[key][subKey] !== undefined) {
                                        salahData.nafal.sunnat[key][subKey] = parsedData.nafal.sunnat[key][subKey];
                                    }
                                });
                            } else {
                                salahData.nafal.sunnat[key] = parsedData.nafal.sunnat[key];
                            }
                        }
                    });
                }
                
                // Merge special nafal
                ['tahajjud', 'ishraq', 'chast', 'avabin'].forEach(nafal => {
                    if (parsedData.nafal[nafal]) {
                        salahData.nafal[nafal] = { ...salahData.nafal[nafal], ...parsedData.nafal[nafal] };
                    }
                });
            }
            
            console.log('Loaded salah data for', dateKey);
        } catch (error) {
            console.error('Error parsing saved data:', error);
            // Keep default data if parsing fails
        }
    } else {
        console.log('New day initialized for', dateKey);
    }
    
    // Always set current date
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
    updateSummary();
    
    localStorage.setItem(`salah_${dateKey}`, JSON.stringify(salahData));
    console.log('Saved salah data for', dateKey);
    
    // Update progress in main app if needed
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

// Render current date - SINGLE DISPLAY
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
        { id: 'tahajjud', name: 'Tahajjud', rakats: '2-8', icon: 'moon', time: 'Last Third of Night', color: 'var(--tahajjud-color)' },
        { id: 'ishraq', name: 'Ishraq', rakats: '2', icon: 'sunrise', time: 'After Sunrise', color: 'var(--ishraq-color)' },
        { id: 'chast', name: 'Chast', rakats: '4', icon: 'sun', time: 'Before Zuhr', color: 'var(--chast-color)' },
        { id: 'avabin', name: 'Avabin', rakats: '6', icon: 'pray', time: 'After Maghrib', color: 'var(--avabin-color)' }
    ];
    
    // Render Sunnat
    sunnatNafal.forEach(nafal => {
        const isCompleted = getNafalStatus(nafal.id);
        const item = document.createElement('div');
        item.className = `nafal-item ${isCompleted ? 'active' : ''}`;
        item.dataset.nafal = nafal.id;
        
        item.innerHTML = `
            <div class="nafal-icon">
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
    });
    
    // Render Special Nafal
    specialNafal.forEach(nafal => {
        const isCompleted = getNafalStatus(nafal.id);
        const item = document.createElement('div');
        item.className = `nafal-item ${isCompleted ? 'active' : ''}`;
        item.dataset.nafal = nafal.id;
        item.style.borderColor = nafal.color;
        
        item.innerHTML = `
            <div class="nafal-icon" style="color: ${nafal.color}">
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
    });
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
    let totalFarz = 5; // Always 5 farz salah
    let completedFarz = 0;
    
    // Count completed farz
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
    
    salahData.summary = {
        totalFarz,
        totalNafal,
        completedFarz,
        completedNafal,
        farzPercentage: Math.round((completedFarz / totalFarz) * 100),
        nafalPercentage: Math.round((completedNafal / totalNafal) * 100),
        overallPercentage: Math.round(((completedFarz + completedNafal) / (totalFarz + totalNafal)) * 100)
    };
}

// Murakab daily summary
function renderMurakabSummary() {
    const murakabMinutes = Math.floor(murakabSeconds / 60);
    const summaryStats = document.getElementById('summaryStats');
    
    if (!summaryStats) return;
    
    // Make sure summary object is created
    if (!salahData.summary) {
        salahData.summary = {};
    }

    // Existing stats ke saath Murakab add karein
    summaryStats.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px;">
            <div style="text-align: center; padding: 15px; background: #e8f5e9; border-radius: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #388e3c;">
                    ${salahData.summary.completedFarz || 0}/${salahData.summary.totalFarz || 5}
                </div>
                <div style="font-size: 12px; color: #666;">Farz Completed</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #e3f2fd; border-radius: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #1976d2;">
                    ${salahData.summary.completedNafal || 0}/${salahData.summary.totalNafal || 9}
                </div>
                <div style="font-size: 12px; color: #666;">Nafal Completed</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #f3e5f5; border-radius: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #7b1fa2;">
                    ${murakabMinutes}m
                </div>
                <div style="font-size: 12px; color: #666;">Murakab Time</div>
            </div>
        </div>
    `;
}

// Monthly Murakab report function
function getMurakabMonthlyReport() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
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
                console.error('Error parsing data for', dateKey, error);
            }
        }
    }
    
    return {
        totalMinutes,
        totalDays,
        averagePerDay: totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0
    };
}

// Monthly report show karein
function showMonthlyReport() {
    const report = getMurakabMonthlyReport();
    
    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
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
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 15px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        ">
            <h3 style="color: #7b1fa2; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-chart-bar"></i> Monthly Murakab Report
            </h3>
            
            <div style="display: grid; gap: 15px; margin-bottom: 25px;">
                <div style="display: flex; justify-content: space-between; padding: 10px; background: #f3e5f5; border-radius: 8px;">
                    <span>Total Time:</span>
                    <strong>${report.totalMinutes} minutes</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px; background: #e8f5e9; border-radius: 8px;">
                    <span>Days Practiced:</span>
                    <strong>${report.totalDays} days</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px; background: #e3f2fd; border-radius: 8px;">
                    <span>Average Daily:</span>
                    <strong>${report.averagePerDay} minutes</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px; background: #fff3e0; border-radius: 8px;">
                    <span>Consistency:</span>
                    <strong>${Math.round((report.totalDays / 30) * 100)}%</strong>
                </div>
            </div>
            
            <button id="closeReportBtn" style="
                padding: 10px 25px;
                background: #7b1fa2;
                color: white;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                font-weight: bold;
                width: 100%;
            ">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close event listener
    const closeBtn = document.getElementById('closeReportBtn');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    // Also close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Reset Murakab timer jab date change ho
function resetMurakabForNewDate() {
    murakabIsRunning = false;
    clearInterval(murakabTimer);
    murakabTimer = null;
    
    // Reset timer display
    document.getElementById('startMurakabBtn').disabled = false;
    document.getElementById('stopMurakabBtn').disabled = true;
    
    console.log('Murakab reset for new date');
}

// Render progress summary
function renderProgressSummary() {
    if (!progressCircles) return;
    
    updateSummary();

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
                        style="stroke: var(--nafal-color)">
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
                        style="stroke: var(--witr-color)">
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
        summaryStats.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 20px;">
                <div style="text-align: center; padding: 15px; background: #e8f5e9; border-radius: 10px;">
                    <div style="font-size: 24px; font-weight: bold; color: #388e3c;">
                        ${salahData.summary.completedFarz}/${salahData.summary.totalFarz}
                    </div>
                    <div style="font-size: 12px; color: #666;">Farz Completed</div>
                </div>
                <div style="text-align: center; padding: 15px; background: #e3f2fd; border-radius: 10px;">
                    <div style="font-size: 24px; font-weight: bold; color: #1976d2;">
                        ${salahData.summary.completedNafal}/${salahData.summary.totalNafal}
                    </div>
                    <div style="font-size: 12px; color: #666;">Nafal Completed</div>
                </div>
            </div>
        `;
    }

    renderMurakabSummary();
}

// Update overall progress in main app
function updateOverallProgress() {
    const overallProgress = salahData.summary.overallPercentage;

    // Add roza progress calculation
    const rozaProgress = calculateRozaProgress();
    
    console.log('Overall Salah Progress:', overallProgress + '%');
    console.log('Roza Progress:', rozaProgress + '%');
    
    localStorage.setItem('salahOverallProgress', overallProgress.toString());
    localStorage.setItem('rozaOverallProgress', rozaProgress.toString());
}

// ========== MURAKAB FUNCTIONS ==========

// Initialize Murakab
function initMurakab() {
    const startBtn = document.getElementById('startMurakabBtn');
    const stopBtn = document.getElementById('stopMurakabBtn');
    const timerDisplay = document.getElementById('murakabTimer');
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
    
    // Tooltip hover effect
    const infoIcon = document.querySelector('.info-icon');
    const tooltip = document.querySelector('.murakab-tooltip');
    
    if (infoIcon && tooltip) {
        infoIcon.addEventListener('mouseenter', () => {
            tooltip.style.display = 'block';
        });
        
        infoIcon.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
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
            
            console.log('Loaded Murakab data for', dateKey, 'Seconds:', murakabSeconds);
        } catch (error) {
            console.error('Error loading Murakab data:', error);
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

// Date change functions mein Murakab data load add karein:
function handleDateChange() {
    loadSalahData();
    loadMurakabData(); // ADD THIS LINE
    renderDate();
    loadRozaData();
    renderFarzSalah();
    renderNafalPrayers();
    renderProgressSummary();
    renderRozaInterface();
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
    console.log('Murakab started');
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
    console.log('Murakab stopped after', minutes, 'minutes');
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

// ========== ROZA TRACKING FUNCTIONS ==========

let rozaData = {
    date: null,
    type: null, // 'ramzan', 'moharram', 'sunnat', 'nafil', 'qaza'
    status: 'not_observed', // 'not_observed', 'partial', 'completed'
    schedule: {
        sehri: false,
        iftar: false
    },
    kaffara: {
        required: false,
        type: null,
        notes: ''
    },
    notes: ''
};

let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();

// Initialize Roza Tracking
function initRozaTracking() {
    // Load roza data
    loadRozaData();
    
    // Render roza interface
    renderRozaInterface();
    renderFastingCalendar();
    
    // Setup event listeners
    setupRozaEventListeners();
    
    console.log('Roza Tracking initialized');
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
            console.log('Loaded roza data for', dateKey);
        } catch (error) {
            console.error('Error loading roza data:', error);
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
    
    console.log('Saved roza data for', dateKey);
}

// Get default fast type based on date
function getDefaultFastType() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const month = today.getMonth(); // 0 = January, 8 = September (Ramzan)
    const date = today.getDate();
    
    // Check if it's Ramzan (assuming Ramzan is in 9th month)
    if (month === 8) { // September (adjust based on Hijri calendar)
        return 'ramzan';
    }
    
    // Check if it's Moharram 9th or 10th
    if (month === 0 && (date === 9 || date === 10)) { // January
        return 'moharram';
    }
    
    // Check if it's Monday or Thursday (Sunnat fasts)
    if (dayOfWeek === 1 || dayOfWeek === 4) { // Monday or Thursday
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
            
            // Show animation
            card.style.animation = 'none';
            setTimeout(() => {
                card.style.animation = 'pulse 0.5s';
            }, 10);
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

// Add pulse animation for selection
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

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
    const startingDay = firstDay.getDay(); // 0 = Sunday
    
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
    const totalCells = 42; // 6 rows * 7 days
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
            console.error('Error parsing roza data:', error);
            return null;
        }
    }
    return null;
}

// Update calendar statistics
function updateCalendarStats() {
    // Count fasts for current month
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
    
    // Calculate monthly stats
    let totalFasts = 0;
    let completedFasts = 0;
    let totalMinutes = 0;
    
    // Check all days of current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const fastData = getRozaDataForDate(dateKey);
        
        if (fastData && fastData.type) {
            totalFasts++;
            
            if (fastData.status === 'completed') {
                completedFasts++;
                // Add to total fasting time (assuming average 15 hours per fast)
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

// Show day details modal
function showDayDetails(dateKey, fastData) {
    const date = new Date(dateKey);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    
    const modal = document.createElement('div');
    modal.style.cssText = `
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
    `;
    
    const getTypeName = (type) => {
        switch(type) {
            case 'ramzan': return 'Ramzan Fast';
            case 'moharram': return 'Moharram Fast';
            case 'sunnat': return 'Sunnat Fast';
            case 'nafil': return 'Nafil Fast';
            case 'qaza': return 'Qaza Fast';
            default: return 'Fast';
        }
    };
    
    const getStatusText = (status) => {
        switch(status) {
            case 'completed': return 'Completed ✓';
            case 'partial': return 'Partial ⏳';
            case 'not_observed': return 'Not Observed ✗';
            default: return 'Not Set';
        }
    };
    
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 15px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        ">
            <h3 style="color: #159895; margin-bottom: 20px;">
                <i class="fas fa-calendar-day"></i> ${formattedDate}
            </h3>
            
            <div style="display: grid; gap: 15px; margin-bottom: 25px;">
                <div style="display: flex; justify-content: space-between; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                    <span>Fast Type:</span>
                    <strong>${getTypeName(fastData.type)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                    <span>Status:</span>
                    <strong>${getStatusText(fastData.status)}</strong>
                </div>
                ${fastData.schedule.sehri ? `
                    <div style="display: flex; justify-content: space-between; padding: 10px; background: #e8f5e9; border-radius: 8px;">
                        <span>Sehri:</span>
                        <strong>✓ Done</strong>
                    </div>
                ` : ''}
                ${fastData.schedule.iftar ? `
                    <div style="display: flex; justify-content: space-between; padding: 10px; background: #e8f5e9; border-radius: 8px;">
                        <span>Iftar:</span>
                        <strong>✓ Done</strong>
                    </div>
                ` : ''}
                ${fastData.kaffara.required ? `
                    <div style="padding: 10px; background: #fff3e0; border-radius: 8px; border-left: 4px solid #ff9800;">
                        <div style="font-weight: bold; color: #d32f2f; margin-bottom: 5px;">
                            <i class="fas fa-exclamation-triangle"></i> Kaffara Required
                        </div>
                        <div style="font-size: 14px;">
                            Type: ${fastData.kaffara.type || 'Not specified'}
                        </div>
                        ${fastData.kaffara.notes ? `
                            <div style="font-size: 13px; margin-top: 5px; color: #666;">
                                Notes: ${fastData.kaffara.notes}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                ${fastData.notes ? `
                    <div style="padding: 10px; background: #e3f2fd; border-radius: 8px;">
                        <div style="font-weight: bold; color: #1976d2; margin-bottom: 5px;">
                            <i class="fas fa-sticky-note"></i> Notes
                        </div>
                        <div style="font-size: 14px;">
                            ${fastData.notes}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <button id="closeDayDetailsBtn" style="
                padding: 10px 25px;
                background: #159895;
                color: white;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                font-weight: bold;
                width: 100%;
            ">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close event listener
    const closeBtn = document.getElementById('closeDayDetailsBtn');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    // Also close on outside click
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
    
    // Kaffara type select
    const kaffaraType = document.getElementById('kaffaraType');
    if (kaffaraType) {
        kaffaraType.addEventListener('change', (e) => {
            rozaData.kaffara.type = e.target.value;
            saveRozaData();
        });
    }
    
    // Kaffara notes
    const kaffaraNotes = document.getElementById('kaffaraNotes');
    if (kaffaraNotes) {
        kaffaraNotes.addEventListener('input', (e) => {
            rozaData.kaffara.notes = e.target.value;
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

// Calculate roza progress for the month
function calculateRozaProgress() {
    const monthlyStats = updateMonthlyRozaStats();
    if (monthlyStats.totalFasts === 0) return 0;
    
    return Math.round((monthlyStats.completedFasts / monthlyStats.totalFasts) * 100);
}

// Function to show roza report
function showRozaReport() {
    const report = updateMonthlyRozaStats();
    const rozaProgress = calculateRozaProgress();
    
    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
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
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 15px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        ">
            <h3 style="color: #159895; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-calendar-alt"></i> Monthly Roza Report
            </h3>
            
            <div style="display: grid; gap: 15px; margin-bottom: 25px;">
                <div style="display: flex; justify-content: space-between; padding: 10px; background: #f3e5f5; border-radius: 8px;">
                    <span>Total Fasts:</span>
                    <strong>${report.totalFasts}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px; background: #e8f5e9; border-radius: 8px;">
                    <span>Completed Fasts:</span>
                    <strong>${report.completedFasts}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px; background: #e3f2fd; border-radius: 8px;">
                    <span>Success Rate:</span>
                    <strong>${rozaProgress}%</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px; background: #fff3e0; border-radius: 8px;">
                    <span>Total Fasting Time:</span>
                    <strong>${Math.floor(report.totalMinutes / 60)} hours</strong>
                </div>
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                <h4 style="color: #666; margin-bottom: 10px;">
                    <i class="fas fa-info-circle"></i> Fasting Statistics
                </h4>
                <div style="font-size: 14px; color: #666;">
                    <div>• Daily fasting target: 1 fast</div>
                    <div>• Monthly target: 8 Sunnat fasts (Mondays & Thursdays)</div>
                    <div>• Ramzan: 30 consecutive fasts</div>
                    <div>• Moharram: Recommended 9th & 10th</div>
                </div>
            </div>
            
            <button id="closeRozaReportBtn" style="
                padding: 10px 25px;
                background: #159895;
                color: white;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                font-weight: bold;
                width: 100%;
            ">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close event listener
    const closeBtn = document.getElementById('closeRozaReportBtn');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    // Also close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ========== EVENT LISTENERS ==========
// Event Listeners
function setupEventListeners() {
    // Date navigation
    document.getElementById('prevDayBtn').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        handleDateChange(); // USE THIS INSTEAD
    });
    
    document.getElementById('nextDayBtn').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        handleDateChange(); // USE THIS INSTEAD
    });
    
    document.getElementById('resetTodayBtn').addEventListener('click', () => {
        currentDate = new Date();
        handleDateChange(); // USE THIS INSTEAD
    });

    // Monthly Report Button
    document.getElementById('monthlyReportBtn').addEventListener('click', showMonthlyReport);

    // Add this to your setupEventListeners function:
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
            
            if (salahName === 'witr') {
                salahData.witr.notes = notes;
            } else if (salahData.farz[salahName]) {
                salahData.farz[salahName].notes = notes;
            }
            
            saveSalahData();
        }
    });

    // Character counter for notes
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

// Clear ALL records function
function clearAllSalahRecords() {
    if (confirm("⚠️ WARNING: This will delete ALL Salah records!\n\nThis action cannot be undone.\nAre you absolutely sure?")) {
        // Remove all salah data from localStorage
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key.startsWith('salah_') || key.startsWith('murakab_') || key.startsWith('roza_')) {
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

        // Update UI
        renderFarzSalah();
        renderNafalPrayers();
        renderProgressSummary();
        renderRozaInterface();
        
        // Show success message
        showNotification('All records have been cleared!', 'success');
        console.log('All salah records cleared');
    }
}

// Show notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : '#2196f3'};
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
    
    // Add CSS for animation
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
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

// Make functions available globally
window.prevDay = () => {
    currentDate.setDate(currentDate.getDate() - 1);
    loadSalahData();
    renderDate();
    renderFarzSalah();
    renderNafalPrayers();
    renderProgressSummary();
};

window.nextDay = () => {
    currentDate.setDate(currentDate.getDate() + 1);
    loadSalahData();
    renderDate();
    renderFarzSalah();
    renderNafalPrayers();
    renderProgressSummary();
};

window.resetToToday = () => {
    currentDate = new Date();
    loadSalahData();
    renderDate();
    renderFarzSalah();
    renderNafalPrayers();
    renderProgressSummary();
};