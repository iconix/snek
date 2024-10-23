import { Board } from '../board';
import { GAME_CONFIG } from '../config';
import { displayErrorMessage } from '../error';
import { Food, Item, Phase, TELEPORT_CLASSNAME, Teleport, selectRandomItem } from '../item';
import { MotionControlIndicator } from '../motion';
import { Snake } from '../snake';
import { InputHandler } from './input';
import { renderGame, renderGameOver } from './render';
import { GameState } from './state';

const { GAME } = GAME_CONFIG;

const CANVAS_ID = 'gameCanvas';
const CONTROL_PANEL_ID = 'controlPanel';
const MOTION_INDICATOR_ID = 'motionIndicator';

/**
 * global var to persist indicator visibility across game sessions.
 * */
let motionIndicatorVisible = false;

/**
 * Represents the main game logic and state.
 */
export class Game {

    /**
     * @param {Board} board - game board
     * @param {Snake} snake - snek
     * @param {Item} item - current game item
     */
    constructor(board, snake, item) {
        this.board = board;
        this.snake = snake;
        this.item = item;

        this.state = new GameState();
        this.input = new InputHandler(this);

        this._lastUpdateTimestamp = 0;

        /**
         * @type {{
        *   active: boolean | null,
        *   orientation: { beta: number, gamma: number },
        *   direction: string | null,
        *   indicatorVisible: boolean,
        * }}
        */
        this.motionControl = {
            active: null,
            orientation: { beta: 0, gamma: 0 },
            direction: null,
            indicatorVisible: motionIndicatorVisible,
            // sensitivity: 1
        };

        this._boundMethods = {
            handleClearHighScore: this._handleClearHighScore.bind(this),
            handleToggleMotionIndicator: this._handleToggleMotionIndicator.bind(this)
        };

        this._initializeUI();
    }

    /**
     * Runs the game loop.
     * @param {DOMHighResTimeStamp} now - current timestamp
     */
    run(now) {
        if (this._shouldUpdateFrame(now)) {
            this._updateFrame();
            if (this.state._ended) {
                renderGameOver(this);
                return;
            } else {
                renderGame(this);
            }
        }

        // run game loop again
        requestAnimationFrame((t) => this.run(t));
    }

    /**
     * Toggles pause state of the game.
     */
    togglePause() {
        this.state.togglePause();

        if (this.state.paused) {
            this.snake.pause();
            this.board.setPauseGameFilter();
        } else {
            this.snake.unpause();
            this.board.resetFilter();
        }

        // TODO: pause/unpause any game sounds
        // this.audio.togglePause();

        console.log(`game ${this.state.paused ? 'paused' : 'resumed'}`);
    }

    /**
     * Restarts the game.
     */
    restart() {
        this.input.manageRestartControls(false);
        this._removeEventListeners();
        console.log('game restarted');
        runGame();
    }

    /**
     * Determines if the current frame of the game loop should be updated.
     * @param {DOMHighResTimeStamp} now - current timestamp
     * @returns {boolean} true if the frame should update; false otherwise
     * @private
     */
    _shouldUpdateFrame(now) {
        if (now - this._lastUpdateTimestamp >= this.state.speed) {
            this._lastUpdateTimestamp = now;
            return true;
        }
        return false;
    }

    /**
     * Updates the current frame based on game logic.
     * This method checks the game state and advances snek as necessary.
     * @private
     */
    _updateFrame() {
        if (this.state.ended) return;
        if (!this.state.paused) {
            this._advanceSnake();
            // TODO: add to control panel
            // this.input._debugMotionControl();
        }
    }

    /**
     * Snek movement, collision, and item consumption logic.
     * @private
     */
    _advanceSnake() {
        let didEatBeforeMove = this.snake.didEat(this.item);

        // move snek, growing if it ate an item
        this.snake.move(didEatBeforeMove);

        if (didEatBeforeMove) {
            console.log(`snek ate item: ${this.item.type.toUpperCase()}`);

            this.state.updateScore(GAME.SCORE_INCREMENT);

            // apply item effects
            this.snake.equip(this.item);

            // update board effects if necessary
            this.board.setGlow(this.snake.powerUps[TELEPORT_CLASSNAME]);

            // generate a new item
            this._generateNewItem();
        } else {
            // optionally regenerate item based on game conditions
            this._maybeRegenerateItem();
        }

        // TODO: add to control panel
        // console.log(`${this.item.type}: ${this.item.x}, ${this.item.y}`);

        if (this._checkCollision()) {
            this._end();
        }
    }

