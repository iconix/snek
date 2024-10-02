import * as defaultCanvas from '../canvas';

// fn to create render functions with canvas as injected dependency
export function createRenderFunctions(canvas = defaultCanvas) {
    /**
     * Renders the current game state.
     * @param {import('./game').Game} game - game object to render
     */
    function renderGame(game) {
        canvas.drawGame(game);
        canvas.drawScore(game.state.score, game.board);
        canvas.drawHighScore(game.state.highScore, game.board);
        canvas.drawItem(game.item, game.board);
        canvas.drawSnake(game.snake, game.board);
    }

    /**
     * Renders the game over state.
     * @param {import('./game').Game} game - game object to render
     */
    function renderGameOver(game) {
        game.board.setEndGameFilter();
        canvas.drawGame(game);
        canvas.drawItem(game.item, game.board);
        canvas.drawSnake(game.snake, game.board);
        canvas.drawGameOver(game.board);
    }

    return { renderGame, renderGameOver };
}

// export the default render functions
const { renderGame, renderGameOver } = createRenderFunctions();
export { renderGame, renderGameOver };
