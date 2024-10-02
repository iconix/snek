import { GAME_CONFIG } from './config';

const { ITEM } = GAME_CONFIG;

export const PHASE_CLASSNAME = 'Phase';
export const TELEPORT_CLASSNAME = 'Teleport';

/**
 * Represents an item that can be consumed by snek in the game.
 */
export class Item {
    /**
     * @param {import('./board').Board} board - game board
     * @param {import('./snake').Snake} snake - snek object
     */
    constructor(board, snake) {
        this._x = Number.MIN_SAFE_INTEGER, this._y = Number.MIN_SAFE_INTEGER;
        this._generate(board, snake);
    }

    /**
     * Gets the x-coordinate of the item.
     * @returns {number} x-coordinate
     */
    get x() {
        return this._x;
    }

    /**
     * Gets the y-coordinate of the item.
     * @returns {number} y-coordinate
     */
    get y() {
        return this._y;
    }

    /**
     * Gets the type of the item.
     * @returns {string} item type
     */
    get type() { return 'UNKNOWN_ITEM' }

    /**
     * Gets the fill color of the item.
     * @returns {string} fill color
     */
    get fillColor() { return '' }

    /**
     * Gets the border color of the item.
     * @returns {string} border color
     */
    get borderColor() { return '' }

    /**
     * Generates a new position for the item.
     * @param {import('./board').Board} board - game board
     * @param {import('./snake').Snake} snake - snek object
     * @private
     */
    _generate(board, snake) {
        this._x = this._randomBlock(0, board.width - board.blockSize, board.blockSize);
        this._y = this._randomBlock(0, board.height - board.blockSize, board.blockSize);

        snake.forEachSegment((/** @type {{ x: number; y: number; }} @returns {void} */ snakeSegment) => {
            const itemIsOnSnake = snakeSegment.x == this.x && snakeSegment.y == this.y
            if (itemIsOnSnake) this._generate(board, snake);
        });
    }

    /**
     * Generates a random block position.
     * @param {number} min - minimum value
     * @param {number} max - maximum value
     * @param {number} blockSize - size of each block
     * @returns {number} random block position
     * @private
     */
    _randomBlock(min, max, blockSize) {
        // note: round to snap item placement to grid, as defined by blockSize
        return Math.round((Math.random() * (max-min) + min) / blockSize) * blockSize;
    }
}

/**
 * Represents a food item in the game.
 * Food is the basic item that snek consumes to grow and increase the player's score.
 * @extends Item
 */
export class Food extends Item {

    /**
     * Gets the food type.
     * @returns {string} food type
     */
    get type() { return 'FOOD' }

    /**
     * Gets the fill color of the food.
     * @returns {string} fill color
     */
    get fillColor() { return ITEM.FOOD_COLOR }

    /**
     * Gets the border color of the food.
     * @returns {string} border color
     */
    get borderColor() { return ITEM.FOOD_BORDER_COLOR }
}

/**
 * Represents a teleport item in the game.
 * Teleport is a power-up that allows snek to pass through the walls of the game board.
 * When consumed, it gives snek the ability to "wrap around" the game board once.
 * @extends Item
 */
export class Teleport extends Item {

    /**
     * Gets the teleport type.
     * @returns {string} teleport type
     */
    get type() { return 'TELEPORT' }

    /**
     * Gets the fill color of the teleport item.
     * @returns {string} fill color
     */
    get fillColor() { return ITEM.TELEPORT_COLOR }

    /**
     * Gets the border color of the teleport item.
     * @returns {string} border color
     */
    get borderColor() { return ITEM.TELEPORT_BORDER_COLOR }
}

/**
 * Represents a phase item in the game.
 * Phase is a power-up that allows snek the ability to pass through its own body once.
 * @extends Item
 */
export class Phase extends Item {

    /**
     * Gets the phase type.
     * @returns {string} phase type
     */
    get type() { return 'PHASE' }

    /**
     * Gets the fill color of the phase item.
     * @returns {string} fill color
     */
    get fillColor() { return ITEM.PHASE_COLOR }

    /**
     * Gets the border color of the phase item.
     * @returns {string} border color
     */
    get borderColor() { return ITEM.PHASE_BORDER_COLOR }
}

const ITEM_TYPES = {
    none: null,
    food: Food,
    teleport: Teleport,
    phase: Phase
};

/**
 * Options for item selection.
 * @typedef {Object} ItemSelectionOptions
 * @property {boolean} [alwaysReturnItem=false] - If true, always returns an item (never null)
 * @property {boolean} [reducePowerUpProbability=false] - If true, reduces the probability of power-ups
 */

