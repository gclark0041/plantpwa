// Local Storage Management
class Storage {
    constructor() {
        this.prefix = 'plantHub_';
        this.initStorage();
    }

    initStorage() {
        // Initialize storage structure if not exists
        const defaultData = {
            plants: [],
            room: {
                theme: 'nature',
                wallpaper: 'none',
                plantSize: 'medium',
                layout: []
            },
            tasks: [],
            journal: [],
            settings: {
                notifications: true,
                darkMode: false,
                waterReminders: true,
                careStreakStart: null
            },
            stats: {
                plantCount: 0,
                careStreak: 0,
                journalCount: 0,
                lastCareDate: null
            }
        };

        Object.keys(defaultData).forEach(key => {
            if (!this.get(key)) {
                this.set(key, defaultData[key]);
            }
        });
    }

    // Basic storage operations
    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error getting from storage:', error);
            return null;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error setting storage:', error);
            return false;
        }
    }

    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }

    clear() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
        this.initStorage();
    }

    // Plant management
    addPlant(plant) {
        const plants = this.get('plants') || [];
        const newPlant = {
            ...plant,
            id: plant.id || Date.now(),
            addedDate: new Date().toISOString(),
            lastWatered: null,
            lastFertilized: null,
            notes: '',
            nickname: plant.nickname || plant.name,
            health: 'good',
            location: 'indoor',
            potSize: 'medium',
            soilType: 'regular',
            customImage: null
        };
        plants.push(newPlant);
        this.set('plants', plants);
        this.updateStats();
        return newPlant;
    }

    updatePlant(plantId, updates) {
        const plants = this.get('plants') || [];
        const index = plants.findIndex(p => p.id === plantId);
        if (index !== -1) {
            plants[index] = { ...plants[index], ...updates };
            this.set('plants', plants);
            return plants[index];
        }
        return null;
    }

    removePlant(plantId) {
        const plants = this.get('plants') || [];
        const filtered = plants.filter(p => p.id !== plantId);
        this.set('plants', filtered);
        this.updateStats();
        
        // Also remove from room layout
        const room = this.get('room');
        room.layout = room.layout.filter(item => item.plantId !== plantId);
        this.set('room', room);
    }

    getPlant(plantId) {
        const plants = this.get('plants') || [];
        return plants.find(p => p.id === plantId);
    }

    getAllPlants() {
        return this.get('plants') || [];
    }

    // Room management
    updateRoomLayout(layout) {
        const room = this.get('room');
        room.layout = layout;
        this.set('room', room);
    }

    updateRoomTheme(theme) {
        const room = this.get('room');
        room.theme = theme;
        this.set('room', room);
    }

    updateRoomSettings(settings) {
        const room = this.get('room');
        Object.assign(room, settings);
        this.set('room', room);
    }

    getRoom() {
        return this.get('room');
    }

    // Task management
    addTask(task) {
        const tasks = this.get('tasks') || [];
        const newTask = {
            id: Date.now(),
            ...task,
            completed: false,
            createdDate: new Date().toISOString()
        };
        tasks.push(newTask);
        this.set('tasks', tasks);
        return newTask;
    }

    updateTask(taskId, updates) {
        const tasks = this.get('tasks') || [];
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updates };
            this.set('tasks', tasks);
            
            // Update care streak if task is completed
            if (updates.completed) {
                this.updateCareStreak();
            }
            return tasks[index];
        }
        return null;
    }

    removeTask(taskId) {
        const tasks = this.get('tasks') || [];
        const filtered = tasks.filter(t => t.id !== taskId);
        this.set('tasks', filtered);
    }

    getTasksForDate(date) {
        const tasks = this.get('tasks') || [];
        const dateStr = new Date(date).toDateString();
        return tasks.filter(task => {
            const taskDate = new Date(task.date).toDateString();
            return taskDate === dateStr;
        });
    }

    getUpcomingTasks(days = 7) {
        const tasks = this.get('tasks') || [];
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + days);
        
        return tasks.filter(task => {
            const taskDate = new Date(task.date);
            return taskDate >= now && taskDate <= future && !task.completed;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Journal management
    addJournalEntry(entry) {
        const journal = this.get('journal') || [];
        const newEntry = {
            id: Date.now(),
            ...entry,
            date: new Date().toISOString(),
            images: entry.images || []
        };
        journal.unshift(newEntry);
        this.set('journal', journal);
        this.updateStats();
        return newEntry;
    }

    updateJournalEntry(entryId, updates) {
        const journal = this.get('journal') || [];
        const index = journal.findIndex(e => e.id === entryId);
        if (index !== -1) {
            journal[index] = { ...journal[index], ...updates };
            this.set('journal', journal);
            return journal[index];
        }
        return null;
    }

    removeJournalEntry(entryId) {
        const journal = this.get('journal') || [];
        const filtered = journal.filter(e => e.id !== entryId);
        this.set('journal', filtered);
        this.updateStats();
    }

    getJournalEntries(plantId = null) {
        const journal = this.get('journal') || [];
        if (plantId) {
            return journal.filter(e => e.plantId === plantId);
        }
        return journal;
    }

    // Settings management
    updateSettings(settings) {
        const current = this.get('settings');
        const updated = { ...current, ...settings };
        this.set('settings', updated);
        return updated;
    }

    getSettings() {
        return this.get('settings');
    }

    // Stats management
    updateStats() {
        const plants = this.getAllPlants();
        const journal = this.get('journal') || [];
        const stats = this.get('stats');
        
        stats.plantCount = plants.length;
        stats.journalCount = journal.length;
        
        this.set('stats', stats);
    }

    updateCareStreak() {
        const stats = this.get('stats');
        const today = new Date().toDateString();
        const lastCare = stats.lastCareDate ? new Date(stats.lastCareDate).toDateString() : null;
        
        if (lastCare !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastCare === yesterday.toDateString()) {
                stats.careStreak += 1;
            } else {
                stats.careStreak = 1;
            }
            
            stats.lastCareDate = new Date().toISOString();
            this.set('stats', stats);
        }
    }

    getStats() {
        return this.get('stats');
    }

    // Export/Import functionality
    exportData() {
        const data = {};
        ['plants', 'room', 'tasks', 'journal', 'settings', 'stats'].forEach(key => {
            data[key] = this.get(key);
        });
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            Object.keys(data).forEach(key => {
                this.set(key, data[key]);
            });
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Export storage instance
const storage = new Storage();