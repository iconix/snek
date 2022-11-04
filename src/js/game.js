import { drawGame, drawGameEnd, drawHighScore, drawItem, drawScore, drawSnake } from './canvas.js';
import { Board } from './board.js';
import { Food, Item, Phase, randomizeItem, Teleport } from './item.js';
import { Snake, LEFT_KEY, RIGHT_KEY, UP_KEY, DOWN_KEY } from './snake.js';

const CANVAS_ID = 'gameCanvas';
const CONTROL_PANEL_ID = 'controlPanel';

const GAME_SPEED__ARROW = 100;  // milliseconds
const GAME_SPEED__MOTION = 125; // milliseconds, slow down game since harder with motion controls
const SWIPE_SENSITIVITY = 10;  // delta of pixels needed to consider touch mvmt a 'swipe'
const MOTION_SENSITIVITY = 15;  // degree of motion needed to consider a device mvmt as intentional

const SCORE_INCREMENT = 10;
const FOOD_STABILITY_SCORE_THRESHOLD = 100;

const SPACE_KEY = 'Space';
const KEY_CONTROLS = new Set([LEFT_KEY, RIGHT_KEY, UP_KEY, DOWN_KEY, SPACE_KEY]);

export class Game {
    /**
     * @param {Board} board
     * @param {Snake} snake
     * @param {Item} item
     * @param {number} speed
     */
    constructor(board, snake, item, speed) {
        this._board = board;
        this._snake = snake;
        this._item = item;

        this._score = 0;
        this._highScore = parseInt(localStorage.getItem('highScore') || '0');

        this._paused = false;
        this._ended = false;

        this._speed = parseInt(localStorage.getItem('gameSpeed') || speed.toString());

        this._motionAvailable = null;
        this._lastBeta = 0;
        this._lastGamma = 0;

        this._setupControls();
    }

    /**
     * @returns {Board}
     */
    get board() {
        return this._board;
    }

    /**
     * @returns {Snake}
     */
    get snake() {
        return this._snake;
    }

    /**
     * @returns {Item}
     */
    get item() {
        return this._item;
    }

    /**
     * @returns {number}
     */
    get speed() {
        return this._speed;
    }

    /**
     * @returns {number}
     */
    get score() {
        return this._score;
    }

    /**
     * @returns {number}
     */
    get highScore() {
        return this._highScore;
    }

    /**
     * @returns {boolean}
     */
    get paused() {
        return this._paused;
    }

    /**
     * @returns {void}
     */
    run() {
        if (this._didEnd()) { this._end(); return; }

        let timeout = setTimeout(() => {
            this._snake.isChangingDirection = false;

            drawGame(this);
            drawScore(this._score, this._board);
            drawHighScore(this._highScore, this._board);
            drawItem(this._item, this._board);
            if (!this._paused) {
                //console.log(`paused: ${this._paused}. advancing...`);
                this._advanceSnake();
            }
            drawSnake(this._snake, this._board);

            // run game loop again
            this.run();
        }, this._speed);

        if (!this._timeout) this._timeout = timeout;
    }

    /**
     * @returns {void}
     */
    _advanceSnake() {
        this._snake.advanceHead();

        if (this._snake.didEat(this._item)) {
            this._score += SCORE_INCREMENT;

            this._snake.equip(this._item);

            this._board.setGlow(this._snake.powerUps[Teleport]);

            let itemClass = randomizeItem(this._score, this._snake.powerUps, true, false);

            if (itemClass !== null) {
                this._item = new itemClass(this._board, this._snake);
                // console.log(`new ${this._item.fillColor.toUpperCase()} item`);
            }
        } else {
            const foodIsUnstable = this._score >= FOOD_STABILITY_SCORE_THRESHOLD;
            // randomly regenerate item even if it wasn't eaten
            if (foodIsUnstable || this._item instanceof Teleport || this._item instanceof Phase) {
                let itemClass = randomizeItem(this._score, this._snake.powerUps, false, true);
                if (itemClass !== null) {
                    this._item = new itemClass(this._board, this._snake);
                    // console.log(`new ${this._item.fillColor.toUpperCase()} item`);
                }
            }

            this._snake.advanceTail();
        }

        // TODO: add to control panel
        // console.log(`${this._item.type}: ${this._item.x}, ${this._item.y}`);
    }

    /**
     * @returns {boolean}
     */
    _didEnd() {
        const didCollide = this._snake.didCollide(this._board.width, this._board.height, this._board.blockSize);
        this._board.setGlow(this._snake.powerUps[Teleport]);
        return didCollide;
    }

