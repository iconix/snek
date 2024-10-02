import { jest } from '@jest/globals';
import { GAME_CONFIG } from '../../src/js/config';
import { DIRECTION_DOWN, DIRECTION_LEFT, DIRECTION_RIGHT, DIRECTION_UP } from '../../src/js/direction';
import { InputHandler } from '../../src/js/game/input';
import { MockBoard } from '../__mocks__/mockBoard';
import { MockGame } from '../__mocks__/mockGame';
import { MockItem } from '../__mocks__/mockItem';
import { MockSnake } from '../__mocks__/mockSnake';

const { INPUT } = GAME_CONFIG;

// mock DeviceOrientationEvent
class MockDeviceOrientationEvent extends Event {
    constructor(type, eventInitDict) {
        super(type, eventInitDict);
        this.alpha = eventInitDict.alpha ?? null;
        this.beta = eventInitDict.beta ?? null;
        this.gamma = eventInitDict.gamma ?? null;
        this.absolute = eventInitDict.absolute ?? false;
    }
}

global.DeviceOrientationEvent = MockDeviceOrientationEvent;

// helper fn to create a mock Touch object
function createMockTouch(x, y) {
    return {
        identifier: 0,
        target: document.body,
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y,
        pageX: x,
        pageY: y,
        radiusX: 2.5,
        radiusY: 2.5,
        rotationAngle: 10,
        force: 1,
    };
}