    /**
     * Generates a new item on the board.
     * @private
     */
    _generateNewItem() {
        let itemClass = selectRandomItem(this.state.score, this.snake.powerUps,
            { alwaysReturnItem: true, reducePowerUpProbability: false }
        );
        if (itemClass !== null) {
            this.item = new itemClass(this.board, this.snake);
            console.log(`new item generated: ${this.item.type.toUpperCase()}`);
        }
    }

    /**
     * Possibly regenerates the current item based on game conditions:
     * (1) when the player is already performing well (high score),
     * we make the food volatile, or able to change or disappear, like power-ups are.
     * (2) when there's already a power-up on the board, we reduce the chance of chain-spawning power-ups.
     * @private
     */
    _maybeRegenerateItem() {
        const foodIsVolatile = this.state.score >= GAME.SCORE_THRESHOLD_FOR_VOLATILE_FOOD;
        if (foodIsVolatile || this.item instanceof Teleport || this.item instanceof Phase) {
            let itemClass = selectRandomItem(this.state.score, this.snake.powerUps,
                {alwaysReturnItem: false, reducePowerUpProbability: true}
            );
            if (itemClass !== null) {
                this.item = new itemClass(this.board, this.snake);
                console.log(`item regenerated: ${this.item.type.toUpperCase()}`);
            }
        }
    }

    /**
     * Checks if snek has collided with the board boundaries or itself.
     * @returns {boolean} true if a collision occurred; false otherwise
     * @private
     */
    _checkCollision() {
        // always set game board glow based on whether or not teleport powerup is equipped
        this.board.setGlow(this.snake.powerUps[TELEPORT_CLASSNAME]);
        return this.snake.didCollide(this.board.width, this.board.height, this.board.blockSize);
    }

    /**
     * Ends the game and updates final state.
     * @private
     */
    _end() {
        this.state.endGame();
        this.state.updateHighScore();

        this.input.manageGameControls(false);
        this.input.manageRestartControls(true);

        console.log(`game over - final score: ${this.state.score}; high score: ${this.state.highScore}`);
    }

    /**
     * Resets the high score to zero and logs the change.
     * Updates the game state but does not trigger a re-render.
     * @private
     */
    _clearHighScore() {
        const oldHighScore = this.state.highScore;
        this.state.clearHighScore();
        console.log(`high score cleared. old high score: ${oldHighScore}`);
    }

    /**
     * Updates the motion control state with new orientation and direction values.
     * If motion control is not already active, this will activate it.
     * Also updates the motion indicator UI if it's visible.
     *
     * @param {{ beta: number, gamma: number }} orientation - current device orientation angles
     * @param {string|null} direction - current movement direction of the snake ('left', 'right', 'up', 'down', or null)
     * TODO: sensitivity
     */
    // updateMotionControl(orientation, direction, sensitivity) {
    updateMotionControl(orientation, direction) {
        this.motionControl.orientation = orientation;
        if (direction) {
            this.motionControl.direction = direction;
        }

        if (this.motionControl.active === null) {
            this.activateMotionControl();
        }

        if (this.motionIndicator && this.motionControl.indicatorVisible) {
            // this.motionIndicator.update(orientation, direction, sensitivity);
            this.motionIndicator.update(orientation, direction);
        }
    }

    /**
     * Activates motion controls for the game.
     * Sets the game speed to motion-appropriate speed, shows the motion indicator toggle button,
     * and updates the motion control state to active.
     */
    activateMotionControl() {
        this.motionControl.active = true;
        this.state.setSpeed(GAME.SPEED_MS__MOTION);
        this.board.showMotionIndicatorToggleButton();
        console.log('motion controls activated');
    }

    /**
     * Deactivates motion controls for the game.
     * Hides the motion indicator, resets to default game speed,
     * hides the motion indicator toggle button, and updates the motion control state.
     */
    deactivateMotionControl() {
        this.motionControl.active = false;
        this.motionControl.indicatorVisible = false;
        if (this.motionIndicator) {
            this.motionIndicator.hide();
        }
        this.state.setSpeed(GAME.SPEED_MS__ARROW);
        this.board.hideMotionIndicatorToggleButton();
    }

    // <!-- UI HELPER METHODS BELOW -->
    // <!-- TODO: fully refactor to be in Board instead, without circular dep (GameEngine) ? -->

    /**
     * Initializes all UI components for the game / control panel.
     * Sets up the motion indicator, motion toggle button, and high score clear button.
     * @private
     */
    _initializeUI() {
        this._setupMotionIndicator();
        this._setupMotionToggleButton();
        this._setupClearHighScoreButton();
    }

