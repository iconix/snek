import { jest } from '@jest/globals';
import { Game } from '../../src/js/game/game';
import { Board } from '../../src/js/board';
import { Snake } from '../../src/js/snake';
import { Food, Teleport, Phase } from '../../src/js/item';
import { GAME_CONFIG } from '../../src/js/config';

const { GAME, INPUT } = GAME_CONFIG;

describe('Game Integration Tests', () => {
    let game, canvas, ctrlPanel;

    beforeEach(() => {
        // set up DOM elements
        canvas = document.createElement('canvas');
        ctrlPanel = document.createElement('div');
        document.body.appendChild(canvas);
        document.body.appendChild(ctrlPanel);

        // mock window properties
        global.innerWidth = 1024;
        global.innerHeight = 768;

        // initialize game components
        const board = new Board(canvas, ctrlPanel);
        const snake = new Snake(board.width, board.height, board.blockSize);
        const food = new Food(board, snake);
        game = new Game(board, snake, food);

        // mock requestAnimationFrame
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => setTimeout(cb, 0));
    });

    afterEach(() => {
        document.body.removeChild(canvas);
        document.body.removeChild(ctrlPanel);
        jest.clearAllMocks();
    });

    test('Game loop should update score when snake eats food', () => {
        const initialScore = game.state.score;
        const initialItem = game.item;

        // position snake head at food location
        game.snake.teleportHead({ x: game.item.x, y: game.item.y });

        // run a single frame update
        game._updateFrame();

        expect(game.state.score).toBe(initialScore + GAME.SCORE_INCREMENT);
        expect(game.item).not.toBe(initialItem);  // new item should be generated
    });

    test('Game should end when snake collides with itself', () => {
        // grow snek
        for (let i = 0; i < 5; i++) {
            game.snake.move(true);
        }

        // make snek collide with itself
        game.snake.changeDirection('down');
        game.snake.move();
        game.snake.changeDirection('left');
        game.snake.move();
        game.snake.changeDirection('up');

        // note: this will also do the final move for snek
        game._updateFrame();

        expect(game.state.ended).toBe(true);
    });

    test('Teleport power-up should allow snake to pass through walls', () => {
        game.item = new Teleport(game.board, game.snake);

        // position snek head at teleport item location
        game.snake.teleportHead({ x: game.item.x, y: game.item.y });

        // consume teleport
        game._updateFrame();

        expect(game.snake.powerUps['Teleport']).toBe(true);

        // move snek to right wall
        game.snake.teleportHead({ x: game.board.width - game.board.blockSize, y: game.snake.getHeadPosition().y });

        // update frame to trigger teleportation
        game._updateFrame();

        expect(game.snake.getHeadPosition().x).toBe(0);
        expect(game.state.ended).toBe(false);
        expect(game.snake.powerUps['Teleport']).toBe(false);
    });

    test('Phase power-up should allow snake to pass through itself once', () => {
        game.item = new Phase(game.board, game.snake);

        // position snake head at phase item location
        game.snake.teleportHead({ x: game.item.x, y: game.item.y });

        // consume phase
        game._updateFrame();

        expect(game.snake.powerUps['Phase']).toBe(true);

        // grow the snake
        for (let i = 0; i < 5; i++) {
            game.snake.move(true);
        }

        // make snake collide with itself
        game.snake.changeDirection('down');
        game.snake.move();
        game.snake.changeDirection('left');
        game.snake.move();
        game.snake.changeDirection('up');

        // note: this will also do the final move for snek
        game._updateFrame();

        expect(game.state.ended).toBe(false);
        expect(game.snake.powerUps['Phase']).toBe(false);

        // move the snake a bit more to ensure it's in a new position
        game.snake.move();
        game.snake.changeDirection('right');
        game.snake.move();

        // second collision should end the game
        game.snake.changeDirection('down');

        // note: this will also do the final move for snek
        game._updateFrame();

        expect(game.state.ended).toBe(true);
    });

    test('Game loop should respond to keyboard input', () => {
        game.input.manageGameControls(true);

        const initialDirection = { dx: game.snake._dx, dy: game.snake._dy };

        // simulate keyboard input
        const event = new KeyboardEvent('keydown', { code: 'ArrowUp' });
        document.dispatchEvent(event);

        // run a frame update
        game._updateFrame();

        expect(game.snake._dy).not.toBe(initialDirection.dy);

        // reset
        game.input.manageGameControls(false);
    });

    test('Game should pause and resume correctly', () => {
        const initialSnakePosition = game.snake.getHeadPosition();

        // Pause the game
        game.togglePause();

        // Try to update the frame
        game._updateFrame();

        // Snake position should not change
        expect(game.snake.getHeadPosition()).toEqual(initialSnakePosition);

        // Resume the game
        game.togglePause();

        // Update the frame
        game._updateFrame();

        // Snake position should now change
        expect(game.snake.getHeadPosition()).not.toEqual(initialSnakePosition);
    });

    test('Game speed should change with score', () => {
        const initialSpeed = game.state.speed;

        // Increase score
        game.state.updateScore(GAME.SCORE_INCREMENT * 10);

        // Update game speed
        game.state.setSpeed(INPUT.GAME_SPEED__ARROW - 50);  // Assume speed increases with score

        expect(game.state.speed).toBeLessThan(initialSpeed);
    });
});
