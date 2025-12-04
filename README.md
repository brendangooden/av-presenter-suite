# AV Presenter Suite

A professional teleprompter application built with Vue 3 and Vite, designed for static deployment on platforms like Netlify or Vercel. Features dual-window operation with cross-window synchronization, multiple operational modes, timer system, and live messaging, for use in live broadcast and audio visual setups. 

## Features

### Core Functionality

- **Dual-Window Architecture**: Separate control and program views synchronized via BroadcastChannel API
- **Three Operational Modes**:
  - **Timer Mode**: Full-screen timer with presenter name
  - **Teleprompter Mode**: Scrolling text with small timer bar
  - **Combined Mode**: Teleprompter with prominent timer display
- **Advanced Timer System**: Count-up and count-down timers with visual warnings
- **Live Messaging**: Send messages from control to program view with info/warning styling
- **Auto-Scroll**: Smooth teleprompter scrolling with adjustable speed
- **Drag-to-Scroll**: Manual control via mouse drag
- **Presenter Management**: Add, edit, and delete multiple presenters with scripts
- **Import/Export**: JSON-based backup and restore of all data
- **Keyboard Controls**: Spacebar toggles play/pause
- **Persistent Settings**: LocalStorage-based state preservation

### Technical Features

- **Vue 3 Composition API**: Modern, reactive component architecture
- **Cross-Window Sync**: BroadcastChannel with localStorage fallback
- **Static SPA**: No backend required, works entirely in the browser
- **URL-Based Routing**: Role determined via query parameters
- **RequestAnimationFrame**: Smooth, performant animations
- **Responsive Design**: Works on various screen sizes

## Architecture

### Directory Structure

```
presentation-autocue-timer/
├── index.html                 # Entry HTML file
├── package.json              # Dependencies and scripts
├── vite.config.js           # Vite configuration
├── src/
│   ├── main.js              # Application entry point
│   ├── App.vue              # Root component (role routing)
│   ├── style.css            # Global styles
│   ├── views/
│   │   ├── ControlView.vue  # Control/admin interface
│   │   └── ProgramView.vue  # Presenter output view
│   ├── components/
│   │   ├── PresenterList.vue      # Sidebar presenter list
│   │   ├── PresenterEditor.vue    # Modal for editing presenters
│   │   ├── TeleprompterDisplay.vue # Scrolling text display
│   │   ├── TimerDisplay.vue       # Timer with controls
│   │   └── MessageBanner.vue      # Live message overlay
│   └── composables/
│       └── useTeleprompterSync.js # Shared state & sync logic
```

### Role-Based Views

The application uses **Vue Router** to determine which view to render:

- **Control View**: `http://localhost:5173/control`
  - Full admin interface
  - Presenter management
  - Timer controls
  - Message sending
  - Mode selection
  - Playback controls

- **Program View**: `http://localhost:5173/program`
  - Clean presenter display
  - Synchronized timer
  - Teleprompter text
  - Message overlays
  - No editing controls

### Cross-Window Synchronization

The application uses a dual-layer synchronization approach:

#### Primary: BroadcastChannel API
- Modern, efficient cross-tab communication
- Real-time state updates
- Low latency
- Supported in modern browsers

#### Fallback: LocalStorage Events
- Compatible with older browsers
- Uses `storage` event listener
- Slightly higher latency
- Universal compatibility

#### Message Protocol

Messages follow a typed protocol:

```javascript
{
  type: 'SET_STATE' | 'UPDATE_TIMER' | 'UPDATE_SCRIPT' | 
        'UPDATE_PLAYBACK' | 'SET_MODE' | 'PUSH_MESSAGE' | 
        'CLEAR_MESSAGE' | 'UPDATE_PRESENTERS' | 'SELECT_PRESENTER',
  payload: { /* type-specific data */ }
}
```

### State Management

The `useTeleprompterSync` composable manages all shared state:

```javascript
{
  // Presenter data
  presenters: Array<{ id, name, script }>,
  selectedPresenterId: number,
  
  // Teleprompter settings
  isPlaying: boolean,
  speed: number (1-10),
  fontSize: number (24-72),
  scrollPosition: number,
  
  // Timer state
  timerMode: 'up' | 'down',
  durationMs: number,
  elapsedMs: number,
  isTimerRunning: boolean,
  timerStartTime: number,
  
  // App mode
  mode: 'timer' | 'autocue' | 'combined',
  
  // Messaging
  currentMessage: {
    text: string,
    type: 'info' | 'warning',
    id: string,
    visible: boolean
  }
}
```

