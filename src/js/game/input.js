import { GAME_CONFIG } from '../config';
import { DIRECTION_DOWN, DIRECTION_LEFT, DIRECTION_RIGHT, DIRECTION_UP } from '../direction';

const { INPUT } = GAME_CONFIG;

const SPACE_KEY = 'Space';
const LEFT_KEY = 'ArrowLeft';
const RIGHT_KEY = 'ArrowRight';
const UP_KEY = 'ArrowUp';
const DOWN_KEY = 'ArrowDown';

/**
 * Handles user input for the game.
 */
export class InputHandler {
    /**
     * @param {import('./game').Game} game - game instance
     */
    constructor(game) {
        this._game = game;
        this._motionAvailable = null;
        this._deviceOrientation = {
            beta: 0,  // rotation around x-axis (-180 to 180)
            gamma: 0  // rotation around y-axis (-90 to 90)
        };
        this._touchStart = { x: 0, y: 0 };
        this._touchEnd = { x: 0, y: 0 };
        this._boundMethods = this._bindMethods();
    }

    /**
     * Manages all control event listeners for the game.
     * @param {boolean} shouldAdd - if true, adds the event listeners; if false, removes them.
     */
    manageGameControls(shouldAdd) {
        this._manageKeyboardControls(shouldAdd);
        this._manageTouchControls(shouldAdd);
        this._manageVisibilityControl(shouldAdd);
        this._managePauseControl(shouldAdd);
        this._manageFullscreenControl(shouldAdd);
        this._manageDeviceOrientationControl(shouldAdd);
    }

    /**
     * Manages controls for restarting the game.
     * @param {boolean} shouldAdd - if true, adds the event listeners; if false, removes them.
     */
    manageRestartControls(shouldAdd) {
        const action = shouldAdd ? 'addEventListener' : 'removeEventListener';
        if (shouldAdd && !this._motionAvailable) {
            // remove existing keyboard listener to avoid conflicts with new restart controls
            document.removeEventListener('keydown', this._boundMethods.handleKeyInput);
        }
        document[action]('keydown', this._boundMethods.handleRestart);
        document[action]('click', this._boundMethods.handleRestart);
    }

    /**
     * Creates and returns an object containing all event handler methods bound to the current instance of InputHandler.
     * Ensures they always have the correct `this` context when called, regardless of how they are invoked.
     * @returns {Object} object containing bound method references
     * @private
     */
    _bindMethods() {
        return {
            handleKeyInput: this._handleKeyInput.bind(this),
            handleDeviceMovement: this._handleDeviceMovement.bind(this),
            handleVisibilityChange: this._handleVisibilityChange.bind(this),
            requestDeviceOrientation: this._requestDeviceOrientation.bind(this),
            togglePause: this._game.togglePause.bind(this._game),
            enterFullScreen: this._game.board.enterFullScreen.bind(this._game.board),
            handleTouchStart: this._handleTouchStart.bind(this),
            handleTouchEnd: this._handleTouchEnd.bind(this),
            handleRestart: this._handleRestart.bind(this)
        };
    }

    /**
     * Manages keyboard control event listeners for the game.
     * @param {boolean} shouldAdd - if true, adds the event listeners; if false, removes them.
     * @private
     */
    _manageKeyboardControls(shouldAdd) {
        const action = shouldAdd ? 'addEventListener' : 'removeEventListener';
        document[action]('keydown', this._boundMethods.handleKeyInput);
    }

    /**
     * Manages touch control event listeners for the game.
     * @param {boolean} shouldAdd - if true, adds the event listeners; if false, removes them.
     * @private
     */
    _manageTouchControls(shouldAdd) {
        const action = shouldAdd ? 'addEventListener' : 'removeEventListener';
        this._game.board.canvas[action]('touchstart', this._boundMethods.handleTouchStart);
        this._game.board.canvas[action]('touchend', this._boundMethods.handleTouchEnd);
    }

    /**
     * Set up visibility change control event listeners for the game.
     * @param {boolean} shouldAdd - if true, adds the event listeners; if false, removes them.
     * @private
     */
    _manageVisibilityControl(shouldAdd) {
        const action = shouldAdd ? 'addEventListener' : 'removeEventListener';
        document[action]('visibilitychange', this._boundMethods.handleVisibilityChange, false);
    }

    /**
     * Set up pause control event listeners for the game.
     * @param {boolean} shouldAdd - if true, adds the event listeners; if false, removes them.
     * @private
     */
    _managePauseControl(shouldAdd) {
        const action = shouldAdd ? 'addEventListener' : 'removeEventListener';
        document[action]('click', this._boundMethods.togglePause);
    }

