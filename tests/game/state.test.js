import { jest } from '@jest/globals';
import { GameState } from '../../src/js/game/state';
import { GAME_CONFIG } from '../../src/js/config';

const { GAME, STATE } = GAME_CONFIG;

describe('GameState', () => {
    let gameState;
    let localStorageMock;

    beforeEach(() => {
        localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
        };
        Object.defineProperty(global, 'localStorage', { value: localStorageMock });
        gameState = new GameState();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Score and High Score Management', () => {
        test('should initialize with zero score', () => {
            expect(gameState.score).toBe(0);
        });

        test('should update score correctly', () => {
            gameState.updateScore(10);
            expect(gameState.score).toBe(10);
            gameState.updateScore(5);
            expect(gameState.score).toBe(15);
        });

        test('should initialize high score from localStorage', () => {
            localStorageMock.getItem.mockReturnValue('100');
            gameState = new GameState();
            expect(gameState.highScore).toBe(100);
        });

        test('should update high score when current score is higher', () => {
            localStorageMock.getItem.mockReturnValue('50');
            gameState = new GameState();
            gameState.updateScore(60);
            gameState.updateHighScore();
            expect(gameState.highScore).toBe(60);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(STATE.LOCAL_STORAGE_KEY_HIGH_SCORE, '60');
        });

        test('should not update high score when current score is lower', () => {
            localStorageMock.getItem.mockReturnValue('100');
            gameState = new GameState();
            gameState.updateScore(50);
            gameState.updateHighScore();
            expect(gameState.highScore).toBe(100);
            expect(localStorageMock.setItem).not.toHaveBeenCalled();
        });

        test('should handle localStorage not available', () => {
            Object.defineProperty(global, 'localStorage', { value: undefined });
            gameState = new GameState();
            expect(gameState.highScore).toBe(0);
            gameState.updateScore(10);
            gameState.updateHighScore();
            expect(gameState.highScore).toBe(10);
        });

        test('should handle localStorage throwing an error', () => {
            localStorageMock.getItem.mockImplementation(() => {
                throw new Error('localStorage is not available');
            });
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('localStorage is not available');
            });
            gameState = new GameState();
            expect(gameState.highScore).toBe(0);
            gameState.updateScore(10);
            gameState.updateHighScore();
            expect(gameState.highScore).toBe(10);
        });
    });

    describe('Game Speed Management', () => {
        test('should initialize game speed from localStorage', () => {
            localStorageMock.getItem.mockReturnValue('150');
            gameState = new GameState();
            expect(gameState.speed).toBe(150);
        });

        test('should use default game speed if not set in localStorage', () => {
            localStorageMock.getItem.mockReturnValue(null);
            gameState = new GameState();
            expect(gameState.speed).toBe(GAME.SPEED_MS__ARROW);
        });

        test('should set game speed correctly', () => {
            gameState.setSpeed(200);
            expect(gameState.speed).toBe(200);
        });

        test('should set game speed to 0 if negative value is provided', () => {
            gameState.setSpeed(-100);
            expect(gameState.speed).toBe(0);
        });

        test('should round game speed to nearest integer', () => {
            gameState.setSpeed(150.7);
            expect(gameState.speed).toBe(151);
            gameState.setSpeed(149.2);
            expect(gameState.speed).toBe(149);
        });

        test('should handle non-numeric input for game speed', () => {
            const originalSpeed = gameState.speed;
            gameState.setSpeed('fast');
            expect(gameState.speed).toBe(originalSpeed);
            gameState.setSpeed(NaN);
            expect(gameState.speed).toBe(originalSpeed);
        });
    });

    describe('State Transitions', () => {
        test('should initialize with game not paused', () => {
            expect(gameState.paused).toBe(false);
        });

        test('should toggle pause state correctly', () => {
            gameState.togglePause();
            expect(gameState.paused).toBe(true);
            gameState.togglePause();
            expect(gameState.paused).toBe(false);
        });

        test('should initialize with game not ended', () => {
            expect(gameState.ended).toBe(false);
        });

        test('should end game correctly', () => {
            gameState.setSpeed(150);
            gameState.endGame();
            expect(gameState.ended).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(STATE.LOCAL_STORAGE_KEY_GAME_SPEED, '150');
        });

        test('should handle localStorage error when ending game', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('localStorage is not available');
            });
            gameState.setSpeed(150);
            gameState.endGame();
            expect(gameState.ended).toBe(true);
        });
    });
});
