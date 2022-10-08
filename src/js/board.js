const CTRL_PANEL_HEIGHT = 50;  // pixels
const NUM_STEPS_ACROSS_CANVAS = 30;

const DEFAULT_BACKGROUND_COLOR = 'white';
const DEFAULT_BORDER_COLOR = 'darkgreen';
const TELEPORT_BORDER_COLOR = 'blue';
const TELEPORT_BACKGROUND_COLOR = '#e2f1fa';  // a light blue

const NO_FILTER = 'none';
const PAUSE_FILTER = 'contrast(1.4) sepia(1)';
const ENDGAME_FILTER = 'grayscale(0.8) blur(0.5px)';

const MOTION_REQUEST_BUTTON_ID = 'motionRequest';

export class Board {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {HTMLElement} ctrlPanel
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
        this._blockSize = canvas.width / NUM_STEPS_ACROSS_CANVAS;

        this._activeFilter = NO_FILTER;
        this._color = DEFAULT_BACKGROUND_COLOR;
        this._borderColor = DEFAULT_BORDER_COLOR;
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
     * @returns {void}
     */
    resetFilter() {
        this._activeFilter = NO_FILTER;
    }

    /**
     * @returns {void}
     */
    setEndGameFilter() {
        this._activeFilter = ENDGAME_FILTER;
    }

    /**
     * @returns {void}
     */
    setPauseGameFilter() {
        this._activeFilter = PAUSE_FILTER;
    }

    /**
     * @returns {void}
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
     * @returns {void}
     */
    exitFullScreen() {
        document.exitFullscreen();
    }

    /**
     * @returns {HTMLButtonElement}
     */
    createMotionRequestBtn() {
        let btn = document.createElement('button');
        btn.innerHTML = 'Allow Motion Control';
        btn.setAttribute('id', MOTION_REQUEST_BUTTON_ID);
        btn.type = 'button';
        this._ctrlPanel.appendChild(btn);
        return btn;
    }

    /**
     * @returns {void}
     */
    removeMotionRequestBtn() {
        let btn = document.getElementById(MOTION_REQUEST_BUTTON_ID);
        btn?.parentNode?.removeChild(btn);
    }

    /**
     * @param {boolean} shouldGlow
     * @returns {void}
     */
    setGlow(shouldGlow) {
        if (shouldGlow && !this._isGlowing) {
            // n.b., since canvas border doesn't show in fullscreen mode, we tint the background too
            this._color = TELEPORT_BACKGROUND_COLOR;
            this._borderColor = TELEPORT_BORDER_COLOR;
            this._isGlowing = true;
            // console.log(`[board] shouldGlow: ${shouldGlow}; borderColor: ${this.borderColor}; isGlowing: ${this.isGlowing}`);
        }

        if (!shouldGlow && this._isGlowing) {
            this._color = DEFAULT_BACKGROUND_COLOR;
            this._borderColor = DEFAULT_BORDER_COLOR;
            this._isGlowing = false;
            // console.log(`[board] shouldGlow: ${shouldGlow}; borderColor: ${this.borderColor}; isGlowing: ${this.isGlowing}`);
        }
    }

    /**
     * @returns {boolean}
     */
    needsPermission() {
        return document.getElementById(MOTION_REQUEST_BUTTON_ID) !== null;
    }

    /**
     * @param {{ (this: HTMLCanvasElement, ev: TouchEvent): void; }} handleTouchStart
     * @param {{ (this: HTMLCanvasElement, ev: TouchEvent): void; }} handleTouchEnd
     * @returns {void}
     */
    addTouchHandlers(handleTouchStart, handleTouchEnd) {
        this._handleTouchStart = handleTouchStart;
        this._handleTouchEnd = handleTouchEnd;

        this._canvas.addEventListener('touchstart', handleTouchStart);
        this._canvas.addEventListener('touchend', handleTouchEnd);
    }

    /**
     * @returns {void}
     */
    removeTouchHandlers() {
        if (this._handleTouchStart) this._canvas.removeEventListener('touchstart', this._handleTouchStart);
        if (this._handleTouchEnd) this._canvas.removeEventListener('touchend', this._handleTouchEnd);
    }

    /**
     * @returns {number}
     */
    _calculateBoardSize() {
        // take the min(width, height), find closest number divisible by desired # of total steps across the canvas,
        // and use this as the width + height of the square canvas
        let rawSize = Math.min(window.innerWidth, window.innerHeight) - CTRL_PANEL_HEIGHT;
        let quotient = rawSize / NUM_STEPS_ACROSS_CANVAS;

        // subtracting NUM_STEPS_ACROSS_CANVAS below to allow some whitespace around the game canvas
        return quotient * NUM_STEPS_ACROSS_CANVAS - NUM_STEPS_ACROSS_CANVAS;
    }

    /**
     * @returns {void}
     */
    _sizeCanvas() {
        this._canvas.style.width = this._boardSize + 'px';
        this._canvas.style.height = this._boardSize + 'px';
        this._canvas.width = this._boardSize * this._ratio;
        this._canvas.height = this._canvas.width;
    }

    /**
     * @returns {void}
     */
    _sizeControlPanel() {
        this._ctrlPanel.style.width = this._boardSize + 'px';
        this._ctrlPanel.style.height = CTRL_PANEL_HEIGHT + 'px';
    }
}