    /**
     * Set up fullscreen control event listeners for the game.
     * @param {boolean} shouldAdd - if true, adds the event listeners; if false, removes them.
     * @private
     */
    _manageFullscreenControl(shouldAdd) {
        const action = shouldAdd ? 'addEventListener' : 'removeEventListener';
        document[action]('dblclick', this._boundMethods.enterFullScreen);
    }

    /**
     * Set up device orientation event listeners for the game, if available.
     * @param {boolean} shouldAdd - if true, adds the event listeners; if false, removes them.
     * @private
     */
    _manageDeviceOrientationControl(shouldAdd) {
        const action = shouldAdd ? 'addEventListener' : 'removeEventListener';

        if (typeof DeviceOrientationEvent !== 'undefined') {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                if (shouldAdd) {
                    let btn = this._game.board.createMotionRequestBtn();
                    if (btn) {
                        btn.addEventListener('click', this._boundMethods.requestDeviceOrientation);

                        // give user time to grant permission
                        this._game.togglePause();
                    }
                } else {
                    let btn = this._game.board.getMotionRequestBtn();
                    if (btn) {
                        btn.removeEventListener('click', this._boundMethods.requestDeviceOrientation);
                    }
                }
            } else {
                window[action]('deviceorientation', this._boundMethods.handleDeviceMovement);
            }
        }
    }

    /**
     * Handles keyboard input.
     * @param {KeyboardEvent} event - keyboard event
     * @private
     */
    _handleKeyInput(event) {
        const keyCommands = {
            [LEFT_KEY]: new MoveCommand(DIRECTION_LEFT),
            [RIGHT_KEY]: new MoveCommand(DIRECTION_RIGHT),
            [UP_KEY]: new MoveCommand(DIRECTION_UP),
            [DOWN_KEY]: new MoveCommand(DIRECTION_DOWN),
            [SPACE_KEY]: new PauseCommand()
        };

        const command = keyCommands[event.code];
        if (command) {
            if (this._motionAvailable === null && !this._game.state._ended) {
                console.log('key controls activated');
            }

            // disable motion control when keyboard is used
            // (having both keyboard and motion event listeners makes the game less responsive)
            this._disableMotionControl();

            command.execute(this._game);
        }
    }

    /**
     * Handles restart events triggered by key press, click, or touch.
     * @param {KeyboardEvent | MouseEvent | TouchEvent} ev - event object
     */
    _handleRestart(ev) {
        if ((ev instanceof KeyboardEvent && ev.code === SPACE_KEY) ||
            ev.type === 'click' ||
            ev.type === 'touchend') {
            this._game.restart();
        }
    }

    /**
     * Handles device motion input.
     * @param {DeviceOrientationEvent} event - device orientation event
     * @private
     */
    _handleDeviceMovement(event) {
        const currentOrientation = {
            beta: event.beta || 0,
            gamma: event.gamma || 0
        }

        const orientationChange = {
            beta: this._deviceOrientation.beta - currentOrientation.beta,
            gamma: this._deviceOrientation.gamma - currentOrientation.gamma
        }

        // check if this is the first significant movement detected
        // used to determine when to switch from keyboard to motion controls
        if (this._motionAvailable === null && this._isSignificantMotion(orientationChange)) {
            this._enableMotionControl();
        }

        const direction = this._getDirectionFromOrientation(orientationChange);
        if (direction) {
            let command = new MoveCommand(direction);
            command.execute(this._game);
            this._deviceOrientation = currentOrientation;
        }
    }

    /**
     * Determines if a change in device orientation is significant enough to trigger a direction change.
     * Filters out small, unintentional device movements so we respond only to deliberate motions.
     * @param {Object} orientationChange - change in device orientation
     * @param {number} orientationChange.beta - change in beta (x-axis rotation) in degrees
     * @param {number} orientationChange.gamma - change in gamma (y-axis rotation) in degrees
     * @returns {boolean} true if the motion is considered significant; false otherwise
     * @private
     */
    _isSignificantMotion(orientationChange) {
        return Math.abs(orientationChange.beta) > INPUT.MOTION_SENSITIVITY ||
               Math.abs(orientationChange.gamma) > INPUT.MOTION_SENSITIVITY;
    }

    /**
     * Determine direction based on orientation change.
     * @param {{ beta: number, gamma: number }} orientationChange - the change in device orientation
     * @returns {string | null} determined direction or null
     * @private
     */
    _getDirectionFromOrientation(orientationChange) {
        if (Math.abs(orientationChange.beta) > Math.abs(orientationChange.gamma)) {
            if (orientationChange.beta < -INPUT.MOTION_SENSITIVITY) {
                return DIRECTION_DOWN;
            } else if (orientationChange.beta > INPUT.MOTION_SENSITIVITY) {
                return DIRECTION_UP;
            }
        } else {
            if (orientationChange.gamma < -INPUT.MOTION_SENSITIVITY) {
                return DIRECTION_RIGHT;
            } else if (orientationChange.gamma > INPUT.MOTION_SENSITIVITY) {
                return DIRECTION_LEFT;
            }
        }
        return null;
    }

    /**
     * Handles visibility change of the document.
     * @private
     */
    _handleVisibilityChange() {
        if (document.hidden && !this._game.state.paused) {
            this._game.togglePause();
        }
    }

    /**
     * Request device orientation permission.
     * @private
     */
    _requestDeviceOrientation() {
        // iOS 13+ requires permission
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    this._enableMotionControl();
                }
            })
            .catch(console.error);
    }

    /**
     * Enables motion control for the game.
     * @private
     */
    _enableMotionControl() {
        document.removeEventListener('keydown', this._boundMethods.handleKeyInput);
        window.addEventListener('deviceorientation', this._boundMethods.handleDeviceMovement);

        this._game.board.removeMotionRequestBtn();
        this._game.state.setSpeed(INPUT.GAME_SPEED__MOTION);
        this._motionAvailable = true;

        console.log('motion controls activated');
    }

    /**
     * Disables motion control for the game.
     * @private
     */
    _disableMotionControl() {
        this._game.board.removeMotionRequestBtn();
        window.removeEventListener('deviceorientation', this._handleDeviceMovement);
        this._game.state.setSpeed(INPUT.GAME_SPEED__ARROW);
        this._motionAvailable = false;
    }

    /**
     * Logs debug information about the current state of motion controls.
     * This method is intended to be called periodically (e.g., in the game loop)
     * to provide ongoing insight into the motion control system's state.
     * @private
     */
    _debugMotionControl() {
        console.log('motion control debug info', {
            motionAvailable: this._motionAvailable,
            deviceOrientation: this._deviceOrientation,
            isChangingDirection: this._game.snake._isChangingDirection,
            snakeDirection: this._game.snake.getCurrentDirection()
        });
    }

    /**
     * Handles the touch start event.
     * Records the initial Y position of the touch.
     * @param {TouchEvent} ev - touch start event
     * @private
     */
    _handleTouchStart(ev) {
        ev.preventDefault();

        const firstTouch = ev.changedTouches[0];
        // console.log({
        //     [ev.type]: (firstTouch.screenX, firstTouch.screenY)
        // });

        this._touchStart = { x: firstTouch.screenX, y: firstTouch.screenY };
    }

    /**
     * Handles the touch end event.
     * Records the final Y position of the touch and calls handleSwipeGesture.
     * @param {TouchEvent} ev - touch end event
     * @private
     */
    _handleTouchEnd(ev) {
        ev.preventDefault();

        const firstTouch = ev.changedTouches[0];
        // console.log({
        //     [ev.type]: (firstTouch.screenX, firstTouch.screenY)
        // });

        this._touchEnd = { x: firstTouch.screenX, y: firstTouch.screenY };

        this._handleSwipeGesture();
    }

    /**
     * Handles the gesture based on the swipe direction.
     * Enters fullscreen on upward swipe, exits fullscreen on downward swipe,
     * restarts the game if it has ended, or toggles pause otherwise.
     * @private
     */
    _handleSwipeGesture() {
        if (this._touchStart.y - this._touchEnd.y > INPUT.SWIPE_SENSITIVITY) {
            // console.log(`swiped UP ${downY-upY}px`);
            this._game.board.enterFullScreen();
        } else if (this._touchEnd.y - this._touchStart.y > INPUT.SWIPE_SENSITIVITY) {
            // console.log(`swiped DOWN ${upY-downY}px`);
            this._game.board.exitFullScreen();
        } else if (this._game.state.ended) {
            this._game.restart();
        } else {
            // console.log(`togglePause from handleGesture`);
            this._game.togglePause();
        }
    }
}

/**
 * Represents a command to pause the game.
 */
class PauseCommand {

    /**
     * Executes the pause command.
     * @param {import('./game').Game} game - game instance
     */
    execute(game) {
        game.togglePause();
    }
}

/**
 * Represents a command to move snek.
 */
class MoveCommand {

    /**
     * @param {string} direction - direction to move
     */
    constructor(direction) {
        this.direction = direction;
    }

    /**
     * Executes the move command.
     * @param {import('./game').Game} game - game instance
     */
    execute(game) {
        game.snake.changeDirection(this.direction);
    }
}
