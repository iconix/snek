import { GAME_CONFIG } from './config';

const { BOARD } = GAME_CONFIG;

const MOTION_REQUEST_BUTTON_ID = 'motionRequest';

/**
 * Represents the game board.
 */
export class Board {
    /**
     * @param {HTMLCanvasElement} canvas - canvas element for the game
     * @param {HTMLElement | null} ctrlPanel - control panel element
     */
    constructor(canvas, ctrlPanel) {
        this._canvas = canvas;
        this._ctrlPanel = ctrlPanel;

        // 2d drawing context
        if (!(this.ctx = this._canvas.getContext('2d'))) {
            throw new Error('2d context not supported or canvas already initialized');
        }

        this._boardSize = this._calculateBoardSize();

        // handle rendering difference between a standard display vs a HiDPI or Retina display
        this._ratio = window.devicePixelRatio || 1;

        this._sizeCanvas();
        this._sizeControlPanel();

        this._width = canvas.width;
        this._height = canvas.height;
        this._blockSize = canvas.width / BOARD.NUM_STEPS_ACROSS_CANVAS;

        this._activeFilter = BOARD.FILTERS.NONE;
        this._color = BOARD.DEFAULT_BACKGROUND_COLOR;
        this._borderColor = BOARD.DEFAULT_BORDER_COLOR;
        this._isGlowing = false;

        this.resetFilter();

        // console.log({
        //     ratio: this._ratio, 'canvas.style.width': canvas.style.width,
        //     'canvas.style.height': canvas.style.height, 'canvas.width': canvas.width,
        //     'canvas.height': canvas.height, block_size: this._blockSize
        // })
    }

    /**
     * @returns {HTMLCanvasElement}
     */
    get canvas() {
        return this._canvas;
    }

    /**
     * @returns {string}
     */
    get color() {
        return this._color;
    }

    /**
     * @returns {string}
     */
    get borderColor() {
        return this._borderColor;
    }

    /**
     * @returns {boolean}
     */
    get isGlowing() {
        return this._isGlowing;
    }

    /**
     * @returns {string}
     */
    get activeFilter() {
        return this._activeFilter;
    }

    /**
     * @returns {number}
     */
    get width() {
        return this._width;
    }

    /**
     * @returns {number}
     */
    get height() {
        return this._height;
    }

    /**
     * @returns {number}
     */
    get blockSize() {
        return this._blockSize;
    }

    /**
     * @returns {number}
     */
    get ratio() {
        return this._ratio;
    }

    /**
     * Resets the board filter to default.
     */
    resetFilter() {
        this._activeFilter = BOARD.FILTERS.NONE;
    }

    /**
     * Sets the board filter for the end game state.
     */
    setEndGameFilter() {
        this._activeFilter = BOARD.FILTERS.ENDGAME;
    }

    /**
     * Sets the board filter for the paused game state.
     */
    setPauseGameFilter() {
        this._activeFilter = BOARD.FILTERS.PAUSE;
    }

    /**
     * Enters fullscreen mode.
     */
    enterFullScreen() {
        // switch to full screen
        this._canvas.requestFullscreen().then(function () {
            try {
                // lock portrait orientation when going full screen
                // @ts-ignore
                screen.lockOrientationUniversal = screen.lockOrientation ||
                    // @ts-ignore
                    screen.mozLockOrientation ||
                    // @ts-ignore
                    screen.msLockOrientation;
                // @ts-ignore
                screen.lockOrientationUniversal('portrait-primary');
            } catch (e) {
                // console.log(e);
            }
        });
    }

    /**
     * Exits fullscreen mode.
     */
    exitFullScreen() {
        document.exitFullscreen();
    }

    /**
     * Creates a button in control panel to request motion control permission.
     * If the button already exists, it returns the existing button.
     * @returns {HTMLButtonElement | null} created button, or null if control panel does not exist
     */
    createMotionRequestButton() {
        if (!this._ctrlPanel) return null;

        let existingBtn = this.getMotionRequestButton();
        if (existingBtn) return existingBtn;

        let btn = document.createElement('button');
        btn.innerHTML = 'Allow Motion Control';
        btn.setAttribute('id', MOTION_REQUEST_BUTTON_ID);
        btn.type = 'button';
        this._ctrlPanel.appendChild(btn);
        return btn;
    }

    /**
     * Gets the motion control request button.
     * @returns {HTMLButtonElement | null} motion request button if it exists; otherwise null
     */
    getMotionRequestButton() {
        const element = document.getElementById(MOTION_REQUEST_BUTTON_ID);
        return element instanceof HTMLButtonElement ? element : null;
    }

    /**
     * Removes the motion control request button.
     */
    removeMotionRequestButton() {
        let btn = this.getMotionRequestButton();
        btn?.parentNode?.removeChild(btn);
    }

    /**
     * Sets the glow effect on the board.
     * @param {boolean} shouldGlow - whether the board should glow
     */
    setGlow(shouldGlow) {
        if (shouldGlow === this.isGlowing) return;

        this._isGlowing = shouldGlow;

        if (shouldGlow) {
            // note: since canvas border doesn't show in fullscreen mode, we tint the background too
            this._color = BOARD.TELEPORT_BACKGROUND_COLOR;
            this._borderColor = BOARD.TELEPORT_BORDER_COLOR;
        } else {
            this._color = BOARD.DEFAULT_BACKGROUND_COLOR;
            this._borderColor = BOARD.DEFAULT_BORDER_COLOR;
        }

        // console.log(`[board] shouldGlow: ${shouldGlow}; borderColor: ${this.borderColor}; isGlowing: ${this.isGlowing}`);
    }

    /**
     * Checks if the game needs permission for motion control.
     * @returns {boolean} true if permission is needed; false otherwise
     */
    needsPermission() {
        return document.getElementById(MOTION_REQUEST_BUTTON_ID) !== null;
    }

    /**
     * Calculates the size of the game board.
     * @returns {number} The calculated board size.
     * @private
     */
    _calculateBoardSize() {
        // calculate a square board size based on window dimensions and total # of steps across the canvas
        const availableSpace = Math.min(window.innerWidth, window.innerHeight) - BOARD.CTRL_PANEL_HEIGHT;
        const gridBlockSize = availableSpace / BOARD.NUM_STEPS_ACROSS_CANVAS;  // find closest number divisible by steps
        const boardSize = Math.floor(gridBlockSize) * BOARD.NUM_STEPS_ACROSS_CANVAS - BOARD.MARGIN_SIZE;

        // TODO: could implement like below instead - if willing to implement resizing
        // const maxWidth = window.innerWidth - MARGIN_SIZE;
        // const maxHeight = window.innerHeight - CTRL_PANEL_HEIGHT - MARGIN_SIZE;
        // const boardSize = Math.min(maxWidth, maxHeight);

        return boardSize;
    }

    /**
     * Sets the size of the canvas.
     * @private
     */
    _sizeCanvas() {
        this._canvas.style.width = this._boardSize + 'px';
        this._canvas.style.height = this._boardSize + 'px';
        this._canvas.width = this._boardSize * this._ratio;
        this._canvas.height = this._canvas.width;
    }

    /**
     * Sets the size of the control panel.
     * @private
     */
    _sizeControlPanel() {
        if (!this._ctrlPanel) return;
        this._ctrlPanel.style.width = this._boardSize + 'px';
        this._ctrlPanel.style.height = BOARD.CTRL_PANEL_HEIGHT + 'px';
    }
}