    /**
     * Sets up the motion control indicator UI component.
     * Creates a new MotionControlIndicator if the required DOM element exists,
     * otherwise logs a warning and continues without the indicator.
     * @private
     */
    _setupMotionIndicator() {
        const motionIndicatorDiv = document.getElementById(MOTION_INDICATOR_ID);
        if (!(motionIndicatorDiv instanceof HTMLDivElement)) {
            console.warn(`Div with id '${MOTION_INDICATOR_ID}' not found. Motion control indicator will not be displayed.`);
            return;
        }

        this.motionIndicator = new MotionControlIndicator(motionIndicatorDiv, {
            showInfo: false,
            position: 'corner'
        });

        if (this.motionControl.indicatorVisible) {
            this.motionIndicator.show();
        } else {
            this.motionIndicator.hide();
        }
        this.board.updateMotionIndicatorToggleButtonTitle(this.motionControl.indicatorVisible);
    }

    /**
     * Sets up the motion indicator toggle button.
     * Creates the button and attaches the toggle event handler.
     * @private
     */
    _setupMotionToggleButton() {
        const toggleButton = this.board.createMotionIndicatorToggleButton();
        if (toggleButton) {
            toggleButton.addEventListener('click', this._boundMethods.handleToggleMotionIndicator);
        }
    }

    /**
     * Sets up the clear high score button.
     * Creates the button and attaches the clear score event handler.
     * @private
     */
    _setupClearHighScoreButton() {
        const clearButton = this.board.createClearHighScoreButton();
        if (clearButton) {
            clearButton.addEventListener('click', this._boundMethods.handleClearHighScore);
        }
    }

    /**
     * Handles toggling the motion indicator's visibility.
     * Prevents default event behavior and propagation, then updates
     * both the indicator's visibility state and the toggle button's title.
     * @private
     * @param {MouseEvent} event - click event object
     */
    _handleToggleMotionIndicator(event) {
        this.motionControl.indicatorVisible = !this.motionControl.indicatorVisible;
        motionIndicatorVisible = this.motionControl.indicatorVisible;

        event.preventDefault();
        event.stopPropagation();

        if (this.motionIndicator && this.motionControl.indicatorVisible) {
            this.motionIndicator.show();
        } else if (this.motionIndicator) {
            this.motionIndicator.hide();
        }
        this.board.updateMotionIndicatorToggleButtonTitle(this.motionControl.indicatorVisible);
    }

    /**
     * Handles clearing the high score.
     * Prevents default event behavior and propagation, then clears the high score.
     * @private
     * @param {MouseEvent} event - click event object
     */
    _handleClearHighScore(event) {
        event.preventDefault();
        event.stopPropagation();
        this._clearHighScore();
    }

    /**
     * Removes all event listeners added during game initialization.
     * @private
     */
    _removeEventListeners() {
        const clearButton = this.board.getClearHighScoreButton();
        if (clearButton) {
            clearButton.removeEventListener('click', this._boundMethods.handleClearHighScore);
        }

        const toggleButton = this.board.getMotionIndicatorToggleButton();
        if (toggleButton) {
            toggleButton.removeEventListener('click', this._boundMethods.handleToggleMotionIndicator);
        }
    }
}

// <!-- GAME EXECUTION HELPERS BELOW -->

/**
 * Initializes and runs the game.
 */
export function runGame() {
    try {
        let board = _initBoard();
        let snake = new Snake(board.height, board.height, board.blockSize);
        let food = new Food(board, snake);
        let game = new Game(board, snake, food);

        game.input.manageGameControls(true);

        requestAnimationFrame((t) => game.run(t));
    } catch (error) {
        console.error('failed to initialize game:', error);
        // display an error message to the user
        displayErrorMessage('Failed to start the game. Please refresh the page and try again.', document.getElementById(CANVAS_ID));
    }
}

/**
 * Initializes the game board.
 * @returns {Board} initialized game board
 * @throws {Error} ff the canvas element is not found or is not an HTMLCanvasElement
 * @private
 */
function _initBoard() {
    let canvas, ctrl_panel;
    if (!(canvas = document.getElementById(CANVAS_ID))) {
        throw new Error(`HTML canvas with id '${CANVAS_ID}' not found`);
    }
    if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error(`#${CANVAS_ID} element is not an HTML canvas`);
    }
    if (!(ctrl_panel = document.getElementById(CONTROL_PANEL_ID))) {
        console.warn(`control panel element with id '${CONTROL_PANEL_ID}' not found`);
    }
    if (!(ctrl_panel instanceof HTMLDivElement)) {
        console.warn(`#${CONTROL_PANEL_ID} element is not a div`);
        ctrl_panel = null;
    }
    if (ctrl_panel === null) {
        console.warn('proceeding without control panel')
    }

    let board = new Board(canvas, ctrl_panel);

    return board;
}