/**
 * Randomizes the selection of an item type based on game conditions.
 * @param {number} score - current game score
 * @param {{ [x: string]: boolean; }} powerUps - available power-ups and whether eqipped
 * @param {ItemSelectionOptions} [options={}] - options for item selection
 * @returns {(new (board: import('./board').Board, item: import('./snake').Snake) => Item)} selected item class or null
 */
export function selectRandomItem(score, powerUps, options = {}) {
    const { alwaysReturnItem = false, reducePowerUpProbability = false } = options;

    const itemChances = calculateItemProbabilities(score, powerUps, alwaysReturnItem, reducePowerUpProbability);

    // console.log(itemChances);

    const selectedItemType = pickItem(itemChances);
    return ITEM_TYPES[selectedItemType];
}

/**
 * Picks an item based on a weighted random selection algorithm.
 * @param {{ [x: string]: any; }} chances - chances for each item
 * @returns {string} selected item key
 */
function pickItem(chances) {
    const random = Math.random();  // random value to use for selection
    let cumulativeProbability = 0;

    for (const [item, probability] of Object.entries(chances)) {
        cumulativeProbability += probability;
        if (random <= cumulativeProbability) {
            return item;
        }
    }

    // this should never happen if probabilities sum to 1
    throw new Error('item selection failed');
}

/**
 * Calculates probability of generation for each item type.
 * Provides ability to balance the game by making power-ups less frequent in certain situations.
 * @param {number} score - current game score
 * @param {{ [x: string]: boolean }} powerUps - current power-ups
 * @param {boolean} alwaysReturnItem - whether to always return an item
 * @param {boolean} reducePowerUpProbability - whether to reduce the probability of power-ups
 * @returns {{ [x: string]: number }} probabilities for each item type
 */
function calculateItemProbabilities(score, powerUps, alwaysReturnItem, reducePowerUpProbability) {
    // note: a power-up always drops AT its score threshold; afterwards drops get random
    const teleportProb = calculateTeleportProbability(score, powerUps, alwaysReturnItem, reducePowerUpProbability);
    const phaseProb = calculatePhaseProbability(score, powerUps, alwaysReturnItem, reducePowerUpProbability);

    let foodProb, noItemProb;
    if (alwaysReturnItem) {
        foodProb = 1 - teleportProb - phaseProb;
        noItemProb = 0;
    } else {
        foodProb = ITEM.BASE_VOLATILE_FOOD_PROBABILITY;
        noItemProb = 1 - teleportProb - phaseProb - foodProb;
    }

    const probabilities = {
        none: noItemProb,
        food: foodProb,
        teleport: teleportProb,
        phase: phaseProb,
    };

    const totalProb = Object.values(probabilities).reduce((sum, prob) => sum + prob, 0);
    if (Math.abs(totalProb - 1) > 1e-10) {  // allow for small floating-point errors
        throw new Error(`Item probabilities must sum to 1. Current sum: ${totalProb}`);
    }

    return probabilities;
}

/**
 * Calculates the probability of generating a Teleport item.
 * @param {number} score - current game score
 * @param {{ [x: string]: boolean }} powerUps - current power-ups
 * @param {boolean} alwaysReturnItem - whether to always return an item
 * @param {boolean} reducePowerUpProbability - whether to reduce the probability of power-ups
 * @returns {number} probability of generating a Teleport item
 */
function calculateTeleportProbability(score, powerUps, alwaysReturnItem, reducePowerUpProbability) {
    if (score === ITEM.TELEPORT_SCORE_THRESHOLD && alwaysReturnItem) return 1;
    if (score > ITEM.TELEPORT_SCORE_THRESHOLD && !powerUps[TELEPORT_CLASSNAME]) {
        return reducePowerUpProbability ? ITEM.BASE_TELEPORT_PROBABILITY / 10 : ITEM.BASE_TELEPORT_PROBABILITY;
    }
    return 0;
}

/**
 * Calculates the probability of generating a Phase item.
 * @param {number} score - current game score
 * @param {{ [x: string]: boolean }} powerUps - current power-ups
 * @param {boolean} alwaysReturnItem - whether to always return an item
 * @param {boolean} reducePowerUpProbability - whether to reduce the probability of power-ups
 * @returns {number} probability of generating a Phase item
 */
function calculatePhaseProbability(score, powerUps, alwaysReturnItem, reducePowerUpProbability) {
    if (score === ITEM.PHASE_SCORE_THRESHOLD && alwaysReturnItem) return 1;
    if (score > ITEM.PHASE_SCORE_THRESHOLD && !powerUps[PHASE_CLASSNAME]) {
        return reducePowerUpProbability ? ITEM.BASE_PHASE_PROBABILITY / 10 : ITEM.BASE_PHASE_PROBABILITY;
    }
    return 0;
}
