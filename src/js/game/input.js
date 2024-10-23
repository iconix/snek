import { GAME_CONFIG } from '../config';
import { DIRECTION_DOWN, DIRECTION_LEFT, DIRECTION_RIGHT, DIRECTION_UP } from '../direction';
import { calculateMotionControl } from '../motion';

const { INPUT } = GAME_CONFIG;

const SPACE_KEY = 'Space';
const LEFT_KEY = 'ArrowLeft';
const RIGHT_KEY = 'ArrowRight';
const UP_KEY = 'ArrowUp';
const DOWN_KEY = 'ArrowDown';

/**
 * global var to persist permission state across game sessions.
 * possible values: 'unknown', 'requesting', 'granted', 'denied'
 * */
let motionPermissionState = 'unknown';

/**
 * Handles user input for the game.
 */
export class InputHandler {
    /**
     * @param {import('./game').Game} game - game instance
     */
    constructor(game) {
        this._game = game;

        this._touchStart = { x: 0, y: 0 };
        this._touchEnd = { x: 0, y: 0 };
        this._boundMethods = this._bindMethods();

        // TODO: reset on game pause too
        this._initialOrientation = null;
        this._lastOrientation = null;
        this._lastOrientationUpdateTime = 0;
        this._sensitivityMultiplier = 1;
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
            handlePauseClick: this._handlePauseClick.bind(this),
            requestDeviceOrientation: this._requestDeviceOrientation.bind(this),
            enterFullScreen: this._game.board.enterFullScreen.bind(this._game.board),
            handleTouchStart: this._handleTouchStart.bind(this),
            handleTouchEnd: this._handleTouchEnd.bind(this),
            handleRestart: this._handleRestart.bind(this)
        };
    }

    /**
     * Manages all control event listeners for the game.
     * @param {boolean} shouldAdd - if true, adds the event listeners; if false, removes them.
     */
    manageGameControls(shouldAdd) {
        this._manageKeyboardControls(shouldAdd);
        this._manageMotionControls(shouldAdd);
        this._manageTouchControls(shouldAdd);
        this._manageClickControls(shouldAdd);
        this._manageVisibilityControl(shouldAdd);
    }

    /**
     * Manages controls for restarting the game.
     * @param {boolean} shouldAdd - if true, adds the event listeners; if false, removes them.
     */
    manageRestartControls(shouldAdd) {
        const action = shouldAdd ? 'addEventListener' : 'removeEventListener';
        if (shouldAdd && !this._game.motionControl.active) {
            // remove existing keyboard listener to avoid conflicts with new restart controls
            document.removeEventListener('keydown', this._boundMethods.handleKeyInput);
        }
        document[action]('keydown', this._boundMethods.handleRestart);
        document[action]('click', this._boundMethods.handleRestart);
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
     * Manages click control event listeners for the game.
     * @param {boolean} shouldAdd - if true, adds the event listeners; if false, removes them.
     * @private
     */
    _manageClickControls(shouldAdd) {
        const action = shouldAdd ? 'addEventListener' : 'removeEventListener';
        document[action]('click', this._boundMethods.handlePauseClick);
        document[action]('dblclick', this._boundMethods.enterFullScreen);
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
     * Set up motion control event listeners for the game, if available.
     * @param {boolean} shouldAdd - if true, adds the event listeners; if false, removes them.
     * @private
     */
    _manageMotionControls(shouldAdd) {
        if (typeof DeviceOrientationEvent === 'undefined') return;
        shouldAdd ? this._listenToDeviceOrientation() : window.removeEventListener('deviceorientation', this._boundMethods.handleDeviceMovement);
    }

    /**
     * Checks if device orientation events are supported and sets up the appropriate listeners or permission requests.
     * If permission is required (e.g., on iOS 13+), it creates a button for the user to request permission.
     * If permission is already granted or not required, it activates motion control immediately.
     * @private
     */
    _listenToDeviceOrientation() {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            if (motionPermissionState === 'granted') {
                this._activateMotionControl();
            } else {
                this._createMotionRequestButton();
            }
        } else {
            window.addEventListener('deviceorientation', this._boundMethods.handleDeviceMovement);
        }
    }

    _createMotionRequestButton() {
        let btn = this._game.board.createMotionRequestButton();
        if (btn) {
            btn.classList.add('show');
            btn.addEventListener('click', this._boundMethods.requestDeviceOrientation);

            // give user time to grant permission
            if (!this._game.state.paused) {
                this._game.togglePause();
            }

            motionPermissionState = 'requesting';
        }
    }

    /**
     * Handles keyboard input.
     * @param {KeyboardEvent} event - keyboard event
     * @private
     */
    _handleKeyInput(event) {
        const keyCommands = {
            [LEFT_KEY]: () => this._game.snake.changeDirection(DIRECTION_LEFT),
            [RIGHT_KEY]: () => this._game.snake.changeDirection(DIRECTION_RIGHT),
            [UP_KEY]: () => this._game.snake.changeDirection(DIRECTION_UP),
            [DOWN_KEY]: () => this._game.snake.changeDirection(DIRECTION_DOWN),
            [SPACE_KEY]: () => this._game.togglePause(),
        };

        const commandFn = keyCommands[event.code];
        if (commandFn) {
            if (this._game.motionControl.active === null) {
                console.log('key controls activated');
            }

            // disable motion control when keyboard is used
            // (having both keyboard and motion event listeners makes the game less responsive)
            this._deactivateMotionControl();

            commandFn();
        }
    }

    /**
     * Handles click events for pausing the game.
     * Disallows pause clicks while the game is requesting motion permission.
     * @param {MouseEvent} event - The click event object
     * @private
     */
    _handlePauseClick(event) {
        if (motionPermissionState !== 'requesting') {
            this._game.togglePause();
        }
    }

    /**
     * Handles restart events triggered by key press, click, or touch.
     * @param {KeyboardEvent | MouseEvent | TouchEvent} event - event object
     */
    _handleRestart(event) {
        if ((event instanceof KeyboardEvent && event.code === SPACE_KEY) ||
            event.type === 'click' ||
            event.type === 'touchend') {
            this._game.restart();
        }
    }

    /**
     * Handles device motion input.
     * @param {DeviceOrientationEvent} event - device orientation event
     * @private
     */
    _handleDeviceMovement(event) {
        const currentUpdateTime = Date.now();
        const currentOrientation = {
            beta: event.beta || 0,
            gamma: event.gamma || 0
        }

        if (!this._initialOrientation) {
            this._initialOrientation = { ...currentOrientation };
            this._lastOrientation = { ...currentOrientation };
            // update the game's motion control state with initial orientation
            this._game.updateMotionControl(currentOrientation, null, this._sensitivityMultiplier);
            return;
        }

        const { direction, sensitivity } = calculateMotionControl(
            currentOrientation,
            this._lastOrientation,
            currentUpdateTime,
            this._lastOrientationUpdateTime
        );

        this._sensitivityMultiplier = sensitivity;

        if (direction) {
            // used to determine when to switch from keyboard to motion controls
            if (this._game.motionControl.active === null) {
                this._activateMotionControl();
            }

            this._game.snake.changeDirection(direction);
            this._lastOrientationUpdateTime = currentUpdateTime;
            this._lastOrientation = currentOrientation;
        }

        this._game.updateMotionControl(
            currentOrientation,
            this._game.snake.getCurrentDirection(),
            this._sensitivityMultiplier
        );
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
     * Handles the touch start event.
     * Records the initial Y position of the touch.
     * @param {TouchEvent} event - touch start event
     * @private
     */
    _handleTouchStart(event) {
        event.preventDefault();

        const firstTouch = event.changedTouches[0];
        // console.log({
        //     [ev.type]: (firstTouch.screenX, firstTouch.screenY)
        // });

        this._touchStart = { x: firstTouch.screenX, y: firstTouch.screenY };
    }

    /**
     * Handles the touch end event.
     * Records the final Y position of the touch and calls handleSwipeGesture.
     * @param {TouchEvent} event - touch end event
     * @private
     */
    _handleTouchEnd(event) {
        event.preventDefault();

        const firstTouch = event.changedTouches[0];
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
        const verticalSwipe = this._touchStart.y - this._touchEnd.y;
        if (verticalSwipe > INPUT.SWIPE_SENSITIVITY) {
            // console.log(`swiped UP ${downY-upY}px`);
            this._game.board.enterFullScreen();
        } else if (verticalSwipe < -INPUT.SWIPE_SENSITIVITY) {
            // console.log(`swiped DOWN ${upY-downY}px`);
            this._game.board.exitFullScreen();
        } else if (this._game.state.ended) {
            this._game.restart();
        } else if (motionPermissionState !== 'requesting') {
            // console.log(`togglePause from handleGesture`);
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
            .then(state => {
                motionPermissionState = state;
                if (state === 'granted') {
                    this._activateMotionControl();
                    if (this._game.state.paused) {
                        this._game.togglePause();
                    }
                } else {
                    console.log('motion permission denied');
                }
            })
            .catch(console.error)
            .finally(() => {
                this._game.board.removeMotionRequestButton();
            });
    }

    /**
     * Enables motion control for the game.
     * @private
     */
    _activateMotionControl() {
        document.removeEventListener('keydown', this._boundMethods.handleKeyInput);
        window.addEventListener('deviceorientation', this._boundMethods.handleDeviceMovement);

        this._game.board.removeMotionRequestButton();
        this._game.activateMotionControl();

        console.log('motion controls activated');
    }

    /**
     * Disables motion control for the game.
     * @private
     */
    _deactivateMotionControl() {
        this._game.board.removeMotionRequestButton();
        window.removeEventListener('deviceorientation', this._handleDeviceMovement);
        this._game.deactivateMotionControl();
    }

    /**
     * Logs debug information about the current state of motion controls.
     * This method is intended to be called periodically (e.g., in the game loop)
     * to provide ongoing insight into the motion control system's state.
     * @private
     */
    _debugMotionControl() {
        console.log('motion control debug info', {
            motionControlActive: this._game.motionControl.active,
            motionPermissionState: motionPermissionState,
            deviceOrientation: this._lastOrientation,
            isChangingDirection: this._game.snake._isChangingDirection,
            snakeDirection: this._game.snake.getCurrentDirection()
        });
    }

    /**
     * Simulates the presence of the DeviceOrientationEvent.requestPermission API.
     * This method is useful for testing or development environments where the actual API might not be available.
     * It creates a mock DeviceOrientationEvent object with a requestPermission method that always resolves to 'granted'.
     * @static
     * @private
     */
    static _simulateDeviceOrientationRequestPermission() {
        // create DeviceOrientationEvent if it doesn't exist
        if (typeof DeviceOrientationEvent === 'undefined') {
            window.DeviceOrientationEvent = {};
        }

        // add requestPermission method
        window.DeviceOrientationEvent.requestPermission = () => {
            return new Promise((resolve) => {
                resolve('granted');
            });
        };

        // modify typeof operator for requestPermission
        Object.defineProperty(Object.prototype, 'requestPermission', {
            value: function() {}
        });
    }
}

// TODO: consider refactoring to use Command interface again if
// key controls AND mouse/touch/motion controls can all use it

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
