const boardElement = document.getElementById("board");
const turnText = document.getElementById("turnText");
const message = document.getElementById("message");

const redCount = document.getElementById("redCount");
const blueCount = document.getElementById("blueCount");

const resetBtn = document.getElementById("resetBtn");
const undoBtn = document.getElementById("undoBtn");

const winnerModal = document.getElementById("winnerModal");
const winnerText = document.getElementById("winnerText");
const playAgain = document.getElementById("playAgain");

const SIZE = 8;

let board = [];
let currentPlayer = "red";
let selected = null;
let history = [];
let gameOver = false;


/* ==========================
   BUAT PAPAN
========================== */

function createBoard() {

  boardElement.innerHTML = "";

  for (let row = 0; row < SIZE; row++) {

    for (let col = 0; col < SIZE; col++) {

      const cell = document.createElement("div");

      cell.className = "cell";

      cell.dataset.row = row;
      cell.dataset.col = col;

      cell.addEventListener(
        "click",
        () => handleClick(row, col)
      );

      boardElement.appendChild(cell);
    }
  }
}


/* ==========================
   POSISI AWAL
========================== */

function newGame() {

  board = Array.from(
    { length: SIZE },
    () => Array(SIZE).fill(null)
  );

  currentPlayer = "red";
  selected = null;
  history = [];
  gameOver = false;

  winnerModal.classList.remove("show");

  /*
    Merah di bagian atas
  */

  for (let row = 0; row < 3; row++) {

    for (let col = 0; col < SIZE; col++) {

      if ((row + col) % 2 === 1) {

        board[row][col] = {
          player: "red",
          king: false
        };

      }
    }
  }

  /*
    Biru di bagian bawah
  */

  for (let row = 5; row < 8; row++) {

    for (let col = 0; col < SIZE; col++) {

      if ((row + col) % 2 === 1) {

        board[row][col] = {
          player: "blue",
          king: false
        };

      }
    }
  }

  render();
  updateUI();
}


/* ==========================
   RENDER
========================== */

function render() {

  const cells =
    boardElement.querySelectorAll(".cell");

  cells.forEach(cell => {

    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);

    const piece = board[row][col];

    cell.innerHTML = "";

    cell.classList.remove(
      "selected",
      "valid"
    );

    if (piece) {

      const element =
        document.createElement("div");

      element.className =
        `piece ${piece.player}`;

      if (piece.king) {
        element.classList.add("king");
      }

      cell.appendChild(element);
    }
  });


  if (selected) {

    const selectedCell =
      getCell(
        selected.row,
        selected.col
      );

    selectedCell.classList.add(
      "selected"
    );


    const moves =
      getMoves(
        selected.row,
        selected.col
      );


    moves.forEach(move => {

      getCell(
        move.row,
        move.col
      ).classList.add("valid");

    });
  }
}


/* ==========================
   KLIK PAPAN
========================== */

function handleClick(row, col) {

  if (gameOver) return;

  const piece = board[row][col];


  /*
    Pilih bidak
  */

  if (!selected) {

    if (
      piece &&
      piece.player === currentPlayer
    ) {

      selected = {
        row,
        col
      };

      render();

    }

    return;
  }


  /*
    Pilih bidak lain
  */

  if (
    piece &&
    piece.player === currentPlayer
  ) {

    selected = {
      row,
      col
    };

    render();

    return;
  }


  /*
    Cari gerakan
  */

  const moves =
    getMoves(
      selected.row,
      selected.col
    );


  const move =
    moves.find(
      m =>
        m.row === row &&
        m.col === col
    );


  if (!move) {

    selected = null;

    render();

    return;
  }


  movePiece(
    selected.row,
    selected.col,
    move
  );
}


/* ==========================
   GERAKAN
========================== */

