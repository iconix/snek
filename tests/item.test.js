import { jest } from '@jest/globals';
import { GAME_CONFIG } from '../src/js/config';
import { Food, Item, Phase, selectRandomItem, Teleport } from '../src/js/item';
import { MockBoard } from './__mocks__/mockBoard';
import { MockSnake } from './__mocks__/mockSnake';

const { ITEM } = GAME_CONFIG;

describe('Item', () => {
    let mockBoard, mockSnake;
    let generateSpy, randomBlockSpy;

    beforeEach(() => {
        mockBoard = new MockBoard();
        mockSnake = new MockSnake();

        // @ts-ignore
        generateSpy = jest.spyOn(Item.prototype, '_generate');
        // @ts-ignore
        randomBlockSpy = jest.spyOn(Item.prototype, '_randomBlock');
    });

    afterEach(() => {
        generateSpy.mockRestore();
        randomBlockSpy.mockRestore();
    });

    test('constructor generates valid position', () => {
        const item = new Item(mockBoard, mockSnake);
        expect(item.x).toBeGreaterThanOrEqual(0);
        expect(item.x).toBeLessThan(mockBoard.width);
        expect(item.y).toBeGreaterThanOrEqual(0);
        expect(item.y).toBeLessThan(mockBoard.height);
        expect(item.x % mockBoard.blockSize).toBe(0);
        expect(item.y % mockBoard.blockSize).toBe(0);
    });

    test('regenerates position if on snake', () => {
        const REGENERATED_X = 200;
        const REGENERATED_Y = 200;

        randomBlockSpy.mockImplementationOnce(() => mockSnake.INITIAL_X)
                      .mockImplementationOnce(() => mockSnake.INITIAL_Y)
                      .mockImplementationOnce(() => REGENERATED_X)
                      .mockImplementationOnce(() => REGENERATED_Y);

        new Item(mockBoard, mockSnake);

        // verify that item was generated twice
        expect(generateSpy).toHaveBeenCalledTimes(2);
        generateSpy.mockRestore();
    });

    test('has correct properties', () => {
        const item = new Item(mockBoard, mockSnake);
        expect(item.type).toBe('UNKNOWN_ITEM');
        expect(item.fillColor).toBe('');
        expect(item.borderColor).toBe('');
    });
});

describe('Food', () => {
    let mockBoard, mockSnake;

    beforeEach(() => {
        mockBoard = {
            width: 300,
            height: 300,
            blockSize: 10
        };
        mockSnake = {
            forEachSegment: jest.fn()
        };
    });

    test('has correct properties', () => {
        const food = new Food(mockBoard, mockSnake);
        expect(food.type).toBe('FOOD');
        expect(food.fillColor).toBe(ITEM.FOOD_COLOR);
        expect(food.borderColor).toBe(ITEM.FOOD_BORDER_COLOR);
    });
});

describe('Teleport', () => {
    let mockBoard, mockSnake;

    beforeEach(() => {
        mockBoard = {
            width: 300,
            height: 300,
            blockSize: 10
        };
        mockSnake = {
            forEachSegment: jest.fn()
        };
    });

    test('has correct properties', () => {
        const teleport = new Teleport(mockBoard, mockSnake);
        expect(teleport.type).toBe('TELEPORT');
        expect(teleport.fillColor).toBe(ITEM.TELEPORT_COLOR);
        expect(teleport.borderColor).toBe(ITEM.TELEPORT_BORDER_COLOR);
    });
});

describe('Phase', () => {
    let mockBoard, mockSnake;

    beforeEach(() => {
        mockBoard = {
            width: 300,
            height: 300,
            blockSize: 10
        };
        mockSnake = {
            forEachSegment: jest.fn()
        };
    });

    test('has correct properties', () => {
        const phase = new Phase(mockBoard, mockSnake);
        expect(phase.type).toBe('PHASE');
        expect(phase.fillColor).toBe(ITEM.PHASE_COLOR);
        expect(phase.borderColor).toBe(ITEM.PHASE_BORDER_COLOR);
    });
});

