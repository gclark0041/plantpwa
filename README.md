# PlantHub - Plant Care PWA

A modern Progressive Web App for plant enthusiasts to manage their plant collection with a fully customizable virtual plant room.

## Features

### 🏠 Customizable Plant Room
- **Drag & Drop Interface**: Arrange your plants freely in a virtual room
- **Multiple Themes**: Choose from 6 beautiful room themes (Minimal, Nature, Sunset, Ocean, Desert, Night)
- **Wallpaper Options**: Add visual patterns to your room
- **Adjustable Plant Sizes**: Scale your plants to your preference
- **Fullscreen View**: Admire your plant collection in an immersive view

### 🔍 Plant Discovery
- **Powered by Perenual API**: Access a vast database of plant species
- **Smart Search**: Find plants by name or characteristics
- **Filter Options**: Browse by categories (Indoor, Outdoor, Succulents, Flowering)
- **Detailed Information**: View care requirements, growth habits, and more

### 💧 Care Management
- **Task Scheduling**: Set reminders for watering, fertilizing, repotting
- **Recurring Tasks**: Create daily, weekly, or monthly care routines
- **Task Tracking**: Mark tasks as complete and build care streaks
- **Calendar View**: See all upcoming plant care tasks at a glance

### 📖 Plant Journal
- **Growth Documentation**: Track your plants' progress over time
- **Photo Support**: Add images to your journal entries
- **Plant-Specific Entries**: Link entries to specific plants
- **Chronological Timeline**: View your plant journey

### 👤 Profile & Stats
- **Care Statistics**: Track your plant count, care streak, and journal entries
- **Data Export**: Backup your plant data as JSON
- **Theme Settings**: Toggle between light and dark modes
- **Notification Settings**: Configure care reminders

### 📱 PWA Features
- **Offline Support**: Access your plants without internet
- **Installable**: Add to home screen on mobile devices
- **Push Notifications**: Get reminded about plant care tasks
- **Responsive Design**: Works beautifully on all devices

## Installation

1. Clone the repository to your local machine
2. Serve the files using a local web server (required for PWA features)
3. Open in a modern web browser
4. Click "Install" when prompted to add to home screen

### Using Python:
```bash
cd plant-care-pwa
python -m http.server 8000
```

### Using Node.js:
```bash
npx serve plant-care-pwa
```

## API Configuration

The app uses the Perenual API for plant data. The development API key is included, but for production use:

1. Get your own API key from [Perenual.com](https://perenual.com/docs/api)
2. Replace the API key in `js/api.js`

## Technical Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Custom CSS with CSS Variables for theming
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Outfit, Playfair Display)
- **Storage**: LocalStorage for data persistence
- **PWA**: Service Worker for offline functionality
- **API**: Perenual Plant Database API

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile browsers with PWA support

## Key Features Implementation

### Plant Room Drag & Drop
- Touch and mouse event support
- Boundary constraints
- Visual feedback during dragging
- Persistent position storage

### Offline Functionality
- Service Worker caches all assets
- API responses cached for offline access
- LocalStorage for data persistence

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Touch-optimized interactions
- Adaptive navigation

## Future Enhancements

- [ ] Plant health tracking with photos
- [ ] Community features for sharing rooms
- [ ] Plant identification via camera
- [ ] Weather integration for outdoor plants
- [ ] Watering schedule optimization
- [ ] Export to calendar apps
- [ ] Multiple room support
- [ ] 3D room view option
- [ ] Social sharing features
- [ ] Achievements and badges

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Plant data provided by [Perenual API](https://perenual.com)
- Icons by [Font Awesome](https://fontawesome.com)
- Inspired by the plant parent community 🌱

---

Made with ❤️ for plant lovers everywhere