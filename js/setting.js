// Setting Panel for Zikr Management - Optimized Version

let zikrData = [];
let currentRecordId = null;
let isNewRecord = true;

// DOM Elements
const recordsList = document.getElementById('recordsList');
const zikrForm = document.getElementById('zikrForm');
const formTitle = document.getElementById('formTitle');
const deleteBtn = document.getElementById('deleteBtn');
const isFixedLevel = document.getElementById('isFixedLevel');
const thresholdSection = document.getElementById('thresholdSection');
const statusMessage = document.getElementById('statusMessage');

// Initialize application
async function initializeData() {
    try {
        // Try to load from localStorage
        const savedData = localStorage.getItem('zikrAppData');
        
        if (savedData) {
            zikrData = JSON.parse(savedData);
        } else {
            // If no data in localStorage, try to load from data.json
            await loadFromJsonFile();
            return;
        }
        
        renderRecordsList();
        
        // Auto-select first record if exists
        if (zikrData.length > 0) {
            selectRecord(zikrData[0].id);
        } else {
            resetForm();
        }
        
    } catch (error) {
        showStatus('Error loading data. Please refresh the page.', 'error');
        recordsList.innerHTML = `
            <div class="no-records">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Data</h3>
                <p>Please refresh the page</p>
                <button class="btn" onclick="initializeData()" style="margin-top: 15px;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// Load data from data.json file
async function loadFromJsonFile() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`Failed to load data.json: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        zikrData = Array.isArray(data) ? data : data.zikrData || [];
        
        // Initialize totalCount to 0 for all records
        zikrData.forEach(zikr => {
            zikr.totalCount = 0;
        });
        
        // Save to localStorage
        saveToLocalStorage();
        
        renderRecordsList();
        
        if (zikrData.length > 0) {
            selectRecord(zikrData[0].id);
        } else {
            resetForm();
        }
        
        return true;
        
    } catch (error) {
        showStatus('Could not load data.json. Starting with empty data.', 'error');
        zikrData = [];
        renderRecordsList();
        resetForm();
        return false;
    }
}

// Save data to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem('zikrAppData', JSON.stringify(zikrData));
        localStorage.setItem('zikrAppLastSync', new Date().toISOString());
    } catch (error) {
        throw error;
    }
}

// Render records list in sidebar
function renderRecordsList() {
    if (zikrData.length === 0) {
        recordsList.innerHTML = `
            <div class="no-records">
                <i class="fas fa-book-open"></i>
                <h3>No Zikr Records</h3>
                <p>Click "Add New" to create your first zikr</p>
            </div>
        `;
        return;
    }
    
    recordsList.innerHTML = zikrData.map(zikr => `
        <div class="record-item ${currentRecordId === zikr.id ? 'active' : ''}" 
             onclick="selectRecord(${zikr.id})">
            <div class="record-title">
                ${zikr.isFixedLevel ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-repeat"></i>'}
                ${zikr.title}
            </div>
            <div class="record-meta">
                <span>ID: ${zikr.id}</span>
                <span class="record-type">
                    ${zikr.isFixedLevel ? 'Fixed' : 'Countable'}
                </span>
            </div>
        </div>
    `).join('');
}

// Select a record to edit
function selectRecord(id) {
    const record = zikrData.find(z => z.id === id);
    if (!record) return;
    
    currentRecordId = id;
    isNewRecord = false;
    
    // Update form title
    formTitle.innerHTML = `<i class="fas fa-edit"></i> Edit: ${record.title}`;
    
    // Fill form with record data
    document.getElementById('recordId').value = record.id;
    document.getElementById('title').value = record.title;
    document.getElementById('arabic').value = record.arabic || '';
    document.getElementById('romanArabic').value = record.romanArabic || '';
    document.getElementById('romanUrdu').value = record.romanUrdu || '';
    document.getElementById('description').value = record.description || '';
    document.getElementById('isFixedLevel').checked = record.isFixedLevel || false;
    document.getElementById('mukhtasarThreshold').value = record.mukhtasarThreshold || 3;
    document.getElementById('wasatThreshold').value = record.wasatThreshold || 7;
    document.getElementById('mukammalThreshold').value = record.mukammalThreshold || 11;
    
    // Show delete button
    deleteBtn.style.display = 'flex';
    
    // Toggle threshold visibility
    toggleThresholdVisibility();
    
    // Re-render records list to update active state
    renderRecordsList();
    
    // Scroll to top of form
    document.querySelector('.form-section').scrollTop = 0;
    
    hideStatus();
}

