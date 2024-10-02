import {
    DIRECTION_LEFT,
    DIRECTION_RIGHT,
    DIRECTION_UP,
    DIRECTION_DOWN,
    DIRECTIONS,
    getDirection,
    isOppositeDirection,
    normalizeDirection
} from '../../src/js/game/direction';

describe('Direction Module', () => {
    describe('getDirection function', () => {
        test('should return correct Direction object for valid direction strings', () => {
            expect(getDirection(DIRECTION_LEFT)).toEqual(DIRECTIONS[DIRECTION_LEFT]);
            expect(getDirection(DIRECTION_RIGHT)).toEqual(DIRECTIONS[DIRECTION_RIGHT]);
            expect(getDirection(DIRECTION_UP)).toEqual(DIRECTIONS[DIRECTION_UP]);
            expect(getDirection(DIRECTION_DOWN)).toEqual(DIRECTIONS[DIRECTION_DOWN]);
        });

        test('should return null for invalid direction strings', () => {
            expect(getDirection('invalid')).toBeNull();
            expect(getDirection('')).toBeNull();
        });

        test('should be case-insensitive', () => {
            expect(getDirection('LEFT')).toEqual(DIRECTIONS[DIRECTION_LEFT]);
            expect(getDirection('RiGhT')).toEqual(DIRECTIONS[DIRECTION_RIGHT]);
        });
    });

    describe('isOppositeDirection function', () => {
        test('should return true for opposite directions', () => {
            expect(isOppositeDirection(DIRECTIONS[DIRECTION_LEFT], DIRECTIONS[DIRECTION_RIGHT])).toBe(true);
            expect(isOppositeDirection(DIRECTIONS[DIRECTION_UP], DIRECTIONS[DIRECTION_DOWN])).toBe(true);
        });

        test('should return false for non-opposite directions', () => {
            expect(isOppositeDirection(DIRECTIONS[DIRECTION_LEFT], DIRECTIONS[DIRECTION_UP])).toBe(false);
            expect(isOppositeDirection(DIRECTIONS[DIRECTION_RIGHT], DIRECTIONS[DIRECTION_DOWN])).toBe(false);
        });

        test('should return false for same direction', () => {
            expect(isOppositeDirection(DIRECTIONS[DIRECTION_LEFT], DIRECTIONS[DIRECTION_LEFT])).toBe(false);
            expect(isOppositeDirection(DIRECTIONS[DIRECTION_UP], DIRECTIONS[DIRECTION_UP])).toBe(false);
        });
    });

    describe('normalizeDirection function', () => {
        test('should normalize direction vectors to magnitude of 1', () => {
            expect(normalizeDirection(5, 0)).toEqual({ dx: 1, dy: 0 });
            expect(normalizeDirection(0, -3)).toEqual({ dx: 0, dy: -1 });
            expect(normalizeDirection(-4, -4)).toEqual({ dx: -1, dy: -1 });
        });

        test('should handle zero vector', () => {
            expect(normalizeDirection(0, 0)).toEqual({ dx: 0, dy: 0 });
        });

        test('should handle floating point values', () => {
            const result = normalizeDirection(0.5, 0.5);
            expect(result.dx).toBeCloseTo(1);
            expect(result.dy).toBeCloseTo(1);
        });

        test('should handle very large numbers', () => {
            const result = normalizeDirection(1e10, 1e10);
            expect(result.dx).toBeCloseTo(1);
            expect(result.dy).toBeCloseTo(1);
        });

        test('should handle very small numbers', () => {
            const result = normalizeDirection(1e-10, 1e-10);
            expect(result.dx).toBeCloseTo(1);
            expect(result.dy).toBeCloseTo(1);
        });

        test('should handle negative zero', () => {
            expect(normalizeDirection(-0, -0)).toEqual({ dx: 0, dy: 0 });
        });

        test('should handle NaN', () => {
            const result = normalizeDirection(NaN, NaN);
            expect(isNaN(result.dx)).toBe(true);
            expect(isNaN(result.dy)).toBe(true);
        });

        test('should handle one zero and one non-zero component', () => {
            expect(normalizeDirection(5, 0)).toEqual({ dx: 1, dy: 0 });
            expect(normalizeDirection(0, -3)).toEqual({ dx: 0, dy: -1 });
        });
    });
});
