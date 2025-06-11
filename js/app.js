// Main App Logic
class PlantCareApp {
    constructor() {
        this.currentPage = 'room';
        this.plants = [];
        this.isLoading = false;
        this.discoverPlants = [];
        this.discoverPage = 1;
        this.init();
    }

    init() {
        this.setupNavigation();
        this.loadDiscoverPage();
        this.updateStats();
        this.setupEventListeners();
        this.checkNotifications();
        this.setupInfiniteScroll();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.switchPage(page);
                
                // Update active state
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    switchPage(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
            p.classList.add('page-transition-exit');
        });

        // Show selected page
        setTimeout(() => {
            document.querySelectorAll('.page').forEach(p => {
                p.classList.remove('page-transition-exit');
            });
            
            const selectedPage = document.getElementById(`${page}-page`);
            selectedPage.classList.add('active', 'page-transition-enter');
            
            setTimeout(() => {
                selectedPage.classList.remove('page-transition-enter');
            }, 400);
        }, 300);

        this.currentPage = page;

        // Load page-specific content
        switch(page) {
            case 'discover':
                this.loadDiscoverPage();
                break;
            case 'care':
                this.loadCarePage();
                break;
            case 'journal':
                this.loadJournalPage();
                break;
            case 'profile':
                this.updateStats();
                break;
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('plant-search');
        const searchBtn = document.querySelector('.search-btn');
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchPlants(searchInput.value);
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchPlants(searchInput.value);
            });
        }

        // Filter chips
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                // Map chip text to API filter
                const text = chip.textContent.trim().toLowerCase();
                let filter = null;
                switch (text) {
                    case 'indoor':
                        filter = { indoor: 1 };
                        break;
                    case 'outdoor':
                        filter = { indoor: 0 };
                        break;
                    case 'edible':
                        filter = { edible: 1 };
                        break;
                    case 'poisonous':
                        filter = { poisonous: 1 };
                        break;
                    case 'annual':
                        filter = { cycle: 'annual' };
                        break;
                    case 'perennial':
                        filter = { cycle: 'perennial' };
                        break;
                    case 'all':
                    default:
                        filter = null;
                }
                this.filterPlants(filter);
            });
        });

        // Care page buttons
        document.getElementById('add-reminder-btn')?.addEventListener('click', () => {
            this.showAddReminderModal();
        });

        // Journal page button
        document.getElementById('new-entry-btn')?.addEventListener('click', () => {
            this.showNewJournalEntryModal();
        });

        // Profile actions
        document.querySelectorAll('.profile-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.textContent.trim();
                this.handleProfileAction(action);
            });
        });
    }

    // Store current search/filter state
    currentSearch = '';
    currentFilter = null;
    async loadDiscoverPage(reset = true) {
        const grid = document.getElementById('plant-grid');
        if (!grid || this.isLoading) return;

        if (reset) {
            this.discoverPlants = [];
            this.discoverPage = 1;
        }

        this.isLoading = true;
        if (reset) {
            grid.innerHTML = '<div class="loader-container"><div class="plant-loader"></div></div>';
        } else {
            // Show loader at the bottom for load more
            const loader = document.createElement('div');
            loader.className = 'loader-container';
            loader.innerHTML = '<div class="plant-loader"></div>';
            grid.appendChild(loader);
        }

        try {
            let result;
            if (this.currentSearch) {
                result = await plantAPI.searchPlants(this.currentSearch, { ...this.currentFilter, page: this.discoverPage });
            } else if (this.currentFilter) {
                result = await plantAPI.searchPlants('', { ...this.currentFilter, page: this.discoverPage });
            } else {
                result = await plantAPI.searchPlants('', { indoor: 1, page: this.discoverPage });
            }
            if (result.data && result.data.length > 0) {
                this.discoverPlants = this.discoverPlants.concat(result.data);
                this.displayPlants(this.discoverPlants, true);
                this.discoverPage++;
            } else if (reset) {
                grid.innerHTML = '<p class="no-results">No plants found. Try searching!</p>';
            }
        } catch (error) {
            if (reset) {
                grid.innerHTML = '<p class="error">Failed to load plants. Please try again.</p>';
            }
        } finally {
            this.isLoading = false;
        }
    }

    displayPlants(plants, showLoadMore = false) {
        const grid = document.getElementById('plant-grid');
        grid.innerHTML = plants.map(plant => {
            const formatted = plantAPI.formatPlantData(plant);
            return `
                <div class="plant-card" data-plant-id="${formatted.id}">
                    <img src="${formatted.thumbnail}" 
                         alt="${formatted.name}"
                         onerror="this.src='assets/default-plant.svg'">
                    <div class="plant-card-info">
                        <h3>${formatted.name}</h3>
                        <p>${formatted.scientificName || ''}</p>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers
        grid.querySelectorAll('.plant-card').forEach(card => {
            card.addEventListener('click', () => {
                const plantId = card.dataset.plantId;
                this.showPlantDetailsModal(plantId);
            });
        });
        // Remove Load More button if present
        const btn = document.getElementById('load-more-btn');
        if (btn) btn.remove();
    }

    async searchPlants(query) {
        this.currentSearch = query;
        this.currentFilter = null;
        await this.loadDiscoverPage(true);
    }

    async filterPlants(filter) {
        this.currentSearch = '';
        this.currentFilter = filter;
        await this.loadDiscoverPage(true);
    }

    async showPlantDetailsModal(plantId) {
        this.showNotification('Loading plant details...', 'info');
        
        try {
            const details = await plantAPI.getPlantDetails(plantId);
            if (!details) {
                this.showNotification('Failed to load plant details', 'error');
                return;
            }

            const plant = plantAPI.formatPlantData(details);
            const careGuide = await plantAPI.getPlantCareGuide(plantId);

            const content = `
                <div class="plant-detail-modal">
                    <img src="${plant.image}" alt="${plant.name}" class="detail-image">
                    <h2>${plant.name}</h2>
                    <p class="scientific-name">${plant.scientificName}</p>
                    
                    <div class="plant-badges">
                        ${plant.indoor ? '<span class="badge indoor">Indoor</span>' : ''}
                        ${plant.poisonous ? '<span class="badge danger">Poisonous</span>' : ''}
                        ${plant.edible ? '<span class="badge success">Edible</span>' : ''}
                        ${plant.medicinal ? '<span class="badge info">Medicinal</span>' : ''}
                    </div>
                    
                    <div class="detail-sections">
                        <div class="detail-section">
                            <h3>Care Requirements</h3>
                            <div class="care-grid">
                                <div class="care-item">
                                    <i class="fas fa-tint"></i>
                                    <span>Water: ${plant.watering}</span>
                                </div>
                                <div class="care-item">
                                    <i class="fas fa-sun"></i>
                                    <span>Light: ${plant.sunlight.join(', ')}</span>
                                </div>
                                <div class="care-item">
                                    <i class="fas fa-chart-line"></i>
                                    <span>Growth: ${plant.growthRate}</span>
                                </div>
                                <div class="care-item">
                                    <i class="fas fa-leaf"></i>
                                    <span>Care Level: ${plant.careLevel}</span>
                                </div>
                            </div>
                        </div>
                        
                        ${plant.description ? `
                            <div class="detail-section">
                                <h3>Description</h3>
                                <p>${plant.description}</p>
                            </div>
                        ` : ''}
                        
                        ${careGuide ? `
                            <div class="detail-section">
                                <h3>Care Guide</h3>
                                <div class="care-guide">
                                    ${careGuide.section ? careGuide.section.map(section => `
                                        <div class="guide-section">
                                            <h4>${section.type}</h4>
                                            <p>${section.description}</p>
                                        </div>
                                    `).join('') : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            this.createModal({
                title: plant.name,
                content: content,
                actions: [
                    { 
                        text: 'Add to Collection', 
                        class: 'primary', 
                        action: () => {
                            this.addPlantToCollection(plant);
                        }
                    },
                    { text: 'Close', class: 'secondary', action: () => this.closeModal() }
                ]
            });
        } catch (error) {
            this.showNotification('Failed to load plant details', 'error');
        }
    }

    addPlantToCollection(plant) {
        const content = `
            <form id="add-plant-form">
                <div class="form-group">
                    <label>Nickname (optional)</label>
                    <input type="text" id="plant-nickname" placeholder="Give your plant a name">
                </div>
                <div class="form-group">
                    <label>Location</label>
                    <select id="plant-location">
                        <option value="indoor">Indoor</option>
                        <option value="outdoor">Outdoor</option>
                        <option value="balcony">Balcony</option>
                        <option value="greenhouse">Greenhouse</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Pot Size</label>
                    <select id="plant-pot-size">
                        <option value="small">Small</option>
                        <option value="medium" selected>Medium</option>
                        <option value="large">Large</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea id="plant-notes" rows="3" placeholder="Any special notes about your plant"></textarea>
                </div>
            </form>
        `;

        this.updateModal({
            title: 'Add to Collection',
            content: content,
            actions: [
                {
                    text: 'Add Plant',
                    class: 'primary',
                    action: () => {
                        const plantData = {
                            ...plant,
                            nickname: document.getElementById('plant-nickname').value || plant.name,
                            location: document.getElementById('plant-location').value,
                            potSize: document.getElementById('plant-pot-size').value,
                            notes: document.getElementById('plant-notes').value
                        };
                        
                        const addedPlant = storage.addPlant(plantData);
                        this.closeModal();
                        this.showNotification(`${addedPlant.nickname} added to your collection!`, 'success');
                        
                        // Add to room if on room page
                        if (this.currentPage === 'room' && plantRoom) {
                            plantRoom.addPlantToRoom(addedPlant);
                            plantRoom.loadRoom();
                        }
                        // Auto-generate care tasks from API
                        this.generateCareTasksForPlant(addedPlant);
                    }
                },
                { text: 'Cancel', class: 'secondary', action: () => this.closeModal() }
            ]
        });
    }

    loadCarePage() {
        const todayTasks = document.getElementById('today-tasks');
        const upcomingTasks = document.getElementById('upcoming-tasks');
        
        // Load today's tasks
        const today = new Date();
        const todayTasksList = storage.getTasksForDate(today);
        
        if (todayTasksList.length > 0) {
            todayTasks.innerHTML = todayTasksList.map(task => this.createTaskElement(task)).join('');
        } else {
            todayTasks.innerHTML = '<p class="no-tasks">No tasks for today!</p>';
        }
        
        // Load upcoming tasks
        const upcoming = storage.getUpcomingTasks();
        if (upcoming.length > 0) {
            upcomingTasks.innerHTML = upcoming.map(task => this.createTaskElement(task)).join('');
        } else {
            upcomingTasks.innerHTML = '<p class="no-tasks">No upcoming tasks</p>';
        }

        // Update calendar month
        const monthElement = document.getElementById('calendar-month');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        monthElement.textContent = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;

        // Add event listeners for edit/delete
        document.querySelectorAll('.task-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(btn.closest('.task-item').dataset.taskId);
                this.showEditTaskModal(taskId);
            });
        });
        document.querySelectorAll('.task-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(btn.closest('.task-item').dataset.taskId);
                this.showDeleteTaskModal(taskId);
            });
        });
    }

    createTaskElement(task) {
        const plant = storage.getPlant(task.plantId);
        const taskDate = new Date(task.date);
        const isToday = taskDate.toDateString() === new Date().toDateString();
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-info">
                    <h4>${task.type === 'water' ? '💧' : task.type === 'fertilize' ? '🌱' : task.type === 'prune' ? '✂️' : task.type === 'repot' ? '🪴' : '🔔'} ${task.type.charAt(0).toUpperCase() + task.type.slice(1)} ${plant ? plant.nickname : 'Unknown Plant'}</h4>
                    <p>${isToday ? 'Today' : taskDate.toLocaleDateString()}</p>
                    <p class="task-notes">${task.notes ? task.notes : ''}</p>
                    ${task.interval ? `<p class="task-interval">Every ${task.interval} days</p>` : ''}
                </div>
                <div class="task-actions">
                    <button class="task-edit-btn" title="Edit"><i class="fas fa-pen"></i></button>
                    <button class="task-delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }

    showEditTaskModal(taskId) {
        const task = (storage.get('tasks') || []).find(t => t.id === taskId);
        if (!task) return;
        const plant = storage.getPlant(task.plantId);
        const content = `
            <form id="edit-task-form">
                <div class="form-group">
                    <label>Plant</label>
                    <input type="text" value="${plant ? plant.nickname : 'Unknown Plant'}" disabled>
                </div>
                <div class="form-group">
                    <label>Task Type</label>
                    <input type="text" value="${task.type.charAt(0).toUpperCase() + task.type.slice(1)}" disabled>
                </div>
                <div class="form-group">
                    <label>Next Due Date</label>
                    <input type="date" id="edit-task-date" value="${new Date(task.date).toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Interval (days, optional)</label>
                    <input type="number" id="edit-task-interval" value="${task.interval || ''}" min="1">
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea id="edit-task-notes" rows="2">${task.notes || ''}</textarea>
                </div>
            </form>
        `;
        this.createModal({
            title: 'Edit Task',
            content: content,
            actions: [
                {
                    text: 'Save',
                    class: 'primary',
                    action: () => {
                        const updates = {
                            date: document.getElementById('edit-task-date').value,
                            interval: parseInt(document.getElementById('edit-task-interval').value) || null,
                            notes: document.getElementById('edit-task-notes').value
                        };
                        storage.updateTask(taskId, updates);
                        this.closeModal();
                        this.loadCarePage();
                        this.showNotification('Task updated!', 'success');
                    }
                },
                { text: 'Cancel', class: 'secondary', action: () => this.closeModal() }
            ]
        });
    }

    showDeleteTaskModal(taskId) {
        this.createModal({
            title: 'Delete Task',
            content: '<p>Are you sure you want to delete this task?</p>',
            actions: [
                {
                    text: 'Delete',
                    class: 'danger',
                    action: () => {
                        storage.removeTask(taskId);
                        this.closeModal();
                        this.loadCarePage();
                        this.showNotification('Task deleted!', 'success');
                    }
                },
                { text: 'Cancel', class: 'secondary', action: () => this.closeModal() }
            ]
        });
    }

    showAddReminderModal() {
        const plants = storage.getAllPlants();
        if (plants.length === 0) {
            this.showNotification('Add some plants first!', 'info');
            return;
        }

        const content = `
            <form id="reminder-form">
                <div class="form-group">
                    <label>Plant</label>
                    <select id="reminder-plant" required>
                        ${plants.map(plant => `
                            <option value="${plant.id}">${plant.nickname || plant.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Task Type</label>
                    <select id="reminder-type" required>
                        <option value="water">Water</option>
                        <option value="fertilize">Fertilize</option>
                        <option value="repot">Repot</option>
                        <option value="prune">Prune</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="reminder-date" required 
                           min="${new Date().toISOString().split('T')[0]}"
                           value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Repeat</label>
                    <select id="reminder-repeat">
                        <option value="none">Don't repeat</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Every 2 weeks</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea id="reminder-notes" rows="2"></textarea>
                </div>
            </form>
        `;

        this.createModal({
            title: 'Add Care Reminder',
            content: content,
            actions: [
                {
                    text: 'Add Reminder',
                    class: 'primary',
                    action: () => {
                        const task = {
                            plantId: parseInt(document.getElementById('reminder-plant').value),
                            type: document.getElementById('reminder-type').value,
                            date: document.getElementById('reminder-date').value,
                            repeat: document.getElementById('reminder-repeat').value,
                            notes: document.getElementById('reminder-notes').value
                        };
                        
                        storage.addTask(task);
                        this.closeModal();
                        this.showNotification('Reminder added!', 'success');
                        this.loadCarePage();
                    }
                },
                { text: 'Cancel', class: 'secondary', action: () => this.closeModal() }
            ]
        });
    }

    loadJournalPage() {
        const entries = storage.getJournalEntries();
        const container = document.getElementById('journal-entries');
        
        if (entries.length > 0) {
            container.innerHTML = entries.map(entry => {
                const plant = storage.getPlant(entry.plantId);
                return `
                    <div class="journal-entry" data-entry-id="${entry.id}">
                        <div class="entry-header">
                            <h3>${plant ? plant.nickname : 'General'}</h3>
                            <span class="entry-date">${new Date(entry.date).toLocaleDateString()}</span>
                        </div>
                        <p class="entry-content">${entry.content}</p>
                        ${entry.images && entry.images.length > 0 ? `
                            <div class="entry-images">
                                ${entry.images.map(img => `<img src="${img}" alt="Journal photo">`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p class="no-entries">No journal entries yet. Start documenting your plant journey!</p>';
        }
    }

    showNewJournalEntryModal() {
        const plants = storage.getAllPlants();
        
        const content = `
            <form id="journal-form">
                <div class="form-group">
                    <label>Plant (optional)</label>
                    <select id="journal-plant">
                        <option value="">General Entry</option>
                        ${plants.map(plant => `
                            <option value="${plant.id}">${plant.nickname || plant.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Entry</label>
                    <textarea id="journal-content" rows="6" required 
                              placeholder="How are your plants doing today?"></textarea>
                </div>
                <div class="form-group">
                    <label>Add Photos</label>
                    <input type="file" id="journal-images" accept="image/*" multiple>
                </div>
            </form>
        `;

        this.createModal({
            title: 'New Journal Entry',
            content: content,
            actions: [
                {
                    text: 'Save Entry',
                    class: 'primary',
                    action: () => {
                        const entry = {
                            plantId: document.getElementById('journal-plant').value ? 
                                    parseInt(document.getElementById('journal-plant').value) : null,
                            content: document.getElementById('journal-content').value,
                            images: [] // Would need file handling implementation
                        };
                        
                        storage.addJournalEntry(entry);
                        this.closeModal();
                        this.showNotification('Journal entry saved!', 'success');
                        this.loadJournalPage();
                    }
                },
                { text: 'Cancel', class: 'secondary', action: () => this.closeModal() }
            ]
        });
    }

    updateStats() {
        const stats = storage.getStats();
        document.getElementById('plant-count').textContent = stats.plantCount;
        document.getElementById('care-streak').textContent = stats.careStreak;
        document.getElementById('journal-count').textContent = stats.journalCount;
    }

    handleProfileAction(action) {
        switch(action) {
            case 'Notification Settings':
                this.showNotificationSettings();
                break;
            case 'Theme Settings':
                this.showThemeSettings();
                break;
            case 'Export Data':
                this.exportData();
                break;
            case 'About':
                this.showAbout();
                break;
        }
    }

    showNotificationSettings() {
        const settings = storage.getSettings();
        
        const content = `
            <div class="settings-form">
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="notifications-enabled" 
                               ${settings.notifications ? 'checked' : ''}>
                        Enable Notifications
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="water-reminders" 
                               ${settings.waterReminders ? 'checked' : ''}>
                        Water Reminders
                    </label>
                </div>
            </div>
        `;

        this.createModal({
            title: 'Notification Settings',
            content: content,
            actions: [
                {
                    text: 'Save',
                    class: 'primary',
                    action: () => {
                        storage.updateSettings({
                            notifications: document.getElementById('notifications-enabled').checked,
                            waterReminders: document.getElementById('water-reminders').checked
                        });
                        this.closeModal();
                        this.showNotification('Settings saved!', 'success');
                    }
                },
                { text: 'Cancel', class: 'secondary', action: () => this.closeModal() }
            ]
        });
    }

    showThemeSettings() {
        const settings = storage.getSettings();
        
        const content = `
            <div class="theme-settings">
                <div class="theme-option-card ${!settings.darkMode ? 'active' : ''}" data-theme="light">
                    <div class="theme-preview light"></div>
                    <span>Light Mode</span>
                </div>
                <div class="theme-option-card ${settings.darkMode ? 'active' : ''}" data-theme="dark">
                    <div class="theme-preview dark"></div>
                    <span>Dark Mode</span>
                </div>
            </div>
        `;

        this.createModal({
            title: 'Theme Settings',
            content: content,
            actions: [
                { text: 'Close', class: 'primary', action: () => this.closeModal() }
            ]
        });

        document.querySelectorAll('.theme-option-card').forEach(card => {
            card.addEventListener('click', () => {
                const isDark = card.dataset.theme === 'dark';
                storage.updateSettings({ darkMode: isDark });
                document.body.classList.toggle('dark-mode', isDark);
                document.querySelectorAll('.theme-option-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            });
        });
    }

    exportData() {
        const data = storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planthub-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showNotification('Data exported successfully!', 'success');
    }

    showAbout() {
        const content = `
            <div class="about-content">
                <h3>PlantHub</h3>
                <p>Your Digital Plant Care Companion</p>
                <p class="version">Version 1.0.0</p>
                
                <div class="about-features">
                    <h4>Features:</h4>
                    <ul>
                        <li>🌿 Customizable plant room</li>
                        <li>🔍 Plant discovery with Perenual API</li>
                        <li>💧 Care reminders and tracking</li>
                        <li>📖 Plant journal</li>
                        <li>📊 Care statistics</li>
                        <li>🌙 Dark mode support</li>
                        <li>📱 PWA - works offline!</li>
                    </ul>
                </div>
                
                <p class="credits">Built with ❤️ for plant lovers</p>
            </div>
        `;

        this.createModal({
            title: 'About PlantHub',
            content: content,
            actions: [
                { text: 'Close', class: 'primary', action: () => this.closeModal() }
            ]
        });
    }

    // Modal System
    createModal(options) {
        const modalContainer = document.getElementById('modal-container');
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${options.title}</h2>
                    <button class="icon-btn modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${options.content}
                </div>
                ${options.actions ? `
                    <div class="modal-footer">
                        ${options.actions.map(action => `
                            <button class="modal-action ${action.class || ''}">${action.text}</button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        modalContainer.innerHTML = '';
        modalContainer.appendChild(modal);

        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        
        if (options.actions) {
            const buttons = modal.querySelectorAll('.modal-action');
            options.actions.forEach((action, index) => {
                buttons[index].addEventListener('click', action.action);
            });
        }

        // Show modal
        setTimeout(() => modal.classList.add('active'), 10);
        
        return modal;
    }

    updateModal(options) {
        const modal = document.querySelector('.modal');
        if (!modal) return;

        if (options.title) {
            modal.querySelector('.modal-header h2').textContent = options.title;
        }

        if (options.content) {
            modal.querySelector('.modal-body').innerHTML = options.content;
        }

        if (options.actions) {
            const footer = modal.querySelector('.modal-footer');
            footer.innerHTML = options.actions.map(action => `
                <button class="modal-action ${action.class || ''}">${action.text}</button>
            `).join('');

            const buttons = footer.querySelectorAll('.modal-action');
            options.actions.forEach((action, index) => {
                buttons[index].addEventListener('click', action.action);
            });
        }
    }

    closeModal() {
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                document.getElementById('modal-container').innerHTML = '';
            }, 300);
        }
    }

    // Notification System
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                             type === 'error' ? 'exclamation-circle' : 
                             'info-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 10);

        // Hide notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    checkNotifications() {
        const settings = storage.getSettings();
        if (!settings.notifications) return;

        // Check for tasks due today
        const todayTasks = storage.getTasksForDate(new Date());
        const incompleteTasks = todayTasks.filter(task => !task.completed);

        if (incompleteTasks.length > 0) {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('PlantHub Reminder', {
                    body: `You have ${incompleteTasks.length} plant care task${incompleteTasks.length > 1 ? 's' : ''} today!`,
                    icon: 'assets/icon-192.png'
                });
            }
        }
    }

    setupInfiniteScroll() {
        const grid = document.getElementById('plant-grid');
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            if (this.currentPage !== 'discover') return;
            if (this.isLoading) return;
            const rect = grid.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            // If the bottom of the grid is within 200px of the viewport bottom
            if (rect.bottom - windowHeight < 200) {
                this.loadDiscoverPage(false);
            }
        });
    }

    async generateCareTasksForPlant(plant) {
        // Fetch care guide from API
        const careGuide = await plantAPI.getPlantCareGuide(plant.id);
        if (!careGuide || !careGuide.section) return;
        const existingTasks = (storage.get('tasks') || []).filter(t => t.plantId === plant.id);
        const now = new Date();
        careGuide.section.forEach(section => {
            let type = '';
            let interval = null;
            let notes = section.description;
            // Determine type and interval from section
            const desc = section.description.toLowerCase();
            if (section.type.toLowerCase().includes('water')) {
                type = 'water';
                const match = desc.match(/every (\d+) day/);
                if (match) interval = parseInt(match[1]);
            } else if (section.type.toLowerCase().includes('fertiliz')) {
                type = 'fertilize';
                const match = desc.match(/every (\d+) (day|week|month)/);
                if (match) {
                    const num = parseInt(match[1]);
                    if (match[2].startsWith('day')) interval = num;
                    else if (match[2].startsWith('week')) interval = num * 7;
                    else if (match[2].startsWith('month')) interval = num * 30;
                }
            } else if (section.type.toLowerCase().includes('prun')) {
                type = 'prune';
                // Try to extract interval
                const match = desc.match(/every (\d+) (day|week|month)/);
                if (match) {
                    const num = parseInt(match[1]);
                    if (match[2].startsWith('day')) interval = num;
                    else if (match[2].startsWith('week')) interval = num * 7;
                    else if (match[2].startsWith('month')) interval = num * 30;
                }
            } else if (section.type.toLowerCase().includes('repot')) {
                type = 'repot';
                const match = desc.match(/every (\d+) (year|month)/);
                if (match) {
                    const num = parseInt(match[1]);
                    if (match[2].startsWith('month')) interval = num * 30;
                    else if (match[2].startsWith('year')) interval = num * 365;
                }
            } else {
                // Other care types
                type = section.type.toLowerCase();
            }
            // Only add if not already present for this plant and type
            if (type && !existingTasks.some(t => t.type === type)) {
                storage.addTask({
                    plantId: plant.id,
                    type,
                    date: now.toISOString(),
                    interval,
                    notes,
                    recurring: !!interval
                });
            }
        });
        // Optionally, refresh care page if visible
        if (this.currentPage === 'care') {
            this.loadCarePage();
        }
    }
}

// Notification Styles
const notificationStyles = `
<style>
.notification {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: var(--surface);
    padding: 16px 24px;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 1001;
    transition: transform 0.3s ease;
}

.notification.show {
    transform: translateX(-50%) translateY(0);
}

.notification.success {
    background: #4caf50;
    color: white;
}

.notification.error {
    background: #f44336;
    color: white;
}

.notification.info {
    background: #2196f3;
    color: white;
}

/* Dark mode support */
body.dark-mode {
    --background: #121212;
    --surface: #1e1e1e;
    --text-primary: #ffffff;
    --text-secondary: #aaaaaa;
    --border: #333333;
}

/* Additional modal styles */
.add-plant-options,
.collection-picker {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 16px;
    margin-top: 20px;
}

.option-btn,
.collection-plant {
    padding: 20px;
    border: 2px solid var(--border);
    border-radius: var(--radius);
    background: var(--background);
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
}

.option-btn:hover,
.collection-plant:hover {
    border-color: var(--primary-color);
    transform: translateY(-2px);
}

.option-btn i,
.collection-plant img {
    font-size: 32px;
    margin-bottom: 8px;
    display: block;
}

.collection-plant img {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 8px;
    margin: 0 auto 8px;
}

/* Form styles */
.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: var(--text-secondary);
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 16px;
    background: var(--background);
    transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--primary-color);
}

/* Plant detail modal styles */
.plant-detail-modal {
    max-height: 70vh;
    overflow-y: auto;
}

.detail-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: var(--radius);
    margin-bottom: 20px;
}

.plant-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 20px;
}

.badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
}

.badge.indoor {
    background: #4caf50;
    color: white;
}

.badge.danger {
    background: #f44336;
    color: white;
}

.badge.success {
    background: #4caf50;
    color: white;
}

.badge.info {
    background: #2196f3;
    color: white;
}

.care-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}

.care-item {
    display: flex;
    align-items: center;
    gap: 12px;
}

.care-item i {
    font-size: 20px;
    color: var(--primary-color);
}

/* Task styles */
.task-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--surface);
    border-radius: var(--radius);
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.task-item:hover {
    transform: translateX(5px);
}

.task-item.completed {
    opacity: 0.6;
}

.task-checkbox {
    width: 24px;
    height: 24px;
    border: 2px solid var(--primary-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.task-checkbox.checked {
    background: var(--primary-color);
    color: white;
}

.task-info h4 {
    margin-bottom: 4px;
}

.task-info p {
    font-size: 14px;
    color: var(--text-secondary);
}

/* Journal styles */
.journal-entry {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 20px;
    margin-bottom: 16px;
    transition: transform 0.3s ease;
}

.journal-entry:hover {
    transform: translateY(-2px);
}

.entry-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.entry-date {
    font-size: 14px;
    color: var(--text-secondary);
}

.entry-content {
    line-height: 1.6;
}

.entry-images {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
    margin-top: 12px;
}

.entry-images img {
    width: 100%;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
}
</style>
`;

// Add styles to document
document.head.insertAdjacentHTML('beforeend', notificationStyles);

// Initialize app
const app = new PlantCareApp();

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}