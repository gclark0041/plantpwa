// Enhanced Plant Room Features
class PlantRoomEnhancements {
    constructor() {
        this.waterDroplets = [];
        this.sparkles = [];
        this.isWatering = false;
        this.init();
    }

    init() {
        this.setupAdvancedInteractions();
        this.setupKeyboardShortcuts();
        this.setupGestures();
        this.initializeAmbientEffects();
    }

    setupAdvancedInteractions() {
        // Double-tap to water animation
        let lastTap = 0;
        document.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                const plant = e.target.closest('.room-plant');
                if (plant) {
                    this.waterPlantAnimation(plant);
                }
            }
            lastTap = currentTime;
        });

        // Double-click for desktop
        document.addEventListener('dblclick', (e) => {
            const plant = e.target.closest('.room-plant');
            if (plant) {
                this.waterPlantAnimation(plant);
            }
        });

        // Long press for plant info
        let pressTimer;
        const startPress = (e) => {
            const plant = e.target.closest('.room-plant');
            if (plant) {
                pressTimer = setTimeout(() => {
                    this.showQuickPlantInfo(plant);
                }, 500);
            }
        };

        const endPress = () => {
            clearTimeout(pressTimer);
        };

        document.addEventListener('touchstart', startPress);
        document.addEventListener('touchend', endPress);
        document.addEventListener('mousedown', startPress);
        document.addEventListener('mouseup', endPress);
    }

    waterPlantAnimation(plantElement) {
        if (this.isWatering) return;
        this.isWatering = true;

        const rect = plantElement.getBoundingClientRect();
        const roomRect = document.getElementById('plant-room').getBoundingClientRect();

        // Create water droplets
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const droplet = document.createElement('div');
                droplet.className = 'water-drop';
                droplet.style.left = (rect.left - roomRect.left + rect.width / 2 - 10 + (Math.random() - 0.5) * 20) + 'px';
                droplet.style.top = (rect.top - roomRect.top - 20) + 'px';
                
                document.getElementById('plant-room').appendChild(droplet);
                
                setTimeout(() => droplet.remove(), 1500);
            }, i * 100);
        }

        // Plant reaction
        plantElement.classList.add('heartbeat');
        setTimeout(() => {
            plantElement.classList.remove('heartbeat');
            this.isWatering = false;
        }, 1500);

        // Update last watered
        const plantId = parseInt(plantElement.dataset.plantId);
        const plant = storage.getPlant(plantId);
        if (plant) {
            storage.updatePlant(plantId, { lastWatered: new Date().toISOString() });
            this.createSparkles(rect.left - roomRect.left + rect.width / 2, rect.top - roomRect.top + rect.height / 2);
        }
    }

    createSparkles(x, y) {
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            const angle = (i / 8) * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            
            sparkle.style.left = x + 'px';
            sparkle.style.top = y + 'px';
            sparkle.style.setProperty('--end-x', Math.cos(angle) * distance + 'px');
            sparkle.style.setProperty('--end-y', Math.sin(angle) * distance + 'px');
            
            document.getElementById('plant-room').appendChild(sparkle);
            
            setTimeout(() => sparkle.remove(), 1000);
        }
    }

    showQuickPlantInfo(plantElement) {
        const plantId = parseInt(plantElement.dataset.plantId);
        const plant = storage.getPlant(plantId);
        if (!plant) return;

        const info = document.createElement('div');
        info.className = 'quick-plant-info';
        info.innerHTML = `
            <h4>${plant.nickname || plant.name}</h4>
            <p>💧 ${plant.lastWatered ? `Last watered: ${new Date(plant.lastWatered).toLocaleDateString()}` : 'Never watered'}</p>
            <p>☀️ ${plant.sunlight ? plant.sunlight[0] : 'Unknown light needs'}</p>
            <p>❤️ Health: ${plant.health || 'Good'}</p>
        `;

        const rect = plantElement.getBoundingClientRect();
        info.style.left = rect.left + 'px';
        info.style.top = (rect.top - 100) + 'px';

        document.body.appendChild(info);

        setTimeout(() => {
            info.classList.add('show');
        }, 10);

        setTimeout(() => {
            info.classList.remove('show');
            setTimeout(() => info.remove(), 300);
        }, 3000);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only work when in plant room
            if (!document.getElementById('room-page').classList.contains('active')) return;

            switch(e.key) {
                case 'f':
                case 'F':
                    if (!e.ctrlKey && !e.metaKey) {
                        document.getElementById('room-view-btn').click();
                    }
                    break;
                case 'c':
                case 'C':
                    if (!e.ctrlKey && !e.metaKey) {
                        document.getElementById('customize-room-btn').click();
                    }
                    break;
                case 'a':
                case 'A':
                    if (!e.ctrlKey && !e.metaKey) {
                        document.getElementById('add-plant-btn').click();
                    }
                    break;
                case 'Escape':
                    // Close any open panels
                    const customPanel = document.querySelector('.customization-panel.active');
                    if (customPanel) {
                        customPanel.classList.remove('active');
                    }
                    const fullscreen = document.querySelector('.room-fullscreen.active');
                    if (fullscreen) {
                        fullscreen.classList.remove('active');
                    }
                    break;
            }
        });
    }

    setupGestures() {
        const room = document.getElementById('plant-room');
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        room.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                // Pinch gesture start
                this.handlePinchStart(e);
            } else {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        });

        room.addEventListener('touchend', (e) => {
            if (Math.abs(touchEndX - touchStartX) > 50 || Math.abs(touchEndY - touchStartY) > 50) {
                // Swipe detected
                this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
            }
        });

        room.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                // Pinch gesture move
                this.handlePinchMove(e);
            } else {
                touchEndX = e.touches[0].clientX;
                touchEndY = e.touches[0].clientY;
            }
        });
    }

    handleSwipe(startX, startY, endX, endY) {
        const diffX = endX - startX;
        const diffY = endY - startY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (diffX > 0) {
                // Swipe right - previous theme
                this.cycleTheme('prev');
            } else {
                // Swipe left - next theme
                this.cycleTheme('next');
            }
        }
    }

    cycleTheme(direction) {
        const themes = ['minimal', 'nature', 'sunset', 'ocean', 'desert', 'night'];
        const currentTheme = storage.getRoom().theme;
        const currentIndex = themes.indexOf(currentTheme);
        
        let newIndex;
        if (direction === 'next') {
            newIndex = (currentIndex + 1) % themes.length;
        } else {
            newIndex = currentIndex === 0 ? themes.length - 1 : currentIndex - 1;
        }

        if (window.plantRoom) {
            window.plantRoom.applyTheme(themes[newIndex]);
            app.showNotification(`Theme: ${themes[newIndex].charAt(0).toUpperCase() + themes[newIndex].slice(1)}`, 'info');
        }
    }

    initializeAmbientEffects() {
        // Occasional floating particles
        setInterval(() => {
            if (Math.random() > 0.7) {
                this.createAmbientParticle();
            }
        }, 5000);

        // Time-based lighting
        this.updateRoomLighting();
        setInterval(() => this.updateRoomLighting(), 60000); // Update every minute
    }

    createAmbientParticle() {
        const particle = document.createElement('div');
        particle.className = 'ambient-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (10 + Math.random() * 10) + 's';
        
        const room = document.getElementById('plant-room');
        room.appendChild(particle);
        
        setTimeout(() => particle.remove(), 20000);
    }

    updateRoomLighting() {
        const hour = new Date().getHours();
        const room = document.getElementById('plant-room');
        
        // Remove all time classes
        room.classList.remove('morning', 'afternoon', 'evening', 'night');
        
        if (hour >= 6 && hour < 10) {
            room.classList.add('morning');
        } else if (hour >= 10 && hour < 17) {
            room.classList.add('afternoon');
        } else if (hour >= 17 && hour < 20) {
            room.classList.add('evening');
        } else {
            room.classList.add('night');
        }
    }

    // Plant health visualization
    updatePlantHealthVisual(plantElement, health) {
        const healthColors = {
            excellent: '#4CAF50',
            good: '#8BC34A',
            fair: '#FFC107',
            poor: '#FF5722'
        };

        const color = healthColors[health] || healthColors.good;
        plantElement.style.filter = `drop-shadow(0 0 10px ${color}40)`;
    }

    // Seasonal decorations
    addSeasonalDecorations() {
        const month = new Date().getMonth();
        const room = document.getElementById('plant-room');
        
        // Winter (Dec, Jan, Feb)
        if (month === 11 || month === 0 || month === 1) {
            this.addSnowflakes();
        }
        // Spring (Mar, Apr, May)
        else if (month >= 2 && month <= 4) {
            this.addButterflies();
        }
        // Summer (Jun, Jul, Aug)
        else if (month >= 5 && month <= 7) {
            this.addSunbeams();
        }
        // Fall (Sep, Oct, Nov)
        else {
            this.addFallingLeaves();
        }
    }

    addSnowflakes() {
        const snowContainer = document.createElement('div');
        snowContainer.className = 'seasonal-overlay snowflakes';
        
        for (let i = 0; i < 20; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.innerHTML = '❄';
            snowflake.style.left = Math.random() * 100 + '%';
            snowflake.style.animationDelay = Math.random() * 10 + 's';
            snowflake.style.fontSize = (10 + Math.random() * 20) + 'px';
            snowContainer.appendChild(snowflake);
        }
        
        document.getElementById('plant-room').appendChild(snowContainer);
    }
}

