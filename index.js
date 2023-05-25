var canvas = document.getElementById('tictac');
var c = canvas.getContext('2d');
canvas.width = 500;
canvas.height = canvas.width;
canvas.style.width = canvas.width + "px";
canvas.style.height = canvas.width + "px";
//X = player -1    O = Player 1

var blueScore = 0;
var redScore = 0;
const boardSize = 16;
const winAmount = 5;
const fieldSize = canvas.width / boardSize;
const directions = [
    [1, 0],  //Right
    [-1, 1], //Bottom left
    [0, 1],  //Down
    [1, 1]   //Bottom Right
]
var mouse = { x: 0, y: 0 }

window.addEventListener('click', (e) => {
    mouse.x = e.x - canvas.offsetLeft;
    mouse.y = e.y - canvas.offsetTop;
    squareClickEvent(mouse.x, mouse.y);
})

function squareClickEvent(x, y) {
    if (!(x / fieldSize < boardSize && y / fieldSize < boardSize && x > 0 && y > 0)) {
        console.log("Out of bounds")
        return
    }
    var currentSquare = board.state[Math.floor(x / fieldSize)][Math.floor(y / fieldSize)]
    if(currentSquare.player != 0){
        return
    }
    board.play(currentSquare)
    let agentTurn = board.alphabeta(3).bestMove;
    if (!agentTurn) {
        if(evaluatePosition(board) === 1000){
            blueScore += 1;
            document.getElementById("blueScore").innerHTML = blueScore;
        } else {
            redScore += 1;
            document.getElementById("redScore").innerHTML = redScore;
        }
        reset()
    } else {
        board.play(agentTurn)
    }
}

class Board {
    constructor(size, currentPlayer = -1) {
        this.size = size;
        this.currentPlayer = currentPlayer;
        this.state = [];
        this.boardInit();
        this.surround = new Set();
        this.moveHistory = [];
        this.surroundHistory = [];
    }

    boardInit() {
        for (let x = 0; x < this.size; x++) {
            this.state.push([]);
            for (let y = 0; y < this.size; y++) {
                this.state[x].push(new Square(x, y))
                this.state[x][y].draw()
            }
        }
    }

    play(field, draw = true) {
        if (field.player != 0) {
            return
        }
        field.player = this.currentPlayer;
        if (draw) {
            field.contest();
        }
        this.updateSurround(field);
        this.currentPlayer *= -1;
        this.moveHistory.push(field);
    }

    revertMove() {
        this.moveHistory.pop().player = 0;
        this.surround = this.surroundHistory.pop();
        this.currentPlayer *= -1;
    }

    updateSurround(currentSquare) {
        this.surroundHistory.push(new Set(this.surround));
        emptyAround(currentSquare).forEach((e) => {
            this.surround.add(e)
        })
        this.surround.delete(currentSquare);
    }

    redraw() {
        c.clearRect(0, 0, canvas.width, canvas.height);
        this.draw();
        for (let x = 0; x < board.state.length; x++) {
            for (let y = 0; y < board.state[x].length; y++) {
                board.state[x][y].contest();
            }
        }
    }

    draw() {
        for (let x = 0; x < board.state.length; x++) {
            for (let y = 0; y < board.state[x].length; y++) {
                board.state[x][y].draw();
            }
        }
    }

    alphabeta(n, alpha = -1001, beta = 1001, maximizingPlayer = (this.currentPlayer === 1)) {
        //console.log("entering", n, alpha, beta);
        let value
        let bestMove
        if (n <= 0) {
            return { bestMove: bestMove, evaluation: evaluatePosition(this) };
        }
        if (1000 === Math.abs(evaluatePosition(this))) {
            return { evaluation: evaluatePosition(this) }
        }
        if (maximizingPlayer) {
            value = -1001
            this.surround.forEach((field) => {
                this.play(field, false);
                let newValue = this.alphabeta(n - 1, alpha, beta, false);
                if (value < newValue.evaluation) {
                    value = newValue.evaluation
                    bestMove = field
                }
                this.revertMove();
                if (value > beta) {
                    return
                }
                alpha = Math.max(alpha, value)
            })
            return { bestMove: bestMove, evaluation: value };
        } else {
            value = 1001
            this.surround.forEach((field) => {
                this.play(field, false);
                let newValue = this.alphabeta(n - 1, alpha, beta, true);
                if (value > newValue.evaluation) {
                    value = newValue.evaluation
                    bestMove = field
                }
                this.revertMove();
                if (value < alpha) {
                    return
                }
                beta = Math.min(beta, value)
            })
            return { bestMove: bestMove, evaluation: value };
        }
    }
}
class Square {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.player = 0;
        this.drawX = this.x * fieldSize;
        this.drawY = this.y * fieldSize;
    }

    draw() {
        c.lineWidth = 1;
        c.strokeStyle = "#000000";
        c.strokeRect(this.drawX, this.drawY, fieldSize, fieldSize);
    }

    contest() {
        if (this.player == -1) {
            c.beginPath();
            c.lineWidth = 3
            c.strokeStyle = "#FF0000"
            c.moveTo(this.drawX, this.drawY);
            c.lineTo(this.drawX + fieldSize, this.drawY + fieldSize);
            c.moveTo(this.drawX + fieldSize, this.drawY);
            c.lineTo(this.drawX, this.drawY + fieldSize);
            c.stroke();
            c.closePath();
        } else if (this.player == 1) {
            c.beginPath();
            c.lineWidth = 3;
            c.strokeStyle = "#0000FF"
            c.arc(this.drawX + fieldSize / 2, this.drawY + fieldSize / 2, fieldSize / 2, 0, 2 * Math.PI)
            c.stroke();
        }
    }
}

