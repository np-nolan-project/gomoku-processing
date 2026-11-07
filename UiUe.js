/*
 * ============================================================
 * Gomoku - Five in a Row
 * ============================================================
 *
 * A responsive two-player Gomoku game implemented using p5.js.
 *
 * Features:
 * 1. A 19 x 19 Gomoku board.
 * 2. Alternating moves between Black and White.
 * 3. Four-direction victory detection.
 * 4. Draw detection when the board is completely occupied.
 * 5. Responsive canvas resizing for different screen sizes.
 * 6. Automatic board redraw when the browser window is resized.
 * 7. Game restart without reloading the web page.
 *
 * Architecture:
 * - Configuration: Board dimensions and visual settings.
 * - PlayerColor: Player information and winning logic.
 * - Game state: Board data, active player, and game status.
 * - Rendering: Canvas and stone drawing functions.
 * - Interaction: Mouse input and move validation.
 * - Responsive layout: Canvas resizing and coordinate conversion.
 *
 * ============================================================
 */


/* ============================================================
 * GAME CONFIGURATION
 * ============================================================
 */

// Number of intersections along each side of the board.
const BOARD_SIZE = 19;

// Board background color.
const BOARD_BACKGROUND = '#f5deb3';

// Grid line color.
const GRID_COLOR = 100;

// Star-point positions using zero-based board indexes.
const STAR_POINTS = [3, 9, 15];

// Numeric values representing each intersection's state.
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

// Display colors for the two players.
const BLACK_COLOR = '#000000';
const WHITE_COLOR = '#ffffff';


/* ============================================================
 * RESPONSIVE BOARD DIMENSIONS
 * ============================================================
 */

// Canvas dimensions are calculated dynamically according to
// the available browser width.
let canvasSize;

// Distance between adjacent board intersections.
let cellSize;

// Distance between the canvas edge and the outermost intersections.
let boardMargin;

// Diameter of each stone.
let stoneSize;


/**
 * Calculate the canvas size based on 75% of the viewport width.
 *
 * The canvas remains square and automatically adjusts when
 * the browser window is resized.
 *
 * @returns {number} The calculated canvas dimension in pixels.
 */
function calculateCanvasSize() {

    return Math.floor(Math.min(windowWidth, windowHeight) * 0.75);
}

/**
 * Update all board-related dimensions.
 *
 * All measurements are derived from the current canvas size.
 * This ensures that grid spacing, margins, and stone sizes
 * remain proportional whenever the canvas is resized.
 */
function updateBoardDimensions() {

    // Use 5% of the canvas size as the outer board margin.
    boardMargin = canvasSize * 0.05;

    // There are BOARD_SIZE - 1 spaces between BOARD_SIZE intersections.
    cellSize =
        (canvasSize - 2 * boardMargin) / (BOARD_SIZE - 1);

    // Stones occupy approximately 86% of one grid cell.
    stoneSize = cellSize * 0.86;
}


/* ============================================================
 * PLAYER CLASS
 * ============================================================
 */

/**
 * Represents a Gomoku player.
 *
 * Each player has a name, a numeric identifier, and a display color.
 * The class also contains methods for checking winning conditions.
 */
class PlayerColor {

    /**
     * Create a player instance.
     *
     * @param {string} playerName - The player's display name.
     * @param {number} playerId - The numeric board value of the player.
     * @param {string} playerColor - The visual color of the player's stones.
     */
    constructor(playerName, playerId, playerColor) {

        this.playerName = playerName;
        this.playerId = playerId;
        this.playerColor = playerColor;
    }


