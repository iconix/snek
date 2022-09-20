const CTRL_PANEL_HEIGHT = 50;  // pixels
const NUM_STEPS_ACROSS_CANVAS = 30;

const NO_FILTER = 'none';
const PAUSE_FILTER = 'contrast(1.4) sepia(1)';
const ENDGAME_FILTER = 'grayscale(0.8) blur(0.5px)';

const MOTION_REQUEST_BUTTON_ID = 'motionRequest';

export class Board {
    constructor(canvas, ctrlPanel) {
        this._canvas = canvas;
        this._ctrlPanel = ctrlPanel;

        // 2d drawing context
        this.ctx = this._canvas.getContext('2d');

        this._boardSize = this._calculateBoardSize();

        // handle rendering difference between a standard display vs a HiDPI or Retina display
        this._ratio = window.devicePixelRatio || 1;

        this._sizeCanvas();
        this._sizeControlPanel();

        this._width = canvas.width;
        this._height = canvas.height;
        this._blockSize = canvas.width / NUM_STEPS_ACROSS_CANVAS;

        this.resetFilter();

        // console.log({
        //     ratio: this._ratio, 'canvas.style.width': canvas.style.width,
        //     'canvas.style.height': canvas.style.height, 'canvas.width': canvas.width,
        //     'canvas.height': canvas.height, block_size: this._blockSize
        // })
    }

    get canvas() {
        return this._canvas;
    }

    get activeFilter() {
        return this._activeFilter;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    get blockSize() {
        return this._blockSize;
    }

    get ratio() {
        return this._ratio;
    }

    resetFilter() {
        this._activeFilter = NO_FILTER;
    }

    setEndGameFilter() {
        this._activeFilter = ENDGAME_FILTER;
    }

    setPauseGameFilter() {
        this._activeFilter = PAUSE_FILTER;
    }

    enterFullScreen() {
        // switch to full screen
        this._canvas.requestFullscreen().then(function () {
            try {
                // lock portrait orientation when going full screen
                screen.lockOrientationUniversal = screen.lockOrientation ||
                    screen.mozLockOrientation ||
                    screen.msLockOrientation;
                screen.lockOrientationUniversal('portrait-primary');
            } catch (e) {
                // console.log(e);
            }
        });
    }

    exitFullScreen() {
        document.exitFullscreen();
    }

    createMotionRequestBtn() {
        let btn = document.createElement('button');
        btn.innerHTML = 'Allow Motion Control';
        btn.setAttribute('id', MOTION_REQUEST_BUTTON_ID);
        btn.type = 'button';
        self._ctrlPanel.appendChild(btn);
        return btn;
    }

    removeMotionRequestBtn() {
        let btn = document.getElementById(MOTION_REQUEST_BUTTON_ID);
        if (btn) {
            btn.parentNode.removeChild(btn);
        }
    }

    needsPermission() {
        return document.getElementById(MOTION_REQUEST_BUTTON_ID) !== null;
    }

    addTouchHandlers(handleTouchStart, handleTouchEnd) {
        this._canvas.addEventListener('touchstart', handleTouchStart);
        this._canvas.addEventListener('touchend', handleTouchEnd);
    }

    _calculateBoardSize() {
        // take the min(width, height), find closest number divisible by desired # of total steps across the canvas,
        // and use this as the width + height of the square canvas
        let rawSize = Math.min(window.innerWidth, window.innerHeight) - CTRL_PANEL_HEIGHT;
        let quotient = parseInt(rawSize / NUM_STEPS_ACROSS_CANVAS);

        // subtracting NUM_STEPS_ACROSS_CANVAS below to allow some whitespace around the game canvas
        return quotient * NUM_STEPS_ACROSS_CANVAS - NUM_STEPS_ACROSS_CANVAS;
    }

    _sizeCanvas() {
        this._canvas.style.width = this._boardSize + 'px';
        this._canvas.style.height = this._boardSize + 'px';
        this._canvas.width = this._boardSize * this._ratio;
        this._canvas.height = this._canvas.width;
    }

    _sizeControlPanel() {
        this._ctrlPanel.style.width = this._boardSize + 'px';
        this._ctrlPanel.style.height = CTRL_PANEL_HEIGHT + 'px';
        this._ctrlPanel.width = this._boardSize * this._ratio;
        this._ctrlPanel.height = CTRL_PANEL_HEIGHT * this._ratio;
    }
}
