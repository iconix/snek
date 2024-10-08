import { jest } from '@jest/globals';

import { GAME_CONFIG } from '../../src/js/config';
import { Game } from '../../src/js/game/game';
import { GameState } from '../../src/js/game/state';

import { MockBoard } from '../__mocks__/mockBoard';
import { MockItem } from '../__mocks__/mockItem';
import { MockSnake } from '../__mocks__/mockSnake';

describe('Game', () => {
    let game, mockSnake, mockItem;
    let resetFilterSpy, setPauseGameFilterSpy;
    let pauseSpy, unpauseSpy, didEatSpy, didCollideSpy;
    let updateFrameSpy;
    let updateHighScoreSpy;

    /**
     * @type {MockBoard}
     */
    let mockBoard;

    beforeEach(() => {
        mockBoard = new MockBoard();
        resetFilterSpy = jest.spyOn(MockBoard.prototype, 'resetFilter');
        setPauseGameFilterSpy = jest.spyOn(MockBoard.prototype, 'setPauseGameFilter');

        mockSnake = new MockSnake();
        pauseSpy = jest.spyOn(MockSnake.prototype, 'pause');
        unpauseSpy = jest.spyOn(MockSnake.prototype, 'unpause');
        didEatSpy = jest.spyOn(MockSnake.prototype, 'didEat');
        didCollideSpy = jest.spyOn(MockSnake.prototype, 'didCollide');

        mockItem = new MockItem(mockBoard, mockSnake);

        game = new Game(mockBoard, mockSnake, mockItem);
        // @ts-ignore
        updateFrameSpy = jest.spyOn(game, '_updateFrame');

        updateHighScoreSpy = jest.spyOn(GameState.prototype, 'updateHighScore');
    });

    afterEach(() => {
        resetFilterSpy.mockRestore();
        setPauseGameFilterSpy.mockRestore();
        pauseSpy.mockRestore();
        unpauseSpy.mockRestore();
        didEatSpy.mockRestore();
        updateHighScoreSpy.mockRestore();
        didCollideSpy.mockRestore();
    });

    test('should initialize correctly', () => {
        expect(game.board).toBe(mockBoard);
        expect(game.snake).toBe(mockSnake);
        expect(game.item).toBe(mockItem);
        expect(game.state.score).toBe(0);
        expect(game.state.ended).toBe(false);
        expect(game.state.paused).toBe(false);
        expect(game.input).toBeDefined();
    });

    test('should toggle pause correctly', () => {
        game.togglePause();
        expect(game.state.paused).toBe(true);
        expect(mockSnake.pause).toHaveBeenCalled();
        expect(mockBoard.setPauseGameFilter).toHaveBeenCalled();

        game.togglePause();
        expect(game.state.paused).toBe(false);
        expect(mockSnake.unpause).toHaveBeenCalled();
        expect(mockBoard.resetFilter).toHaveBeenCalled();
    });

    test('should handle game over correctly', () => {
        game._end();
        expect(game.state.ended).toBe(true);
        expect(game.state.updateHighScore).toHaveBeenCalled();
    });

    test('should update score when snake eats food', () => {
        const initialScore = game.state.score;
        mockSnake.didEat.mockReturnValue(true);
        game._advanceSnake();
        expect(game.state.score).toBeGreaterThan(initialScore);
    });

    test('should generate new item when snake eats food', () => {
        mockSnake.didEat.mockReturnValue(true);
        const initialItem = game.item;
        game._advanceSnake();
        expect(game.item).not.toBe(initialItem);
    });

    test('run method should update game state correctly over time', () => {
        // mock performance.now() to control time
        const performanceNow = jest.spyOn(performance, 'now');
        let currentTime = 0;
        performanceNow.mockImplementation(() => currentTime);

        // mock requestAnimationFrame to control when frames are rendered
        const mockRequestAnimationFrame = jest.fn();
        global.requestAnimationFrame = mockRequestAnimationFrame;

        game.run(currentTime);

        // simulate passage of time and multiple frame updates
        for (let i = 0; i < 5; i++) {
            // advance time by the game speed
            currentTime += game.state.speed;

            // call the callback passed to requestAnimationFrame
            mockRequestAnimationFrame.mock.calls[i][0](currentTime);

            expect(updateFrameSpy).toHaveBeenCalledTimes(i + 1);
        }

        // simulate snake eating food
        mockSnake.didEat.mockReturnValue(true);
        currentTime += game.state.speed;
        mockRequestAnimationFrame.mock.calls[5][0](currentTime);

        // check if score was updated
        expect(game.state.score).toBe(GAME_CONFIG.GAME.SCORE_INCREMENT);

        // simulate game over condition
        mockSnake.didCollide.mockReturnValue(true);
        currentTime += game.state.speed;
        mockRequestAnimationFrame.mock.calls[6][0](currentTime);

        // check if game ended
        expect(game.state.ended).toBe(true);

        // clean up
        performanceNow.mockRestore();
    });
});