// Add new record
function addNewRecord() {
    resetForm();
    formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Zikr';
    deleteBtn.style.display = 'none';
    
    // Generate new ID
    const newId = zikrData.length > 0 ? Math.max(...zikrData.map(z => z.id)) + 1 : 1;
    document.getElementById('recordId').value = newId;
    
    // Focus on title field
    document.getElementById('title').focus();
    
    showStatus('Ready to add new zikr record', 'info');
}

// Reset form to default
function resetForm() {
    zikrForm.reset();
    currentRecordId = null;
    isNewRecord = true;
    formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Zikr';
    deleteBtn.style.display = 'none';
    
    // Set default values
    document.getElementById('recordId').value = '0';
    document.getElementById('mukhtasarThreshold').value = 3;
    document.getElementById('wasatThreshold').value = 7;
    document.getElementById('mukammalThreshold').value = 11;
    document.getElementById('isFixedLevel').checked = false;
    document.getElementById('description').value = '';
    
    toggleThresholdVisibility();
    hideStatus();
    
    // Update records list active state
    renderRecordsList();
}

// Toggle threshold fields visibility
function toggleThresholdVisibility() {
    const isFixed = document.getElementById('isFixedLevel').checked;
    thresholdSection.style.display = isFixed ? 'none' : 'block';
    
    if (isFixed) {
        document.getElementById('mukhtasarThreshold').value = 3;
        document.getElementById('wasatThreshold').value = 7;
        document.getElementById('mukammalThreshold').value = 11;
    }
}

// Validate threshold values
function validateThresholds(record) {
    if (!record.isFixedLevel) {
        const mukhtasar = record.mukhtasarThreshold;
        const wasat = record.wasatThreshold;
        const mukammal = record.mukammalThreshold;
        
        // Check if all are odd numbers
        if (mukhtasar % 2 === 0 || wasat % 2 === 0 || mukammal % 2 === 0) {
            return 'Threshold values must be odd numbers';
        }
        
        // Check increasing order
        if (mukhtasar >= wasat || wasat >= mukammal) {
            return 'Thresholds must be in increasing order: Short < Medium < Full';
        }
        
        // Check minimum values
        if (mukhtasar < 3 || wasat < 7 || mukammal < 11) {
            return 'Minimum thresholds: Short=3, Medium=7, Full=11';
        }
    }
    
    return null;
}

// Save record (Create or Update)
function saveRecord() {
    // Validate form
    if (!zikrForm.checkValidity()) {
        showStatus('Please fill all required fields', 'error');
        return;
    }
    
    // Get form data
    const formData = new FormData(zikrForm);
    const record = {
        id: parseInt(formData.get('id')),
        title: formData.get('title').trim(),
        arabic: formData.get('arabic').trim(),
        romanArabic: formData.get('romanArabic').trim(),
        romanUrdu: formData.get('romanUrdu').trim(),
        description: formData.get('description').trim(),
        isFixedLevel: formData.get('isFixedLevel') === 'on',
        mukhtasarThreshold: parseInt(formData.get('mukhtasarThreshold')),
        wasatThreshold: parseInt(formData.get('wasatThreshold')),
        mukammalThreshold: parseInt(formData.get('mukammalThreshold')),
        totalCount: 0
    };
    
    // Validate title
    if (!record.title) {
        showStatus('Title is required', 'error');
        return;
    }
    
    // Validate thresholds
    const thresholdError = validateThresholds(record);
    if (thresholdError) {
        showStatus(thresholdError, 'error');
        return;
    }
    
    try {
        // Check if this is update or create
        const existingIndex = zikrData.findIndex(z => z.id === record.id);
        
        if (existingIndex >= 0) {
            // Update existing record - preserve totalCount
            record.totalCount = zikrData[existingIndex].totalCount;
            zikrData[existingIndex] = record;
            showStatus(`Record "${record.title}" updated successfully!`, 'success');
        } else {
            // Add new record
            zikrData.push(record);
            showStatus(`Record "${record.title}" created successfully!`, 'success');
        }
        
        // Save to localStorage
        saveToLocalStorage();
        
        // Update UI
        renderRecordsList();
        selectRecord(record.id);
        
    } catch (error) {
        showStatus('Error saving record. Please try again.', 'error');
    }
}

