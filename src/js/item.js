const FOOD_COLOR = 'red';
const FOOD_BORDER_COLOR = 'darkred';
const TELEPORT_COLOR = 'blue';
const TELEPORT_BORDER_COLOR = 'darkblue';
const PHASE_COLOR = 'orchid';
const PHASE_BORDER_COLOR = 'violet';

const TELEPORT_SCORE_THRESHOLD = 50;
const TELEPORT_PROBABILITY = 0.1;
const PHASE_SCORE_THRESHOLD = 150;
const PHASE_PROBABILITY = 0.1;
const UNSTABLE_FOOD_PROBABILITY = 0.01;

export class Item {
    /**
     * @param {import('./board').Board} board
     * @param {import('./snake').Snake} snake
     */
    constructor(board, snake) {
        this._x = Number.MIN_SAFE_INTEGER, this._y = Number.MIN_SAFE_INTEGER;
        this._generate(board, snake);
    }

    /**
     * @returns {number}
     */
    get x() {
        return this._x;
    }

    /**
     * @returns {number}
     */
    get y() {
        return this._y;
    }

    /**
     * @returns {string}
     */
    get type() { return 'UNKNOWN_ITEM' }

    /**
     * @returns {string}
     */
    get fillColor() { return '' }

    /**
     * @returns {string}
     */
    get borderColor() { return '' }

    /**
     * @param {import('./board').Board} board
     * @param {import('./snake').Snake} snake
     * @returns {void}
     */
    _generate(board, snake) {
        this._x = this._randomBlock(0, board.width - board.blockSize, board.blockSize);
        this._y = this._randomBlock(0, board.height - board.blockSize, board.blockSize);

        snake.body.forEach((/** @type {{ x: number; y: number; }} @returns {void} */ snakePart) => {
            const itemIsOnSnake = snakePart.x == this._x && snakePart.y == this._y
            if (itemIsOnSnake) this._generate(board, snake);
        });
    }

    /**
     * @param {number} min
     * @param {number} max
     * @param {number} blockSize
     * @returns {number}
     */
    _randomBlock(min, max, blockSize) {
        return Math.round((Math.random() * (max-min) + min) / blockSize) * blockSize;
    }
}

export class Food extends Item {
    /**
     * @returns {string}
     */
    get type() { return 'FOOD' }

    /**
     * @returns {string}
     */
    get fillColor() { return FOOD_COLOR }

    /**
     * @returns {string}
     */
    get borderColor() { return FOOD_BORDER_COLOR }
}

export class Teleport extends Item {
    /**
     * @returns {string}
     */
    get type() { return 'TELEPORT' }

    /**
     * @returns {string}
     */
    get fillColor() { return TELEPORT_COLOR }

    /**
     * @returns {string}
     */
    get borderColor() { return TELEPORT_BORDER_COLOR }
}

export class Phase extends Item {
    /**
     * @returns {string}
     */
    get type() { return 'PHASE' }

    /**
     * @returns {string}
     */
    get fillColor() { return PHASE_COLOR }

    /**
     * @returns {string}
     */
    get borderColor() { return PHASE_BORDER_COLOR }
}

const ITEM_TYPES = {
    none: null,
    food: Food,
    teleport: Teleport,
    phase: Phase
};

/**
 * @param {number} score
 * @param {{ [x: any]: boolean; }} powerUps
 * @param {boolean} alwaysReturnItem
 * @param {boolean} lessPowerUps
 * @returns {null | (new (board: import('./board').Board, item: import('./snake').Snake) => Item)}
 */
export function randomizeItem(score, powerUps, alwaysReturnItem, lessPowerUps) {
    // at SCORE_THRESHOLDs, enable powerups
    // an item always drops AT its threshold; afterwards drops get random

    let noItemProb = 0, foodProb = 0, teleportProb = 0, phaseProb = 0;
    if (score == TELEPORT_SCORE_THRESHOLD) {
        if (alwaysReturnItem) {
            teleportProb = 1;
        }
    }
    else if (score == PHASE_SCORE_THRESHOLD) {
        if (alwaysReturnItem) {
            phaseProb = 1;
        }
    } else if (score > TELEPORT_SCORE_THRESHOLD && !powerUps[Teleport]) {
        if (lessPowerUps) {
            teleportProb = TELEPORT_PROBABILITY / 10;
        } else {
            teleportProb = TELEPORT_PROBABILITY;
        }
    }

    if (score > PHASE_SCORE_THRESHOLD && !powerUps[Phase]) {
        if (lessPowerUps) {
            phaseProb = PHASE_PROBABILITY / 10;
        } else {
            phaseProb = PHASE_PROBABILITY;
        }
    }

    if (alwaysReturnItem) {
        foodProb = 1 - teleportProb - phaseProb;
    } else {
        foodProb = UNSTABLE_FOOD_PROBABILITY;
        noItemProb = 1 - teleportProb - phaseProb - foodProb;
    }

    let itemChances = {
        none: noItemProb,
        food: foodProb,
        teleport: teleportProb,
        phase: phaseProb,
    }

    // console.log(itemChances);

    let itemClass = ITEM_TYPES[pickItem(itemChances, Math.random())];

    return itemClass;
}

/**
 * @param {{ [x: string]: any; }} chances
 * @param {number} p
 * @returns {string | undefined}
 */
function pickItem(chances, p) {
    // adapted from: https://gist.github.com/alesmenzel/6164543b3d018df7bcaf6c5f9e6a841e
    const items = Object.keys(chances);

    return items.find((_, i) => {
        const sum = items.slice(0, i + 1).reduce((acc, el) => {
            return acc + chances[el];
        }, 0);

        if (p < sum) return true;

        return false;
    });
}