    /**
     * Check whether the latest move results in a victory.
     *
     * Four directions are checked:
     * 1. Horizontal.
     * 2. Vertical.
     * 3. Main diagonal.
     * 4. Anti-diagonal.
     *
     * Stones are counted on both sides of the latest move.
     * The latest stone itself is counted once.
     *
     * @param {number} x - Zero-based column index.
     * @param {number} y - Zero-based row index.
     * @returns {boolean} True if five or more consecutive stones exist.
     */
    isWin(x, y) {

        // Each pair represents a direction vector (dx, dy).
        const directions = [
            [1, 0],   // Horizontal.
            [0, 1],   // Vertical.
            [1, 1],   // Main diagonal.
            [1, -1]   // Anti-diagonal.
        ];

        // Check each possible winning direction.
        for (const [dx, dy] of directions) {

            // Count the newly placed stone.
            let count = 1;

            // Count matching stones in the positive direction.
            count += this.countStones(x, y, dx, dy);

            // Count matching stones in the opposite direction.
            count += this.countStones(x, y, -dx, -dy);

            // Five or more consecutive stones indicate a win.
            if (count >= 5) {
                return true;
            }
        }

        return false;
    }


    /**
     * Count consecutive stones belonging to this player.
     *
     * The search stops when it encounters an empty intersection,
     * an opponent's stone, or the edge of the board.
     *
     * @param {number} x - Starting column index.
     * @param {number} y - Starting row index.
     * @param {number} dx - Horizontal movement per step.
     * @param {number} dy - Vertical movement per step.
     * @returns {number} Number of consecutive matching stones.
     */
    countStones(x, y, dx, dy) {

        let count = 0;

        // Move one intersection away from the latest stone.
        x += dx;
        y += dy;

        // Continue while the position is valid and belongs
        // to the current player.
        while (
            isInsideBoard(x, y) &&
            board[y][x] === this.playerId
        ) {

            count++;

            // Advance to the next intersection.
            x += dx;
            y += dy;
        }

        return count;
    }


    /**
     * Handle the end of the game when this player wins.
     *
     * The winner is displayed in the navigation bar.
     * Further moves are disabled by setting isGameOver to true.
     */
    win() {

        document.getElementById('winner').innerText =
            'Winner: ' + this.playerName;

        isGameOver = true;

        document.getElementById('whose-turn').innerText =
            'Game over';
    }
}


/* ============================================================
 * PLAYER INSTANCES
 * ============================================================
 */

// Create the Black player and the White player.
const blackPlayer = new PlayerColor(
    'Black ●',
    BLACK,
    BLACK_COLOR
);

const whitePlayer = new PlayerColor(
    'White ○',
    WHITE,
    WHITE_COLOR
);


/* ============================================================
 * GAME STATE
 * ============================================================
 */

// Two-dimensional array representing the game board.
//
// board[y][x] contains:
// EMPTY (0): No stone.
// BLACK (1): A Black stone.
// WHITE (2): A White stone.
let board = [];

// The player whose turn it currently is.
let currentPlayer = blackPlayer;

// Indicates whether the game has ended.
let isGameOver = false;

// Number of valid moves made during the current game.
//
// This counter is used for draw detection.
let movesPlayed = 0;


/* ============================================================
 * P5.JS INITIALIZATION
 * ============================================================
 */

/**
 * Initialize the p5.js sketch.
 *
 * This function runs once when the application starts.
 * It calculates the initial canvas size, creates the canvas,
 * and initializes a new game.
 */
function setup() {

    // Calculate the initial responsive canvas dimensions.
    canvasSize = calculateCanvasSize();

    // Create a square canvas.
    createCanvas(canvasSize, canvasSize);

    // Calculate grid spacing and stone dimensions.
    updateBoardDimensions();

    // Initialize the game.
    initializeGame();
}


/**
 * Main p5.js drawing loop.
 *
 * Continuous animation is not required because the board changes
 * only when a player makes a move or the canvas is resized.
 *
 * Rendering is therefore triggered explicitly by game events.
 */
function draw() {

    // Intentionally left empty.
}


/* ============================================================
 * GAME INITIALIZATION AND RESET
 * ============================================================
 */

/**
 * Initialize a new game.
 *
 * This function resets:
 * - All board intersections.
 * - The active player.
 * - The number of moves.
 * - The game-over state.
 * - The winner announcement.
 *
 * It then redraws the empty board.
 */
