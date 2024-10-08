import { GAME_CONFIG } from './config';

const { CANVAS } = GAME_CONFIG;

const PAUSE_ICON_CHAR_CODE = 0xF4BF;
const EXCLAMATION_ICON_CHAR_CODE = 0xF33A;

/**
 * A fake "context manager" for pixel sharpness.
 * https://stackoverflow.com/a/8696641
 * @param {CanvasRenderingContext2D} ctx - canvas rendering context
 * @param {() => void} cb - callback function to execute within the context
 */
function withStraddle(ctx, cb) {
    const offset = 0.5;

    try {
        // turn on 'straddle' trick to avoid blurriness
        ctx.translate(offset, offset);
        cb();
    } finally {
        // turn off 'straddle' trick to avoid blurriness
        ctx.translate(-offset, -offset);
    }
}

/**
 * Draws the game board and background.
 * @param {import('./game/game').Game} game - game object
 */
export function drawGame(game) {
    let board = game.board;
    let ctx = board.ctx;

    ctx.save();

    withStraddle(ctx, () => {
        ctx.filter = board.activeFilter;

        // set border and background colors
        ctx.fillStyle = board.color;
        if (board.isGlowing) {
            // note: strokeRect doesn't do a good job of bordering the canvas,
            // so we fall back to CSS styling

            // https://stackoverflow.com/a/5670984
            board.canvas.style.border = 'none'
            board.canvas.style.outline = `${board.borderColor} dashed thin`;
            board.canvas.style.boxShadow = `0 0 10px ${board.color}`;
            board.canvas.style.transition = 'box-shadow linear 1s';
        } else {
            board.canvas.style.border = `2px solid ${board.borderColor}`;
            board.canvas.style.outline = 'none';
            board.canvas.style.boxShadow = 'none';
            board.canvas.style.transition = 'box-shadow linear 0.5s';
        }

        ctx.fillRect(0, 0, board.canvas.width, board.canvas.height);

        if (game.state.paused) {
            let useExclamation = board.needsPermission();

            const iconSize = CANVAS.GAME_TEXT_FONT_SIZE * board.ratio;
            const iconPadding = 5 * board.ratio;

            // since filters don't work on iOS safari, we need another visual aid
            // add pause button icon https://icons.getbootstrap.com/icons/pause-btn-fill/
            // or exclamation triangle icon if we still need permissions
            // https://icons.getbootstrap.com/icons/exclamation-triangle-fill/
            ctx.font = `${iconSize}px "bootstrap-icons"`;
            ctx.fillStyle = useExclamation ? CANVAS.EXCLAMATION_BTN_COLOR : CANVAS.PAUSE_BTN_COLOR;
            ctx.fillText(String.fromCharCode(
                useExclamation ? EXCLAMATION_ICON_CHAR_CODE : PAUSE_ICON_CHAR_CODE
            ), iconPadding, iconSize + iconPadding, board.canvas.width);
        }
    });

    ctx.restore();
}

/**
 * Draws snek on the game board.
 * @param {import('./snake').Snake} snake - snek object
 * @param {import('./board').Board} board - game board
 */
export function drawSnake(snake, board) {
    const ctx = board.ctx;

    ctx.save();

    withStraddle(ctx, () => {
        if (snake.isGlowing) {
            // https://stackoverflow.com/a/43676108
            ctx.lineCap = 'round';
            ctx.shadowBlur = 18;
            ctx.shadowColor = snake.color;
        }

        ctx.fillStyle = snake.color;
        ctx.strokeStyle = snake.borderColor;

        snake.forEachSegment((/** @type {{ x: number; y: number; }} */ segment) => {
            ctx.fillRect(segment.x, segment.y, board.blockSize, board.blockSize);
            ctx.strokeRect(segment.x, segment.y, board.blockSize, board.blockSize);
        });
    });

    ctx.restore();
}

/**
 * Draws an item on the game board.
 * @param {import('./item').Item} item - item object
 * @param {import('./board').Board} board - game board
 */
export function drawItem(item, board) {
    let ctx = board.ctx;
    ctx.save();

    withStraddle(ctx, () => {
        ctx.fillStyle = item.fillColor;
        ctx.strokeStyle = item.borderColor;
        ctx.fillRect(item.x, item.y, board.blockSize, board.blockSize);
        ctx.strokeRect(item.x, item.y, board.blockSize, board.blockSize);
    });

    ctx.restore();
}

/**
 * Draws the current score on the game board.
 * @param {number} score - current score
 * @param {import('./board').Board} board - game board
 */
export function drawScore(score, board) {
    let ctx = board.ctx;
    ctx.save();

    ctx.font = `${CANVAS.GAME_TEXT_FONT_SIZE * board.ratio}px ${CANVAS.GAME_TEXT_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = CANVAS.GAME_TEXT_COLOR;
    ctx.fillText(score.toString(), board.canvas.width / 2, (board.canvas.height / 2) - ((CANVAS.GAME_TEXT_FONT_SIZE / 2) * board.ratio), board.canvas.width);

    ctx.restore();
}

/**
 * Draws the high score on the game board.
 * @param {number} score - high score
 * @param {import('./board').Board} board - game board
 */
export function drawHighScore(score, board) {
    let ctx = board.ctx;
    ctx.save();

    ctx.font = `${CANVAS.GAME_TEXT_FONT_SIZE * board.ratio}px ${CANVAS.GAME_TEXT_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = CANVAS.HIGH_SCORE_TEXT_COLOR;
    ctx.strokeText(score.toString(), board.canvas.width / 2, (board.canvas.height / 2) + ((CANVAS.GAME_TEXT_FONT_SIZE / 2) * board.ratio), board.canvas.width);

    ctx.restore();
}

/**
 * Draws the game over message on the game board.
 * @param {import('./board').Board} board - game board
 */
export function drawGameOver(board) {
    let ctx = board.ctx;
    ctx.save();

    ctx.font = `${CANVAS.GAME_TEXT_FONT_SIZE * board.ratio}px ${CANVAS.GAME_TEXT_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = CANVAS.GAME_TEXT_COLOR;
    ctx.fillText('DED', board.canvas.width / 2, board.canvas.height / 2, board.canvas.width);

    ctx.restore();
}
