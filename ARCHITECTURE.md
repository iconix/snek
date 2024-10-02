# Game Architecture

## Overview

This document outlines the architecture of this `snek` game implementation. The game is built using HTML5 Canvas and JavaScript and follows an object-oriented approach. It is designed to be modular, extensible, and easy to maintain.

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

## Conclusion

This architecture provides a solid foundation for the Snake game, with clear separation of concerns and modular components. It allows for easy maintenance and future enhancements while keeping the codebase organized and manageable.
