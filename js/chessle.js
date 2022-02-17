const SERVER_URL = 'https://d1vwq1uqg5c4bn.cloudfront.net';

const MAX_GUESSES = 6;

const LIGHT_BOX = 'bg-dark';
const BLACK_BOX = 'text-white bg-secondary';
const YELLOW_BOX = 'text-white bg-warning';
const GREEN_BOX = 'text-white bg-success';

const DIFFICULTY_NAME_MAP = {
    'n': 'Normal',
    'e': 'Expert'
};

const RESULT_TO_BOX_MAP = {
    'g': GREEN_BOX,
    'y': YELLOW_BOX,
    'b': BLACK_BOX
};

const RESULT_TO_EMOJI_MAP = {
    'g': '🟩',
    'y': '🟨',
    'b': '⬛'
};

const DIFFICULTY_TO_LENGTH_MAP = {
    'n': 6,
    'e': 10,
    'msod': 12
};

const GUESS_BOX_SIZE_TO_FONT_WEIGHT = {
    'large': 'bold',
    'medium': 'bold',
    'small': 'normal',
    'tiny': 'normal'
};

const GUESS_BOX_SIZE_WIDTH_HEIGHT = {
    'large': '5rem',
    'medium': '4rem',
    'small': '3rem',
    'tiny': '2rem'
};

const GUESS_BOX_SIZE_TO_FONT_SIZE = {
    'large': {
        3: '2rem',
        4: '1.8rem',
        5: '1.4rem',
        6: '1.2rem',
        7: '1rem'
    },
    'medium': {
        3: '1.5rem',
        4: '1.4rem',
        5: '1.15rem',
        6: '1rem',
        7: '0.85rem'
    },
    'small': {
        3: '1.4rem',
        4: '1.15rem',
        5: '0.95rem',
        6: '0.85rem',
        7: '0.7rem'
    },
    'tiny': {
        3: '1.05rem',
        4: '0.85rem',
        5: '0.7rem',
        6: '0.6rem',
        7: '0.5rem'
    }
};

let difficulty = 'e';
let date;
let chessleNum;
let ans_name_normal;
let ans_name_expert;
let full_ans;
let ans;
let userId;

let prevGuesses = [];
let prevResults = [];
let isGameOver = false;

let percentCorrect;
let avgTries;

function submitGuess() {
    // Get guess from the boxes
    let guess = [];
    for (let i = 0; i < getAnsLength(); i++) {
        guess.push(document.getElementById('guess-' + i).innerHTML);
    }
    // Error if not all the boxes are filled up
    if (guess.includes('')) {
        createAlert('errorBox', 'errorArea', 'Fill up all the moves first!', 'danger');
        return;
    }

    // Check guess
    let result = check(guess, ans);
    prevGuesses.push(guess);
    prevResults.push(result);
    updateLocalStorage();

    // Add guess and result to new row
    addPrevGuessHtml(guess, result)

    // Is the guess correct?
    if (result.every(val => val === 'g')) {
        gameOver(true);
        return;
    }

    // Did they run out of guesses?
    if (prevGuesses.length >= MAX_GUESSES) {
        gameOver(false);
        return;
    }

    resetBoard();
}

function getAnsLength() {
    return 20;
}

function updateLocalStorage() {
    localStorage.setItem('date', date);
    localStorage.setItem('chessleNum', chessleNum);
    localStorage.setItem('ans', JSON.stringify(ans));
    localStorage.setItem('prevGuesses', JSON.stringify(prevGuesses));
    localStorage.setItem('prevResults', JSON.stringify(prevResults));
    localStorage.setItem('difficulty', difficulty);
    localStorage.setItem('isGameOver', isGameOver);
}

function gameOver(isWin) {
    // Get rid of the now unnecessary buttons
    document.getElementById('currentGuess').style.display = 'none';
    document.getElementById('submit').style.display = 'none';
    document.getElementById('undoButton').style.display = 'none';
    document.getElementById('flipButton').style.display = 'none';
    isGameOver = true;
    localStorage.setItem('isWin', isWin);
    updateLocalStorage();

    game.load_pgn(ans.join(' '), {sloppy: true});
    board.position(game.fen());

    sendResult(isWin);

    // Show endgame modal
    if (isWin) {
        openShareModal('Congrats, you won!');
    } else {
        openShareModal('Nice try!');
    }
}