// Delete current record
function deleteRecord() {
    if (!currentRecordId) return;
    
    const record = zikrData.find(z => z.id === currentRecordId);
    if (!record) return;
    
    if (!confirm(`Are you sure you want to delete "${record.title}"?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    try {
        // Remove from array
        zikrData = zikrData.filter(z => z.id !== currentRecordId);
        
        // Save to localStorage
        saveToLocalStorage();
        
        // Update UI
        showStatus(`Record "${record.title}" deleted successfully!`, 'success');
        
        // Select next record or reset form
        if (zikrData.length > 0) {
            selectRecord(zikrData[0].id);
        } else {
            resetForm();
        }
        
    } catch (error) {
        showStatus('Error deleting record. Please try again.', 'error');
    }
}

// ========== ZIKR DATA MANAGEMENT ==========

// Export Zikr data to JSON file
function exportZikrData() {
    try {
        // Get current data
        const jsonData = JSON.stringify(zikrData, null, 2);
        
        // Create download link
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zikr_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showStatus('Zikr data exported successfully!', 'success');
        
    } catch (error) {
        showStatus('Error exporting Zikr data. Please try again.', 'error');
    }
}

// Import Zikr data from file
function importZikrData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            const newData = Array.isArray(importedData) ? importedData : importedData.zikrData || [];
            
            if (newData.length === 0) {
                throw new Error('No valid data found in file');
            }
            
            // Ask user what to do
            const choice = confirm('Do you want to:\n\nOK = Merge with existing data\nCancel = Replace all data');
            
            if (choice) {
                // Merge data
                newData.forEach(newZikr => {
                    const existingIndex = zikrData.findIndex(z => z.id === newZikr.id);
                    if (existingIndex >= 0) {
                        // Update existing, preserve counts
                        newZikr.totalCount = zikrData[existingIndex].totalCount;
                        zikrData[existingIndex] = newZikr;
                    } else {
                        // Add new
                        if (!newZikr.totalCount) newZikr.totalCount = 0;
                        zikrData.push(newZikr);
                    }
                });
            } else {
                // Replace all data
                zikrData = newData.map(zikr => ({
                    ...zikr,
                    totalCount: zikr.totalCount || 0
                }));
            }
            
            // Save to localStorage
            saveToLocalStorage();
            
            // Update UI
            renderRecordsList();
            if (zikrData.length > 0) {
                selectRecord(zikrData[0].id);
            } else {
                resetForm();
            }
            
            showStatus('Zikr data imported successfully!', 'success');
            
        } catch (error) {
            showStatus('Invalid JSON file. Please check the format.', 'error');
        }
    };
    
    reader.onerror = function() {
        showStatus('Error reading file. Please try again.', 'error');
    };
    
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

// ========== SALAH DATA MANAGEMENT ==========

// Export Salah data to JSON file
function exportSalahData() {
    try {
        // Collect all Salah data from localStorage
        const salahData = {};
        const now = new Date();
        
        // Get last 30 days of Salah data
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            
            // Get Salah data
            const salah = localStorage.getItem(`salah_${dateKey}`);
            if (salah) {
                salahData[dateKey] = JSON.parse(salah);
            }
            
            // Get Murakab data
            const murakab = localStorage.getItem(`murakab_${dateKey}`);
            if (murakab) {
                if (!salahData[dateKey]) salahData[dateKey] = {};
                salahData[dateKey].murakab = JSON.parse(murakab);
            }
            
            // Get Roza data
            const roza = localStorage.getItem(`roza_${dateKey}`);
            if (roza) {
                if (!salahData[dateKey]) salahData[dateKey] = {};
                salahData[dateKey].roza = JSON.parse(roza);
            }
        }
        
        // Get overall progress
        const overallProgress = {
            salah: localStorage.getItem('salahOverallProgress') || '0',
            roza: localStorage.getItem('rozaOverallProgress') || '0'
        };
        
        // Combine all data
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                dataType: 'salah_tracking',
                daysCount: Object.keys(salahData).length
            },
            salahData: salahData,
            overallProgress: overallProgress
        };
        
        // Create JSON string
        const jsonData = JSON.stringify(exportData, null, 2);
        
        // Create download link
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `salah_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showStatus('Salah data exported successfully!', 'success');
        
    } catch (error) {
        showStatus('Error exporting Salah data. Please try again.', 'error');
    }
}

// Import Salah data from file
function importSalahData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!importedData.salahData || typeof importedData.salahData !== 'object') {
                throw new Error('Invalid Salah data format');
            }
            
            if (!confirm('Import Salah data?\n\nExisting Salah data for same dates will be overwritten.')) {
                return;
            }
            
            // Import Salah data
            let importedCount = 0;
            Object.entries(importedData.salahData).forEach(([dateKey, data]) => {
                if (data) {
                    // Save Salah data
                    if (Object.keys(data).length > 0) {
                        localStorage.setItem(`salah_${dateKey}`, JSON.stringify(data));
                        importedCount++;
                    }
                    
                    // Save Murakab data if exists
                    if (data.murakab) {
                        localStorage.setItem(`murakab_${dateKey}`, JSON.stringify(data.murakab));
                    }
                    
                    // Save Roza data if exists
                    if (data.roza) {
                        localStorage.setItem(`roza_${dateKey}`, JSON.stringify(data.roza));
                    }
                }
            });
            
            // Import overall progress
            if (importedData.overallProgress) {
                if (importedData.overallProgress.salah) {
                    localStorage.setItem('salahOverallProgress', importedData.overallProgress.salah);
                }
                if (importedData.overallProgress.roza) {
                    localStorage.setItem('rozaOverallProgress', importedData.overallProgress.roza);
                }
            }
            
            showStatus(`Successfully imported ${importedCount} days of Salah data!`, 'success');
            
        } catch (error) {
            showStatus('Invalid Salah data file. Please check the format.', 'error');
        }
    };
    
    reader.onerror = function() {
        showStatus('Error reading file. Please try again.', 'error');
    };
    
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

