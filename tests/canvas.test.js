import { jest } from '@jest/globals';
import { drawGame, drawGameOver, drawHighScore, drawItem, drawScore, drawSnake } from '../src/js/canvas';
import { GAME_CONFIG } from '../src/js/config';
import { MockBoard } from './__mocks__/mockBoard';
import { MockContext } from './__mocks__/mockContext';
import { MockGame, MockGameState } from './__mocks__/mockGame';
import { MockItem } from './__mocks__/mockItem';
import { MockSnake } from './__mocks__/mockSnake';

const { BOARD, CANVAS } = GAME_CONFIG;

const captureContextState = (mockFn) => {
    let captured = {};
    mockFn.mockImplementation(function() {
        captured = {
            font: this.font,
            textAlign: this.textAlign,
            fillStyle: this.fillStyle,
            strokeStyle: this.strokeStyle,
            filter: this.filter,
            lineCap: this.lineCap,
            shadowBlur: this.shadowBlur,
            shadowColor: this.shadowColor,
        };
    });
    return () => captured;
};

describe('Canvas Drawing Functions', () => {
    let mockContext, mockBoard, mockSnake, mockItem, mockGame;
    let contextSaveSpy;

    beforeEach(() => {
        mockContext = new MockContext();
        contextSaveSpy = jest.spyOn(MockContext.prototype, 'save');

        mockBoard = new MockBoard();
        mockBoard.ctx = mockContext;
        // @ts-ignore
        mockBoard._canvas = { width: 300, height: 300, style: {} };
        mockBoard._blockSize = 10;
        mockBoard._ratio = 1;
        mockSnake = new MockSnake();
        mockItem = new MockItem(mockBoard, mockSnake);
        mockGame = new MockGame(mockBoard, mockSnake, mockItem);
        mockGame.state = new MockGameState({
            score: 100,
            highScore: 500,
            paused: false
        });

        jest.clearAllMocks();
    });

    afterEach(() => {
        contextSaveSpy.mockRestore();
    });

    describe('drawGame', () => {
        test('should draw game background and border', () => {
            drawGame(mockGame);

            expect(mockContext.fillStyle).toBe(MockContext.normalizeColor(BOARD.DEFAULT_BACKGROUND_COLOR));
            expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, mockBoard.canvas.width, mockBoard.canvas.height);
            expect(mockBoard.canvas.style.border).toBe(`2px solid ${BOARD.DEFAULT_BORDER_COLOR}`);
        });

        test('should apply glow effect when board is glowing', () => {
            mockBoard.setGlow(true);
            drawGame(mockGame);

            expect(mockContext.fillStyle).toBe(MockContext.normalizeColor(BOARD.TELEPORT_BACKGROUND_COLOR));
            expect(mockBoard.canvas.style.boxShadow).toBe(`0 0 10px ${BOARD.TELEPORT_BACKGROUND_COLOR}`);
        });
    });

    describe('drawSnake', () => {
        test('should draw each segment of the snake', () => {
            const mockSegments = [
                { x: 10, y: 20 },
                { x: 20, y: 20 },
                { x: 30, y: 20 }
            ];
            // @ts-ignore
            mockSnake.forEachSegment = jest.fn((callback) => mockSegments.forEach(callback));

            drawSnake(mockSnake, mockBoard);

            expect(mockContext.save).toHaveBeenCalled();
            expect(mockContext.translate).toHaveBeenCalledWith(0.5, 0.5);
            expect(mockContext.fillRect).toHaveBeenCalledTimes(mockSegments.length);
            expect(mockContext.strokeRect).toHaveBeenCalledTimes(mockSegments.length);
            expect(mockContext.restore).toHaveBeenCalled();

            // check if fillRect and strokeRect were called with correct parameters for each segment
            mockSegments.forEach(segment => {
                expect(mockContext.fillRect).toHaveBeenCalledWith(segment.x, segment.y, mockBoard.blockSize, mockBoard.blockSize);
                expect(mockContext.strokeRect).toHaveBeenCalledWith(segment.x, segment.y, mockBoard.blockSize, mockBoard.blockSize);
            });
        });

        test('should apply glow effect when snake is glowing', () => {
            mockSnake.setGlow(true);
            mockSnake.forEachSegment = jest.fn((/** @type {function} */ callback) => {
                expect(mockContext.lineCap).toBe('round');
                expect(mockContext.shadowBlur).toBe(18);
                expect(mockContext.shadowColor).toBe(MockContext.normalizeColor(mockSnake.color));
                callback({ x: 10, y: 20 });
            });

            drawSnake(mockSnake, mockBoard);
        });

        test('should not apply glow effect when snake is not glowing', () => {
            mockSnake.setGlow(false);
            mockSnake.forEachSegment = jest.fn((/** @type {function} */ callback) => {
                expect(mockContext.lineCap).toBe('butt');
                expect(mockContext.shadowBlur).toBe(0);
                expect(mockContext.shadowColor).toBe('#000000');
                callback({ x: 10, y: 20 });
            });

            drawSnake(mockSnake, mockBoard);
        });
    });

    describe('drawItem', () => {
        test('should draw the item correctly', () => {
            drawItem(mockItem, mockBoard);

            expect(mockContext.save).toHaveBeenCalled();
            expect(mockContext.translate).toHaveBeenCalledWith(0.5, 0.5);
            expect(mockContext.fillRect).toHaveBeenCalledWith(mockItem.x, mockItem.y, mockBoard.blockSize, mockBoard.blockSize);
            expect(mockContext.strokeRect).toHaveBeenCalledWith(mockItem.x, mockItem.y, mockBoard.blockSize, mockBoard.blockSize);
            expect(mockContext.restore).toHaveBeenCalled();

            expect(mockContext.fillStyle).toBe(MockContext.normalizeColor(mockItem.fillColor));
            expect(mockContext.strokeStyle).toBe(MockContext.normalizeColor(mockItem.borderColor));
        });
    });

    describe('drawScore', () => {
        test('should draw the current score', () => {
            const getCapturedState = captureContextState(mockContext.fillText);

            drawScore(mockGame.state.score, mockBoard);

            const captured = getCapturedState();

            expect(captured.font).toBe(`${CANVAS.GAME_TEXT_FONT_SIZE * mockBoard.ratio}px ${CANVAS.GAME_TEXT_FONT_FAMILY}`);
            expect(captured.textAlign).toBe('center');
            expect(captured.fillStyle).toBe(MockContext.normalizeColor(CANVAS.GAME_TEXT_COLOR));

            expect(mockContext.fillText).toHaveBeenCalledWith('100', 150, 125, 300);
            expect(mockContext.save).toHaveBeenCalled();
            expect(mockContext.restore).toHaveBeenCalled();
        });
    });

    describe('drawHighScore', () => {
        test('should draw the high score', () => {
            const getCapturedState = captureContextState(mockContext.strokeText);

            drawHighScore(mockGame.state.highScore, mockBoard);

            const captured = getCapturedState();

            expect(captured.font).toBe(`${CANVAS.GAME_TEXT_FONT_SIZE * mockBoard.ratio}px ${CANVAS.GAME_TEXT_FONT_FAMILY}`);
            expect(captured.textAlign).toBe('center');
            expect(captured.strokeStyle).toBe(MockContext.normalizeColor(CANVAS.HIGH_SCORE_TEXT_COLOR));
            expect(mockContext.strokeText).toHaveBeenCalledWith('500', 150, 175, 300);
        });
    });

    describe('drawGameOver', () => {
        test('should draw the game over message', () => {
            const getCapturedState = captureContextState(mockContext.fillText);

            drawGameOver(mockBoard);

            const captured = getCapturedState();

            expect(captured.font).toBe(`${CANVAS.GAME_TEXT_FONT_SIZE * mockBoard.ratio}px ${CANVAS.GAME_TEXT_FONT_FAMILY}`);
            expect(captured.textAlign).toBe('center');
            expect(captured.fillStyle).toBe(MockContext.normalizeColor(CANVAS.GAME_TEXT_COLOR));
            expect(mockContext.fillText).toHaveBeenCalledWith('DED', 150, 150, 300);
        });
    });
});
