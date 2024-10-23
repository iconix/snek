# Snek Architecture

## Table of Contents

1. [Overview](#overview)
2. [Main Components](#main-components)
3. [Component Interactions](#component-interactions)
4. [Data Flow](#data-flow)
5. [Extensibility](#extensibility)
6. [Build System](#build-system)
7. [Deployment System](#deployment-system)

## Overview

This document outlines the architecture of this `snek` game implementation. The game is built using HTML5 Canvas and vanilla JavaScript and follows an object-oriented approach. It is designed to be modular, extensible, and easy to maintain.

## Main Components

```
                    +------------+
                    |   Config   |
                    +------------+
                           |
                           | (used by all)
                           v
                    +------------+
                    |   Canvas   |
                    +------------+
                           ^
                           | (used by all)
                           |
  +------------+     +------------+     +------------+
  | InputHandler|---->|    Game    |<--->| GameState  |
  +------------+     +------------+     +------------+
                      |      |      |
                      |      |      |
                      v      v      v
           +------------+    |    +------------+
           |   Board    |    |    |   Snake    |
           +------------+    |    +------------+
                 ^           |        ^
                 |           v        |
                 |   +------------+   |
                 ----|    Item    |<---
                     +------------+
                           ^
                           |
              +------------+------------+
              |            |            |
        +------------+------------+------------+
        |    Food    |  Teleport  |   Phase    |
        +------------+------------+------------+
```

This diagram illustrates the main components of the game and their relationships. The Game class acts as the central coordinator, managing Board, Snake, and Item components. It receives input from InputHandler and reads/updates game state through GameState. Both Config and Canvas act as core services - Config provides settings used by all components, while Canvas handles rendering for all game components. The diagram also shows necessary direct relationships between components, such as Board and Snake interactions with Item for positioning and collision detection.

### 1. Game

The `Game` class is the central component that orchestrates the game logic. It manages the game loop, updates game state, and coordinates interactions between other components.

Key responsibilities:
- Initializing the game board, snake, and items
- Running the game loop
- Handling game state (pause, restart, end)
- Coordinating updates to snake position, item generation, and item consumption

### 2. Board

The `Board` class represents the game board. It manages the game's Canvas configuration and UI state.

Key responsibilities:
- Managing canvas size, scaling, and dimensions
- Providing board dimensions and block size information
- Managing board visual state (colors, filters, glow effects)
- Controlling fullscreen mode
- Managing UI elements in the control panel

### 3. Snake

The `Snake` class represents the user-controlled snek in the game.

Key responsibilities:
- Managing snake movement and growth
- Handling direction changes
- Detecting collisions with itself and board boundaries
- Managing power-ups applied to the snake

### 4. Item

The `Item` class (and its subclasses like `Food`, `Teleport`, and `Phase`) represent the various items that can appear on the game board.

Key responsibilities:
- Generating valid random positions using Board dimensions and Snake position
- Providing item position and basic property interfaces
- Defining item type-specific visual properties and behaviors

### 5. InputHandler

The `InputHandler` class manages all user input for controlling the game.

Key responsibilities:
- Handling keyboard, touch, and motion control schemes
- Managing event listeners for different game states
- Translating user input into game actions

### 6. GameState

The `GameState` class manages the current state of the game.

Key responsibilities:
- Tracking score and high score
- Managing game speed
- Handling pause and end game states
- Persisting game state to localStorage

### 7. Config

The `config.js` file contains all game settings and constants, allowing for easy tweaking of game parameters.

### 8. Canvas

The `canvas.js` file contains functions for rendering game elements on the canvas.

Key responsibilities:
- Drawing the game board, snake, items, and UI elements
- Applying visual effects and filters

### 9. Error Handling

The `error.js` file provides error handling functionality.

Key responsibilities:
- Displaying error messages on the canvas or in the DOM
- Handling different types of errors gracefully

## Component Interactions

1. `Config` and `Canvas` are core services:
   - All components access `Config` for game settings
   - All game components use `Canvas` for rendering

2. The `Game` class acts as the central coordinator:
   - Creates and manages `Board`, `Snake`, and `Item` instances
   - Receives input from `InputHandler`
   - Maintains bidirectional communication with `GameState` for reading and updating score and game conditions
   - Coordinates game loop and component updates

3. Component-specific interactions:
   - `Board` provides dimensional information to `Item` for placement
   - `Snake` interacts with `Item` for collision detection and power-up effects. `Item` uses `Snake` for positioning.
   - `InputHandler` communicates directional changes and game controls to `Game`
   - `Item` subclasses (`Food`, `Teleport`, `Phase`) inherit base item behavior

## Data Flow

1. User Input → InputHandler → Game
    - Game then updates appropriate components (Snake direction, GameState pause, etc.)
2. Game Loop → Game → Board/Snake/Item updates
3. Game ↔ GameState
4. Game → All Components → Canvas (for rendering)

## Extensibility

The modular design allows for easy extensions:
- New item types can be added by creating new subclasses of `Item`.
- Additional power-ups can be implemented in the `Snake` class.
- New game modes can be created by extending the `Game` class or modifying game logic.
- Visual themes can be adjusted by modifying the `Board` class and related rendering functions.

## Build System

The project uses a lightweight build system to prepare the game for deployment. It was initially introduced to bundle the JS modules. This system is configured using npm scripts and Rollup.

### Key Components:

1. **npm Scripts**: Defined in `package.json`, these scripts automate various build tasks.

2. **Rollup**: Used as the module bundler, configured in `rollup.config.js`.

3. **Terser**: A plugin for Rollup that minifies the JavaScript output.

### Build Process:

1. **Cleaning**: The `clean` script removes the previous build artifacts from the `dist` directory.

2. **JavaScript Bundling**: The `js` script uses Rollup to bundle and optionally minify the JavaScript files.

3. **Asset Copying**: The `copy-css` and `copy-html` scripts copy CSS and HTML files to the `dist` directory.

4. **Full Build**: The `build` script runs the cleaning process followed by JavaScript bundling and asset copying.

5. **Development Server**: The `server` script starts a development server with live reloading using Browser-Sync.

6. **Watching**: Several watch scripts (`watch-js`, `watch-css`, `watch-html`) monitor for changes in source files and trigger rebuilds as necessary.

### Key Features:

- **Module Resolution**: Rollup handles module resolution, allowing the use of ES6 import/export syntax.
- **Minification**: The Terser plugin minifies the JavaScript for production builds.
- **Source Maps**: Generated for easier debugging of the minified code.

## Deployment System

The project is set up for deployment to Firebase Hosting.

### Key Components:

1. **Firebase Configuration**: The `firebase.json` file configures the Firebase Hosting settings.

2. **Hosting Settings**:
   - The `public` directory is set to `dist`, which contains the built assets.
   - Custom headers are set to prevent caching.
   - A rewrite rule is configured to serve `snek.html` for all routes.

### Deployment Process:

1. **Build**: Run the `npm run build` command to create a production-ready build in the `dist` directory.

2. **Deploy**: Use the Firebase CLI command `firebase deploy` to upload the contents of the `dist` directory to Firebase Hosting.

### Key Features:

- **Cache Control**: The configuration ensures that the latest version of the game is always served by preventing caching.
- **Single Page App**: The rewrite rule allows the game to function as a single page application.
- **Easy Updates**: Deploying updates is as simple as running the build process and using the Firebase CLI to deploy.

This build and deployment setup allows for efficient development with live reloading, optimized production builds, and straightforward deployment to Firebase Hosting.
