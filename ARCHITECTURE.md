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
  +------------+     +------------+     +------------+
  | InputHandler|<--->|    Game    |<--->| GameState  |
  +------------+     +------------+     +------------+
                           ^  ^
                           |  |
                    +------+  +------+
                    |               |
              +------------+  +------------+
              |   Board    |  |   Snake    |
              +------------+  +------------+
                    ^               ^
                    |               |
                    +---------------+
                           |
                           v
                    +------------+
                    |    Item    |
                    +------------+
                           ^
                           |
              +------------+------------+
              |            |            |
        +------------+------------+------------+
        |    Food    |  Teleport  |   Phase    |
        +------------+------------+------------+
```

This diagram illustrates the main components of the game and their relationships. The Game class acts as the central coordinator, interacting with InputHandler, GameState, Board, Snake, and Item classes. The Config module is used by all components for game settings.

### 1. Game

The `Game` class is the central component that orchestrates the game logic. It manages the game loop, updates game state, and coordinates interactions between other components.

Key responsibilities:
- Initializing the game board, snake, and items
- Running the game loop
- Handling game state (pause, restart, end)
- Coordinating updates to snake position and item generation

### 2. Board

The `Board` class represents the game board. It manages the canvas element and provides methods for drawing game elements.

Key responsibilities:
- Managing canvas size and scaling
- Providing drawing context for other components
- Handling board-specific visual effects (glow, filters)
- Managing fullscreen mode

### 3. Snake

The `Snake` class represents the player-controlled snake in the game.

Key responsibilities:
- Managing snake movement and growth
- Handling direction changes
- Detecting collisions with itself and board boundaries
- Managing power-ups applied to the snake

### 4. Item

The `Item` class (and its subclasses like `Food`, `Teleport`, and `Phase`) represent the various items that can appear on the game board.

Key responsibilities:
- Generating new items at random positions
- Defining item-specific properties and behaviors
- Handling item consumption effects

### 5. InputHandler

The `InputHandler` class manages user input for controlling the game.

Key responsibilities:
- Handling keyboard, touch, and motion controls
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

1. The `Game` class initializes all other components (`Board`, `Snake`, `Item`, `InputHandler`, `GameState`).

2. In each frame of the game loop:
   - `Game` checks with `GameState` to determine if it should update.
   - If updating, `Game` tells `Snake` to move.
   - `Game` checks for collisions between `Snake` and `Item` or board boundaries.
   - `Game` updates `GameState` (score, etc.) based on these interactions.
   - `Game` uses `Board` and `Canvas` functions to render the current state.

3. `InputHandler` listens for user input and communicates with `Game` to change snake direction or toggle game state (pause/resume).

4. When `Snake` consumes an `Item`, `Game` is notified, updates the score in `GameState`, and generates a new `Item`.

5. All components refer to `config.js` for game settings, allowing for easy adjustment of game parameters.

## Data Flow

1. User Input → InputHandler → Game → Snake
2. Game Loop → Game → Snake/Item/Board → GameState
3. Game State Changes → Game → Board/Canvas (for rendering)

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