// Additional styles for enhancements
const enhancementStyles = `
<style>
/* Quick Plant Info */
.quick-plant-info {
    position: fixed;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 16px;
    border-radius: 12px;
    font-size: 14px;
    z-index: 1000;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease;
    max-width: 200px;
}

.quick-plant-info.show {
    opacity: 1;
    transform: translateY(0);
}

.quick-plant-info h4 {
    margin: 0 0 8px 0;
    color: #4CAF50;
}

.quick-plant-info p {
    margin: 4px 0;
}

/* Ambient Particles */
.ambient-particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    pointer-events: none;
    animation: floatUp 15s linear;
    bottom: -10px;
}

@keyframes floatUp {
    to {
        transform: translateY(-100vh) translateX(50px);
        opacity: 0;
    }
}

/* Time-based lighting */
.plant-room.morning {
    filter: brightness(1.1) hue-rotate(-10deg);
}

.plant-room.evening {
    filter: brightness(0.9) hue-rotate(10deg) saturate(1.2);
}

.plant-room.night {
    filter: brightness(0.7) contrast(1.1);
}

/* Seasonal Overlays */
.seasonal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
}

.snowflake {
    position: absolute;
    top: -20px;
    animation: snowfall 10s linear infinite;
    opacity: 0.8;
}

@keyframes snowfall {
    to {
        transform: translateY(calc(100vh + 20px)) rotate(360deg);
    }
}

/* Enhanced sparkle effect */
.sparkle {
    animation: sparkleMove 1s ease-out forwards;
}

@keyframes sparkleMove {
    to {
        transform: translate(var(--end-x), var(--end-y));
        opacity: 0;
    }
}

/* Plant glow effects */
.room-plant.healthy {
    animation: healthyGlow 3s ease-in-out infinite;
}

@keyframes healthyGlow {
    0%, 100% {
        filter: drop-shadow(0 0 5px rgba(76, 175, 80, 0.3));
    }
    50% {
        filter: drop-shadow(0 0 15px rgba(76, 175, 80, 0.6));
    }
}

/* Customization panel enhancements */
.customization-panel {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.95);
}

body.dark-mode .customization-panel {
    background: rgba(30, 30, 30, 0.95);
}
</style>
`;

// Add enhancement styles
document.head.insertAdjacentHTML('beforeend', enhancementStyles);

// Initialize enhancements when ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('plant-room')) {
        window.plantRoomEnhancements = new PlantRoomEnhancements();
    }
});