import { GAME_CONFIG } from '../config';

const { INPUT, STATE } = GAME_CONFIG;

/**
 * Represents the state of the game.
 */
export class GameState {

    constructor() {
        // states
        this._paused = false;
        this._ended = false;

        // values
        this._score = 0;
        this._highScore = this._getItemSafely(STATE.LOCAL_STORAGE_KEY_HIGH_SCORE, 0);
        this._speed = this._getItemSafely(STATE.LOCAL_STORAGE_KEY_GAME_SPEED, INPUT.GAME_SPEED_MS__ARROW);
    }

    /**
     * Gets the speed of the game, aka time between frame updates, in milliseconds.
     * @returns {number} game speed
     */
    get speed() {
        return this._speed;
    }

    /**
     * Gets the current score of the game.
     * @returns {number} current score
     */
    get score() {
        return this._score;
    }

    /**
     * Gets the high score of all games.
     * @returns {number} high score
     */
    get highScore() {
        return this._highScore;
    }

    /**
     * Gets whether or not the game is paused.
     * @returns {boolean} true if game is paused; false otherwise
     */
    get paused() {
        return this._paused;
    }

    /**
     * Gets whether or not the game has ended.
     * @returns {boolean} true if game has ended; false otherwise
     */
    get ended() {
        return this._ended;
    }

    /**
     * Updates the current score.
     * @param {number} increment - amount to increase the score by
     */
    updateScore(increment) {
        this._score += increment;
    }

    /**
     * Updates the high score if the current score is higher.
     */
    updateHighScore() {
        if (this.score > this.highScore) {
            this._highScore = this.score;
            this._setItemSafely(STATE.LOCAL_STORAGE_KEY_HIGH_SCORE, this.score);
        }
    }

    /**
     * Resets the high score to 0 and persists this change to localStorage.
     * This operation cannot be undone.
     */
    clearHighScore() {
        this._highScore = 0;
        this._setItemSafely(STATE.LOCAL_STORAGE_KEY_HIGH_SCORE, 0);
    }

    /**
     * Sets the game speed.
     * @param {number} speed - new game speed to use
     */
    setSpeed(speed) {
        if (typeof speed !== 'number' || isNaN(speed)) {
            return;
        }
        this._speed = Math.max(0, Math.round(speed));
    }

    /**
     * Toggles the pause state of the game.
     */
    togglePause() {
        this._paused = !this.paused;
    }

    /**
     * Ends the game and saves the current game speed.
     */
    endGame() {
        this._ended = true;
        this._setItemSafely(STATE.LOCAL_STORAGE_KEY_GAME_SPEED, this.speed);
    }

    /**
     * Safely gets an item from localStorage.
     * @param {string} key - The key to retrieve from localStorage
     * @param {*} defaultValue - The default value to return if retrieval fails
     * @returns {*} The value from localStorage or the default value
     * @private
     */
    _getItemSafely(key, defaultValue) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.warn(`Error reading from localStorage: ${error.message}`);
            return defaultValue;
        }
    }

    /**
     * Safely sets an item in localStorage.
     * @param {string} key - The key to set in localStorage
     * @param {*} value - The value to set
     * @private
     */
    _setItemSafely(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn(`Error writing to localStorage: ${error.message}`);
        }
    }
}