// Clear all Salah data
function clearAllSalahData() {
    if (!confirm('⚠️ WARNING: This will delete ALL Salah tracking data!\n\nThis includes prayer records, fasting data, and meditation logs.\n\nThis action cannot be undone!\n\nAre you absolutely sure?')) {
        return;
    }
    
    try {
        // Remove all Salah-related data from localStorage
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key.startsWith('salah_') || key.startsWith('murakab_') || key.startsWith('roza_')) {
                localStorage.removeItem(key);
            }
        }
        
        // Remove overall progress
        localStorage.removeItem('salahOverallProgress');
        localStorage.removeItem('rozaOverallProgress');
        
        // Remove monthly stats
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key.startsWith('roza_stats_') || key.startsWith('murakab_stats_')) {
                localStorage.removeItem(key);
            }
        }
        
        showStatus('All Salah data has been cleared!', 'success');
        
    } catch (error) {
        showStatus('Error clearing Salah data. Please try again.', 'error');
    }
}

// ========== BACKUP AND RESTORE ==========

// Backup all data to browser storage
function backupAllData() {
    try {
        // Collect all data
        const backupData = {
            timestamp: new Date().toISOString(),
            zikrData: zikrData,
            salahData: {}
        };
        
        // Collect Salah data (last 90 days)
        const now = new Date();
        for (let i = 0; i < 90; i++) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            
            // Get Salah data
            const salah = localStorage.getItem(`salah_${dateKey}`);
            if (salah) {
                backupData.salahData[dateKey] = JSON.parse(salah);
            }
            
            // Get Murakab data
            const murakab = localStorage.getItem(`murakab_${dateKey}`);
            if (murakab) {
                if (!backupData.salahData[dateKey]) backupData.salahData[dateKey] = {};
                backupData.salahData[dateKey].murakab = JSON.parse(murakab);
            }
            
            // Get Roza data
            const roza = localStorage.getItem(`roza_${dateKey}`);
            if (roza) {
                if (!backupData.salahData[dateKey]) backupData.salahData[dateKey] = {};
                backupData.salahData[dateKey].roza = JSON.parse(roza);
            }
        }
        
        // Save to localStorage
        localStorage.setItem('full_backup_data', JSON.stringify(backupData));
        localStorage.setItem('full_backup_timestamp', new Date().toISOString());
        
        showStatus('Complete backup created successfully!', 'success');
        
    } catch (error) {
        showStatus('Error creating backup. Please try again.', 'error');
    }
}

