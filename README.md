# Kigali Real-Time Road Info App

A real-time road information and issue reporting application for Kigali, Rwanda. Built with React, Leaflet, and OpenStreetMap for Map View.

## Features

✅ **Interactive Map** - View real-time road conditions on an interactive OpenStreetMap
✅ **Route Planning** - Get directions from point A to point B with multiple route options
✅ **Issue Reporting** - Report road issues like potholes, accidents, roadworks, etc.
✅ **Issue Tracking** - View all reported issues on the map with color-coded markers
✅ **Multi-language Support** - Switch between English, Kinyarwanda, and French
✅ **Responsive Design** - Works seamlessly on mobile and desktop devices

## Technologies Used

- **React 19** - Modern React with hooks
- **Leaflet** - Interactive map library
- **Leaflet Routing Machine** - Routing and directions functionality
- **OpenStreetMap** - Free and open map tiles
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository

```bash
git clone <your-repo-url>
cd dry-app
```

2. Install dependencies

```bash
npm install
```

3. Start the development server

```bash
npm run dev
```

4. Open your browser to `http://localhost:5173` (or the port shown in terminal)

## How to Use

### 🗺️ Getting Directions (Route from Point A to Point B)

1. **Click the "Get Directions" button** below the map
2. **Click on the map** to set your **starting point (A)** - a green marker will appear
3. **Click again on the map** to set your **destination (B)** - a red marker will appear
4. The app will automatically calculate and display:
   - The **primary route** (blue line)
   - **Alternative routes** (gray lines)
   - **Turn-by-turn directions** in a panel
   - **Distance and estimated time**
5. You can **drag the waypoints** to adjust the route
6. Click **"Clear Route"** to remove the route and start over

### 📍 Viewing Road Issues

- **Map Markers**: Each issue is shown with a colored marker and emoji icon

  - 🕳️ Potholes (red)
  - 🚧 Roadworks (orange)
  - ⚠️ Accidents (yellow)
  - 🚫 Road Closures (dark red)
  - 💧 Flooding (blue)
  - 🪨 Debris (gray)
  - 🚗 Traffic (orange)

- **Click on any marker** to see issue details in a popup
- **Click on issue cards** in the list to locate them on the map

### ⚠️ Reporting a Road Issue

1. Click **"Report a Road Issue"** button
2. Select the **issue type** from the dropdown
3. Enter a **title** and **description**
4. Provide the **location** (address or landmark)
5. Click **"Submit Report"**

Your report will be added to the queue for verification!

### 🌍 Show/Hide Map Legend

Click the **"Show Map Legend"** button to see what each marker type represents.

## Project Structure

```
dry-app/
├── src/
│   ├── components/
│   │   ├── Map.jsx              # Main map with routing
│   │   ├── IssueReportModal.jsx # Issue reporting form
│   │   ├── IssuesList.jsx       # List of all issues
│   │   ├── MapLegend.jsx        # Map legend component
│   │   └── SideBar.jsx          # (Future feature)
│   ├── data/
│   │   ├── issueCategories.js   # Issue type definitions
│   │   └── mockIssues.js        # Sample issue data
│   ├── App.jsx                  # Main app component
│   ├── App.css                  # Styles
│   └── main.jsx                 # Entry point
├── public/                      # Static assets
├── package.json
└── README.md
```

## Routing Details

The app uses **Leaflet Routing Machine** which connects to:

- **OSRM (Open Source Routing Machine)** - Free routing service
- **OpenStreetMap data** - Community-maintained road network

### Route Features:

- ✅ Multiple route alternatives
- ✅ Turn-by-turn directions
- ✅ Distance and time estimates
- ✅ Draggable waypoints
- ✅ Traffic-aware routing (when available)

## Future Enhancements

- [ ] Real-time traffic data integration
- [ ] User authentication and profiles
- [ ] Issue verification workflow
- [ ] Push notifications for nearby issues
- [ ] Integration with city authorities
- [ ] Offline map support
- [ ] Route sharing functionality
- [ ] Voice-guided navigation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for the people of Kigali

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
