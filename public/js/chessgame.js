const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
        row.forEach((square, colIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowIndex + colIndex) % 2 === 0 ? "light" : "dark"
            );
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = colIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: colIndex };
                        e.dataTransfer.setData('text/plain', "");
                        console.log(`Drag start: ${sourceSquare.row}, ${sourceSquare.col}`);
                    }
                });

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                    console.log('Drag end');
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    console.log(`Drop: ${targetSquare.row}, ${targetSquare.col}`);
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === "b") {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q" // Assume promotion to queen for simplicity
    };

    console.log(`Attempting move: ${move.from} to ${move.to}`);
    const result = chess.move(move);
    if (result) {
        console.log(`Move valid: ${move.from} to ${move.to}`);
        socket.emit("move", move);
        checkGameStatus();
    } else {
        console.log("Invalid move");
        alert("Invalid move. Please try again.");
    }
};

const checkGameStatus = () => {
    if (chess.in_checkmate()) {
        alert("Checkmate! Game over.");
    } else if (chess.in_draw()) {
        alert("It's a draw!");
    } else if (chess.in_stalemate()) {
        alert("Stalemate! Game over.");
    } else if (chess.in_check()) {
        alert("Check!");
    } else if (chess.insufficient_material()) {
        alert("Draw due to insufficient material.");
    } else if (chess.in_threefold_repetition()) {
        alert("Draw due to threefold repetition.");
    }
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        'p': '♙', // Black pawn
        'r': '♜', // Black rook
        'n': '♞', // Black knight
        'b': '♝', // Black bishop
        'q': '♛', // Black queen
        'k': '♚', // Black king
        'P': '♙', // White pawn
        'R': '♖', // White rook
        'N': '♘', // White knight
        'B': '♗', // White bishop
        'Q': '♕', // White queen
        'K': '♔'  // White king
    };
    return unicodePieces[piece.type] || "";
};

socket.on("playerRole", (role) => {
    playerRole = role;
    console.log(`Player role: ${playerRole}`);
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    console.log("Spectator role");
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    console.log(`Board state updated: ${fen}`);
    renderBoard();
});