function check(guess, answer) {
    if (guess.length !== getAnsLength() || answer.length !== getAnsLength()) {
        let err = 'Something went seriously wrong, try refreshing the page';
        createAlert('errorBox', 'errorArea', err, 'danger');
        return;
    }
    ans_map = {};
    for (let i = 0; i < answer.length; i++) {
        ans_map[answer[i]] = (ans_map[answer[i]] || 0) + 1;
    }

    result = [];
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === answer[i]) {
            result[i] = 'g';
            ans_map[guess[i]]--;
        }
    }
    for (let i = 0; i < guess.length; i++) {
        if (!result[i]) {
            if (ans_map[guess[i]]) {
                result[i] = 'y';
                ans_map[guess[i]]--;
            } else {
                result[i] = 'b';
            }
        }
    }
    return result;
}

function createEmojiPattern(separator) {
    let pattern = ''
    for (let i = 0; i < prevResults.length; i++) {
        pattern += prevResults[i].map(res => RESULT_TO_EMOJI_MAP[res]).join('') + separator;
    }
    return pattern;
}

function createSharePasta() {
    let lastGuess = prevResults[prevResults.length - 1];
    let tries = lastGuess.every(val => val === 'g') ? prevResults.length : 'X';

    let pasta = 'Chessle '
        + chessleNum
        + ' ('
        + DIFFICULTY_NAME_MAP[difficulty]
        + ') '
        + tries
        + '/' + MAX_GUESSES + '\n\n'
        + createEmojiPattern('\n') + '\n'
        + 'https://jackli.gg/chessle';
    let shareData = {
        text: pasta
    };
    // From detectmobilebrowsers.com
    let isMobile = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) isMobile = true;})(navigator.userAgent||navigator.vendor||window.opera);
    if (isMobile) {
        navigator.share(shareData);
    } else {
        navigator.clipboard.writeText(pasta);
        createAlert('alertBox', 'alertArea', 'Copied 👍', 'primary');
    }
}


// HTML

function createAlert(id, parent, text, style) {
    if (!document.getElementById(id)) {
        let newAlert = document.createElement('div');
        newAlert.id = id;
        newAlert.className = 'alert alert-' + style;
        newAlert.appendChild(document.createTextNode(text));
        let alertArea = document.getElementById(parent);
        alertArea.insertBefore(newAlert, alertArea.childNodes[0]);
        setTimeout(function() {
            newAlert.remove();
        }, 2500);
    }
}

function getGuessBoxSize() {
    let windowWidth = window.innerWidth;
    if (difficulty === 'e') {
        if (windowWidth > 1200) {
            return 'large';
        } else if (windowWidth > 1000) {
            return 'medium';
        } else if (windowWidth > 770) {
            return 'small';
        }
        return 'tiny';
    } else {
        if (windowWidth > 770) {
            return 'large';
        } else if (windowWidth > 500) {
            return 'medium';
        }
        return 'small';
    }
}

function createLabelCss(guessBoxSize) {
    return `
        font-size: ${GUESS_BOX_SIZE_TO_FONT_SIZE[guessBoxSize][3]};
        font-weight: ${GUESS_BOX_SIZE_TO_FONT_WEIGHT[guessBoxSize]};
    `;
}

function createLabelHtml(idx, guessBoxSize) {
    return `
        <span class="move-label align-self-center" style="${createLabelCss(guessBoxSize)}">
        ${idx / 2 + 1}.
        </span>
    `;
}

function createGuessBoxFontCss(text, guessBoxSize) {
    let textLength = Math.max(Math.min(text.length, 7), 3);
    return `
        font-size: ${GUESS_BOX_SIZE_TO_FONT_SIZE[guessBoxSize][textLength]};
        font-weight: ${GUESS_BOX_SIZE_TO_FONT_WEIGHT[guessBoxSize]};
    `;
}

function createBox(guessBoxSize, str, style, fontCss, id) {
    let widthHeight = GUESS_BOX_SIZE_WIDTH_HEIGHT[guessBoxSize];
    id = id !== undefined ? 'id="' + id + '"' : '';
    return `
        <div>
          <div class="card ${style} guess-card" style="width: ${widthHeight}; height: ${widthHeight};">
            <div class="card-body row align-self-center">
              <p class="card-text align-middle align-self-center text-center"
                  style="${fontCss};"${id}>${str}</p>
            </div>
          </div>
        </div>
    `;
}