describe('selectRandomItem', () => {
    let mathRandomSpy;

    beforeEach(() => {
        mathRandomSpy = jest.spyOn(global.Math, 'random');
        mathRandomSpy.mockReturnValue(0.5);
    });

    afterEach(() => {
        mathRandomSpy.mockRestore();
    });

    test('returns Food when score is below thresholds', () => {
        const result = selectRandomItem(0, {}, { alwaysReturnItem: true, reducePowerUpProbability: false });
        expect(result).toBe(Food);
    });

    test('returns Teleport at teleport threshold', () => {
        const result = selectRandomItem(ITEM.TELEPORT_SCORE_THRESHOLD, {}, { alwaysReturnItem: true, reducePowerUpProbability: false });
        expect(result).toBe(Teleport);
    });

    test('returns Phase at phase threshold', () => {
        const result = selectRandomItem(ITEM.PHASE_SCORE_THRESHOLD, {}, { alwaysReturnItem: true, reducePowerUpProbability: false });
        expect(result).toBe(Phase);
    });

    test('can return null when not always returning item', () => {
        mathRandomSpy.mockReset();
        mathRandomSpy.mockReturnValueOnce(0.9)  // should result in null
                     .mockReturnValueOnce(0.1); // should result in Food

        const result1 = selectRandomItem(0, {}, { alwaysReturnItem: false, reducePowerUpProbability: false });

        const foodProbabilityOriginalValue = jest.replaceProperty(ITEM, 'BASE_VOLATILE_FOOD_PROBABILITY', 0.99); // make food selection more probable
        const result2 = selectRandomItem(0, {}, { alwaysReturnItem: false, reducePowerUpProbability: false });
        foodProbabilityOriginalValue.restore();

        expect(result1).toBeNull();
        expect(result2).toBe(Food);

        expect(mathRandomSpy).toHaveBeenCalledTimes(2);
    });

    test('always returns an item when alwaysReturnItem is true', () => {
        for (let i = 0; i < 1000; i++) {
            const result = selectRandomItem(0, {}, { alwaysReturnItem: true, reducePowerUpProbability: false });
            expect(result).not.toBeNull();
        }
    });

    test('reduces power-up probability when specified', () => {
        // set up a sequence of random values
        const randomValues = Array(100).fill(0).map((_, i) => i / 100);

        mathRandomSpy.mockReset();
        mathRandomSpy.mockImplementation(() => randomValues.shift());

        const score = ITEM.TELEPORT_SCORE_THRESHOLD + 10;
        const powerUps = { 'Teleport': false };

        // count Teleport occurrences without reduction
        let normalTeleportCount = 0;
        for (let i = 0; i < 100; i++) {
            const result = selectRandomItem(score, powerUps, { alwaysReturnItem: true, reducePowerUpProbability: false });
            if (result === Teleport) normalTeleportCount++;
        }

        // reset random values
        randomValues.push(...Array(100).fill(0).map((_, i) => i / 100));

        // count Teleport occurrences with reduction
        let reducedTeleportCount = 0;
        for (let i = 0; i < 100; i++) {
            const result = selectRandomItem(score, powerUps, { alwaysReturnItem: true, reducePowerUpProbability: true });
            if (result === Teleport) reducedTeleportCount++;
        }

        expect(reducedTeleportCount).toBeLessThan(normalTeleportCount);
        expect(mathRandomSpy).toHaveBeenCalledTimes(200);

        // console.log(`Normal Teleport count: ${normalTeleportCount}`);
        // console.log(`Reduced Teleport count: ${reducedTeleportCount}`);
    });

    test('returns null when score is below thresholds and not always returning item', () => {
        mathRandomSpy.mockReset();
        mathRandomSpy.mockReturnValue(0.99); // high value to ensure we don't select an item

        const result = selectRandomItem(0, {}, { alwaysReturnItem: false, reducePowerUpProbability: false });
        expect(result).toBeNull();
    });

    test('returns Food when score is just below Teleport threshold', () => {
        const result = selectRandomItem(ITEM.TELEPORT_SCORE_THRESHOLD - 1, {}, { alwaysReturnItem: true, reducePowerUpProbability: false });
        expect(result).toBe(Food);
    });

    test('respects probability distribution when score is high', () => {
        mathRandomSpy.mockRestore();

        const score = Math.max(ITEM.TELEPORT_SCORE_THRESHOLD, ITEM.PHASE_SCORE_THRESHOLD) + 100;
        const iterations = 10000;
        const results = { Food: 0, Teleport: 0, Phase: 0 };

        for (let i = 0; i < iterations; i++) {
            const result = selectRandomItem(score, {}, { alwaysReturnItem: true, reducePowerUpProbability: false });
            results[result.name]++;
        }

        // check that each item type appears with roughly the expected frequency
        expect(results.Food / iterations).toBeCloseTo(1 - ITEM.BASE_TELEPORT_PROBABILITY - ITEM.BASE_PHASE_PROBABILITY, 1);
        expect(results.Teleport / iterations).toBeCloseTo(ITEM.BASE_TELEPORT_PROBABILITY, 1);
        expect(results.Phase / iterations).toBeCloseTo(ITEM.BASE_PHASE_PROBABILITY, 1);
    });

    test('handles edge case of very high score', () => {
        const veryHighScore = Number.MAX_SAFE_INTEGER;
        const result = selectRandomItem(veryHighScore, {}, { alwaysReturnItem: true, reducePowerUpProbability: false });
        expect([Food, Teleport, Phase]).toContain(result);
    });

    test('respects existing power-ups', () => {
        const score = Math.max(ITEM.TELEPORT_SCORE_THRESHOLD, ITEM.PHASE_SCORE_THRESHOLD) + 100;
        const iterations = 1000;
        const resultsWithTeleport = { Food: 0, Teleport: 0, Phase: 0 };
        const resultsWithPhase = { Food: 0, Teleport: 0, Phase: 0 };

        for (let i = 0; i < iterations; i++) {
            const resultWithTeleport = selectRandomItem(score, { Teleport: true, Phase: false }, { alwaysReturnItem: true, reducePowerUpProbability: false });
            resultsWithTeleport[resultWithTeleport.name]++;

            const resultWithPhase = selectRandomItem(score, { Teleport: false, Phase: true }, { alwaysReturnItem: true, reducePowerUpProbability: false });
            resultsWithPhase[resultWithPhase.name]++;
        }

        // check that Teleport doesn't appear when it's already equipped
        expect(resultsWithTeleport.Teleport).toBe(0);
        // check that Phase doesn't appear when it's already equipped
        expect(resultsWithPhase.Phase).toBe(0);
    });
});
