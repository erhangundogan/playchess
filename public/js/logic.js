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
    // pawn has special moves, so we need function to handle it
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

      // capture double square movement of opponent's pawn
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
      var enPassantRightPiece = currentGame.getPieceAt(
        currentPosition.row + parseInt(selectedEnPassantPattern[0][0]),
        currentPosition.col + parseInt(selectedEnPassantPattern[0][1]));

      if (enPassantRightPiece && enPassantRightPiece.is('pawn') && enPassantRightPiece.isFirstMovement()) {
        // this is double opening of opponent's pawn on the left side
        selectedMovementPattern.push(selectedCapturePattern[0]);
      }

      var enPassantLeftPiece = currentGame.getPieceAt(
        currentPosition.row + parseInt(selectedEnPassantPattern[1][0]),
        currentPosition.col + parseInt(selectedEnPassantPattern[1][1]));

      if (enPassantLeftPiece && enPassantLeftPiece.is('pawn') && enPassantLeftPiece.isFirstMovement()) {
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

    this.pawnDoubleSquare = false; // pawn advance two squares
    this.pawnPromotion = false; // pawn reached latest row and it will be promoted
    this.castling = false; // rook + king special move

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

  piece.prototype.is = function(pieceType) {
    return this.typeName === pieceType; // this.piece.is('pawn') ?
  };

  piece.prototype.isFirstMovement = function() {
    return this.moves.length === 1;
  };

  piece.prototype.getMoves = function () {
    // we have row, col and piece type
    // so we can extract possible movements according to pattterns
    // underscore library would be essential
    var self = this;
    var moves = [];
    var pattern = patterns[self.typeName];
    var currentPosition = this.position;

    function testMove(piecePosition, rowAmount, colAmount) {
      var newRow = piecePosition.row + parseInt(rowAmount);
      var newCol = piecePosition.col + parseInt(colAmount);
      var testMove = new position(newRow, newCol);

      if (testMove.isValid()) {
        var pieceAtMovement = currentGame.getPieceAt(newRow, newCol);
        if (!pieceAtMovement || (pieceAtMovement && pieceAtMovement.white !== self.white)) {
          return testMove;
        }
      }
    }

    if (typeof pattern === 'function') {
      pattern = pattern(self.white, !self.moved, currentPosition);
    }

    _.each(pattern, function (pItem, pIndex) {

      var p = 1;
      var newPosition = true;

      // if pattern first array item includes +p/-p then this piece will go
      // through positive/negative y coordinate until it is blocked
      if (pItem[0] === '+p') {

        // if pattern second array item includes +p/-p then this piece will go
        // through positive/negative x coordinate until it is blocked
        if (pItem[1] === '+p') {

          // test and add movement until it blocked
          while (newPosition) {
            newPosition = testMove(currentPosition, p, p);
            if (newPosition) {
              moves.push(newPosition);
              p++;
            } else {
              break;
            }
          }

        } else if (pItem[1] === '-p') {

          while (newPosition) {
            newPosition = testMove(currentPosition, p, -p);
            if (newPosition) {
              moves.push(newPosition);
              p++;
            } else {
              break;
            }
          }

        } else {

          while (newPosition) {
            newPosition = testMove(currentPosition, p, pItem[1]);
            if (newPosition) {
              moves.push(newPosition);
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
            if (newPosition) {
              moves.push(newPosition);
              p++;
            } else {
              break;
            }
          }

        } else if (pItem[1] === '-p') {

          while (newPosition) {
            newPosition = testMove(currentPosition, -p, -p);
            if (newPosition) {
              moves.push(newPosition);
              p++;
            } else {
              break;
            }
          }

        } else {

          while (newPosition) {
            newPosition = testMove(currentPosition, -p, pItem[1]);
            if (newPosition) {
              moves.push(newPosition);
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
            if (newPosition) {
              moves.push(newPosition);
              p++;
            } else {
              break;
            }
          }

        } else if (pItem[1] === '-p') {

          while (newPosition) {
            newPosition = testMove(currentPosition, pItem[0], -p);
            if (newPosition) {
              moves.push(newPosition);
              p++;
            } else {
              break;
            }
          }

        } else {

          // there is not pattern, just a single movement
          newPosition = testMove(currentPosition, pItem[0], pItem[1]);
          if (newPosition) {
            moves.push(newPosition);
          }
        }
      }

    });

    return moves;
  };

  /**
   * move
   *
   * @returns {move}
   */
  var move = function () {
    this.id = getUniqueId(24);
    this.piece = null; // type of piece from pieces collection
    this.movement = null; // movement positions before and after
    this.check = false; // is it check?
    this.checkmate = false; // is it checkmate?
    this.duration = 0; // movement duration
    return this;
  };
  move.prototype.piece = typeof piece;
  move.prototype.movement = typeof movement;

  /**
   * user
   *
   * @returns {user}
   */
  var user = function (isWhite) {
    this.id = getUniqueId(24);
    this.info = null;
    this.turn = !!isWhite; // is it current user's turn to play? default white player
    this.lastMove = null; // last move of current user
    this.white = !!isWhite; // current user has white pieces or not
    this.pieces = []; // pieces in the game
    this.piecesOut = []; // pieces out of the game
    this.history = []; // array of moves
    this.castling = [true, true]; // left and right rook castling allowance
    return this;
  };
  user.prototype.lastMove = typeof move;

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

    this.currentDuration = 0;
    this.totalDuration = 0;

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

})(window);