    /**
     * @returns {void}
     */
    _end() {
        this._ended = true;
        this._board.setEndGameFilter();

        drawGame(this);
        drawItem(this._item, this._board);
        drawSnake(this._snake, this._board);

        drawGameEnd(this._board);

        if (this.score > this._highScore) {
            this._highScore = this._score;
            localStorage.setItem('highScore', this._score.toString());
            // TODO: (debug mode) allow clearing the high score
        }

        localStorage.setItem('gameSpeed', this._speed.toString());

        // bind `this` to game in event handler
        this._restart = this._restart.bind(this);

        // allow for game restart
        if (!this._motionAvailable) {
            document.removeEventListener('keydown', this._handleKeyInput);
            document.addEventListener('keydown', this._restart);
        } else {
            // alwways allow restart with space bar
            document.addEventListener('keydown', this._restart);
        }
        document.removeEventListener('click', this._togglePause);
        document.addEventListener('click', this._restart);
    }

    /**
     * @param {KeyboardEvent | MouseEvent | TouchEvent} event
     * @returns {void}
     */
    _restart(event) {
        if ((event instanceof KeyboardEvent && event.code === SPACE_KEY) || event.type === 'click' || event.type === 'touchend') {
            document.removeEventListener('keydown', this._restart);
            document.removeEventListener('click', this._restart);
            this._board.removeTouchHandlers();

            restartGame();
        }
    }

    /**
     * @returns {void}
     */
    _togglePause() {
        this._paused = !this._paused;

        //console.log(`paused: ${this._paused}`);

        if (this._paused) {
            this._snake.pause();
            this._board.setPauseGameFilter();
        } else {
            this._snake.unpause();
            this._board.resetFilter();
        }
    }

    /**
     * @returns {void}
     */
    _setupControls() {
        this._lastBeta = this._lastGamma = 0;

        // bind `this` to game in event handlers
        this._handleDeviceMvmt = this._handleDeviceMvmt.bind(this);
        this._handleKeyInput = this._handleKeyInput.bind(this);
        this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
        this._requestDeviceOrientation = this._requestDeviceOrientation.bind(this);
        this._togglePause = this._togglePause.bind(this);

        // bind `this` to board in event handler
        this._board.enterFullScreen = this._board.enterFullScreen.bind(this._board);

        // call change direction on key press
        document.addEventListener('keydown', this._handleKeyInput);

        // pause game on click or if game becomes hidden
        document.addEventListener('click', this._togglePause);
        document.addEventListener('visibilitychange', this._handleVisibilityChange, false);

        // enter full screen on double click (for devices that support this event)
        document.addEventListener('dblclick', this._board.enterFullScreen);

        // enter full screen on swipe (for touch/mobile devices)
        this._handleSwipeToFullScreen();

        if ( typeof(DeviceOrientationEvent) !== 'undefined' ) {
            // if browser (e.g., iOS safari) requires permission for deviceorientation, request it
            // @ts-ignore
            if ( typeof(DeviceOrientationEvent.requestPermission) === 'function' ) {
                let btn = this._board.createMotionRequestBtn();
                btn.addEventListener('click', this._requestDeviceOrientation);

                // give user time to grant permission
                this._togglePause();
            }
            else {
                window.addEventListener('deviceorientation', this._handleDeviceMvmt);
            }
        }
    }

    /**
     * @param {KeyboardEvent} event
     * @returns {void}
     */
    _handleKeyInput(event) {
        const keyPressed = event.code;

        if (KEY_CONTROLS.has(keyPressed)) {
            if (this._motionAvailable == null && !this._ended) console.log('key controls activated');

            // once user starts using key controls, disable motion control, as having
            // both keyboard and motion event listeners makes the game less responsive
            this._board.removeMotionRequestBtn();
            window.removeEventListener('deviceorientation', this._handleDeviceMvmt);
            this._speed = GAME_SPEED__ARROW;
            this._motionAvailable = false;
        }

        if (keyPressed === SPACE_KEY) {
            this._togglePause();
        }

        this._snake.changeDirectionByKey(keyPressed);
    }

