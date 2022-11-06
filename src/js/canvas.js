const EXCLAMATION_BTN_COLOR = 'darkkhaki';
const GAME_TEXT_COLOR = 'gray';
const HIGH_SCORE_TEXT_COLOR = 'goldenrod';
const PAUSE_BTN_COLOR = 'darkkhaki';

const GAME_TEXT_FONT_FAMILY = '"Saira", serif';

const GAME_TEXT_FONT_SIZE = 50;

const PAUSE_ICON_CHAR_CODE = 0xF4BF;
const EXCLAMATION_ICON_CHAR_CODE = 0xF33A;

/**
 * a fake contextmanager
 * for pixel sharpness https://stackoverflow.com/a/8696641
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ (): void; }} cb
 * @returns {void}
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
 * @param {import('./game').Game} game
 * @returns {void}
 */
export function drawGame(game) {
    let board = game.board;
    let ctx = board.ctx;

    withStraddle(ctx, () => {
        ctx.filter = board.activeFilter;

        // set border and background colors
        ctx.fillStyle = board.color;
        if (board.isGlowing) {
            // n.b. strokeRect doesn't do a good job of bordering the canvas,
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

        if (game.paused) {
            let useExclamation = board.needsPermission();

            // since filters don't work on iOS safari, we need another visual aid
            // add pause button icon https://icons.getbootstrap.com/icons/pause-btn-fill/
            // or exclamation triangle icon if we still need permissions
            // https://icons.getbootstrap.com/icons/exclamation-triangle-fill/
            ctx.font = (GAME_TEXT_FONT_SIZE * board.ratio) + 'px "bootstrap-icons"';
            ctx.fillStyle = useExclamation ? EXCLAMATION_BTN_COLOR : PAUSE_BTN_COLOR;
            ctx.fillText(String.fromCharCode(
                useExclamation ? EXCLAMATION_ICON_CHAR_CODE : PAUSE_ICON_CHAR_CODE
            ), 30 * board.ratio, 50 * board.ratio, board.canvas.width);
        }
    });
}

/**
 * @param {import('./snake').Snake} snake
 * @param {import('./board').Board} board
 * @returns {void}
 */
export function drawSnake(snake, board) {
    snake.body.forEach((/** @type {{ x: number; y: number; }} */ snakePart) => drawSnakePart(
        snakePart,
        snake.color,
        snake.borderColor,
        snake.isGlowing,
        board
    ));
}

/**
 * @param {import('./item').Item} item
 * @param {import('./board').Board} board
 * @returns {void}
 */
export function drawItem(item, board) {
    let ctx = board.ctx;

    withStraddle(ctx, () => {
        ctx.fillStyle = item.fillColor;
        ctx.strokeStyle = item.borderColor;
        ctx.fillRect(item.x, item.y, board.blockSize, board.blockSize);
        ctx.strokeRect(item.x, item.y, board.blockSize, board.blockSize);
    });
}

/**
 * @param {number} score
 * @param {import('./board').Board} board
 * @returns {void}
 */
export function drawScore(score, board) {
    let ctx = board.ctx;

    ctx.font = `${GAME_TEXT_FONT_SIZE * board.ratio}px ${GAME_TEXT_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = GAME_TEXT_COLOR;
    ctx.fillText(score.toString(), board.canvas.width / 2, (board.canvas.height / 2) - ((GAME_TEXT_FONT_SIZE / 2) * board.ratio), board.canvas.width);
}

/**
 * @param {number} score
 * @param {import('./board').Board} board
 * @returns {void}
 */
export function drawHighScore(score, board) {
    let ctx = board.ctx;

    ctx.font = `${GAME_TEXT_FONT_SIZE * board.ratio}px ${GAME_TEXT_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = HIGH_SCORE_TEXT_COLOR;
    ctx.strokeText(score.toString(), board.canvas.width / 2, (board.canvas.height / 2) + ((GAME_TEXT_FONT_SIZE / 2) * board.ratio), board.canvas.width);
}

/**
 * @param {import('./board').Board} board
 * @returns {void}
 */
export function drawGameEnd(board) {
    let ctx = board.ctx;

    ctx.font = `${GAME_TEXT_FONT_SIZE * board.ratio}px ${GAME_TEXT_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = GAME_TEXT_COLOR;
    ctx.fillText('DED', board.canvas.width / 2, board.canvas.height / 2, board.canvas.width);
}

/**
 * @param {{ x: number; y: number; }} snakePart
 * @param {string} color
 * @param {string} borderColor
 * @param {boolean} isGlowing
 * @param {import('./board').Board} board
 * @returns {void}
 */
function drawSnakePart(snakePart, color, borderColor, isGlowing, board) {
    let ctx = board.ctx;

    withStraddle(ctx, () => {
        ctx.fillStyle = color;
        ctx.strokeStyle = borderColor;

        if (isGlowing) {
            // https://stackoverflow.com/a/43676108
            ctx.lineCap = 'round';
            ctx.shadowBlur = 18;
            ctx.shadowColor = color;
        }

        ctx.fillRect(snakePart.x, snakePart.y, board.blockSize, board.blockSize);
        ctx.strokeRect(snakePart.x, snakePart.y, board.blockSize, board.blockSize);

        if (isGlowing) {
            // reset to defaults
            ctx.lineCap = 'butt';
            ctx.shadowBlur = 0;
        }
    });
}