function getMoves(row, col) {

  const piece = board[row][col];

  if (!piece) return [];

  const moves = [];

  let directions;


  if (piece.king) {

    directions = [
      [-1,-1],
      [-1,0],
      [-1,1],
      [0,-1],
      [0,1],
      [1,-1],
      [1,0],
      [1,1]
    ];

  } else {

    const direction =
      piece.player === "red"
        ? 1
        : -1;

    directions = [
      [direction,-1],
      [direction,0],
      [direction,1],
      [0,-1],
      [0,1]
    ];
  }


  directions.forEach(
    ([dr, dc]) => {

      const r = row + dr;
      const c = col + dc;


      /*
        Gerakan biasa
      */

      if (
        inside(r,c) &&
        board[r][c] === null
      ) {

        moves.push({
          row: r,
          col: c,
          capture: false
        });
      }


      /*
        Gerakan makan
      */

      if (
        inside(r,c) &&
        board[r][c] &&
        board[r][c].player !==
          piece.player
      ) {

        const jumpRow =
          row + dr * 2;

        const jumpCol =
          col + dc * 2;


        if (
          inside(
            jumpRow,
            jumpCol
          ) &&
          board[jumpRow][jumpCol] === null
        ) {

          moves.push({
            row: jumpRow,
            col: jumpCol,
            capture: true,
            captured: {
              row: r,
              col: c
            }
          });

        }
      }

    }
  );


  return moves;
}


/* ==========================
   PINDAHKAN BIDAK
========================== */

function movePiece(
  fromRow,
  fromCol,
  move
) {

  /*
    Simpan posisi untuk Undo
  */

  history.push(
    JSON.stringify({
      board,
      currentPlayer
    })
  );


  const piece =
    board[fromRow][fromCol];


  board[move.row][move.col] =
    piece;

  board[fromRow][fromCol] =
    null;


  /*
    Makan
  */

  if (move.capture) {

    board[
      move.captured.row
    ][
      move.captured.col
    ] = null;
  }


  /*
    Promosi Raja
  */

  if (
    !piece.king &&
    (
      (
        piece.player === "red" &&
        move.row === 7
      ) ||
      (
        piece.player === "blue" &&
        move.row === 0
      )
    )
  ) {

    piece.king = true;
  }


  selected = null;


  /*
    Cek kemenangan
  */

  if (
    countPieces(
      getOpponent(piece.player)
    ) === 0
  ) {

    gameOver = true;

    render();
    updateUI();

    showWinner(piece.player);

    return;
  }


  /*
    Ganti giliran
  */

  currentPlayer =
    getOpponent(currentPlayer);


  render();
  updateUI();
}


/* ==========================
   CEK BIDAK
========================== */

function countPieces(player) {

  let count = 0;

  board.forEach(row => {

    row.forEach(piece => {

      if (
        piece &&
        piece.player === player
      ) {
        count++;
      }

    });

  });

  return count;
}


/* ==========================
   UPDATE UI
========================== */

function updateUI() {

  const red =
    countPieces("red");

  const blue =
    countPieces("blue");


  redCount.textContent = red;
  blueCount.textContent = blue;


  const name =
    currentPlayer === "red"
      ? "Merah"
      : "Biru";


  turnText.textContent =
    `Giliran ${name}`;


  message.textContent =
    `Sekarang giliran pemain ${name}`;


  turnText.style.background =
    currentPlayer === "red"
      ? "var(--red)"
      : "var(--blue)";


  undoBtn.disabled =
    history.length === 0;

  undoBtn.style.opacity =
    history.length === 0
      ? ".45"
      : "1";
}


/* ==========================
   UNDO
========================== */

function undoGame() {

  if (
    history.length === 0 ||
    gameOver
  ) return;


  const previous =
    JSON.parse(
      history.pop()
    );


  board =
    previous.board;

  currentPlayer =
    previous.currentPlayer;

  selected = null;


  render();
  updateUI();
}


/* ==========================
   WINNER
========================== */

function showWinner(player) {

  const name =
    player === "red"
      ? "Merah"
      : "Biru";


  winnerText.textContent =
    `🎉 ${name} Menang!`;


  winnerModal.classList.add(
    "show"
  );
}


/* ==========================
   HELPER
========================== */

function inside(row, col) {

  return (
    row >= 0 &&
    row < SIZE &&
    col >= 0 &&
    col < SIZE
  );
}


function getOpponent(player) {

  return player === "red"
    ? "blue"
    : "red";
}


function getCell(row, col) {

  return boardElement.querySelector(
    `[data-row="${row}"][data-col="${col}"]`
  );
}


/* ==========================
   BUTTON
========================== */

resetBtn.addEventListener(
  "click",
  newGame
);

playAgain.addEventListener(
  "click",
  newGame
);

undoBtn.addEventListener(
  "click",
  undoGame
);


/* ==========================
   START
========================== */

createBoard();
newGame();