function addPrevGuessHtml(guess, result) {
    let prevGuessHtml = `
        <div class="row justify-content-center align-self-center">
        ${createPrevGuessHtml(guess, result)}
        </div>`;
    document.getElementById('prevGuesses').innerHTML += prevGuessHtml;
}

function createPrevGuessHtml(guess, result) {
    let guessBoxSize = getGuessBoxSize();
    let html = '';
    for (let i = 0; i < guess.length; i++) {
        if (i % 2 === 0) {
            html += '<div class="move-group">' + createLabelHtml(i, guessBoxSize);
        }
        let css = createGuessBoxFontCss(guess[i], guessBoxSize);
        html += createBox(guessBoxSize, guess[i], RESULT_TO_BOX_MAP[result[i]], css);
        if (i % 2 !== 0) {
            html += '</div>';
        }
    }
    return html;
}

function populateGuessBoxes(moves) {
    let guessBoxSize = getGuessBoxSize();
    let guessHtml = '';
    for (let i = 0; i < getAnsLength(); i++) {
        if (i % 2 === 0) {
            guessHtml += '<div class="move-group">' + createLabelHtml(i, guessBoxSize);
        }
        let css = createGuessBoxFontCss(moves[i] || '', guessBoxSize);
        guessHtml += createBox(guessBoxSize, moves[i] || '', LIGHT_BOX, css, 'guess-' + i);
        if (i % 2 !== 0) {
            guessHtml += '</div>';
        }
    }
    guessHtml += '';
    $('#currentGuess').html(guessHtml);
}

function chooseNormalMode() {
    difficulty = 'n';
    setUpAnswer();
}

function chooseExpertMode() {
    difficulty = 'e';
    setUpAnswer();
}

function setUpAnswer() {
    ans = full_ans.slice(0, getAnsLength());
    populateGuessBoxes([]);
    $('#instructionsModal').modal('hide');
}

function openInstructionsModal() {
    $('#instructionsModalTitle').text('Welcome to Chessle');
    let instructionsText = `
        Guess the entire opening sequence, for both white and black!<br />
        <div class="instructions-example">
            <p class="instructions-example-title">Example</p>
            <img class="instructions-example-img" src="img/example.png">
            <br /><br />
            <img class="instructions-colour" src="img/Nf3.png">
            Green on Nf3 means that Nf3 was played on that specific move (White on move 2).
            <br /><br />
            <img class="instructions-colour" src="img/d4.png">
            Yellow on d4 means that d4 was indeed played by <b>either white or black</b>,
            but not at that specific spot (White on move 1).
            <br /><br />
            <img class="instructions-colour" src="img/d5.png">
            Grey on d5 means that d5 was not played by either white or black.
            <br /><br />
            Treat the moves as exactly how the text shows. <b>Nxe5 is not the same as Ne5!</b>
            <br /><br />
            You have ${MAX_GUESSES} guesses. Good luck!
        </div>
    `;
    $('#instructionsModalBody').html(instructionsText);
    $('#instructionsModal').modal({
        backdrop: 'static',
        keyboard: false
    });
    $('#instructionsModal').modal('show');
}

function createPgnFromMoveList(moves) {
    let pgn = '';
    for (let i = 0; i < moves.length; i++) {
        if (i % 2 === 0) {
            pgn += (i / 2 + 1) + '. ';
        }
        pgn += moves[i];
        if (i !== moves.length - 1) {
            pgn += ' ';
        }
    }
    return pgn;
}

function openShareModal(text) {
    $('#shareModalTitle').text(text);
    let modalBody = `
        <p class="share-modal-pattern">
        ${createEmojiPattern('<br />')}
        </p>
        <p class="share-modal-answer">
        The answer was
        <br />
        ${createPgnFromMoveList(ans)}
        <br />
        ${difficulty === 'e' ? ans_name_expert : ans_name_normal}
        <br />
        <br />
        This was from https://lichess.org/sDwYRFac
        <br />
        <br />
        I reset this manually when I have time :)
        </p>
    `;
    $('#shareModalBody').html(modalBody);
    $('#shareModal').modal('show');
}


// HTTP requests


