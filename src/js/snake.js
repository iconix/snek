import { GAME_CONFIG } from './config';
import { DIRECTION_DOWN, DIRECTION_LEFT, DIRECTION_RIGHT, DIRECTION_UP, getDirection, isOppositeDirection, normalizeDirection } from './game/direction';
import { PHASE_CLASSNAME, Phase, TELEPORT_CLASSNAME, Teleport } from './item';

const { SNAKE } = GAME_CONFIG;

/**
 * Represents snek in the game.
 */
export class Snake {

    /**
     * @param {number} boardWidth - width of the game board
     * @param {number} boardHeight - height of the game board
     * @param {number} blockSize - size of each block on the board
     */
    constructor(boardWidth, boardHeight, blockSize) {
        this._blockSize = blockSize;

        // calculate initial position (center of the board)
        const centerX = Math.floor(boardWidth / (2 * blockSize)) * blockSize;
        const centerY = Math.floor(boardHeight / (2 * blockSize)) * blockSize;

        this._body = this._createBody(centerX, centerY, SNAKE.INITIAL_LENGTH);

        // set initial velocity
        this._dx = this._dxAtPause = blockSize;
        this._dy = this._dyAtPause = 0;
        this._isChangingDirection = false;

        // set initial appearance
        this._color = SNAKE.DEFAULT_COLOR;
        this._borderColor = SNAKE.DEFAULT_BORDER_COLOR;
        this._isGlowing = false;

        this.powerUps = { [TELEPORT_CLASSNAME]: false, [PHASE_CLASSNAME]: false };

        this._directionMap = new Map([
            [`${blockSize},0`, DIRECTION_RIGHT],
            [`${-blockSize},0`, DIRECTION_LEFT],
            [`0,${-blockSize}`, DIRECTION_UP],
            [`0,${blockSize}`, DIRECTION_DOWN]
        ]);
    }

    /**
     * Creates the body of snek.
     * @param {number} centerX - x-coordinate of the center of the board
     * @param {number} centerY - y-coordinate of the center of the board
     * @param {number} length - number of parts composing snek body
     * @returns {{ x: number; y: number; }[]} created snek body
     * @private
     */
    _createBody(centerX, centerY, length) {
        const body = [];
        for (let i = 0; i < length; i++) {
            body.push({
                x: centerX - i * this._blockSize,
                y: centerY
            });
        }
        return body;
    }

    /**
     * Gets snek's fill color.
     * @returns {string} fill color
     */
    get color() {
        return this._color;
    }

    /**
     * Gets snek's border color.
     * @returns {string} border color
     */
    get borderColor() {
        return this._borderColor;
    }

    /**
     * Gets whether snek is glowing.
     * @returns {boolean} true if snek is glowing; false otherwise
     */
    get isGlowing() {
        return this._isGlowing;
    }

    /**
     * Gets the position of snek's head.
     * @returns {{ x: number; y: number }} head position
     */
    getHeadPosition() {
        return { ...this._body[0] };
    }

    /**
     * Gets the current direction of snek.
     * @returns {string} current direction ('left', 'right', 'up', or 'down')
     */
    getCurrentDirection() {
        const key = `${this._dx},${this._dy}`;
        return this._directionMap.get(key) || 'unknown';
    }

    /**
     * Moves snek in its current direction.
     * @param {boolean} growing whether snek should grow
     */
    move(growing = false) {
        this._advanceHead();
        if (!growing) {
            this._advanceTail();
        }
    }

    /**
     * Advances snek's head.
     */
    _advanceHead() {
        // note: round to snap snek movement to grid, as defined by blockSize
        const head = {
            x: Math.round((this.getHeadPosition().x + this._dx) / this._blockSize) * this._blockSize,
            y: Math.round((this.getHeadPosition().y + this._dy) / this._blockSize) * this._blockSize
        };
        this._body.unshift(head);

        this._isChangingDirection = false;

        // TODO: add to control panel
        // console.log(`HEAD: ${head.x}, ${head.y}`);
    }

    /**
     * Advances snek's tail (removes the last segment).
     */
    _advanceTail() {
        this._body.pop();
    }

    /**
     * Teleports snek's head to a new position.
     * Useful for unit testing.
     * @param {{ x: number; y: number }} newPosition new position for the head
     */
    teleportHead(newPosition) {
        this._body[0] = { ...newPosition };
    }

    /**
     * Executes a callback for each segment of snek's body.
     * @param {(segment: { x: number; y: number }, index: number) => void} callback
     */
    forEachSegment(callback) {
        this._body.forEach((segment, index) => callback({ ...segment }, index));
    }

