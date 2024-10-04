import { Board } from '../board';
import { GAME_CONFIG } from '../config';
import { displayErrorMessage } from '../error';
import { Food, Item, Phase, TELEPORT_CLASSNAME, Teleport, selectRandomItem } from '../item';
import { Snake } from '../snake';
import { InputHandler } from './input';
import { renderGame, renderGameOver } from './render';
import { GameState } from './state';

const { GAME } = GAME_CONFIG;

const CANVAS_ID = 'gameCanvas';
const CONTROL_PANEL_ID = 'controlPanel';

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

        console.log(`game over - final score: ${this.state.score}`);
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
        console.warn(`control panel element with id '${CONTROL_PANEL_ID}' not found. proceeding without control panel.`);
    }

    let board = new Board(canvas, ctrl_panel);

    return board;
}
