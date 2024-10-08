export const DIRECTION_LEFT = 'left';
export const DIRECTION_RIGHT = 'right';
export const DIRECTION_UP = 'up';
export const DIRECTION_DOWN = 'down';

/**
 * @typedef {Object} Direction
 * @property {number} dx - change in x direction
 * @property {number} dy - change in y direction
 */

/**
 * Object mapping direction strings to their corresponding Direction objects.
 * @type {Object.<string, Direction>}
 */
export const DIRECTIONS = {
    [DIRECTION_LEFT]:  { dx: -1, dy: 0 },
    [DIRECTION_RIGHT]: { dx: 1,  dy: 0 },
    [DIRECTION_UP]:    { dx: 0,  dy: -1 },
    [DIRECTION_DOWN]:  { dx: 0,  dy: 1 },
};

/**
 * Gets the Direction object for a given direction string.
 * @param {string} direction - direction string
 * @returns {Direction | null} Direction object or null if not found
 */
export function getDirection(direction) {
    return DIRECTIONS[direction.toLowerCase()] || null;
}

/**
 * Checks if two directions are opposite to each other.
 * @param {Direction} dir1 - first direction
 * @param {Direction} dir2 - second direction
 * @returns {boolean} true if the directions are opposite; false otherwise
 */
export function isOppositeDirection(dir1, dir2) {
    return dir1.dx === -dir2.dx && dir1.dy === -dir2.dy;
}

/**
 * Normalizes a direction vector to have a magnitude of 1.
 * @param {number} dx - x component of the direction
 * @param {number} dy - y component of the direction
 * @returns {Direction} normalized direction
 */
export function normalizeDirection(dx, dy) {
    const magnitude = Math.max(Math.abs(dx), Math.abs(dy));
    if (magnitude === 0) {
        return { dx: 0, dy: 0 };
    }
    return { dx: dx / magnitude, dy: dy / magnitude };
}