    /**
     * Pauses snek's movement.
     */
    pause() {
        // save velocity at pause
        this._dxAtPause = this._dx;
        this._dyAtPause = this._dy;
        // set velocity to 0
        this._dx = this._dy = 0;
    }

    /**
     * Resumes snek's movement after a pause.
     */
    unpause() {
        // set velocity to state before pause
        this._dx = this._dxAtPause;
        this._dy = this._dyAtPause;
    }

    /**
     * Checks if snek has eaten an item.
     * @param {import('./item').Item} item - item to check
     * @returns {boolean} true if snek has eaten the item; false otherwise
     */
    didEat(item) {
        let head = this.getHeadPosition();
        return head.x === item.x && head.y === item.y;
    }

    /**
     * Equips snek with a power-up
     * @param {import('./item').Item} item - power-up item to equip
     */
    equip(item) {
        if (item instanceof Teleport) this.powerUps[TELEPORT_CLASSNAME] = true;
        if (item instanceof Phase) {
            this.powerUps[PHASE_CLASSNAME] = true;
            this.setGlow(true);
        }
    }

    /**
     * Sets the glow effect on snek.
     * @param {boolean} shouldGlow - whether snek should glow
     */
    setGlow(shouldGlow) {
        if (shouldGlow === this.isGlowing) return;

        this._isGlowing = shouldGlow;

        this._borderColor = shouldGlow ? SNAKE.PHASE_BORDER_COLOR : SNAKE.DEFAULT_BORDER_COLOR;

        // console.log(`[snek] shouldGlow: ${shouldGlow}; borderColor: ${this.borderColor}; isGlowing: ${this.isGlowing}`);
    }

    /**
     * Checks if snek has collided with itself or the board boundaries.
     * @param {number} boardWidth - width of the game board
     * @param {number} boardHeight - height of the game board.
     * @param {number} blockSize - size of each block on the board
     * @returns {boolean} true if snek has collided; false otherwise
     */
    didCollide(boardWidth, boardHeight, blockSize) {
        let head = this.getHeadPosition();

        // loop starts at index 4 because it is impossible for the first three parts to touch each other
        const collidesWithSelf = this._body.slice(4).some(segment => segment.x === head.x && segment.y === head.y);
        if (collidesWithSelf) {
            if (this.powerUps[PHASE_CLASSNAME]) {
                // if phase powerup is equipped, decrement, ignore collision, and continue game
                this.powerUps[PHASE_CLASSNAME] = false;
                this.setGlow(false);

                console.log('snek phased!');
                return false;
            }
            return true;
        }

        // check for collisions with walls
        const hitLeftWall = head.x < 0;
        const hitRightWall = head.x + blockSize > boardWidth;
        const hitTopWall = head.y < 0;
        const hitBottomWall = head.y + blockSize > boardHeight;

        const hitWall = hitLeftWall || hitRightWall || hitTopWall || hitBottomWall;

        if (!hitWall) { return false; }

        // if teleport power is equipped, decrement, teleport, and continue game
        if (this.powerUps[TELEPORT_CLASSNAME]) {
            this.powerUps[TELEPORT_CLASSNAME] = false;

            // teleport to opposite side of the board
            if (hitLeftWall) {
                this.teleportHead({x: boardWidth - blockSize, y: head.y});
            } else if (hitRightWall) {
                this.teleportHead({x: 0, y: head.y});
            } else if (hitTopWall) {
                this.teleportHead({x: head.x, y: boardHeight - blockSize});
            } else if (hitBottomWall) {
                this.teleportHead({x: head.x, y: 0});
            }

            console.log('snek teleported!');
            return false;
        }

        return true;
    }

    /**
     * Changes the direction of snek.
     * @param {string} direction - new direction
     * @returns {boolean} true if snek direction was changed; false otherwise
     */
    changeDirection(direction) {
        // prevent changing direction multiple times before the next move
        if (this._isChangingDirection) return false;

        const newDirection = getDirection(direction);
        if (!newDirection) return false;

        const currentDirection = this._getCurrentDirection();
        // prevent snek from moving back on itself
        if (isOppositeDirection(currentDirection, newDirection)) return false;

        this._setNewDirection(newDirection);
        return true;
    }

    /**
     * Gets the current direction of snek.
     * @returns {import('./game/direction').Direction} current direction
     * @private
     */
    _getCurrentDirection() {
        // normalize the current velocity to get direction
        return normalizeDirection(this._dx, this._dy);
    }

    /**
     * Sets a new direction for snek.
     * @param {import('./game/direction').Direction} direction - new direction
     * @private
     */
    _setNewDirection(direction) {
        this._isChangingDirection = true;
        this._dx = direction.dx * this._blockSize;
        this._dy = direction.dy * this._blockSize;
    }
}
