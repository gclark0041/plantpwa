# PlantHub - Quick Start Guide

## 🚀 Getting Started

### 1. **Setup**
1. Open `index.html` in a modern web browser
2. For PWA features, serve the files through a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```
3. Navigate to `http://localhost:8000`

### 2. **First Steps**
1. **Add Your First Plant**
   - Go to the "Discover" tab
   - Search or browse for plants
   - Click on a plant to see details
   - Click "Add to Collection"
   - Give your plant a nickname!

2. **Customize Your Plant Room**
   - Return to "My Room" tab
   - Click "Add Plant" to add plants from your collection
   - Drag plants to arrange them
   - Click "Customize" to change room theme and wallpaper

3. **Set Care Reminders**
   - Go to "Care" tab
   - Click the "+" button
   - Select your plant and care type
   - Set the date and frequency

### 3. **Key Features**

#### 🏠 **Plant Room**
- **Drag & Drop**: Click and drag plants to rearrange
- **Double-tap/click**: Water animation
- **Long press**: Quick plant info
- **Keyboard Shortcuts**:
  - `A` - Add plant
  - `C` - Customize room
  - `F` - Fullscreen view
  - `ESC` - Close panels

#### 🔍 **Discover Plants**
- Search by name
- Filter by type (Indoor, Outdoor, Succulents, Flowering)
- View detailed care information
- Add to your collection

#### 💧 **Care Schedule**
- Today's tasks at a glance
- Upcoming care activities
- Mark tasks as complete
- Build care streaks

#### 📖 **Plant Journal**
- Document plant growth
- Add notes and observations
- Track plant health over time
- Add photos (coming soon)

#### 👤 **Profile**
- View your plant statistics
- Export/import your data
- Toggle dark mode
- Configure notifications

### 4. **Pro Tips**

1. **Room Themes**: Swipe left/right in the plant room to quickly change themes
2. **Quick Water**: Double-tap any plant for a watering animation
3. **Seasonal Effects**: The app adds seasonal decorations automatically
4. **Time-based Lighting**: Room lighting changes based on time of day
5. **Plant Health**: Plants glow different colors based on their health status

### 5. **Install as App**
- On mobile: Look for "Add to Home Screen" in your browser menu
- On desktop: Click the install icon in the address bar
- Works offline once installed!

### 6. **Troubleshooting**

**Plants not loading?**
- Check your internet connection
- The Perenual API might be temporarily down

**Can't drag plants?**
- Make sure you're clicking directly on the plant image
- Try refreshing the page

**Data lost?**
- Your data is stored locally in your browser
- Use the Export feature regularly to backup

### 7. **API Information**
The app uses the Perenual API for plant data. The included API key is for development only. For production use:
1. Get your own key at [perenual.com/docs/api](https://perenual.com/docs/api)
2. Replace the key in `js/api.js`

---

## 🌱 Happy Plant Parenting!

Need help? Check the README.md for more detailed information.