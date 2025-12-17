// admin.js - Admin Panel for Zikr Management (LocalStorage Based)

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

// Initialize data - Load from localStorage
async function initializeData() {
    try {
        // Try to load from localStorage
        const savedData = localStorage.getItem('zikrAppData');
        
        if (savedData) {
            zikrData = JSON.parse(savedData);
            console.log('Loaded', zikrData.length, 'records from localStorage');
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
        console.error('Error initializing data:', error);
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

// Load data from data.json file (only if no localStorage data)
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
        
        console.log('Loaded', zikrData.length, 'records from data.json');
        
        renderRecordsList();
        
        if (zikrData.length > 0) {
            selectRecord(zikrData[0].id);
        } else {
            resetForm();
        }
        
        return true;
        
    } catch (error) {
        console.error('Error loading from JSON file:', error);
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
        console.log('Saved', zikrData.length, 'records to localStorage');
    } catch (error) {
        console.error('Error saving to localStorage:', error);
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
    
    showStatus('Ready to add new zikr record', 'success');
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
    document.getElementById('mukhtasarThreshold').value = 4;
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

// Save record (Create or Update) - Only to localStorage
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
    
    // Validate thresholds for countable zikr
    if (!record.isFixedLevel) {
        if (record.mukhtasarThreshold >= record.wasatThreshold ||
            record.wasatThreshold >= record.mukammalThreshold) {
            showStatus('Thresholds must be in increasing order: Short < Medium < Full', 'error');
            return;
        }
    }
    
    try {
        // Check if this is update or create
        const existingIndex = zikrData.findIndex(z => z.id === record.id);
        
        if (existingIndex >= 0) {
            // Update existing record - preserve totalCount
            record.totalCount = zikrData[existingIndex].totalCount;
            zikrData[existingIndex] = record;
            showStatus(`✅ Record "${record.title}" updated successfully!`, 'success');
        } else {
            // Add new record
            zikrData.push(record);
            showStatus(`✅ Record "${record.title}" created successfully!`, 'success');
        }
        
        // Save to localStorage ONLY (no auto-download)
        saveToLocalStorage();
        
        // Update UI
        renderRecordsList();
        selectRecord(record.id);
        
    } catch (error) {
        console.error('Error saving record:', error);
        showStatus('❌ Error saving record. Please try again.', 'error');
    }
}

// Delete current record - Only from localStorage
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
        
        // Save to localStorage ONLY (no auto-download)
        saveToLocalStorage();
        
        // Update UI
        showStatus(`🗑️ Record "${record.title}" deleted successfully!`, 'success');
        
        // Select next record or reset form
        if (zikrData.length > 0) {
            selectRecord(zikrData[0].id);
        } else {
            resetForm();
        }
        
    } catch (error) {
        console.error('Error deleting record:', error);
        showStatus('❌ Error deleting record. Please try again.', 'error');
    }
}

// Export data to JSON file (Manual download)
function exportData() {
    try {
        // Create JSON string with proper formatting
        const jsonData = JSON.stringify(zikrData, null, 2);
        
        // Create download link for the JSON file
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zikr_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showStatus('📥 Data exported to JSON file', 'success');
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showStatus('❌ Error exporting data. Please try again.', 'error');
    }
}

// Import data from file (Manual upload)
function importData(event) {
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
            
            showStatus('📤 Data imported successfully!', 'success');
            
        } catch (error) {
            console.error('Error importing data:', error);
            showStatus('❌ Invalid JSON file. Please check the format.', 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

// Backup data to browser storage
function backupData() {
    try {
        const jsonData = JSON.stringify(zikrData, null, 2);
        localStorage.setItem('zikrData_backup', jsonData);
        localStorage.setItem('zikrData_backup_date', new Date().toISOString());
        showStatus('💾 Data backed up to browser storage', 'success');
    } catch (error) {
        showStatus('❌ Error creating backup', 'error');
    }
}

// Restore data from browser backup
function restoreData() {
    try {
        const backup = localStorage.getItem('zikrData_backup');
        if (!backup) {
            showStatus('No backup found in browser storage', 'error');
            return;
        }
        
        if (!confirm('Restore data from backup? Current data will be replaced.')) {
            return;
        }
        
        zikrData = JSON.parse(backup);
        saveToLocalStorage();
        renderRecordsList();
        
        if (zikrData.length > 0) {
            selectRecord(zikrData[0].id);
        } else {
            resetForm();
        }
        
        showStatus('🔄 Data restored from backup', 'success');
    } catch (error) {
        showStatus('❌ Error restoring backup', 'error');
    }
}

// Reset to original data.json
async function resetToOriginal() {
    if (!confirm('Reset to original data from data.json?\n\nAll changes will be lost.')) {
        return;
    }
    
    try {
        await loadFromJsonFile();
        renderRecordsList();
        
        if (zikrData.length > 0) {
            selectRecord(zikrData[0].id);
        } else {
            resetForm();
        }
        
        showStatus('🔄 Reset to original data successful', 'success');
    } catch (error) {
        showStatus('❌ Error resetting data', 'error');
    }
}

// Show status message
function showStatus(message, type = 'success') {
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

// Threshold increment/decrement handler
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
        
        // Step by 2
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
        
        // Step by 2
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
        
        // Step by 2
        mukammalInput.step = 2;
    }
    
    console.log('Threshold controls setup with step=2');
}

// Event Listeners
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

    setupThresholdControls();
});

// Make functions available globally
window.selectRecord = selectRecord;
window.addNewRecord = addNewRecord;
window.resetForm = resetForm;
window.deleteRecord = deleteRecord;
window.exportData = exportData;
window.importData = importData;
window.backupData = backupData;
window.restoreData = restoreData;
window.resetToOriginal = resetToOriginal;