describe('InputHandler', () => {
    let mockCanvas, mockControlPanel;
    let inputHandler, mockBoard, mockItem, mockSnake, mockGame;
    let changeDirectionSpy, exitFullScreenSpy, restartSpy, togglePauseSpy;

    beforeAll(() => {
        mockControlPanel = document.createElement('div');
        mockControlPanel.id = 'controlPanel';
        mockCanvas = document.createElement('canvas');
        mockCanvas.id = 'gameCanvas';

        document.body.appendChild(mockControlPanel);
        document.body.appendChild(mockCanvas);
    });

    afterAll(() => {
        document.body.removeChild(mockControlPanel);
        document.body.removeChild(mockCanvas);
    });

    beforeEach(() => {
        mockSnake = new MockSnake();
        changeDirectionSpy = jest.spyOn(MockSnake.prototype, 'changeDirection');

        mockBoard = new MockBoard();
        exitFullScreenSpy = jest.spyOn(MockBoard.prototype, 'exitFullScreen');

        mockItem = new MockItem(mockBoard, mockSnake);

        mockGame = new MockGame(mockBoard, mockSnake, mockItem);
        togglePauseSpy = jest.spyOn(MockGame.prototype, 'togglePause');
        restartSpy = jest.spyOn(MockGame.prototype, 'restart');

        inputHandler = new InputHandler(mockGame);
        inputHandler.manageGameControls(true);
    });

    afterEach(() => {
        inputHandler.manageGameControls(false);

        changeDirectionSpy.mockRestore();
        togglePauseSpy.mockRestore();
        restartSpy.mockRestore();
        exitFullScreenSpy.mockRestore();
    });

    describe('Keyboard input handling', () => {
        test('should change snake direction on arrow key press', () => {
            const leftKeyEvent = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
            document.dispatchEvent(leftKeyEvent);
            expect(mockSnake.changeDirection).toHaveBeenCalledWith(DIRECTION_LEFT);

            const rightKeyEvent = new KeyboardEvent('keydown', { code: 'ArrowRight' });
            document.dispatchEvent(rightKeyEvent);
            expect(mockSnake.changeDirection).toHaveBeenCalledWith(DIRECTION_RIGHT);

            const upKeyEvent = new KeyboardEvent('keydown', { code: 'ArrowUp' });
            document.dispatchEvent(upKeyEvent);
            expect(mockSnake.changeDirection).toHaveBeenCalledWith(DIRECTION_UP);

            const downKeyEvent = new KeyboardEvent('keydown', { code: 'ArrowDown' });
            document.dispatchEvent(downKeyEvent);
            expect(mockSnake.changeDirection).toHaveBeenCalledWith(DIRECTION_DOWN);
        });

        test('should toggle pause on space key press', () => {
            const keyboardEvent = new KeyboardEvent('keydown', { code: 'Space' });
            document.dispatchEvent(keyboardEvent);
            expect(mockGame.togglePause).toHaveBeenCalled();
        });

        test('should restart game on space key press when game is ended', () => {
            mockGame.state._ended = true;
            inputHandler.manageRestartControls(true);

            const keyboardEvent = new KeyboardEvent('keydown', { code: 'Space' });
            document.dispatchEvent(keyboardEvent);
            expect(mockGame.restart).toHaveBeenCalled();

            inputHandler.manageRestartControls(false);
        });
    });

    describe('Touch input handling', () => {
        test('should handle swipe gestures', () => {
            const touchStartEvent = new TouchEvent('touchstart', {
                changedTouches: [createMockTouch(0, 0)]
            });
            const touchEndEvent = new TouchEvent('touchend', {
                changedTouches: [createMockTouch(0, INPUT.SWIPE_SENSITIVITY + 1)]
            });

            mockBoard.canvas.dispatchEvent(touchStartEvent);
            mockBoard.canvas.dispatchEvent(touchEndEvent);

            expect(mockGame.board.exitFullScreen).toHaveBeenCalled();
        });

        test('should toggle pause on non-swipe touch', () => {
            const touchStartEvent = new TouchEvent('touchstart', {
                changedTouches: [createMockTouch(0, 0)]
            });
            const touchEndEvent = new TouchEvent('touchend', {
                changedTouches: [createMockTouch(0, INPUT.SWIPE_SENSITIVITY - 1)]
            });

            mockBoard.canvas.dispatchEvent(touchStartEvent);
            mockBoard.canvas.dispatchEvent(touchEndEvent);

            expect(mockGame.togglePause).toHaveBeenCalled();
        });
    });

    describe('Device orientation input handling', () => {
        test('should handle device orientation changes', () => {
            // mock the initial orientation
            const initialEvent = new MockDeviceOrientationEvent('deviceorientation', {
                beta: 0,
                gamma: 0
            });
            window.dispatchEvent(initialEvent);

            // simulate a significant change in orientation
            const changedEvent = new MockDeviceOrientationEvent('deviceorientation', {
                beta: 30,
                gamma: 50
            });
            window.dispatchEvent(changedEvent);

            expect(mockSnake.changeDirection).toHaveBeenCalled();
        });

        test('should not handle small device orientation changes', () => {
            // mock the initial orientation
            const initialEvent = new MockDeviceOrientationEvent('deviceorientation', {
                beta: 0,
                gamma: 0
            });
            window.dispatchEvent(initialEvent);

            // simulate a small change in orientation
            const changedEvent = new MockDeviceOrientationEvent('deviceorientation', {
                beta: 5,
                gamma: 5
            });
            window.dispatchEvent(changedEvent);

            expect(mockSnake.changeDirection).not.toHaveBeenCalled();
        });
    });

    describe('Visibility change handling', () => {
        test('should pause game when document becomes hidden', () => {
            Object.defineProperty(document, 'hidden', {
                configurable: true,
                get: () => true
            });

            const visibilityChangeEvent = new Event('visibilitychange');
            document.dispatchEvent(visibilityChangeEvent);

            expect(mockGame.togglePause).toHaveBeenCalled();
        });

        test('should not pause game when document becomes visible', () => {
            Object.defineProperty(document, 'hidden', {
                configurable: true,
                get: () => false
            });

            const visibilityChangeEvent = new Event('visibilitychange');
            document.dispatchEvent(visibilityChangeEvent);

            expect(mockGame.togglePause).not.toHaveBeenCalled();
        });
    });
});
