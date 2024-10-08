export class MockContext extends CanvasRenderingContext2D {
    constructor() {
        super();

        this.fillStyle = '';
        this.strokeStyle = '';
        this.lineCap = 'butt';
        this.shadowBlur = 0;
        this.shadowColor = '';
    }

    // override setter for lineCap to ensure type safety
    set lineCap(value) {
        if (value === 'butt' || value === 'round' || value === 'square') {
            super.lineCap = value;
        } else {
            throw new Error(`Invalid lineCap value: ${value}`);
        }
    }

    // override getter for lineCap
    get lineCap() {
        return super.lineCap;
    }

    static normalizeColor(color) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx === null) {
            console.warn('Canvas 2D context not supported, returning original color');
            return color;
        }
        ctx.fillStyle = color;
        return ctx.fillStyle;
    }

    set fillStyle(color) {
        this._fillStyle = MockContext.normalizeColor(color);
    }

    get fillStyle() {
        return this._fillStyle;
    }

    set strokeStyle(color) {
        this._strokeStyle = MockContext.normalizeColor(color);
    }

    get strokeStyle() {
        return this._strokeStyle;
    }
}