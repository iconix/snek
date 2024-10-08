import { Snake } from '../../src/js/snake';

export class MockSnake extends Snake {
    INITIAL_X = 100;
    INITIAL_Y = 200;

    constructor() {
        super(300, 300, 10);
    }

    forEachSegment(callback) {
        callback({ x: this.INITIAL_X, y: this.INITIAL_Y });
    }
}
