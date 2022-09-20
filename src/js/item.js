export function createItem(board, snake, fill_color, border_color) {
    let item = {
        x: randomBlock(0, board.width - board.blockSize, board.blockSize),
        y: randomBlock(0, board.height - board.blockSize, board.blockSize),
        fill_color: fill_color,
        border_color: border_color,
    };

    // TODO: avoid private access here
    snake._body.forEach(function isItemOnSnake(part) {
        const itemIsOnSnake = part.x == item.x && part.y == item.y
        if (itemIsOnSnake) item = createItem(board, snake, fill_color, border_color);
    });

    return item;

    // TODO: constructor, getters (?)
}

function randomBlock(min, max, blockSize) {
    return Math.round((Math.random() * (max-min) + min) / blockSize) * blockSize;
}