// Restore all data from browser backup
function restoreAllData() {
    try {
        const backup = localStorage.getItem('full_backup_data');
        if (!backup) {
            showStatus('No backup found in browser storage', 'error');
            return;
        }
        
        if (!confirm('Restore all data from backup?\n\nAll current data will be replaced.')) {
            return;
        }
        
        const backupData = JSON.parse(backup);
        
        // Restore Zikr data
        if (backupData.zikrData && Array.isArray(backupData.zikrData)) {
            zikrData = backupData.zikrData;
            saveToLocalStorage();
            renderRecordsList();
            
            if (zikrData.length > 0) {
                selectRecord(zikrData[0].id);
            } else {
                resetForm();
            }
        }
        
        // Restore Salah data
        if (backupData.salahData && typeof backupData.salahData === 'object') {
            // Clear existing Salah data first
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key.startsWith('salah_') || key.startsWith('murakab_') || key.startsWith('roza_')) {
                    localStorage.removeItem(key);
                }
            }
            
            // Restore from backup
            Object.entries(backupData.salahData).forEach(([dateKey, data]) => {
                if (data) {
                    localStorage.setItem(`salah_${dateKey}`, JSON.stringify(data));
                    
                    if (data.murakab) {
                        localStorage.setItem(`murakab_${dateKey}`, JSON.stringify(data.murakab));
                    }
                    
                    if (data.roza) {
                        localStorage.setItem(`roza_${dateKey}`, JSON.stringify(data.roza));
                    }
                }
            });
        }
        
        showStatus('All data restored from backup!', 'success');
        
    } catch (error) {
        showStatus('Error restoring backup. Please try again.', 'error');
    }
}

// Reset Zikr data to default
function resetToDefault() {
    if (!confirm('Reset Zikr data to original values?\n\nAll changes will be lost.')) {
        return;
    }
    
    try {
        loadFromJsonFile();
        showStatus('Zikr data reset to original values!', 'success');
    } catch (error) {
        showStatus('Error resetting data', 'error');
    }
}

// ========== HELPER FUNCTIONS ==========

// Show status message
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    statusMessage.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(hideStatus, 5000);
}

// Hide status message
function hideStatus() {
    statusMessage.style.display = 'none';
}

// Setup threshold controls
function setupThresholdControls() {
    // Mukhtasar threshold controls
    const mukhtasarInput = document.getElementById('mukhtasarThreshold');
    if (mukhtasarInput) {
        mukhtasarInput.addEventListener('change', function() {
            // Ensure value is odd
            if (this.value % 2 === 0) {
                this.value = parseInt(this.value) + 1;
            }
            // Ensure minimum 3
            if (this.value < 3) this.value = 3;
        });
        
        mukhtasarInput.step = 2;
    }
    
    // Wasat threshold controls
    const wasatInput = document.getElementById('wasatThreshold');
    if (wasatInput) {
        wasatInput.addEventListener('change', function() {
            // Ensure value is odd
            if (this.value % 2 === 0) {
                this.value = parseInt(this.value) + 1;
            }
            // Ensure minimum 7
            if (this.value < 7) this.value = 7;
        });
        
        wasatInput.step = 2;
    }
    
    // Mukammal threshold controls
    const mukammalInput = document.getElementById('mukammalThreshold');
    if (mukammalInput) {
        mukammalInput.addEventListener('change', function() {
            // Ensure value is odd
            if (this.value % 2 === 0) {
                this.value = parseInt(this.value) + 1;
            }
            // Ensure minimum 11
            if (this.value < 11) this.value = 11;
        });
        
        mukammalInput.step = 2;
    }
}

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    initializeData();
    
    // Form submit handler
    zikrForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveRecord();
    });
    
    // Fixed level checkbox handler
    isFixedLevel.addEventListener('change', toggleThresholdVisibility);
    
    // Setup threshold controls
    setupThresholdControls();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveRecord();
        }
        
        // Ctrl+N for new record
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            addNewRecord();
        }
        
        // Delete key to delete
        if (e.key === 'Delete' && currentRecordId) {
            deleteRecord();
        }
        
        // Escape to reset form
        if (e.key === 'Escape') {
            resetForm();
        }
    });
});

// Make functions available globally
window.selectRecord = selectRecord;
window.addNewRecord = addNewRecord;
window.resetForm = resetForm;
window.deleteRecord = deleteRecord;
window.exportZikrData = exportZikrData;
window.importZikrData = importZikrData;
window.exportSalahData = exportSalahData;
window.importSalahData = importSalahData;
window.backupAllData = backupAllData;
window.restoreAllData = restoreAllData;
window.resetToDefault = resetToDefault;
window.clearAllSalahData = clearAllSalahData;