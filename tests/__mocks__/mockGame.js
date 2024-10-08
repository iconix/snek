import { Game } from "../../src/js/game/game";
import { GameState } from "../../src/js/game/state";

export class MockGame extends Game { }

/**
 * Options for item selection.
 * @typedef {Object} MockGameStateInternals
 * @property {boolean} [paused=false]
 * @property {boolean} [ended=false]
 * @property {number} [score=0]
 * @property {number} [highScore=0]
 * @property {number} [speed=100]
 */

/**
 * @param {MockGameStateInternals} [state={}] - internal state to set on mock
 */
export class MockGameState extends GameState {
    constructor(state = {}) {
        super();

        this._paused = state.paused;
        this._ended = state.ended;
        this._score = state.score;
        this._highScore = state.highScore;
        this._speed = state.speed;
    }
 }
