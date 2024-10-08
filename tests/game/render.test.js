import { jest } from '@jest/globals';
import { MockBoard } from '../__mocks__/mockBoard';
import { MockGame } from '../__mocks__/mockGame';
import { MockItem } from '../__mocks__/mockItem';
import { MockSnake } from '../__mocks__/mockSnake';

import { createRenderFunctions } from '../../src/js/game/render';

describe('Render Functions', () => {
    let mockGame, mockBoard, mockSnake, mockItem;
    let mockCanvas, renderGame, renderGameOver;
    let setEndGameFilterSpy;

    beforeEach(() => {
        mockBoard = new MockBoard();
        mockSnake = new MockSnake();
        mockItem = new MockItem(mockBoard, mockSnake);
        mockGame = new MockGame(mockBoard, mockSnake, mockItem);
        setEndGameFilterSpy = jest.spyOn(MockBoard.prototype, 'setEndGameFilter');

        // create mock canvas functions
        mockCanvas = {
            drawGame: jest.fn(),
            drawScore: jest.fn(),
            drawHighScore: jest.fn(),
            drawItem: jest.fn(),
            drawSnake: jest.fn(),
            drawGameOver: jest.fn()
        };

        // create render functions with mocked canvas
        const renderFunctions = createRenderFunctions(mockCanvas);
        renderGame = renderFunctions.renderGame;
        renderGameOver = renderFunctions.renderGameOver;

        // reset all mocked functions
        jest.clearAllMocks();
    });

    afterEach(() => {
        setEndGameFilterSpy.mockRestore();
    });

    describe('renderGame', () => {
        test('should call all necessary drawing functions', () => {
            renderGame(mockGame);

            expect(mockCanvas.drawGame).toHaveBeenCalledWith(mockGame);
            expect(mockCanvas.drawScore).toHaveBeenCalledWith(mockGame.state.score, mockGame.board);
            expect(mockCanvas.drawHighScore).toHaveBeenCalledWith(mockGame.state.highScore, mockGame.board);
            expect(mockCanvas.drawItem).toHaveBeenCalledWith(mockGame.item, mockGame.board);
            expect(mockCanvas.drawSnake).toHaveBeenCalledWith(mockGame.snake, mockGame.board);
        });
    });

    describe('renderGameOver', () => {
        test('should call all necessary drawing functions and set end game filter', () => {
            renderGameOver(mockGame);

            expect(mockGame.board.setEndGameFilter).toHaveBeenCalled();
            expect(mockCanvas.drawGame).toHaveBeenCalledWith(mockGame);
            expect(mockCanvas.drawItem).toHaveBeenCalledWith(mockGame.item, mockGame.board);
            expect(mockCanvas.drawSnake).toHaveBeenCalledWith(mockGame.snake, mockGame.board);
            expect(mockCanvas.drawGameOver).toHaveBeenCalledWith(mockGame.board);
        });
    });
});