function getAnswer() {
    let game = '1. c4 Nf6 2. Nc3 e5 3. Nf3 Nc6 4. g3 d5 5. cxd5 Nxd5 6. Bg2 Nb6 7. O-O Be7 8. a3 O-O 9. b4 Be6 10. Rb1 f6 11. d3 a5 12. b5 Nd4 13. Nd2 Qc8 14. e3 Nf5 15. Qc2 Rd8 16. Bb2 a4 17. Rfc1 Nd6 18. Nde4 Ne8 19. Qe2 Bf8 20. f4 exf4 21. gxf4 Qd7 22. d4 c6 23. Nc5 Bxc5 24. dxc5 Nc4 25. Rd1 Qc7 26. Bc1 Na5 27. bxc6 bxc6 28. Nxa4 Rxd1+ 29. Qxd1 Rd8 30. Qc2 Qf7 31. Nc3 Qh5 32. Ne2 Bf5 33. e4 Bg4 34. Ng3 Qf7 35. Bf1 Be6 36. Qc3 Ra8 37. Rb4 Qd7 38. f5 Bf7 39. Bf4 Qd1 40. Kf2 Nb3 41. Be2 Qb1 42. Bc4 Rxa3 43. Ne2'
    let hardcoded_ans = '{"date": "2022-02-16", "num": 4, "name_normal": "Four Knights Game", "name_expert": "English Opening: King\'s English Variation"}'
    let res = JSON.parse(hardcoded_ans);
    date = res.date;
    chessleNum = res.num;
    ans_name_normal = res.name_normal;
    ans_name_expert = "English Opening: King's English Variation, Four Knights Variation, Fianchetto Line"
    full_ans = game.replace(/ [0-9]+[.]/g, '').slice(3).split(' ');

}

function sendResult(isWin) {
    let xhttp = new XMLHttpRequest();
    let body = JSON.stringify({
        'userId': userId,
        'prevGuesses': prevGuesses,
        'prevResults': prevResults,
        'isWin': isWin,
        'difficulty': difficulty,
        'ans': ans,
        'date': date
    });

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            let res = JSON.parse(xhttp.responseText);
            percentCorrect = res.percent_correct;
            avgTries = res.avg_tries;
        }
    };
    xhttp.open('POST', SERVER_URL, false);
    xhttp.send(body);
}


// Chessboard

let board = null;
let game = new Chess();

function onDragStart(source, piece, position, orientation) {
    if (game.history().length >= getAnsLength()) return false;
    if (game.game_over() || isGameOver) return false;

    if ((game.turn() === 'w' && piece.search(/^b/) !== -1)
            || (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }
}

function onDrop(source, target) {
    let move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

    populateGuessBoxes(game.history());
}

function onSnapEnd() {
    board.position(game.fen())
}

function resetBoard() {
    game.reset();
    syncGameBoard();
}

function undo() {
    game.undo();
    syncGameBoard();
}

function flip() {
    board.flip();
}

function syncGameBoard() {
    board.position(game.fen());
    populateGuessBoxes(game.history());
}

function initializeBoard() {
    let config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };
    board = Chessboard('myBoard', config);
}



function setUp() {
    if (localStorage.getItem('userId') == undefined) {
        let newUserId = Math.floor(Math.random() * (10**12 - 10**11) + 10**11);
        userId = newUserId.toString();
        localStorage.setItem('userId', userId);
    } else {
        userId = localStorage.getItem('userId');
    }
    getAnswer();
    if (date !== localStorage.getItem('date')) {
        localStorage.setItem('prevGuesses', '[]');
        localStorage.setItem('prevResults', '[]');
        localStorage.setItem('isGameOver', false);
        openInstructionsModal();
    } else {
        prevGuesses = JSON.parse(localStorage.getItem('prevGuesses'));
        prevResults = JSON.parse(localStorage.getItem('prevResults'));
        difficulty = localStorage.getItem('difficulty');
        for (let i = 0; i < prevGuesses.length; i++) {
            addPrevGuessHtml(prevGuesses[i], prevResults[i]);
        }
        if (localStorage.getItem('isGameOver') === 'true') {
            ans = JSON.parse(localStorage.getItem('ans'));
            gameOver(localStorage.getItem('isWin') === 'true');
        } else {
            setUpAnswer();
        }
    }
}

initializeBoard();
setUp();
