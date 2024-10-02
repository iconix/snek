import { jest } from '@jest/globals';
import { displayErrorMessage } from '../src/js/error';
import { GAME_CONFIG } from '../src/js/config';

const { ERROR } = GAME_CONFIG;

describe('Error Handling', () => {
    let mockCanvas, mockCtx, consoleSpy;

    beforeEach(() => {
        // set up a mock canvas and its context
        mockCanvas = {
            width: 500,
            height: 500,
            getContext: jest.fn()
        };
        mockCtx = {
            save: jest.fn(),
            restore: jest.fn(),
            fillRect: jest.fn(),
            fillText: jest.fn(),
            measureText: jest.fn(() => ({ width: 100 })),
            textAlign: '',
            textBaseline: '',
            fillStyle: '',
            font: ''
        };

        // ensure mockCanvas passes the instanceof HTMLCanvasElement check
        Object.setPrototypeOf(mockCanvas, HTMLCanvasElement.prototype);

        mockCanvas.getContext.mockReturnValue(mockCtx);

        // spy on console.error
        consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // mock document.body for DOM-based error display
        document.body.innerHTML = '';
    });

    afterEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '';
    });

    function assertErrorDiv(errorDiv, expectedMessage) {
        expect(errorDiv).not.toBeNull();
        if (errorDiv) {
            expect(errorDiv.textContent).toBe(expectedMessage);
            expect(errorDiv.style.backgroundColor).toBe(ERROR.MESSAGE_BACKGROUND);
            expect(errorDiv.style.color).toBe(ERROR.MESSAGE_COLOR);
        } else {
            fail('Error div was not created');
        }
    }

    test('should display error message on canvas when canvas is provided', () => {
        const errorMessage = 'Test error message';
        displayErrorMessage(errorMessage, mockCanvas);

        expect(mockCtx.save).toHaveBeenCalled();
        expect(mockCtx.fillRect).toHaveBeenCalled();
        expect(mockCtx.fillText).toHaveBeenCalledWith(errorMessage, 250, 250);
        expect(mockCtx.restore).toHaveBeenCalled();
    });

    test('should display error message in DOM when canvas is not provided', () => {
        const errorMessage = 'Test error message';
        displayErrorMessage(errorMessage);

        const errorDiv = document.body.querySelector('div');
        assertErrorDiv(errorDiv, errorMessage);
    });

    test('should fall back to DOM display if canvas context cannot be obtained', () => {
        const errorMessage = 'Test error message';
        mockCanvas.getContext.mockReturnValue(null);

        displayErrorMessage(errorMessage, mockCanvas);

        expect(consoleSpy).toHaveBeenCalledWith('unable to get 2D context from canvas');
        const errorDiv = document.body.querySelector('div');
        assertErrorDiv(errorDiv, errorMessage);
    });

    test('should handle long error messages on canvas', () => {
        const longErrorMessage = 'This is a very long error message that might exceed the canvas width';
        mockCtx.measureText.mockReturnValue({ width: 600 }); // simulate a long text

        displayErrorMessage(longErrorMessage, mockCanvas);

        expect(mockCtx.fillRect).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 620, 30);
        expect(mockCtx.fillText).toHaveBeenCalledWith(longErrorMessage, 250, 250);
    });

    test('should set correct canvas context properties', () => {
        const errorMessage = 'Test error message';
        displayErrorMessage(errorMessage, mockCanvas);

        expect(mockCtx.font).toBe(ERROR.MESSAGE_FONT);
        expect(mockCtx.fillStyle).toBe(ERROR.MESSAGE_COLOR);
        expect(mockCtx.textAlign).toBe('center');
        expect(mockCtx.textBaseline).toBe('middle');
    });

    test('should create error message with correct styling in DOM', () => {
        const errorMessage = 'Test error message';
        displayErrorMessage(errorMessage);

        const errorDiv = document.body.querySelector('div');
        assertErrorDiv(errorDiv, errorMessage);
        if (errorDiv) {
            expect(errorDiv.style.position).toBe('fixed');
            expect(errorDiv.style.top).toBe('50%');
            expect(errorDiv.style.left).toBe('50%');
            expect(errorDiv.style.transform).toBe('translate(-50%, -50%)');
            expect(errorDiv.style.zIndex).toBe('1000');
        }
    });

    test('should handle HTML elements correctly when displaying error in DOM', () => {
        const errorMessage = '<strong>Error:</strong> Something went <em>wrong</em>!';
        displayErrorMessage(errorMessage);

        const errorDiv = document.body.querySelector('div');
        assertErrorDiv(errorDiv, errorMessage);
        if (errorDiv) {
            // it should not interpret HTML
            expect(errorDiv.innerHTML).not.toBe(errorMessage);
            expect(errorDiv.innerHTML).not.toContain('<strong>');
            expect(errorDiv.innerHTML).not.toContain('<em>');
        }
    });

    test('should display long error message correctly in DOM', () => {
        const errorMessage = 'This is a very long error message that exceeds the typical length of an error message and might cause wrapping or truncation issues if not handled properly';
        displayErrorMessage(errorMessage);

        const errorDiv = document.body.querySelector('div');
        assertErrorDiv(errorDiv, errorMessage);

        if (errorDiv) {
            expect(errorDiv.style.maxWidth).toBe('80%');
            expect(errorDiv.style.overflowWrap).toBe('break-word');
        }
    });

    test('should display error message with special characters correctly in DOM', () => {
        const errorMessage = 'Error: "Quotes" & <Brackets> & 日本語';
        displayErrorMessage(errorMessage);

        const errorDiv = document.body.querySelector('div');
        assertErrorDiv(errorDiv, errorMessage);
    });

    test('should handle multi-line error message in DOM', () => {
        const errorMessage = 'Line 1\nLine 2\nLine 3';
        displayErrorMessage(errorMessage);

        const errorDiv = document.body.querySelector('div');
        assertErrorDiv(errorDiv, errorMessage);

        // Check for preserved line breaks
        if (errorDiv) {
            expect(errorDiv.style.whiteSpace).toBe('pre-wrap');
        }
    });
});
