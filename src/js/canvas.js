const CANVAS_BACKGROUND_COLOR = 'white';
const CANVAS_BORDER_COLOR = 'darkgreen';
const EXCLAMATION_BTN_COLOR = 'darkkhaki';
const GAME_TEXT_COLOR = 'gray';
const PAUSE_BTN_COLOR = 'darkgreen';
const SNAKE_BORDER_COLOR = 'darkgreen';
const SNAKE_COLOR = 'lightgreen';

const GAME_TEXT_FONT_FAMILY = '"Saira", serif';

const GAME_TEXT_FONT_SIZE = 50;

const PAUSE_ICON_CHAR_CODE = 0xF4BF;
const EXCLAMATION_ICON_CHAR_CODE = 0xF33A;

/**
 * a fake contextmanager
 * for pixel sharpness https://stackoverflow.com/a/8696641
**/
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

export function drawGame(game) {
    let board = game.board;
    let ctx = board.ctx;

    withStraddle(ctx, () => {
        // set border and background colors
        ctx.filter = board.activeFilter;
        ctx.fillStyle = CANVAS_BACKGROUND_COLOR;
        ctx.strokeStyle = CANVAS_BORDER_COLOR;

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
            ), 30 * board.ratio, 50 * board.ratio);
        }
    });
}

export function drawSnake(snake, board) {
    // TODO: avoid private access here
    snake._body.forEach(snakePart => drawSnakePart(snakePart, board));
}

export function drawItem(item, board) {
    let ctx = board.ctx;

    withStraddle(ctx, () => {
        ctx.fillStyle = item.fill_color;
        ctx.strokeStyle = item.border_color;
        ctx.fillRect(item.x, item.y, board.blockSize, board.blockSize);
        ctx.strokeRect(item.x, item.y, board.blockSize, board.blockSize);
    });
}

export function drawScore(score, board) {
    let ctx = board.ctx;

    ctx.font = `${GAME_TEXT_FONT_SIZE * board.ratio}px ${GAME_TEXT_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = GAME_TEXT_COLOR;
    ctx.fillText(score, board.canvas.width / 2, board.canvas.height / 2, board.canvas.width);
}

export function drawGameEnd(board) {
    let ctx = board.ctx;

    ctx.font = `${GAME_TEXT_FONT_SIZE * board.ratio}px ${GAME_TEXT_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = GAME_TEXT_COLOR;
    ctx.fillText('DED', board.canvas.width / 2, board.canvas.height / 2, board.canvas.width);
}

function drawSnakePart(snakePart, board) {
    let ctx = board.ctx;

    withStraddle(ctx, () => {
        ctx.fillStyle = SNAKE_COLOR;
        ctx.strokeStyle = SNAKE_BORDER_COLOR;
        ctx.fillRect(snakePart.x, snakePart.y, board.blockSize, board.blockSize);
        ctx.strokeRect(snakePart.x, snakePart.y, board.blockSize, board.blockSize);
    });
}
