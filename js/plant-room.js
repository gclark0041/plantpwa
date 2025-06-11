// Plant Room Management
class PlantRoom {
    constructor() {
        this.room = document.getElementById('plant-room');
        this.plantsContainer = document.querySelector('.plants-container');
        this.roomGrid = document.querySelector('.room-grid');
        this.isDragging = false;
        this.currentPlant = null;
        this.ghostElement = null;
        this.roomSettings = storage.getRoom();
        
        this.init();
    }

    init() {
        this.loadRoom();
        this.setupEventListeners();
        this.applyTheme(this.roomSettings.theme);
        this.applyWallpaper(this.roomSettings.wallpaper);
    }

    setupEventListeners() {
        // Add plant button
        document.getElementById('add-plant-btn').addEventListener('click', () => {
            this.showAddPlantModal();
        });

        // Customize room button
        document.getElementById('customize-room-btn').addEventListener('click', () => {
            this.toggleCustomizationPanel();
        });

        // Room view button
        document.getElementById('room-view-btn').addEventListener('click', () => {
            this.toggleFullscreenView();
        });

        // Touch and mouse events for drag and drop
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        // Mouse events
        this.plantsContainer.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', (e) => this.endDrag(e));

        // Touch events
        this.plantsContainer.addEventListener('touchstart', (e) => this.startDrag(e));
        document.addEventListener('touchmove', (e) => this.drag(e));
        document.addEventListener('touchend', (e) => this.endDrag(e));

        // Prevent default touch behavior
        this.room.addEventListener('touchmove', (e) => {
            if (this.isDragging) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    startDrag(e) {
        const plantElement = e.target.closest('.room-plant');
        if (!plantElement) return;

        this.isDragging = true;
        this.currentPlant = plantElement;
        this.currentPlant.classList.add('dragging');

        // Create ghost element
        this.ghostElement = this.currentPlant.cloneNode(true);
        this.ghostElement.classList.add('plant-ghost');
        this.plantsContainer.appendChild(this.ghostElement);

        // Get initial position
        const rect = this.room.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        this.offset = {
            x: touch.clientX - rect.left - parseInt(this.currentPlant.style.left),
            y: touch.clientY - rect.top - parseInt(this.currentPlant.style.top)
        };

        // Show grid
        this.roomGrid.classList.add('show');
    }

    drag(e) {
        if (!this.isDragging || !this.currentPlant) return;

        const rect = this.room.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        
        let x = touch.clientX - rect.left - this.offset.x;
        let y = touch.clientY - rect.top - this.offset.y;

        // Constrain to room boundaries
        const plantWidth = this.currentPlant.offsetWidth;
        const plantHeight = this.currentPlant.offsetHeight;
        
        x = Math.max(0, Math.min(rect.width - plantWidth, x));
        y = Math.max(0, Math.min(rect.height - plantHeight, y));

        // Update ghost position
        if (this.ghostElement) {
            this.ghostElement.style.left = x + 'px';
            this.ghostElement.style.top = y + 'px';
        }
    }

    endDrag(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.roomGrid.classList.remove('show');

        if (this.currentPlant && this.ghostElement) {
            // Update plant position
            this.currentPlant.style.left = this.ghostElement.style.left;
            this.currentPlant.style.top = this.ghostElement.style.top;
            this.currentPlant.classList.remove('dragging');

            // Save position
            this.savePlantPosition(
                this.currentPlant.dataset.plantId,
                this.currentPlant.style.left,
                this.currentPlant.style.top
            );

            // Add bounce animation
            this.currentPlant.classList.add('bounce');
            setTimeout(() => {
                this.currentPlant.classList.remove('bounce');
            }, 600);
        }

        // Clean up
        if (this.ghostElement) {
            this.ghostElement.remove();
            this.ghostElement = null;
        }
        this.currentPlant = null;
    }

    loadRoom() {
        const roomData = storage.getRoom();
        const plants = storage.getAllPlants();

        // Clear existing plants
        this.plantsContainer.innerHTML = '';

        // Load plants with their positions
        roomData.layout.forEach(item => {
            const plant = plants.find(p => p.id === item.plantId);
            if (plant) {
                this.addPlantToRoom(plant, item.x, item.y);
            }
        });
    }

    addPlantToRoom(plant, x = null, y = null) {
        const plantElement = document.createElement('div');
        plantElement.className = 'room-plant';
        plantElement.dataset.plantId = plant.id;

        // Random position if not specified
        if (x === null || y === null) {
            const rect = this.room.getBoundingClientRect();
            x = Math.random() * (rect.width - 100) + 'px';
            y = Math.random() * (rect.height - 100) + 'px';
        }

        plantElement.style.left = x;
        plantElement.style.top = y;

        plantElement.innerHTML = `
            <img src="${plant.image || plant.thumbnail || 'assets/default-plant.svg'}" 
                 alt="${plant.nickname || plant.name}"
                 onerror="this.src='assets/default-plant.svg'">
            <div class="room-plant-label">${plant.nickname || plant.name}</div>
        `;

        // Apply size setting
        const size = this.roomSettings.plantSize;
        const sizeMap = {
            small: 0.7,
            medium: 1,
            large: 1.3
        };
        plantElement.style.transform = `scale(${sizeMap[size] || 1})`;

        // Add click handler for plant details
        plantElement.addEventListener('click', (e) => {
            if (!this.isDragging) {
                this.showPlantDetails(plant.id);
            }
        });

        this.plantsContainer.appendChild(plantElement);

        // Add growth animation
        plantElement.classList.add('plant-growth');

        // Save position
        this.savePlantPosition(plant.id, x, y);
    }

    savePlantPosition(plantId, x, y) {
        const roomData = storage.getRoom();
        const existingIndex = roomData.layout.findIndex(item => item.plantId === plantId);
        
        if (existingIndex >= 0) {
            roomData.layout[existingIndex] = { plantId, x, y };
        } else {
            roomData.layout.push({ plantId, x, y });
        }
        
        storage.updateRoomLayout(roomData.layout);
    }

    removePlantFromRoom(plantId) {
        const plantElement = this.plantsContainer.querySelector(`[data-plant-id="${plantId}"]`);
        if (plantElement) {
            plantElement.classList.add('shake');
            setTimeout(() => {
                plantElement.remove();
            }, 500);
        }
    }

    applyTheme(theme) {
        const themes = {
            minimal: {
                background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                ambiance: 'rgba(0, 0, 0, 0.02)'
            },
            nature: {
                background: 'linear-gradient(135deg, #e8f5e9 0%, #a5d6a7 100%)',
                ambiance: 'rgba(76, 175, 80, 0.05)'
            },
            sunset: {
                background: 'linear-gradient(135deg, #ffccbc 0%, #ffab91 100%)',
                ambiance: 'rgba(255, 87, 34, 0.05)'
            },
            ocean: {
                background: 'linear-gradient(135deg, #b3e5fc 0%, #4fc3f7 100%)',
                ambiance: 'rgba(3, 169, 244, 0.05)'
            },
            desert: {
                background: 'linear-gradient(135deg, #ffe0b2 0%, #ffcc80 100%)',
                ambiance: 'rgba(255, 152, 0, 0.05)'
            },
            night: {
                background: 'linear-gradient(135deg, #263238 0%, #37474f 100%)',
                ambiance: 'rgba(255, 255, 255, 0.02)'
            }
        };

        const selectedTheme = themes[theme] || themes.nature;
        this.room.style.background = selectedTheme.background;
        
        // Update room settings
        this.roomSettings.theme = theme;
        storage.updateRoomTheme(theme);
    }

    applyWallpaper(wallpaper) {
        const roomBg = this.room.querySelector('.room-background');
        
        const wallpapers = {
            none: '',
            grid: `repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(0,0,0,0.03) 50px, rgba(0,0,0,0.03) 51px),
                   repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(0,0,0,0.03) 50px, rgba(0,0,0,0.03) 51px)`,
            dots: `radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)`,
            lines: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 20px)`,
            leaves: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z' fill='%231a5f3f' fill-opacity='0.03'/%3E%3C/svg%3E")`
        };

        if (wallpaper === 'dots') {
            roomBg.style.backgroundImage = wallpapers[wallpaper];
            roomBg.style.backgroundSize = '20px 20px';
        } else if (wallpaper === 'leaves') {
            roomBg.style.backgroundImage = wallpapers[wallpaper];
            roomBg.style.backgroundSize = '40px 40px';
        } else {
            roomBg.style.backgroundImage = wallpapers[wallpaper] || '';
            roomBg.style.backgroundSize = 'auto';
        }

        // Update room settings
        this.roomSettings.wallpaper = wallpaper;
        storage.updateRoomSettings({ wallpaper });
    }

    updatePlantSize(size) {
        const sizeMap = {
            small: 0.7,
            medium: 1,
            large: 1.3
        };
        
        const scale = sizeMap[size] || 1;
        const plants = this.plantsContainer.querySelectorAll('.room-plant');
        
        plants.forEach(plant => {
            plant.style.transform = `scale(${scale})`;
        });

        // Update room settings
        this.roomSettings.plantSize = size;
        storage.updateRoomSettings({ plantSize: size });
    }

    toggleCustomizationPanel() {
        let panel = document.querySelector('.customization-panel');
        
        if (!panel) {
            panel = this.createCustomizationPanel();
            this.room.appendChild(panel);
        }
        
        panel.classList.toggle('active');
    }

    createCustomizationPanel() {
        const panel = document.createElement('div');
        panel.className = 'customization-panel';
        
        panel.innerHTML = `
            <div class="customization-section">
                <h3>Room Theme</h3>
                <div class="theme-options">
                    <div class="theme-option theme-minimal ${this.roomSettings.theme === 'minimal' ? 'active' : ''}" data-theme="minimal"></div>
                    <div class="theme-option theme-nature ${this.roomSettings.theme === 'nature' ? 'active' : ''}" data-theme="nature"></div>
                    <div class="theme-option theme-sunset ${this.roomSettings.theme === 'sunset' ? 'active' : ''}" data-theme="sunset"></div>
                    <div class="theme-option theme-ocean ${this.roomSettings.theme === 'ocean' ? 'active' : ''}" data-theme="ocean"></div>
                    <div class="theme-option theme-desert ${this.roomSettings.theme === 'desert' ? 'active' : ''}" data-theme="desert"></div>
                    <div class="theme-option theme-night ${this.roomSettings.theme === 'night' ? 'active' : ''}" data-theme="night"></div>
                </div>
            </div>
            
            <div class="customization-section">
                <h3>Wallpaper</h3>
                <div class="wallpaper-options">
                    <div class="wallpaper-option ${this.roomSettings.wallpaper === 'none' ? 'active' : ''}" data-wallpaper="none">
                        <i class="fas fa-times"></i>
                        <span>None</span>
                    </div>
                    <div class="wallpaper-option ${this.roomSettings.wallpaper === 'grid' ? 'active' : ''}" data-wallpaper="grid">
                        <i class="fas fa-th"></i>
                        <span>Grid</span>
                    </div>
                    <div class="wallpaper-option ${this.roomSettings.wallpaper === 'dots' ? 'active' : ''}" data-wallpaper="dots">
                        <i class="fas fa-circle"></i>
                        <span>Dots</span>
                    </div>
                    <div class="wallpaper-option ${this.roomSettings.wallpaper === 'lines' ? 'active' : ''}" data-wallpaper="lines">
                        <i class="fas fa-grip-lines"></i>
                        <span>Lines</span>
                    </div>
                    <div class="wallpaper-option ${this.roomSettings.wallpaper === 'leaves' ? 'active' : ''}" data-wallpaper="leaves">
                        <i class="fas fa-leaf"></i>
                        <span>Leaves</span>
                    </div>
                </div>
            </div>
            
            <div class="customization-section">
                <h3>Plant Size</h3>
                <div class="size-slider">
                    <input type="range" min="0" max="2" value="${this.roomSettings.plantSize === 'small' ? 0 : this.roomSettings.plantSize === 'large' ? 2 : 1}" 
                           id="plant-size-slider">
                    <div class="size-preview">
                        <span>Small</span>
                        <span>Medium</span>
                        <span>Large</span>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        panel.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                panel.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.applyTheme(option.dataset.theme);
            });
        });

        panel.querySelectorAll('.wallpaper-option').forEach(option => {
            option.addEventListener('click', () => {
                panel.querySelectorAll('.wallpaper-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.applyWallpaper(option.dataset.wallpaper);
            });
        });

        const sizeSlider = panel.querySelector('#plant-size-slider');
        sizeSlider.addEventListener('input', (e) => {
            const sizes = ['small', 'medium', 'large'];
            this.updatePlantSize(sizes[e.target.value]);
        });

        return panel;
    }

    toggleFullscreenView() {
        let fullscreen = document.querySelector('.room-fullscreen');
        
        if (!fullscreen) {
            fullscreen = document.createElement('div');
            fullscreen.className = 'room-fullscreen';
            
            const roomClone = this.room.cloneNode(true);
            roomClone.id = 'fullscreen-room';
            
            fullscreen.innerHTML = `
                <button class="room-fullscreen-close">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            fullscreen.appendChild(roomClone);
            document.body.appendChild(fullscreen);
            
            // Add close handler
            fullscreen.querySelector('.room-fullscreen-close').addEventListener('click', () => {
                fullscreen.classList.remove('active');
                setTimeout(() => fullscreen.remove(), 300);
            });
        }
        
        setTimeout(() => fullscreen.classList.add('active'), 10);
    }

    showAddPlantModal() {
        const modal = app.createModal({
            title: 'Add Plant to Room',
            content: `
                <div class="add-plant-options">
                    <button class="option-btn" id="add-from-collection">
                        <i class="fas fa-folder"></i>
                        <span>From My Collection</span>
                    </button>
                    <button class="option-btn" id="add-from-search">
                        <i class="fas fa-search"></i>
                        <span>Search New Plant</span>
                    </button>
                </div>
            `,
            actions: [
                { text: 'Cancel', class: 'secondary', action: () => app.closeModal() }
            ]
        });

        document.getElementById('add-from-collection').addEventListener('click', () => {
            this.showCollectionPicker();
        });

        document.getElementById('add-from-search').addEventListener('click', () => {
            app.closeModal();
            app.switchPage('discover');
        });
    }

    showCollectionPicker() {
        const plants = storage.getAllPlants();
        const roomPlants = storage.getRoom().layout.map(item => item.plantId);
        const availablePlants = plants.filter(p => !roomPlants.includes(p.id));

        if (availablePlants.length === 0) {
            app.closeModal();
            app.showNotification('All your plants are already in the room!', 'info');
            return;
        }

        const content = `
            <div class="collection-picker">
                ${availablePlants.map(plant => `
                    <div class="collection-plant" data-plant-id="${plant.id}">
                        <img src="${plant.image || plant.thumbnail || 'assets/default-plant.svg'}" 
                             alt="${plant.nickname || plant.name}">
                        <span>${plant.nickname || plant.name}</span>
                    </div>
                `).join('')}
            </div>
        `;

        app.updateModal({
            title: 'Select Plant',
            content: content
        });

        document.querySelectorAll('.collection-plant').forEach(el => {
            el.addEventListener('click', () => {
                const plantId = parseInt(el.dataset.plantId);
                const plant = storage.getPlant(plantId);
                this.addPlantToRoom(plant);
                app.closeModal();
                app.showNotification(`${plant.nickname || plant.name} added to room!`, 'success');
            });
        });
    }

    showPlantDetails(plantId) {
        const plant = storage.getPlant(parseInt(plantId));
        if (!plant) return;

        const content = `
            <div class="plant-details">
                <img src="${plant.image || plant.thumbnail || 'assets/default-plant.svg'}" 
                     alt="${plant.nickname || plant.name}">
                <h3>${plant.nickname || plant.name}</h3>
                <p class="scientific-name">${plant.scientificName || ''}</p>
                
                <div class="plant-info-grid">
                    <div class="info-item">
                        <i class="fas fa-tint"></i>
                        <span>Water: ${plant.watering || 'Unknown'}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-sun"></i>
                        <span>Light: ${Array.isArray(plant.sunlight) ? plant.sunlight[0] : plant.sunlight || 'Unknown'}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-heartbeat"></i>
                        <span>Health: ${plant.health || 'Good'}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <span>Added: ${new Date(plant.addedDate).toLocaleDateString()}</span>
                    </div>
                </div>
                
                ${plant.notes ? `<p class="plant-notes">${plant.notes}</p>` : ''}
            </div>
        `;

        app.createModal({
            title: plant.nickname || plant.name,
            content: content,
            actions: [
                { 
                    text: 'Remove from Room', 
                    class: 'danger', 
                    action: () => {
                        this.removePlantFromRoom(plantId);
                        const roomData = storage.getRoom();
                        roomData.layout = roomData.layout.filter(item => item.plantId !== parseInt(plantId));
                        storage.updateRoomLayout(roomData.layout);
                        app.closeModal();
                        app.showNotification('Plant removed from room', 'info');
                    }
                },
                { text: 'Close', class: 'primary', action: () => app.closeModal() }
            ]
        });
    }
}

// Initialize plant room when ready
let plantRoom;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('plant-room')) {
        plantRoom = new PlantRoom();
    }
});