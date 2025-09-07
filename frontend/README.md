# MiniML - Predictive Quality Control

A modern Angular application for predictive quality control simulation, built for ABB.

## Features

- **Upload Dataset**: Upload and analyze CSV datasets with summary statistics
- **Date Range Selection**: Configure training, testing, and simulation periods
- **Model Training**: Train machine learning models with performance metrics
- **Real-time Simulation**: Live prediction simulation with streaming data

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
   ```bash
   cd abb_hack
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:4200`

## Project Structure

```
src/app/
├── components/
│   ├── upload/           # Dataset upload component
│   ├── date-ranges/      # Date range selection component
│   ├── training/         # Model training component
│   └── simulation/       # Real-time simulation component
├── services/
│   ├── project-state.ts  # State management service
│   └── simulation.ts     # Simulation logic service
├── app.html              # Main app template
├── app.scss              # Global styles
├── app.ts                # Main app component
├── app.routes.ts         # Routing configuration
└── app.config.ts         # App configuration
```

## Key Features

### 1. Upload Dataset
- Drag and drop CSV file upload
- Real-time dataset analysis
- Summary cards showing records, features, pass rate, and date range

### 2. Date Range Selection
- Interactive date pickers for training, testing, and simulation periods
- Visual chart showing selected date ranges
- Validation and period calculation

### 3. Model Training
- One-click model training simulation
- Performance metrics display (Accuracy, Precision, Recall, F1 Score)
- Training progress visualization with line charts
- Model performance donut chart

### 4. Real-time Simulation
- Live prediction streaming
- Real-time quality score charts
- Prediction confidence visualization
- Live statistics dashboard
- Streaming data table with sensor readings

## Technologies Used

- **Angular 20** - Modern Angular framework with standalone components
- **TypeScript** - Type-safe JavaScript
- **SCSS** - Enhanced CSS with variables and nesting
- **RxJS** - Reactive programming for state management
- **SVG Charts** - Custom chart implementations

## State Management

The application uses a centralized state management approach with:
- `ProjectStateService` - Manages global application state
- `SimulationService` - Handles simulation logic and mock data generation
- Reactive observables for real-time updates

## Mock Data

The application includes comprehensive mock data generation for:
- Dataset information
- Date ranges
- Model training metrics
- Real-time simulation data
- Sensor readings (temperature, pressure, humidity)

## Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run watch` - Build and watch for changes
- `npm test` - Run unit tests

### Code Structure

- **Standalone Components**: All components are standalone for better tree-shaking
- **Lazy Loading**: Components are lazy-loaded for optimal performance
- **Type Safety**: Full TypeScript support with strict typing
- **Modern Angular**: Uses latest Angular features and best practices

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is developed for ABB as a proof of concept for predictive quality control systems.