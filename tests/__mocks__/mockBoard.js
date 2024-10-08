import { Board } from '../../src/js/board';
import { GAME_CONFIG } from '../../src/js/config';

const { BOARD } = GAME_CONFIG;

export class MockBoard extends Board {
    constructor() {
        let canvas = document.createElement('canvas');
        let ctrlPanel = document.createElement('div');

        super(canvas, ctrlPanel);

        this._canvas = canvas;
        this._ctrlPanel = ctrlPanel;

        if (!(this.ctx = this._canvas.getContext('2d'))) {
            throw new Error('2d context not supported or canvas already initialized');
        }
        this._boardSize = 300;
        this._ratio = 1;
        this._width = 300;
        this._height = 300;
        this._blockSize = 10;
        this._activeFilter = BOARD.FILTERS.NONE;
        this._color = BOARD.DEFAULT_BACKGROUND_COLOR;
        this._borderColor = BOARD.DEFAULT_BORDER_COLOR;
        this._isGlowing = false;
    }

    get canvas() { return this._canvas; }
    get color() { return this._color; }
    get borderColor() { return this._borderColor; }
    get isGlowing() { return this._isGlowing; }
    get activeFilter() { return this._activeFilter; }
    get width() { return this._width; }
    get height() { return this._height; }
    get blockSize() { return this._blockSize; }
    get ratio() { return this._ratio; }

    resetFilter() { this._activeFilter = BOARD.FILTERS.NONE; }
    setEndGameFilter() { this._activeFilter = BOARD.FILTERS.ENDGAME; }
    setPauseGameFilter() { this._activeFilter = BOARD.FILTERS.PAUSE; }
    enterFullScreen() { /* mock implementation */ }
    exitFullScreen() { /* mock implementation */ }
    createMotionRequestButton() { return document.createElement('button'); }
    getMotionRequestButton() {
        const element = document.getElementById('motionRequest');
        return element instanceof HTMLButtonElement ? element : null;
    }
    removeMotionRequestButton() { /* mock implementation */ }
    setGlow(shouldGlow) {
        this._isGlowing = shouldGlow;
        if (shouldGlow) {
            this._color = BOARD.TELEPORT_BACKGROUND_COLOR;
            this._borderColor = BOARD.TELEPORT_BORDER_COLOR;
        } else {
            this._color = BOARD.DEFAULT_BACKGROUND_COLOR;
            this._borderColor = BOARD.DEFAULT_BORDER_COLOR;
        }
    }
    needsPermission() { return false; }
}