function initializeGame() {

    // Create a BOARD_SIZE x BOARD_SIZE array filled with EMPTY.
    board = Array.from(
        { length: BOARD_SIZE },
        () => Array(BOARD_SIZE).fill(EMPTY)
    );

    // Black always starts the game.
    currentPlayer = blackPlayer;

    // Reset the game status.
    isGameOver = false;

    // No moves have been made yet.
    movesPlayed = 0;

    // Update the player-turn indicator.
    document.getElementById('whose-turn').innerText =
        currentPlayer.playerName;

    // Clear the previous game result.
    document.getElementById('winner').innerText = '';

    // Render the initial board.
    drawBoard();
}


/**
 * Restart the game without reloading the page.
 *
 * This function can be called directly from the Restart button.
 */
function restartGame() {

    initializeGame();
}


/* ============================================================
 * BOARD RENDERING
 * ============================================================
 */

/**
 * Draw the complete Gomoku board.
 *
 * The board includes:
 * - A wooden-colored background.
 * - Horizontal and vertical grid lines.
 * - Nine star points.
 * - All stones currently stored in the board array.
 *
 * Every redraw is based on the board data rather than
 * the previous Canvas image.
 */
function drawBoard() {

    // Draw the board background.
    background(BOARD_BACKGROUND);

    // Configure the grid appearance.
    stroke(GRID_COLOR);
    strokeWeight(1);

    // Draw all horizontal and vertical grid lines.
    for (let i = 0; i < BOARD_SIZE; i++) {

        const position = getPixelCoordinate(i);

        // Horizontal grid line.
        line(
            boardMargin,
            position,
            canvasSize - boardMargin,
            position
        );

        // Vertical grid line.
        line(
            position,
            boardMargin,
            position,
            canvasSize - boardMargin
        );
    }

    // Draw the nine star points.
    noStroke();
    fill(GRID_COLOR);

    const starSize = cellSize / 5;

    for (const x of STAR_POINTS) {
        for (const y of STAR_POINTS) {

            circle(
                getPixelCoordinate(x),
                getPixelCoordinate(y),
                starSize
            );
        }
    }

    // Restore all previously placed stones.
    drawStones();
}


/**
 * Draw every stone stored in the board array.
 *
 * Empty intersections are skipped.
 * Black and White stones are rendered using their respective colors.
 */
function drawStones() {

    noStroke();

    for (let y = 0; y < BOARD_SIZE; y++) {

        for (let x = 0; x < BOARD_SIZE; x++) {

            const stone = board[y][x];

            // No stone needs to be drawn on an empty intersection.
            if (stone === EMPTY) {
                continue;
            }

            // Select the color based on the stone's owner.
            fill(
                stone === BLACK
                    ? BLACK_COLOR
                    : WHITE_COLOR
            );

            // Draw the stone at its corresponding intersection.
            circle(
                getPixelCoordinate(x),
                getPixelCoordinate(y),
                stoneSize
            );
        }
    }
}


/* ============================================================
 * MOVE HANDLING
 * ============================================================
 */

/**
 * Handle a mouse click or touch interaction on the canvas.
 *
 * A move is accepted only if:
 * - The game is still active.
 * - The selected position is a valid board intersection.
 * - The intersection is currently empty.
 *
 * After placing a stone, the game checks for a win or a draw.
 * If neither condition is met, the turn switches to the opponent.
 */
function mousePressed() {

    // Ignore all input after the game has ended.
    if (isGameOver) {
        return false;
    }

    // Convert the pointer position into board coordinates.
    const x = getBoardCoordinate(mouseX);
    const y = getBoardCoordinate(mouseY);

    // Ignore invalid clicks outside the board intersections.
    if (x === null || y === null) {
        return false;
    }

    // Prevent placing a stone on an occupied intersection.
    if (isOccupied(x, y)) {
        return false;
    }

    // Record the current player's move.
    board[y][x] = currentPlayer.playerId;

    // Increase the number of valid moves.
    movesPlayed++;

    // Redraw the board to display the new stone.
    drawBoard();

    // Check whether the current player has won.
    if (currentPlayer.isWin(x, y)) {

        currentPlayer.win();

    }

    // If there is no winner and every intersection is occupied,
    // the game ends in a draw.
    else if (movesPlayed === BOARD_SIZE * BOARD_SIZE) {

        declareDraw();

    }

    // Continue the game if neither a win nor a draw has occurred.
    else {

        switchPlayer();
    }

    // Prevent the browser from interpreting the interaction
    // as an additional default mouse or touch action.
    return false;
}