## Installation and Setup

### Prerequisites

- Node.js 16+ and npm
- Modern web browser

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open two browser windows**:
   - Control view: `http://localhost:5173/control`
   - Program view: `http://localhost:5173/program`
   - Or use the **"📺 Program View"** button in control to auto-open

4. **Test synchronization**:
   - Make changes in the control view
   - Observe updates in the program view

### Production Build

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Preview production build**:
   ```bash
   npm run preview
   ```

The built files will be in the `dist/` directory.

## Deployment

### Netlify

1. **Connect repository**:
   - Go to [Netlify](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository

2. **Configure build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Deploy**:
   - Click "Deploy site"
   - Netlify will build and deploy automatically

4. **Access the application**:
   - Control: `https://your-site.netlify.app/control`
   - Program: `https://your-site.netlify.app/program`

### Vercel

1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Deploy via CLI**:
   ```bash
   vercel
   ```

   Or deploy via the [Vercel Dashboard](https://vercel.com):
   - Import your Git repository
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Access the application**:
   - Control: `https://your-app.vercel.app/control`
   - Program: `https://your-app.vercel.app/program`

### Custom Static Host

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Upload the `dist/` folder** to your static hosting service (GitHub Pages, AWS S3, etc.)

3. **Configure routing** (if needed):
   - Ensure the host serves `index.html` for all routes
   - Query parameters must be preserved

## Usage Guide

### Basic Workflow

1. **Open Control Window**:
   - Navigate to `/control`
   - This is your admin interface

2. **Open Program Window**:
   - Click the **"📺 Program View"** button, or
   - Navigate to `/program` in a new window/tab
   - Display this on the presenter's monitor or projector

3. **Configure Mode**:
   - In control view, select mode: Timer, Teleprompter, or Combined
   - Program view updates automatically

4. **Add Presenters**:
   - Click "Add Presenter" in control view
   - Enter name and script
   - Save

5. **Control Playback**:
   - Adjust speed and font size
   - Click play to start auto-scroll
   - Use spacebar to toggle play/pause
   - Drag the teleprompter to manually scroll

6. **Use Timer**:
   - Set timer mode (count up or count down)
   - For countdown, set duration
   - Start/pause/reset as needed
   - Timer syncs to program view

7. **Send Messages**:
   - Type message in control view
   - Select type (Info or Warning)
   - Click "Send"
   - Message appears on program view
   - Click "Clear" to remove

### Keyboard Shortcuts

- **Spacebar**: Toggle play/pause (when not in input field)

### Mode Descriptions

#### Timer Mode
- **Use case**: Presentations that need only time tracking
- **Program view shows**:
  - Large timer display
  - Presenter name at top
  - Message overlay (when sent)
- **Control view shows**:
  - Timer with full controls
  - Message sending interface

#### Teleprompter Mode
- **Use case**: Script reading with minimal timer distraction
- **Program view shows**:
  - Full-screen teleprompter text
  - Small timer bar at top
  - Message overlay (when sent)
- **Control view shows**:
  - Teleprompter preview
  - Playback controls
  - Message sending interface

#### Combined Mode
- **Use case**: Full-featured presentation with both script and timer
- **Program view shows**:
  - Prominent timer panel at top
  - Teleprompter text below
  - Message overlay (when sent)
- **Control view shows**:
  - Timer with controls
  - Teleprompter preview
  - Full controls for both

### Import/Export

#### Export Data
1. Click "Export" button in control view
2. Downloads JSON file with:
   - All presenters and scripts
   - Settings (speed, font size, mode)
   - Timer configuration
3. Filename: `teleprompter-data-YYYY-MM-DD.json`

#### Import Data
1. Click "Import" button in control view
2. Select previously exported JSON file
3. All data is restored
4. Current data is replaced

## Customization

### Adjusting Scroll Speed
- Default range: 1-10
- To change range, edit `ControlView.vue`:
  ```vue
  <input type="range" min="1" max="20" ... />
  ```

### Adjusting Font Size
- Default range: 24-72px
- To change range, edit `ControlView.vue`:
  ```vue
  <input type="range" min="16" max="96" ... />
  ```

## API Reference

### useTeleprompterSync(role)

The main composable for state management and synchronization.

**Parameters**:
- `role` (string): `'control'` or `'program'`

## License

MIT License - feel free to use and modify for your needs.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

For issues or questions:
1. Check this README
2. Review browser console for errors
3. Test in a different browser
4. Clear localStorage and try again
5. Open an issue on the repository

---

Built with Vue 3, Vite, and ❤️
