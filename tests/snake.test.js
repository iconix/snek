import { jest } from '@jest/globals';

import { GAME_CONFIG } from '../src/js/config';
import { DIRECTION_LEFT, DIRECTION_UP } from '../src/js/direction';
import { PHASE_CLASSNAME, Phase, TELEPORT_CLASSNAME, Teleport } from '../src/js/item';
import { Snake } from '../src/js/snake';

import { MockBoard } from './__mocks__/mockBoard';

const { SNAKE } = GAME_CONFIG;

describe('Snake', () => {
    const boardWidth = 100;
    const boardHeight = 100;
    const blockSize = 10;

    /**
     * @type {Snake}
     */
    let snake;

    /**
     * @type {MockBoard}
     */
    let mockBoard;

    beforeEach(() => {
        mockBoard = new MockBoard();
        snake = new Snake(boardWidth, boardHeight, blockSize);
    });

    /* initialization unit tests */

    test('should initialize with correct properties', () => {
        expect(snake._body.length).toBe(5);
        expect(snake._dx).toBe(blockSize);
        expect(snake._dy).toBe(0);
        expect(snake._isChangingDirection).toBe(false);
        expect(snake.powerUps[TELEPORT_CLASSNAME]).toBe(false);
        expect(snake.powerUps[PHASE_CLASSNAME]).toBe(false);
    });

    test('should initialize without colliding', () => {
        expect(snake.didCollide(boardWidth, boardHeight, blockSize)).toBe(false);
    });

    /* movement unit tests */

    test('should move correctly', () => {
        const initialHead = snake.getHeadPosition();
        snake.move();
        const newHead = snake.getHeadPosition();
        expect(newHead.x).toBe(initialHead.x + blockSize);
        expect(newHead.y).toBe(initialHead.y);
        expect(snake._body.length).toBe(5);
    });

    test('should grow when moving and growing flag is true', () => {
        const initialLength = snake._body.length;
        snake.move(true);
        expect(snake._body.length).toBe(initialLength + 1);
    });

    /* direction change unit tests */

    test('should change direction correctly', () => {
        expect(snake.changeDirection(DIRECTION_UP)).toBe(true);
        expect(snake._dx).toBe(0);
        expect(snake._dy).toBe(-blockSize);
    });

    test('should not change to opposite direction', () => {
        expect(snake.changeDirection(DIRECTION_LEFT)).toBe(false);
        expect(snake._dx).toBe(blockSize);
        expect(snake._dy).toBe(0);
    });

    /* collision detection unit tests */

    test('should detect collision with itself', () => {
        // grow the snake
        for (let i = 0; i < 5; i++) {
            snake.move(true);
        }
        // make it turn back on itself
        snake.changeDirection('down');
        snake.move();
        snake.changeDirection('left');
        snake.move();
        snake.changeDirection('up');
        snake.move();
        expect(snake.didCollide(boardWidth, boardHeight, blockSize)).toBe(true);
    });

    test('should detect collision with walls', () => {
        snake.teleportHead({ x: -blockSize, y: 0 });
        expect(snake.didCollide(boardWidth, boardHeight, blockSize)).toBe(true);

        snake.teleportHead({ x: boardWidth, y: 0 });
        expect(snake.didCollide(boardWidth, boardHeight, blockSize)).toBe(true);

        snake.teleportHead({ x: 0, y: -blockSize });
        expect(snake.didCollide(boardWidth, boardHeight, blockSize)).toBe(true);

        snake.teleportHead({ x: 0, y: boardHeight });
        expect(snake.didCollide(boardWidth, boardHeight, blockSize)).toBe(true);
    });

    test('should not collide when fully within bounds', () => {
        snake.teleportHead({ x: 50, y: 50 });
        expect(snake.didCollide(boardWidth, boardHeight, blockSize)).toBe(false);
    });

    test('should not collide when head touches walls', () => {
        snake.teleportHead({ x: 50, y: boardHeight - blockSize });  // bottom
        expect(snake.didCollide(boardWidth, boardHeight, blockSize)).toBe(false);

        snake.teleportHead({ x: 0, y: 50 });  // left
        expect(snake.didCollide(boardWidth, boardHeight, blockSize)).toBe(false);

        snake.teleportHead({ x: 50, y: 0 });  // top
        expect(snake.didCollide(boardWidth, boardHeight, blockSize)).toBe(false);

        snake.teleportHead({ x: boardWidth - blockSize, y: 50 });  // right
        expect(snake.didCollide(boardWidth, boardHeight, blockSize)).toBe(false);
    });

    /* power up unit tests */

    test('should teleport when hitting wall with teleport power-up', () => {
        snake.powerUps[TELEPORT_CLASSNAME] = true;
        snake.teleportHead({ x: -blockSize, y: 0 });
        expect(snake.didCollide(boardWidth, boardHeight, blockSize)).toBe(false);
        expect(snake.getHeadPosition().x).toBe(boardWidth - blockSize);
        expect(snake.powerUps[TELEPORT_CLASSNAME]).toBe(false);
    });

    test('should phase through itself with phase power-up', () => {
        // grow the snake
        for (let i = 0; i < 5; i++) {
            snake.move(true);
        }

        snake.powerUps[PHASE_CLASSNAME] = true;
        snake.teleportHead({ x: snake._body[4].x, y: snake._body[4].y });
        expect(snake.didCollide(boardWidth, boardHeight, blockSize)).toBe(false);
        expect(snake.powerUps[PHASE_CLASSNAME]).toBe(false);
    });

    test('should equip power-ups correctly', () => {
        const teleportItem = new Teleport(mockBoard, snake);
        const phaseItem = new Phase(mockBoard, snake);

        snake.equip(teleportItem);
        expect(snake.powerUps[TELEPORT_CLASSNAME]).toBe(true);

        snake.equip(phaseItem);
        expect(snake.powerUps[PHASE_CLASSNAME]).toBe(true);
        expect(snake.isGlowing).toBe(true);
    });

    /* pausing unit tests */

    test('should pause and unpause correctly', () => {
        snake.pause();
        expect(snake._dx).toBe(0);
        expect(snake._dy).toBe(0);
        expect(snake._dxAtPause).toBe(blockSize);
        expect(snake._dyAtPause).toBe(0);

        snake.unpause();
        expect(snake._dx).toBe(blockSize);
        expect(snake._dy).toBe(0);
    });

    /* forEachSegment method tests */

    test('forEachSegment should iterate over all segments', () => {
        const mockCallback = jest.fn();
        snake.forEachSegment(mockCallback);

        expect(mockCallback).toHaveBeenCalledTimes(snake._body.length);

        for (let i = 0; i < snake._body.length; i++) {
            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    x: expect.any(Number),
                    y: expect.any(Number)
                }),
                i
            );
        }
    });

    test('forEachSegment should pass correct segment data', () => {
        const segments = [];
        snake.forEachSegment((segment) => segments.push({ ...segment }));

        expect(segments).toEqual(snake._body);
    });

    /* setGlow method tests */

    test('setGlow should change snake appearance when set to true', () => {
        snake.setGlow(true);
        expect(snake.isGlowing).toBe(true);
        expect(snake.borderColor).toBe(SNAKE.PHASE_BORDER_COLOR);
    });

    test('setGlow should change snake appearance when set to false', () => {
        // First, set glow to true
        snake.setGlow(true);

        // Then set it back to false
        snake.setGlow(false);
        expect(snake.isGlowing).toBe(false);
        expect(snake.borderColor).toBe(SNAKE.DEFAULT_BORDER_COLOR);
    });

    test('setGlow should not change appearance if already in desired state', () => {
        const initialBorderColor = snake.borderColor;
        snake.setGlow(false);
        expect(snake.isGlowing).toBe(false);
        expect(snake.borderColor).toBe(initialBorderColor);

        snake.setGlow(true);
        const glowingBorderColor = snake.borderColor;
        snake.setGlow(true);
        expect(snake.isGlowing).toBe(true);
        expect(snake.borderColor).toBe(glowingBorderColor);
    });
});