    /**
     * @param {DeviceOrientationEvent} event
     * @returns {void}
     */
    _handleDeviceMvmt(event) {
        // forward (positive) to backward (negative) motion of the device
        const beta = event.beta || 0;
        // right (positive) to left (negative) motion of the device
        const gamma = event.gamma || 0;

        let betaDelta = this._lastBeta - beta;
        let gammaDelta = this._lastGamma - gamma;

        // console.log('deviceorientation', {
        //     beta: event.beta, last_beta: this._lastBeta, beta_delta: betaDelta,
        //     gamma: event.gamma, last_gamma: this._lastGamma, gamma_delta: gammaDelta,
        // });

        if (this._motionAvailable == null && (betaDelta > Math.abs(MOTION_SENSITIVITY) || gammaDelta > Math.abs(MOTION_SENSITIVITY))) {
            // once user starts using motion control, disable keyboard controls, as having
            // both keyboard and motion event listeners makes the game less responsive
            document.removeEventListener('keydown', this._handleKeyInput);

            this._speed = GAME_SPEED__MOTION;
            this._motionAvailable = true;
            console.log('motion controls activated');
        }

        let newMvmt = this._snake.changeDirectionByMvmt(beta, gamma, this._lastBeta, this._lastGamma, MOTION_SENSITIVITY);

        this._lastBeta = newMvmt.newBeta;
        this._lastGamma = newMvmt.newGamma;
    }

    /**
     * @returns {void}
     */
    _handleVisibilityChange() {
        if (document.hidden && !this._paused) {
            this._togglePause();
        }
    }

    /**
     * @returns {void}
     */
    _handleSwipeToFullScreen() {
        let downY = 0;
        let upY = 0;

        let thisGame = this;
        /**
         * @param {TouchEvent} ev
         * @returns {void}
         */
        function handleGesture(ev) {
            if (upY < downY && downY - upY > SWIPE_SENSITIVITY) {
                // console.log(`swiped UP ${downY-upY}px`);
                thisGame._board.enterFullScreen();
            } else if (upY > downY && upY - downY > SWIPE_SENSITIVITY) {
                // console.log(`swiped DOWN ${upY-downY}px`);
                thisGame._board.exitFullScreen();
            } else if (thisGame._ended) {
                thisGame._restart(ev);
            } else {
                // console.log(`togglePause from handleGesture`);
                thisGame._togglePause();
            }
        }

        /**
         * @param {TouchEvent} ev
         * @returns {void}
         */
        function handleTouchStart(ev) {
            ev.preventDefault();

            const firstTouch = ev.changedTouches[0];
            // console.log({
            //     [ev.type]: (firstTouch.screenX, firstTouch.screenY)
            // });
            // downX = firstTouch.screenX;

            downY = firstTouch.screenY;
        }

        /**
         * @param {TouchEvent} ev
         * @returns {void}
         */
        function handleTouchEnd(ev) {
            ev.preventDefault();

            const firstTouch = ev.changedTouches[0];
            // console.log({
            //     [ev.type]: (firstTouch.screenX, firstTouch.screenY)
            // });
            // upX = firstTouch.screenX;

            upY = firstTouch.screenY;

            handleGesture(ev);
        }

        this._board.addTouchHandlers(handleTouchStart, handleTouchEnd);
    }

    /**
     * @returns {void}
     */
    _requestDeviceOrientation() {
        // @ts-ignore
        DeviceOrientationEvent.requestPermission()
            .then( (/** @type {string} @returns {void} */ response) => {
            if ( response === 'granted' ) {
                this._enableMotionControl();
            }
        }).catch( console.error );
    }

    /**
     * disable keyboard, enable motion, remove button,
     * and un-pause game
     * @return {void}
     */
    _enableMotionControl() {
        document.removeEventListener('keydown', this._handleKeyInput);
        window.addEventListener('deviceorientation', this._handleDeviceMvmt);
        this._board.removeMotionRequestBtn();
        this._togglePause();
    }
}

// <!-- GAME EXECUTION HELPERS BELOW -->

/**
 * @returns {Game}
 */
export function initGame() {
    let canvas, ctrl_panel;
    if (!(canvas = document.getElementById(CANVAS_ID))) {
        throw new Error('canvas not found');
    }
    if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error(`#${CANVAS_ID} element is not an HTML canvas`);
    }
    if (!(ctrl_panel = document.getElementById(CONTROL_PANEL_ID))) {
        throw new Error('ctrl panel not found');
    }

    let board = new Board(canvas, ctrl_panel);
    let snake = new Snake(board.height, board.height, board.blockSize);
    let food = new Food(board, snake);

    let game = new Game(board, snake, food, GAME_SPEED__ARROW);

    return game;
}

/**
 * @returns {void}
 */
function restartGame() {
    let game = initGame();
    game.run();
}
