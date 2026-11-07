# Gomoku – Five in a Row

A browser-based Gomoku game built with **HTML, CSS, and p5.js**. Two players take turns placing black and white stones on a 19 × 19 board. The first player to connect five or more consecutive stones in a row wins.

## How to Play

- Black plays first.
- Players take turns placing one stone on an empty intersection.
- Black and white stones cannot be placed on occupied intersections.
- The first player to connect five or more consecutive stones in any horizontal, vertical, or diagonal direction wins.
- If all intersections are occupied and neither player wins, the game ends in a draw.
- Click **Restart** to begin a new game.

## Technologies

- **HTML5** – Defines the page structure.
- **CSS3** – Handles styling and responsive layout.
- **JavaScript** – Implements game logic and player interactions.
- **p5.js** – Renders the game board and stones using HTML5 Canvas.

## Features

- **Two-player gameplay:** Play locally with two players sharing the same device.
- **19 × 19 game board:** A traditional Gomoku board with star points.
- **Win detection:** Automatically detects five or more consecutive stones horizontally, vertically, and diagonally.
- **Draw detection:** Recognizes a draw when the board is completely filled without a winner.
- **Turn indicator:** Displays which player's turn it is.
- **Game status:** Announces the winner or a draw when the game ends.
- **Restart functionality:** Start a new game without refreshing the page.
- **Responsive layout:** Dynamically adjusts the board size to fit different screen dimensions.

## Win Detection Algorithm

The game uses a directional search algorithm to determine whether a player has won. Instead of scanning the entire board after every move, the algorithm only checks the area around the newly placed stone.

This approach is more efficient because the newly placed stone is the only stone that can create a new winning combination.

### Winning Conditions

A player wins when they have five or more consecutive stones of the same color in any of the following four directions:

- **Horizontal:** Left to right.
- **Vertical:** Top to bottom.
- **Main diagonal:** Top-left to bottom-right.
- **Anti-diagonal:** Bottom-left to top-right.

### Direction Vectors

The four directions are represented using coordinate vectors:

```javascript
const directions = [
    [1, 0],   // Horizontal
    [0, 1],   // Vertical
    [1, 1],   // Main diagonal
    [1, -1]   // Anti-diagonal
];
```

Each vector consists of two values:

- `dx`: The change in the horizontal coordinate.
- `dy`: The change in the vertical coordinate.

By using both positive and negative vectors, the algorithm can search in opposite directions along the same line. This allows all eight search directions to be covered using only four direction vectors.

### Search Strategy

After a player places a stone, the algorithm checks each of the four winning directions independently.

For each direction, it performs the following operations:

- Initialize the counter to `1` to include the newly placed stone.
- Search in the positive direction and count consecutive stones belonging to the current player.
- Search in the opposite direction and count consecutive stones of the same color.
- Add both search results to the initial count.
- Check whether the total number of consecutive stones is at least five.

For example, consider the following horizontal arrangement:

```text
B  B  B  B  B
      ^
  Newly placed stone
```

The algorithm counts three stones on one side, one stone on the other side, and the newly placed stone itself.

The total is:

```text
3 + 1 + 1 = 5
```

Therefore, the current player wins.

### Implementation

The win detection logic is divided into two main methods.

**`countStones(x, y, dx, dy)`**

This method counts consecutive stones in a specified direction.

Starting from the adjacent intersection, it moves one position at a time and continues searching while:

- The current position is inside the board boundaries.
- The position contains a stone belonging to the current player.

The search stops when it encounters an empty intersection, an opponent's stone, or the edge of the board.

**`isWin(x, y)`**

This method coordinates the win detection process.

It iterates through the four direction vectors and calls `countStones()` twice for each direction: once using the original vector and once using its negated vector.

The results from both searches are added to the initial count of one, representing the newly placed stone.

If the total reaches five or more in any direction, the method immediately returns `true`. Otherwise, it returns `false` after all four directions have been checked.

### Algorithm Flow

```text
Place a stone
     |
     v
Get the stone coordinates
     |
     v
Select a winning direction
     |
     v
Initialize count = 1
     |
     v
Search in the positive direction
     |
     v
Search in the opposite direction
     |
     v
Calculate the total count
     |
     v
Is the total >= 5?
     |
   Yes ------> Declare a winner
     |
    No
     |
     v
Are there more directions?
     |
   Yes ------> Check the next direction
     |
    No
     |
     v
No winner yet
```

### Complexity Analysis

Let `N` represent the number of intersections along one side of the board.

#### Time Complexity: O(N)

$$
T(N) = 4 \times 2 \times O(N-1) = O(N)
$$

The algorithm checks four fixed directions. In each direction, it searches both sides of the newly placed stone. Each search can examine at most `N - 1` positions.

Therefore, the total number of operations grows linearly with the board dimension.

#### Space Complexity: O(1)

$$
S(N) = O(1)
$$

The algorithm uses only a fixed number of variables for coordinates, direction vectors, and counters. It does not require additional data structures whose size depends on the board dimensions.

### Advantages

- **Efficient:** Avoids scanning the entire board after every move.
- **Modular:** Separates directional counting from win detection.
- **Readable:** Uses direction vectors to simplify the search logic.
- **Scalable:** Works with different board dimensions without changing the core algorithm.
- **Reliable:** Checks both sides of the newly placed stone, including winning combinations that extend in either direction.

This directional search strategy provides a simple and efficient solution for detecting winning combinations in Gomoku.

## Project Structure

```text
.
├── index.html      # Main HTML page
├── index.css       # Styles and responsive layout
└── UiUe.js         # Game logic and p5.js rendering
```

## Future Improvements

Potential enhancements include:

- Player-versus-computer mode.
- Difficulty levels for AI opponents.
- Undo and redo moves.
- Game history and score tracking.
- Improved mobile touch controls.