function chainLength(field) {
    let lengths = [0, 0, 0, 0];
    let blocked = [0, 0, 0, 0];
    if (field.player === 0) {
        return { lengths: lengths, player: 0 };
    }
    for (let i = 0; i < 4; i++) {
        let a = checkDir(field, directions[i])
        let b = checkDir(field, reverseDir(directions[i]))
        //console.log(a.end.blocked)
        if (a.end.blocked) {
            blocked[i] += 1;
        }
        if (b.end.blocked) {
            blocked[i] += 1;
        }
        lengths[i] = (a.value + b.value + 1);
    }
    //console.log(blocked);
    return { lengths: lengths, player: field.player, blocked: blocked };
}


function reverseDir(direction) {
    return [direction[0] * (-1), direction[1] * (-1)]
}

function checkDir(field, dir) {
    for (let i = 1; i < 6; i++) {
        let x = field.x + dir[0] * i;
        let y = field.y + dir[1] * i;
        if (x < 0 || y < 0 || x >= boardSize || y >= boardSize) {
            return { value: i - 1, end: { x: x, y: y, blocked: true } }
        }
        if (board.state[x][y].player === 0) {
            return { value: i - 1, end: { x: x, y: y, blocked: false } }
        }
        if (board.state[x][y].player != field.player) {
            return { value: i - 1, end: { x: x, y: y, blocked: true } }
        }
    }
    return { value: 5, end: { x: -1, y: -1 } }
}

function evaluatePosition(board = board) {
    let position = board.state;
    let maxChains = { "-1": 0, "1": 0 };
    for (let x = 0; x < position.length; x++) {
        for (let y = 0; y < position[x].length; y++) {
            let chains = chainLength(position[x][y]);
            let chainMaxLength = Math.max(...chains.lengths);
            //console.log("X: " + x + " Y: " + y + " IsWin: " + isWin);
            if (chainMaxLength >= 5) {
                return 1000 * chains.player;
            }
            if (chainMaxLength <= 4 && chainMaxLength > 0) {
                maxChains[chains.player] += evalChains(chains);
                //console.log(maxChains);
            }
        }
    }
    //X = -1 O = 1
    return maxChains[1] - maxChains[-1];
}

function emptyAround(field) {
    let x = field.x;
    let y = field.y;
    let fields = [];
    for (let i = 0; i < 4; i++) {
        if (board.state[x + directions[i][0]] && board.state[x + directions[i][0]][y + directions[i][1]] && board.state[x + directions[i][0]][y + directions[i][1]].player == 0) {
            fields.push(board.state[x + directions[i][0]][y + directions[i][1]])
        }
        if (board.state[x - directions[i][0]] && board.state[x - directions[i][0]][y - directions[i][1]] && board.state[x - directions[i][0]][y - directions[i][1]].player == 0) {
            fields.push(board.state[x - directions[i][0]][y - directions[i][1]])
        }
    }
    return fields;
}

function evalChains(chains) {
    let eval = 0;
    let lengths = chains.lengths
    let blocked = chains.blocked
    for (let i in lengths) {
        switch (blocked[i]) {
            case 0: eval += lengths[i]; break;
            case 1: eval += lengths[i] - 1; break;
            case 2: break;
            default: console.log("Lmao");
        }
    }
    return eval;
}

function arraySum(array) {
    let sum = 0;
    for (let i of array) {
        sum += i;
    }
    return sum;
}


function reset(state = new Board(boardSize)) {
    c.clearRect(0, 0, canvas.width, canvas.height);
    board.currentPlayer = -1;
    board = state;
    board.draw();
}

var board = new Board(boardSize);

reset();