/**
 * Switch the active player.
 *
 * Black and White alternate after every valid move.
 * The navigation bar is updated to reflect the new turn.
 */
function switchPlayer() {

    currentPlayer =
        currentPlayer === blackPlayer
            ? whitePlayer
            : blackPlayer;

    document.getElementById('whose-turn').innerText =
        currentPlayer.playerName;
}


/* ============================================================
 * DRAW DETECTION
 * ============================================================
 */

/**
 * Declare a draw when the board is completely occupied.
 *
 * A draw occurs when all 361 intersections contain stones
 * and neither player has already achieved a winning condition.
 *
 * The winner field displays the draw result, and further
 * moves are disabled.
 */
function declareDraw() {

    // Display the draw message.
    document.getElementById('winner').innerText =
        'Draw! No winner.';

    // Update the turn indicator.
    document.getElementById('whose-turn').innerText =
        'Game over';

    // Prevent any additional moves.
    isGameOver = true;
}


/* ============================================================
 * COORDINATE CONVERSION
 * ============================================================
 */

/**
 * Convert a zero-based board index into a Canvas pixel coordinate.
 *
 * This calculation uses the current responsive dimensions.
 * Therefore, it remains accurate after the canvas is resized.
 *
 * @param {number} index - Zero-based row or column index.
 * @returns {number} Corresponding Canvas pixel coordinate.
 */
function getPixelCoordinate(index) {

    return boardMargin + index * cellSize;
}


/**
 * Convert a mouse position into a board index.
 *
 * The nearest intersection is selected using Math.round().
 * The click is rejected if it is too far from that intersection.
 *
 * @param {number} mousePosition - Pointer position along one axis.
 * @returns {number|null} Valid board index, or null if invalid.
 */
function getBoardCoordinate(mousePosition) {

    // Calculate the nearest intersection index.
    const index = Math.round(
        (mousePosition - boardMargin) / cellSize
    );

    // Reject indexes outside the board.
    if (index < 0 || index >= BOARD_SIZE) {
        return null;
    }

    // Find the pixel coordinate of the nearest intersection.
    const intersectionPosition = getPixelCoordinate(index);

    // Calculate the distance between the pointer and intersection.
    const distance = Math.abs(
        mousePosition - intersectionPosition
    );

    // Accept clicks only within half a grid cell.
    if (distance > cellSize / 2) {
        return null;
    }

    return index;
}


/* ============================================================
 * BOARD VALIDATION
 * ============================================================
 */

/**
 * Determine whether a board position is valid.
 *
 * @param {number} x - Zero-based column index.
 * @param {number} y - Zero-based row index.
 * @returns {boolean} True if the position is inside the board.
 */
function isInsideBoard(x, y) {

    return (
        x >= 0 &&
        x < BOARD_SIZE &&
        y >= 0 &&
        y < BOARD_SIZE
    );
}


/**
 * Check whether an intersection already contains a stone.
 *
 * @param {number} x - Zero-based column index.
 * @param {number} y - Zero-based row index.
 * @returns {boolean} True if the intersection is occupied.
 */
function isOccupied(x, y) {

    return board[y][x] !== EMPTY;
}


/* ============================================================
 * RESPONSIVE WINDOW HANDLING
 * ============================================================
 */

/**
 * Handle browser window resizing.
 *
 * p5.js automatically calls windowResized() when the browser
 * window changes size.
 *
 * The canvas is resized and all visual dimensions are recalculated.
 * The existing board array is preserved, so no moves are lost.
 */
function windowResized() {

    // Calculate the new canvas dimensions.
    const newCanvasSize = calculateCanvasSize();

    // Avoid unnecessary resizing if the dimensions have not changed.
    if (newCanvasSize === canvasSize) {
        return;
    }

    // Update the stored canvas size.
    canvasSize = newCanvasSize;

    // Resize the existing canvas.
    resizeCanvas(canvasSize, canvasSize);

    // Recalculate grid spacing, margins, and stone dimensions.
    updateBoardDimensions();

    // Redraw the complete board using the existing game state.
    drawBoard();
}
