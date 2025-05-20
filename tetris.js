// Tetris Game Implementation
document.addEventListener('DOMContentLoaded', () => {
    // Game Constants
    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 30;
    const EMPTY = 'empty';
    
    // Game Variables
    let score = 0;
    let lines = 0;
    let level = 1;
    let gameOver = false;
    let isPaused = false;
    let dropCounter = 0;
    let lastTime = 0;
    let dropInterval = 1000; // milliseconds
    let board = [];
    let activePiece = null;
    let nextPiece = null;
    let gameLoop = null;
    
    // DOM Elements
    const gameBoard = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const linesElement = document.getElementById('lines');
    const startButton = document.getElementById('start-button');
    const nextPieceDisplay = document.getElementById('next-piece');
    
    // Tetromino Shapes
    const SHAPES = {
        I: {
            shape: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            color: 'I'
        },
        J: {
            shape: [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 'J'
        },
        L: {
            shape: [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 'L'
        },
        O: {
            shape: [
                [1, 1],
                [1, 1]
            ],
            color: 'O'
        },
        S: {
            shape: [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            color: 'S'
        },
        T: {
            shape: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 'T'
        },
        Z: {
            shape: [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            color: 'Z'
        }
    };
    
    // Tetromino Class
    class Tetromino {
        constructor(shape = null) {
            const shapeKeys = Object.keys(SHAPES);
            const randomShape = shape || shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
            this.shape = JSON.parse(JSON.stringify(SHAPES[randomShape].shape));
            this.color = SHAPES[randomShape].color;
            this.x = Math.floor(COLS / 2) - Math.ceil(this.shape[0].length / 2);
            this.y = 0;
            
            // Adjust position for I piece
            if (this.color === 'I') {
                this.y = -1;
            }
        }
        
        rotate() {
            // Create a copy to check if rotation is possible
            const originalShape = JSON.parse(JSON.stringify(this.shape));
            const originalX = this.x;
            const originalY = this.y;
            
            // Rotate the matrix (90 degrees clockwise)
            const N = this.shape.length;
            const rotated = Array.from(Array(N), () => Array(N).fill(0));
            
            for (let y = 0; y < N; y++) {
                for (let x = 0; x < N; x++) {
                    rotated[x][N - 1 - y] = this.shape[y][x];
                }
            }
            
            this.shape = rotated;
            
            // Check if rotation causes collision, if so revert back
            if (checkCollision()) {
                this.shape = originalShape;
                this.x = originalX;
                this.y = originalY;
                return false;
            }
            
            return true;
        }
        
        moveLeft() {
            this.x--;
            if (checkCollision()) {
                this.x++;
                return false;
            }
            return true;
        }
        
        moveRight() {
            this.x++;
            if (checkCollision()) {
                this.x--;
                return false;
            }
            return true;
        }
        
        moveDown() {
            this.y++;
            if (checkCollision()) {
                this.y--;
                mergePiece();
                checkLines();
                spawnNewPiece();
                return false;
            }
            return true;
        }
        
        hardDrop() {
            while (this.moveDown()) {
                // Keep moving down until collision
            }
            // Add extra points for hard drop
            updateScore(2);
        }
    }
    
    // Initialize the game board
    function initBoard() {
        // Create empty board
        for (let y = 0; y < ROWS; y++) {
            board[y] = [];
            for (let x = 0; x < COLS; x++) {
                board[y][x] = EMPTY;
            }
        }
        
        // Clear the game board display
        gameBoard.innerHTML = '';
        
        // Create cells for the game board
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.x = x;
                cell.dataset.y = y;
                gameBoard.appendChild(cell);
            }
        }
    }
    
    // Check for collision with board edges and other pieces
    function checkCollision() {
        if (!activePiece) return false;
        
        const shape = activePiece.shape;
        const pieceX = activePiece.x;
        const pieceY = activePiece.y;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x] !== 0) {
                    const boardX = pieceX + x;
                    const boardY = pieceY + y;
                    
                    // Check for out of bounds or collision with placed pieces
                    if (
                        boardX < 0 || 
                        boardX >= COLS || 
                        boardY >= ROWS ||
                        (boardY >= 0 && board[boardY][boardX] !== EMPTY)
                    ) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    // Merge the active piece into the board
    function mergePiece() {
        if (!activePiece) return;
        
        const shape = activePiece.shape;
        const pieceX = activePiece.x;
        const pieceY = activePiece.y;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x] !== 0) {
                    const boardX = pieceX + x;
                    const boardY = pieceY + y;
                    
                    if (boardY >= 0) { // Only place on visible part of the board
                        board[boardY][boardX] = activePiece.color;
                    }
                }
            }
        }
    }
    
    // Spawn a new piece
    function spawnNewPiece() {
        if (nextPiece) {
            activePiece = nextPiece;
        } else {
            activePiece = new Tetromino();
        }
        
        nextPiece = new Tetromino();
        drawNextPiece();
        
        // Check for game over
        if (checkCollision()) {
            gameOver = true;
            clearInterval(gameLoop);
            startButton.textContent = "Start New Game";
            alert('Game Over! Your score: ' + score);
            return;
        }
    }
    
    // Draw the next piece preview
    function drawNextPiece() {
        nextPieceDisplay.innerHTML = '';
        
        const shape = nextPiece.shape;
        const color = nextPiece.color;
        
        // Create grid for next piece preview
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                
                if (y < shape.length && x < shape[y].length && shape[y][x] === 1) {
                    cell.classList.add('tetromino');
                    cell.classList.add(color);
                }
                
                nextPieceDisplay.appendChild(cell);
            }
        }
    }
    
    // Draw the game board
    function draw() {
        // Clear all tetromino and ghost classes from cells
        const cells = document.querySelectorAll('#game-board .cell');
        cells.forEach(cell => {
            cell.className = 'cell';
        });
        
        // Draw placed pieces
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (board[y][x] !== EMPTY) {
                    const cellIndex = y * COLS + x;
                    if (cells[cellIndex]) {
                        cells[cellIndex].classList.add('tetromino');
                        cells[cellIndex].classList.add(board[y][x]);
                    }
                }
            }
        }
        
        // Draw active piece
        if (activePiece) {
            // First, draw ghost piece (showing where piece will land)
            const ghostPiece = JSON.parse(JSON.stringify(activePiece));
            while (!checkGhostCollision(ghostPiece)) {
                ghostPiece.y++;
            }
            ghostPiece.y--;
            
            if (ghostPiece.y > activePiece.y) {
                drawPiece(ghostPiece, true);
            }
            
            // Then draw active piece
            drawPiece(activePiece, false);
        }
    }
    
    // Helper function to check collision for ghost piece
    function checkGhostCollision(ghostPiece) {
        const shape = ghostPiece.shape;
        const pieceX = ghostPiece.x;
        const pieceY = ghostPiece.y;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x] !== 0) {
                    const boardX = pieceX + x;
                    const boardY = pieceY + y;
                    
                    if (
                        boardX < 0 || 
                        boardX >= COLS || 
                        boardY >= ROWS ||
                        (boardY >= 0 && board[boardY][boardX] !== EMPTY)
                    ) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    // Draw a piece (active or ghost)
    function drawPiece(piece, isGhost) {
        const shape = piece.shape;
        const pieceX = piece.x;
        const pieceY = piece.y;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x] !== 0) {
                    const boardX = pieceX + x;
                    const boardY = pieceY + y;
                    
                    if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                        const cellIndex = boardY * COLS + boardX;
                        const cells = document.querySelectorAll('#game-board .cell');
                        
                        if (cells[cellIndex]) {
                            cells[cellIndex].classList.add('tetromino');
                            cells[cellIndex].classList.add(piece.color);
                            
                            if (isGhost) {
                                cells[cellIndex].classList.add('ghost');
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Check for completed lines
    function checkLines() {
        let linesCleared = 0;
        
        for (let y = ROWS - 1; y >= 0; y--) {
            let rowFilled = true;
            
            for (let x = 0; x < COLS; x++) {
                if (board[y][x] === EMPTY) {
                    rowFilled = false;
                    break;
                }
            }
            
            if (rowFilled) {
                // Remove the row and shift all rows above down
                for (let yy = y; yy > 0; yy--) {
                    for (let x = 0; x < COLS; x++) {
                        board[yy][x] = board[yy - 1][x];
                    }
                }
                
                // Clear the top row
                for (let x = 0; x < COLS; x++) {
                    board[0][x] = EMPTY;
                }
                
                linesCleared++;
                y++; // Check the same row again as it now contains the row from above
            }
        }
        
        if (linesCleared > 0) {
            // Update score, lines, and level
            lines += linesCleared;
            
            // Calculate score based on number of lines cleared (Tetris scoring system)
            let lineScore;
            switch (linesCleared) {
                case 1: lineScore = 40 * level; break;
                case 2: lineScore = 100 * level; break;
                case 3: lineScore = 300 * level; break;
                case 4: lineScore = 1200 * level; break;
                default: lineScore = 0;
            }
            
            updateScore(lineScore);
            
            // Update level based on lines cleared
            const newLevel = Math.floor(lines / 10) + 1;
            if (newLevel > level) {
                level = newLevel;
                dropInterval = Math.max(100, 1000 - ((level - 1) * 100));
                levelElement.textContent = level;
            }
            
            linesElement.textContent = lines;
        }
    }
    
    // Update the score
    function updateScore(points) {
        score += points;
        scoreElement.textContent = score;
    }
    
    // Handle keydown events
    function handleKeyDown(event) {
        if (gameOver || isPaused) return;
        
        switch (event.keyCode) {
            case 37: // Left arrow
                activePiece.moveLeft();
                draw();
                break;
            case 39: // Right arrow
                activePiece.moveRight();
                draw();
                break;
            case 40: // Down arrow (soft drop)
                activePiece.moveDown();
                updateScore(1); // Add points for soft drop
                draw();
                break;
            case 38: // Up arrow (rotate)
                activePiece.rotate();
                draw();
                break;
            case 32: // Space (hard drop)
                activePiece.hardDrop();
                draw();
                break;
            case 80: // P key (pause)
                togglePause();
                break;
        }
    }
    
    // Toggle pause state
    function togglePause() {
        isPaused = !isPaused;
        
        if (isPaused) {
            clearInterval(gameLoop);
            startButton.textContent = "Resume";
        } else {
            startGameLoop();
            startButton.textContent = "Pause";
        }
    }
    
    // Start button click handler
    startButton.addEventListener('click', () => {
        if (gameOver) {
            // Reset game
            resetGame();
        } else {
            // Toggle pause
            togglePause();
        }
    });
    
    // Reset the game
    function resetGame() {
        clearInterval(gameLoop);
        score = 0;
        lines = 0;
        level = 1;
        dropInterval = 1000;
        gameOver = false;
        isPaused = false;
        
        scoreElement.textContent = score;
        levelElement.textContent = level;
        linesElement.textContent = lines;
        
        initBoard();
        spawnNewPiece();
        startButton.textContent = "Pause";
        startGameLoop();
    }
    
    // Game loop
    function update(time = 0) {
        const deltaTime = time - lastTime;
        lastTime = time;
        
        dropCounter += deltaTime;
        
        if (dropCounter > dropInterval) {
            activePiece.moveDown();
            dropCounter = 0;
        }
        
        draw();
    }
    
    // Start game loop
    function startGameLoop() {
        gameLoop = setInterval(() => {
            update(performance.now());
        }, 16.67); // ~60fps
    }
    
    // Initialize game
    function init() {
        initBoard();
        spawnNewPiece();
        document.addEventListener('keydown', handleKeyDown);
    }
    
    // Initialize but wait for player to start the game
    init();
    draw();
    
    // Wait for player to press start button before starting game loop
    isPaused = true;
});