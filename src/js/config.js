export const GAME_CONFIG = {
    BOARD: {
        CTRL_PANEL_HEIGHT: 50,  // pixels
        MARGIN_SIZE: 20,  // pixels
        NUM_STEPS_ACROSS_CANVAS: 30,
        DEFAULT_BACKGROUND_COLOR: 'white',
        DEFAULT_BORDER_COLOR: 'darkgreen',
        TELEPORT_BORDER_COLOR: 'blue',
        TELEPORT_BACKGROUND_COLOR: '#e2f1fa',  // a light blue
        FILTERS: {
            NONE: 'none',
            PAUSE: 'contrast(1.4) sepia(1)',
            ENDGAME: 'grayscale(0.8) blur(0.5px)',
        },
    },

    SNAKE: {
        INITIAL_LENGTH: 5,
        DEFAULT_COLOR: 'lightgreen',
        DEFAULT_BORDER_COLOR: 'darkgreen',
        PHASE_BORDER_COLOR: 'violet',
    },

    ITEM: {
        FOOD_COLOR: 'red',
        FOOD_BORDER_COLOR: 'darkred',
        PHASE_COLOR: 'orchid',
        PHASE_BORDER_COLOR: 'violet',
        TELEPORT_COLOR: 'blue',
        TELEPORT_BORDER_COLOR: 'darkblue',
        PHASE_SCORE_THRESHOLD: 150,
        TELEPORT_SCORE_THRESHOLD: 50,
        BASE_PHASE_PROBABILITY: 0.1,
        BASE_TELEPORT_PROBABILITY: 0.1,
        BASE_VOLATILE_FOOD_PROBABILITY: 0.01,
    },

    GAME: {
        SCORE_INCREMENT: 10,
        SCORE_THRESHOLD_FOR_VOLATILE_FOOD: 100,
    },

    INPUT: {
        GAME_SPEED__ARROW: 100,     // milliseconds
        GAME_SPEED__MOTION: 125,    // milliseconds, slow down game since harder with motion controls
        SWIPE_SENSITIVITY: 10,      // delta of pixels needed to consider touch mvmt a 'swipe'
        MOTION_SENSITIVITY: 15,     // degree of motion needed to consider a device mvmt as intentional
    },

    CANVAS: {
        GAME_TEXT_COLOR: 'gray',
        HIGH_SCORE_TEXT_COLOR: 'goldenrod',
        PAUSE_BTN_COLOR: 'darkkhaki',
        EXCLAMATION_BTN_COLOR: 'darkkhaki',
        GAME_TEXT_FONT_FAMILY: '"Saira", serif',
        GAME_TEXT_FONT_SIZE: 50,
    },

    STATE: {
        LOCAL_STORAGE_KEY_HIGH_SCORE: 'highScore',
        LOCAL_STORAGE_KEY_GAME_SPEED: 'gameSpeed',
    },

    ERROR: {
        // ERROR_MESSAGE_DURATION: 5000,
        MESSAGE_FONT: '20px Arial',
        MESSAGE_COLOR: 'red',
        MESSAGE_BACKGROUND: 'rgba(0, 0, 0, 0.7)',
    },
};
