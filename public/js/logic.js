/**
 * Chess Game Logic
 * by Erhan Gundogan
 * January 2015
 * MIT License
 */

(function (global) {

  'use strict';

  var currentGame = null;
  var columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  var rows = [1, 2, 3, 4, 5, 6, 7, 8];
  var pieces = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

  var defaultWhitePieces = [0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 2, 4, 5, 2, 1, 3];
  var defaultBlackPieces = [3, 1, 2, 4, 5, 2, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0];

  // [row, col]: +/- analytic plane, row:y, col:x
  // minus means backwards, different direction for white and black
  var patterns = {
    bishop: [
      ['+p', '+p'],
      ['-p', '-p'],
      ['-p', '+p'],
      ['+p', '-p']
    ],
    rook: [
      ['0', '+p'],
      ['-p', '0'],
      ['0', '-p'],
      ['+p', '0']
    ],
    queen: [
      ['+p', '+p'],
      ['-p', '-p'],
      ['-p', '+p'],
      ['+p', '-p'],
      ['0', '+p'],
      ['-p', '0'],
      ['0', '-p'],
      ['+p', '0']
    ],
    king: [
      ['+1', '+1'],
      ['-1', '-1'],
      ['-1', '+1'],
      ['+1', '-1'],
      ['0', '+1'],
      ['-1', '0'],
      ['0', '-1'],
      ['+1', '0']
    ],
    knight: [
      ['+2', '+1'],
      ['+1', '+2'],
      ['-1', '+2'],
      ['-2', '+1'],
      ['-2', '-1'],
      ['-1', '-2'],
      ['+1', '-2'],
      ['+2', '-1']
    ],
    // pawn has special moves, so we need a function to handle it
    pawn: function (isWhite, isFirstMove, currentPosition) {

      // standard movement
      var movementPattern = {
        white: [
          ['+2', '0'],
          ['+1', '0']
        ],
        black: [
          ['-2', '0'],
          ['-1', '0']
        ]
      };

      // capture opponent's piece
      var capturePattern = {
        white: [
          ['+1', '+1'],
          ['+1', '-1']
        ],
        black: [
          ['-1', '-1'],
          ['-1', '+1']
        ]
      };

      // en passant
      var enPassantPattern = {
        white: [
          ['0', '+1'],
          ['0', '-1']
        ],
        black: [
          ['0', '-1'],
          ['0', '+1']
        ]
      };

      var selectedMovementPattern = movementPattern[isWhite ? 'white' : 'black'];
      var selectedCapturePattern = capturePattern[isWhite ? 'white' : 'black'];
      var selectedEnPassantPattern = enPassantPattern[isWhite ? 'white' : 'black'];

      // double square movement allowed?
      if (!isFirstMove) {
        selectedMovementPattern.splice(0, 1);
      }

      // capture on the right
      var rightCapturePiece = currentGame.getPieceAt(
        currentPosition.row + parseInt(selectedCapturePattern[0][0]),
        currentPosition.col + parseInt(selectedCapturePattern[0][1]));

      if (rightCapturePiece && rightCapturePiece.white !== isWhite) {
        selectedMovementPattern.push(selectedCapturePattern[0]);
      }

      // capture on the left
      var leftCapturePiece = currentGame.getPieceAt(
        currentPosition.row + parseInt(selectedCapturePattern[1][0]),
        currentPosition.col + parseInt(selectedCapturePattern[1][1]));

      if (leftCapturePiece && leftCapturePiece.white !== isWhite) {
        selectedMovementPattern.push(selectedCapturePattern[1]);
      }

      // en passant capture
      var lastMove = isWhite ? currentGame.black.getLastMove() : currentGame.white.getLastMove();

      var enPassantRightPiece = currentGame.getPieceAt(
        currentPosition.row + parseInt(selectedEnPassantPattern[0][0]),
        currentPosition.col + parseInt(selectedEnPassantPattern[0][1]));

      if (enPassantRightPiece &&
        isWhite !== enPassantRightPiece.white &&
        enPassantRightPiece.is('pawn') &&
        enPassantRightPiece.isFirstMovement() &&
        enPassantRightPiece.id === lastMove.pieceId) {
        // this is double opening of opponent's pawn on the left side
        selectedMovementPattern.push(selectedCapturePattern[0]);
      }

      var enPassantLeftPiece = currentGame.getPieceAt(
        currentPosition.row + parseInt(selectedEnPassantPattern[1][0]),
        currentPosition.col + parseInt(selectedEnPassantPattern[1][1]));

      if (enPassantLeftPiece &&
        isWhite !== enPassantLeftPiece.white &&
        enPassantLeftPiece.is('pawn') &&
        enPassantLeftPiece.isFirstMovement() &&
        enPassantLeftPiece.id === lastMove.pieceId) {
        // this is double opening of opponent's pawn on the right side
        selectedMovementPattern.push(selectedCapturePattern[1]);
      }

      return selectedMovementPattern;
    }

  };

  /**
   * position
   *
   * @param row
   * @param col
   * @returns {position}
   */
  var position = function (row, col) {
    this.id = getUniqueId(24);
    this.row = row; // row in number
    this.col = col; // col in number

    // text representation of position
    this.text = function () {
      return columns[this.col] + '' + this.row;
    };
    return this;
  };
  position.prototype.isValid = function () {
    return this.row <= 7 && this.row >= 0 && this.col <= 7 && this.col >= 0;
  };

  var defaultWhitePosition = new position(1, 0);
  var defaultBlackPosition = new position(7, 0);

  /**
   * movement
   *
   * @param before
   * @param after
   * @returns {movement}
   */
  var movement = function (before, after) {
    this.id = getUniqueId(24);
    this.before = before; // row, col position before movement
    this.after = after; // row, col position after movement
    this.pieceId = null; // type of piece from pieces collection
    this.check = false; // is it check?
    this.checkmate = false; // is it checkmate?
    this.duration = 0; // movement duration
    this.pawnDoubleSquareMove = false; // pawn advance two squares
    this.pawnPromotion = false; // pawn reached latest row and it will be promoted
    this.castling = false; // rook + king special movement

    // text representation of movement
    this.text = function () {
      return this.before.text() + ' - ' + this.after.text();
    };
    return this;
  };
  movement.prototype.before = typeof position;
  movement.prototype.after = typeof position;

  /**
   * piece
   *
   * @returns {piece}
   */
  var piece = function (type, white, position) {
    this.id = getUniqueId(24);
    this.type = type; // type of piece: ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']
    this.typeName = pieces[type];
    this.white = !!white;
    this.active = true; // active or passive piece
    this.selected = false; // selected at that moment
    this.position = position; // position of a piece
    this.moves = []; // movements of piece
    return this;
  };

  piece.prototype.position = typeof position;

  piece.prototype.is = function (pieceType) {
    return this.typeName === pieceType; // this.piece.is('pawn') ?
  };

  piece.prototype.isFirstMovement = function () {
    return this.moves.length === 1;
  };

  /***
   * whenever piece moved to another position:
   *
   * remove selected piece from board position
   * remove opponent's piece if it is captured
   * change captured piece to passive
   * add selected piece to clicked square in board array
   * change position of selected piece (ok)
   * add movement to piece's moves array
   * add movement to user's history
   * remove selected flag
   * change turn
   * reset timer
   * clear selected, move classes
   *
   * @param newRow
   * @param newCol
   */
  piece.prototype.moveTo = function (newRow, newCol) {
    var oldPosition = this.position;
    var newPosition = new position(newRow, newCol);

    // remove piece if it is captured
    var capturedPiece = currentGame.getPieceAt(newRow, newCol);
    if (capturedPiece) {
      capturedPiece.capture();
    }

    // calculate elapsed time and replace timer with new one
    var currentTime = (new Date()).getTime();
    var timeDiff = currentTime - currentGame.timer;
    currentGame.timer = currentTime;

    // is this movement pawn's first two square advance?
    var pawnDoubleSquareMove = this.is('pawn') && Math.abs(oldPosition.row - newRow) === 2;

    // is this movement pawn promotion?
    var pawnPromotion = this.is('pawn') && ((this.white && newRow === 7) || (!this.white && newRow === 0));

    // create movement record
    var currentMovement = new movement(oldPosition, newPosition);
    currentMovement.pawnDoubleSquareMove = pawnDoubleSquareMove;
    currentMovement.pawnPromotion = pawnPromotion;
    currentMovement.pieceId = this.id;

    // add new position to piece
    this.position = newPosition;

    // add movement to piece's movements list
    this.moves.push(currentMovement);

    // change position of piece on board
    currentGame.board[oldPosition.row][oldPosition.col] = null;
    currentGame.board[newRow][newCol] = this;
    currentGame.selectedPiece = null;

    // change turn to another player
    if (currentGame.turn === 'white') {
      currentGame.turn = 'black';
      currentGame.white.history.push(currentMovement);
      currentGame.white.elapsedTime.push(timeDiff);
    } else {
      currentGame.turn = 'white';
      currentGame.black.history.push(currentMovement);
      currentGame.black.elapsedTime.push(timeDiff);
    }

  };

  piece.prototype.capture = function () {
    var self = this;
    self.active = false;

    currentGame.board[self.position.row][self.position.col] = null;

    if (this.white) {
      currentGame.white.piecesOut.push(self);
      currentGame.white.pieces = _.reject(currentGame.white.pieces, function (item) {
        return self.id === item.id;
      });
    } else {
      currentGame.black.piecesOut.push(self);
      currentGame.black.pieces = _.reject(currentGame.black.pieces, function (item) {
        return self.id === item.id;
      });
    }
  };

  piece.prototype.getMoves = function () {
    // we have row, col and piece type
    // so we can extract possible movements according to pattterns
    // underscore library would be essential
    var self = this;
    var moves = [];
    var isCaptured = false;
    var pattern = patterns[self.typeName];
    var currentPosition = this.position;

    function testMove(piecePosition, rowAmount, colAmount) {
      var rowDiff = parseInt(rowAmount);
      var colDiff = parseInt(colAmount);
      var newRow = piecePosition.row + rowDiff;
      var newCol = piecePosition.col + colDiff;
      var testMove = new position(newRow, newCol);

      if (testMove.isValid()) {
        var pieceAtMovement = currentGame.getPieceAt(newRow, newCol);
        if (!pieceAtMovement) {
          return {
            item: testMove,
            isCaptured: false
          };
        } else if (pieceAtMovement && pieceAtMovement.white !== self.white && !self.is('pawn')) {
          return {
            item: testMove,
            isCaptured: true
          };
        } else {
          if (self.is('pawn')) {
            if (pieceAtMovement && Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 1) {
              return {
                item: testMove,
                isCaptured: true
              };
            }
          }
        }
      }
    }

    if (typeof pattern === 'function') {
      pattern = pattern(self.white, self.moves.length === 0, currentPosition);
    }

    _.each(pattern, function (pItem, pIndex) {

      var p = 1;
      var newPosition = true;
      var isCaptured = false;

      // if pattern first array item includes +p/-p then this piece will go
      // through positive/negative y coordinate until it is blocked
      if (pItem[0] === '+p') {

        // if pattern second array item includes +p/-p then this piece will go
        // through positive/negative x coordinate until it is blocked
        if (pItem[1] === '+p') {

          // test and add movement until it blocked
          while (newPosition) {
            newPosition = testMove(currentPosition, p, p);
            if (newPosition && newPosition.item) {
              moves.push(newPosition.item);
              if (newPosition.isCaptured) {
                break;
              }
              p++;
            } else {
              break;
            }
          }

        } else if (pItem[1] === '-p') {

          while (newPosition) {
            newPosition = testMove(currentPosition, p, -p);
            if (newPosition && newPosition.item) {
              moves.push(newPosition.item);
              if (newPosition.isCaptured) {
                break;
              }
              p++;
            } else {
              break;
            }
          }

        } else {

          while (newPosition) {
            newPosition = testMove(currentPosition, p, pItem[1]);
            if (newPosition && newPosition.item) {
              moves.push(newPosition.item);
              if (newPosition.isCaptured) {
                break;
              }
              p++;
            } else {
              break;
            }
          }
        }

      } else if (pItem[0] === '-p') {

        if (pItem[1] === '+p') {

          while (newPosition) {
            newPosition = testMove(currentPosition, -p, p);
            if (newPosition && newPosition.item) {
              moves.push(newPosition.item);
              if (newPosition.isCaptured) {
                break;
              }
              p++;
            } else {
              break;
            }
          }

        } else if (pItem[1] === '-p') {

          while (newPosition) {
            newPosition = testMove(currentPosition, -p, -p);
            if (newPosition && newPosition.item) {
              moves.push(newPosition.item);
              if (newPosition.isCaptured) {
                break;
              }
              p++;
            } else {
              break;
            }
          }

        } else {

          while (newPosition) {
            newPosition = testMove(currentPosition, -p, pItem[1]);
            if (newPosition && newPosition.item) {
              moves.push(newPosition.item);
              if (newPosition.isCaptured) {
                break;
              }
              p++;
            } else {
              break;
            }
          }
        }

      } else {

        if (pItem[1] === '+p') {

          while (newPosition) {
            newPosition = testMove(currentPosition, pItem[0], p);
            if (newPosition && newPosition.item) {
              moves.push(newPosition.item);
              if (newPosition.isCaptured) {
                break;
              }
              p++;
            } else {
              break;
            }
          }

        } else if (pItem[1] === '-p') {

          while (newPosition) {
            newPosition = testMove(currentPosition, pItem[0], -p);
            if (newPosition && newPosition.item) {
              moves.push(newPosition.item);
              if (newPosition.isCaptured) {
                break;
              }
              p++;
            } else {
              break;
            }
          }

        } else {

          // there is not pattern, just a single movement
          newPosition = testMove(currentPosition, pItem[0], pItem[1]);
          if (newPosition && newPosition.item) {
            moves.push(newPosition.item);
          }
        }
      }

    });

    return moves;
  };

  /**
   * user
   *
   * @returns {user}
   */
  var user = function (isWhite) {
    this.id = getUniqueId(24);
    this.info = null;
    this.elapsedTime = [];
    this.white = !!isWhite; // current user has white pieces or not
    this.pieces = []; // pieces in the game
    this.piecesOut = []; // pieces out of the game
    this.history = []; // array of moves
    this.castling = [true, true]; // left and right rook castling allowance
    return this;
  };

  user.prototype.getLastMove = function () {
    if (this.history.length > 0) {
      var last = this.history.length - 1;
      return this.history[last];
    }
    return null;
  };

  /**
   * game
   *
   * @returns {game}
   */
  var game = function () {
    this.id = getUniqueId(24);
    this.board = [];

    for (var r = 0; r < 8; r++) {
      this.board.push(new Array(8));
    }

    this.white = new user(true);
    this.white.pieces = this.init(true); // white pieces setup

    this.black = new user();
    this.black.pieces = this.init(); // black pieces setup

    this.timer = (new Date()).getTime();

    this.turn = 'white'; // which user's turn

    this.selectedPiece = null;

    return this;
  };
  game.prototype.selectedPiece = typeof piece;

  /**
   * Game initialization sequence
   * @param isWhite
   * @returns {Array}
   */
  game.prototype.init = function (isWhite) {
    var position = isWhite ? defaultWhitePosition : defaultBlackPosition;
    var pieces = isWhite ? defaultWhitePieces : defaultBlackPieces;
    var self = this;

    return _.map(pieces, function (item, index) {
      var newPosition = _.clone(position);
      var newPiece = new piece(item, isWhite, newPosition);

      // assign piece to that square
      self.board[newPosition.row][newPosition.col] = newPiece;

      // add piece to user's pieces
      if (isWhite) {
        self.white.pieces.push(newPiece);
      } else {
        self.black.pieces.push(newPiece);
      }

      // max 8 columns
      position.col = ++position.col % 8;

      if (position.col === 0) {
        // setup second row of pieces
        position.row = isWhite ? 0 : 6;
      }
      return newPiece;
    });
  };
  /**
   * Gives piece of user at rowIndex, colIndex
   * @param rowIndex : begins from 0
   * @param colIndex : begins from 0
   * @returns {piece}
   */
  game.prototype.getPieceAt = function (rowIndex, colIndex) {
    var foundItem = null;
    var self = this;

    function findPiece(isWhite) {
      var pieces = isWhite ? self.white.pieces : self.black.pieces;
      return _.find(pieces, function (pieceItem) {
        return pieceItem &&
          pieceItem.active &&
          pieceItem.position &&
          pieceItem.position.row === rowIndex &&
          pieceItem.position.col === colIndex;
      });
    }

    if (rowIndex >= 0 && colIndex >= 0) {
      foundItem = findPiece(true);
      if (foundItem) {
        return foundItem;
      }

      foundItem = findPiece();
      if (foundItem) {
        return foundItem;
      }
    }
  };

  /***
   * https://github.com/erhangundogan/jstools/blob/master/lib/jstools.js
   * @param len
   * @returns {string}
   */
  function getUniqueId(len) {
    var buf = [],
      chars = "ABCDEF0123456789",
      charlen = chars.length,
      firstAlphaNumeric = firstAlphaNumeric || false;

    var getRandomInt = function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    for (var i = 0; i < len; ++i) {
      buf.push(chars[getRandomInt(0, charlen - 1)]);
    }

    return buf.join("");
  }

  currentGame = new game();
  global.chess = currentGame;
  global.Session.set('chess', currentGame);

})(window);
