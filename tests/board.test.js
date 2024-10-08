import { jest } from '@jest/globals';
import { Board } from '../src/js/board';
import { GAME_CONFIG } from '../src/js/config';

const { BOARD } = GAME_CONFIG;

describe('Board', () => {
    let canvas, ctrlPanel;

    beforeAll(() => {
        canvas = document.createElement('canvas');
        ctrlPanel = document.createElement('div');
        document.body.appendChild(ctrlPanel);
        document.body.appendChild(canvas);

        // mock window methods
        global.innerWidth = 1024;
        global.innerHeight = 768;
        global.devicePixelRatio = 1;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should initialize with correct properties', () => {
        const board = new Board(canvas, ctrlPanel);
        expect(board.canvas).toBe(canvas);
        expect(board.color).toBe(BOARD.DEFAULT_BACKGROUND_COLOR);
        expect(board.borderColor).toBe(BOARD.DEFAULT_BORDER_COLOR);
        expect(board.isGlowing).toBe(false);
        expect(board.activeFilter).toBe(BOARD.FILTERS.NONE);
    });

    test('should initialize with different sizes', () => {
        global.innerWidth = 800;
        global.innerHeight = 600;
        const board1 = new Board(canvas, ctrlPanel);

        global.innerWidth = 1920;
        global.innerHeight = 1080;
        const board2 = new Board(canvas, ctrlPanel);

        expect(board1.width).toBeLessThan(board2.width);
        expect(board1.height).toBeLessThan(board2.height);
    });

    test('should set and reset filters correctly', () => {
        const board = new Board(canvas, ctrlPanel);

        board.setEndGameFilter();
        expect(board.activeFilter).toBe(BOARD.FILTERS.ENDGAME);

        board.setPauseGameFilter();
        expect(board.activeFilter).toBe(BOARD.FILTERS.PAUSE);

        board.resetFilter();
        expect(board.activeFilter).toBe(BOARD.FILTERS.NONE);
    });

    test('should handle glow effect correctly', () => {
        const board = new Board(canvas, ctrlPanel);

        board.setGlow(true);
        expect(board.isGlowing).toBe(true);
        expect(board.color).toBe(BOARD.TELEPORT_BACKGROUND_COLOR);
        expect(board.borderColor).toBe(BOARD.TELEPORT_BORDER_COLOR);

        board.setGlow(false);
        expect(board.isGlowing).toBe(false);
        expect(board.color).toBe(BOARD.DEFAULT_BACKGROUND_COLOR);
        expect(board.borderColor).toBe(BOARD.DEFAULT_BORDER_COLOR);
    });

    test('should handle fullscreen mode entry and exit', () => {
        const board = new Board(canvas, ctrlPanel);

        // Mock fullscreen methods
        canvas.requestFullscreen = jest.fn().mockResolvedValue();
        document.exitFullscreen = jest.fn().mockResolvedValue();

        board.enterFullScreen();
        expect(canvas.requestFullscreen).toHaveBeenCalled();

        board.exitFullScreen();
        expect(document.exitFullscreen).toHaveBeenCalled();
    });

    test('should create and remove motion request button', () => {
        const board = new Board(canvas, ctrlPanel);

        const btn = board.createMotionRequestButton();
        expect(btn).toBeDefined();
        expect(btn?.id).toBe('motionRequest');
        expect(ctrlPanel.contains(btn)).toBe(true);

        board.removeMotionRequestButton();
        expect(ctrlPanel.contains(btn)).toBe(false);
    });

    test('should return existing motion request button if already created', () => {
        const board = new Board(canvas, ctrlPanel);

        const firstBtn = board.createMotionRequestButton();
        expect(firstBtn).toBeDefined();
        expect(firstBtn?.id).toBe('motionRequest');
        expect(ctrlPanel.contains(firstBtn)).toBe(true);

        const secondBtn = board.createMotionRequestButton();
        expect(secondBtn).toBe(firstBtn);
        expect(ctrlPanel.querySelectorAll('#motionRequest').length).toBe(1);

        board.removeMotionRequestButton();
        expect(ctrlPanel.contains(firstBtn)).toBe(false);
    });

    test('should check for motion permission correctly', () => {
        const board = new Board(canvas, ctrlPanel);

        expect(board.needsPermission()).toBe(false);

        board.createMotionRequestButton();
        expect(board.needsPermission()).toBe(true);

        board.removeMotionRequestButton();
        expect(board.needsPermission()).toBe(false);
    });
});
