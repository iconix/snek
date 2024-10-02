import { GAME_CONFIG } from './config';

const { ERROR } = GAME_CONFIG;

/**
 * Displays an error message on the screen.
 * @param {string} message - error message to display
 * @param {HTMLCanvasElement | HTMLElement | null} canvas - game canvas (if available)
 */
export function displayErrorMessage(message, canvas = null) {
    if (canvas && canvas instanceof HTMLCanvasElement) {
        displayErrorOnCanvas(message, canvas);
    } else {
        displayErrorInDOM(message);
    }
}

/**
 * Displays an error message on the canvas.
 * @param {string} message - error message to display
 * @param {HTMLCanvasElement} canvas - game canvas
 * @private
 */
function displayErrorOnCanvas(message, canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('unable to get 2D context from canvas');
        displayErrorInDOM(message);
        return;
    }

    // save the current canvas state
    ctx.save();

    // set up the error message style
    ctx.font = ERROR.MESSAGE_FONT;
    ctx.fillStyle = ERROR.MESSAGE_BACKGROUND;

    // calculate message width and position
    const messageWidth = ctx.measureText(message).width + 20; // Add some padding
    const messageHeight = 30;
    const messageX = (canvas.width - messageWidth) / 2;
    const messageY = canvas.height / 2 - messageHeight / 2;

    // draw the background
    ctx.fillRect(messageX, messageY, messageWidth, messageHeight);

    // draw the error message
    ctx.fillStyle = ERROR.MESSAGE_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);

    // restore the canvas state
    ctx.restore();

    // remove the error message after a set duration
    // setTimeout(() => {
    //     ctx.clearRect(0, 0, canvas.width, canvas.height);
    //     // note: not redrawing the game here as we might not have a valid game state
    // }, ERROR_MESSAGE_DURATION);
}

/**
 * Displays an error message in the DOM.
 * @param {string} message - error message to display
 * @private
 */
function displayErrorInDOM(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '50%';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translate(-50%, -50%)';
    errorDiv.style.backgroundColor = ERROR.MESSAGE_BACKGROUND;
    errorDiv.style.color = ERROR.MESSAGE_COLOR;
    errorDiv.style.padding = '15px';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.zIndex = '1000';

    // preserve line breaks in multi-line messages
    errorDiv.style.whiteSpace = 'pre-wrap';

    // for long messages, add a max-width and use word-wrapping
    errorDiv.style.maxWidth = '80%';
    errorDiv.style.overflowWrap = 'break-word';

    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    // setTimeout(() => {
    //     document.body.removeChild(errorDiv);
    // }, ERROR_MESSAGE_DURATION);
}
