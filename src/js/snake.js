import { Phase, Teleport } from './item';

const DEFAULT_BORDER_COLOR = 'darkgreen';
const DEFAULT_COLOR = 'lightgreen';
const PHASE_BORDER_COLOR = 'violet';

export const LEFT_KEY = 'ArrowLeft';
export const RIGHT_KEY = 'ArrowRight';
export const UP_KEY = 'ArrowUp';
export const DOWN_KEY = 'ArrowDown';

export class Snake {
    constructor(boardWidth, boardHeight, blockSize) {
        this._body = [
            { x: boardWidth / 2, y: boardHeight / 2 },
            { x: boardWidth / 2 - blockSize, y: boardHeight / 2 },
            { x: boardWidth / 2 - blockSize * 2, y: boardHeight / 2 },
            { x: boardWidth / 2 - blockSize * 3, y: boardHeight / 2 },
            { x: boardWidth / 2 - blockSize * 4, y: boardHeight / 2 },
        ];

        this._blockSize = blockSize;

        // set initial velocity
        this._dx = this._dxAtPause = blockSize;
        this._dy = this._dyAtPause = 0;

        this._color = DEFAULT_COLOR;
        this._borderColor = DEFAULT_BORDER_COLOR;
        this._isGlowing = false;

        this.isChangingDirection = false;
        this.powerUps = {[Teleport]: false, [Phase]: false};
    }

    get body() {
        return this._body;
    }

    get color() {
        return this._color;
    }

    get borderColor() {
        return this._borderColor;
    }

    get isGlowing() {
        return this._isGlowing;
    }

    advanceHead() {
        const head = { x: this._body[0].x + this._dx, y: this._body[0].y + this._dy };
        this._body.unshift(head);

        // TODO: add to control panel
        // console.log(`HEAD: ${head.x}, ${head.y}`);
    }

    advanceTail() {
        this._body.pop();
    }

    pause() {
        // save velocity at pause
        this._dxAtPause = this._dx;
        this._dyAtPause = this._dy;
        // set velocity to 0
        this._dx = this._dy = 0;
    }

    unpause() {
        // set velocity to state before pause
        this._dx = this._dxAtPause;
        this._dy = this._dyAtPause;
    }

    didEat(item) {
        return this._round(this._body[0].x, 0) === this._round(item.x, 0) &&
            this._round(this._body[0].y, 0) === this._round(item.y, 0);
    }

    equip(item) {
        if (item instanceof Teleport) this.powerUps[Teleport] = true;
        if (item instanceof Phase) {
            this.powerUps[Phase] = true;
            this.setGlow(true);
        }
    }

    setGlow(shouldGlow) {
        if (shouldGlow && !this._isGlowing) {
            this._borderColor = PHASE_BORDER_COLOR;
            this._isGlowing = true;
            // console.log(`[snake] shouldGlow: ${shouldGlow}; borderColor: ${this.borderColor}; isGlowing: ${this.isGlowing}`);
        }

        if (!shouldGlow && this._isGlowing) {
            this._borderColor = DEFAULT_BORDER_COLOR;
            this._isGlowing = false;
            // console.log(`[snake] shouldGlow: ${shouldGlow}; borderColor: ${this.borderColor}; isGlowing: ${this.isGlowing}`);
        }
    }

    didCollide(boardWidth, boardHeight, blockSize) {
        // test whether the snake collided with itself
        // loop starts at index 4 because it is impossible for the first three parts to touch each other
        for (let i = 4; i < this._body.length; i++) {
            const didCollide = this._body[i].x === this._body[0].x && this._body[i].y === this._body[0].y;
            if (didCollide) {
                if (this.powerUps[Phase]) {
                    // if phase powerup is available, decrement and continue game
                    this.powerUps[Phase] = false;
                    this.setGlow(false);

                    // console.log('PHASE!');
                    return false;
                }
                return true;
            }
        }

        const hitLeftWall = this._body[0].x < 0;
        const hitRightWall = this._body[0].x > boardWidth - blockSize;
        const hitTopWall = this._body[0].y < 0;
        const hitBottomWall = this._body[0].y > boardHeight - blockSize;

        const hitWall = hitLeftWall || hitRightWall || hitTopWall || hitBottomWall;

        if (!hitWall) { return false; }

        // if teleport power is available, decrement, teleport, and continue game
        if (this.powerUps[Teleport]) {
            this.powerUps[Teleport] = false;

            if (hitLeftWall) {
                this._body[0].x = boardWidth;
            } else if (hitRightWall) {
                this._body[0].x = -blockSize;
            } else if (hitTopWall) {
                this._body[0].y = boardHeight;
            } else if (hitBottomWall) {
                this._body[0].y = -blockSize;
            }

            // console.log('TELEPORT!');
            return false;
        }

        return true;
    }

    changeDirectionByKey(keyPressed) {
        if (this.isChangingDirection) { return; }
        this.isChangingDirection = true;

        const goingUp = this._dy === -this._blockSize;
        const goingDown = this._dy === this._blockSize;
        const goingRight = this._dx === this._blockSize;
        const goingLeft = this._dx === -this._blockSize;

        if (keyPressed === LEFT_KEY && !goingRight) { this._dx = -this._blockSize; this._dy = 0; }
        if (keyPressed === UP_KEY && !goingDown) { this._dx = 0; this._dy = -this._blockSize; }
        if (keyPressed === RIGHT_KEY && !goingLeft) { this._dx = this._blockSize; this._dy = 0; }
        if (keyPressed === DOWN_KEY && !goingUp) { this._dx = 0; this._dy = this._blockSize; }
    }

    changeDirectionByMvmt(beta, gamma, lastBeta, lastGamma, sensitivity) {
        let newBeta = lastBeta;
        let newGamma = lastGamma;

        if (this.isChangingDirection) {
            return {
                newBeta: newBeta,
                newGamma: newGamma
            };
        }
        this.isChangingDirection = true;

        const betaDelta = lastBeta - beta;
        const gammaDelta = lastGamma - gamma;

        const goingUp = this._dy === -this._blockSize;
        const goingDown = this._dy === this._blockSize;
        const goingRight = this._dx === this._blockSize;
        const goingLeft = this._dx === -this._blockSize;

        let dir;
        if (betaDelta < -sensitivity) {
            if (!goingUp) { dir = 'DOWN'; this._dx = 0; this._dy = this._blockSize; newGamma = gamma; }
            newBeta = beta;
        } else if (betaDelta > sensitivity) {
            if (!goingDown) { dir = 'UP'; this._dx = 0; this._dy = -this._blockSize; newGamma = gamma; }
            newBeta = beta;
        } else if (gammaDelta < -sensitivity) {
            if (!goingLeft) { dir = 'RIGHT'; this._dx = this._blockSize; this._dy = 0; newBeta = beta; }
            newGamma = gamma;
        } else if (gammaDelta > sensitivity) {
            if (!goingRight) { dir = 'LEFT'; this._dx = -this._blockSize; this._dy = 0; newBeta = beta; }
            newGamma = gamma;
        }

        // if (dir) {
        //     console.log(`going${dir}`);
        // }

        return {
            newBeta: newBeta,
            newGamma: newGamma
        };
    }

    _round(value, precision = 1) {
        var multiplier = Math.pow(10, precision || 0);
        return Math.round(value * multiplier) / multiplier;
    }
}
