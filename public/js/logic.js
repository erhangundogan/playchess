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
  // bottom/left:[0,0] - top/right:[7,7]
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

  /**
   * position is on chessboard?
   *
   * @returns {boolean}
   */
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
    this.duration = 0; // movement duration
    //this.check = false; // is it check?
    //this.checkmate = false; // is it checkmate?
    //this.pawnPromotion = false; // pawn reached latest row and it will be promoted
    //this.castling = false; // rook + king special movement

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

  /**
   * checks if piece is certain type
   *
   * @param pieceType
   * @returns {boolean}
   */
  piece.prototype.is = function (pieceType) {
    return this.typeName === pieceType; // this.piece.is('pawn') ?
  };

  /**
   * is it first movement of piece
   *
   * @returns {boolean}
   */
  piece.prototype.isFirstMovement = function () {
    return this.moves.length === 1;
  };

  /**
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
   * @param isEnPassant
   */
  piece.prototype.moveTo = function (newRow, newCol, isEnPassant) {
    var oldPosition = this.position;
    var newPosition = new position(newRow, newCol);
    var capturedPiece = null;

    if (isEnPassant) {
      // remove en passant capture
      capturedPiece = currentGame.getPieceAt( (this.white ? newRow - 1 : newRow + 1), newCol );
      if (capturedPiece) {
        capturedPiece.capture();
      }
    } else {
      // remove piece if it is captured
      capturedPiece = currentGame.getPieceAt(newRow, newCol);
      if (capturedPiece) {
        capturedPiece.capture();
      }
    }

    // is it rook and not played before?
    // if so, which rook is it?
    // it is necessary for castling
    if (this.is('rook') && this.moves.length === 0) {
      // white user
      if (this.white) {
        // left or right rook
        if (oldPosition.row === 0 && oldPosition.col === 0) {
          // set left castling false
          currentGame.white.castling[0] = false;
        } else if (oldPosition.row === 0 && oldPosition.col === 7) {
          // set right castling false
          currentGame.white.castling[1] = false;
        }
      } else {
        // left or right rook
        if (oldPosition.row === 7 && oldPosition.col === 0) {
          // set right castling false
          currentGame.black.castling[1] = false;
        } else if (oldPosition.row === 7 && oldPosition.col === 7) {
          // set left castling false
          currentGame.black.castling[0] = false;
        }
      }
    } else if (this.is('king') && this.moves.length === 0) {
      // if it is king set both castling false
      if (this.white) {
        currentGame.white.castling = [false, false];
      } else {
        currentGame.black.castling = [false, false];
      }
    }

    // calculate elapsed time and replace timer with new one
    var currentTime = (new Date()).getTime();
    var timeDiff = currentTime - currentGame.timer;
    currentGame.timer = currentTime;

    // create movement record
    var currentMovement = new movement(oldPosition, newPosition);
    currentMovement.pieceId = this.id;
    currentMovement.duration = timeDiff;

    // is this movement pawn promotion?
    if (this.is('pawn') && ((this.white && newRow === 7) || (!this.white && newRow === 0))) {
      // set movement as pawn promotion
      currentMovement.pawnPromotion = true;

      // TODO: handle pawn promotion
    }

    // add new position to piece
    this.position = newPosition;

    // add movement to piece's movements list
    this.moves.push(currentMovement);

    // change position of piece on board
    currentGame.board[oldPosition.row][oldPosition.col] = null;
    currentGame.board[newRow][newCol] = this;
    currentGame.selectedPiece.selected = false;
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

    // TODO: isCheck and isCheckMate control

  };

  /**
   * captures this piece
   */
  piece.prototype.capture = function () {
    var self = this;
    self.active = false;

    // remove piece from board array
    currentGame.board[self.position.row][self.position.col] = null;

    if (this.white) {
      // add piece to piecesOut array
      currentGame.white.piecesOut.push(self);

      // remove piece from pieces array
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

  /**
   * gets possible movements of a piece
   *
   * @returns {Array}
   */
  piece.prototype.getMoves = function () {
    // we have row, col and piece type
    // so we can extract possible movements according to pattterns
    // underscore library would be essential
    var self = this;
    var moves = [];
    var pattern = patterns[self.typeName]; // get appropriate pattern
    var currentPosition = this.position;

    function testMove(piecePosition, rowAmount, colAmount) {
      // row, col movement amount
      var rowDiff = parseInt(rowAmount);
      var colDiff = parseInt(colAmount);

      // possible new position
      var newRow = piecePosition.row + rowDiff;
      var newCol = piecePosition.col + colDiff;

      // create new position
      var testMove = new position(newRow, newCol);

      // do we have valid position
      if (testMove.isValid()) {

        // any piece on that position
        var pieceAtMovement = currentGame.getPieceAt(newRow, newCol);

        // is it threat against king?
        var isCheck = pieceAtMovement && pieceAtMovement.is('king');

        if (!pieceAtMovement) {
          // there is no capture, move to that position
          if (self.is('pawn') && Math.abs(rowDiff) === 2) {
            // check if there is a piece in front of pawn blocking double square move
            if (!(currentGame.getPieceAt( (rowDiff < 0 ? newRow + 1 : newRow - 1), newCol ))) {
              testMove.isCaptured = false;
              return testMove;
            }
          } else if (self.is('pawn') && Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 1) {
            // is it en passant capture?
            testMove.isCaptured = true;
            testMove.isEnPassant = true;

            // get en passant piece into position
            // var enPassantPiece = currentGame.getPieceAt( (self.white ? newRow - 1 : newRow + 1), newCol );
            // testMove.enPassantPiece = enPassantPiece ? enPassantPiece : null;

            return testMove;
          } else {
            testMove.isCaptured = false;
            return testMove;
          }
        } else if (pieceAtMovement && pieceAtMovement.white !== self.white && !self.is('pawn')) {
          // opponent's piece will be captured straight because our piece is not pawn
          testMove.isCaptured = true;
          testMove.isCheck = isCheck;
          return testMove;
        } else {
          // opponent's piece will be captured with pawn through adjacent square not straight
          if (self.is('pawn')) {
            if (pieceAtMovement && Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 1) {
              testMove.isCaptured = true;
              testMove.isCheck = isCheck;
              return testMove;
            }
          }
        }
      }
    }

    // pawn has special movements so we are getting function
    // and passing arguments to get patterns
    if (typeof pattern === 'function') {
      pattern = pattern(self.white, self.moves.length === 0, currentPosition);
    }

    // TODO: refactor these if/while sections
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

            // do we have new possible new position?
            if (newPosition) {

              // put it into possible moves
              moves.push(newPosition);

              // if there is a opponent's piece we cannot go further
              if (newPosition.isCaptured) {
                break;
              }

              // moving to next position in pattern
              p++;

            } else {

              // we have no more possible moves
              break;
            }
          }

        } else if (pItem[1] === '-p') {

          while (newPosition) {
            newPosition = testMove(currentPosition, p, -p);
            if (newPosition) {
              moves.push(newPosition);
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
            if (newPosition) {
              moves.push(newPosition);
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
            if (newPosition) {
              moves.push(newPosition);
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
            if (newPosition) {
              moves.push(newPosition);
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
            if (newPosition) {
              moves.push(newPosition);
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
            if (newPosition) {
              moves.push(newPosition);
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
            if (newPosition) {
              moves.push(newPosition);
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
          if (newPosition) {
            moves.push(newPosition);
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

  /**
   * gets that user's last movement
   * necessary for en passant
   *
   * @returns {*}
   */
  user.prototype.getLastMove = function () {
    if (this.history.length > 0) {
      var last = this.history.length - 1;
      return this.history[last];
    }
    return null;
  };


  user.prototype.isCheck = function () {
    var self = this;

    _.each(self.pieces, function (piece) {

    });
  };

  /**
   * game
   *
   * @returns {game}
   */
  var game = function () {
    this.id = getUniqueId(24);

    // chessboard array setup
    this.board = [];
    for (var r = 0; r < 8; r++) {
      this.board.push(new Array(8));
    }

    // white pieces setup
    this.white = new user(true);
    this.white.pieces = this.init(true);

    // black pieces setup
    this.black = new user();
    this.black.pieces = this.init();

    // set begin time
    this.timer = (new Date()).getTime();

    // active user
    this.turn = 'white'; // which user's turn

    // selected piece
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

    // create each piece for a user to play
    return _.map(pieces, function (item, index) {

      // clone default position
      var newPosition = _.clone(position);

      // create new piece according to default arguments
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

      // setup second row of pieces
      if (position.col === 0) {
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

      // find piece in that position if it is active
      return _.find(pieces, function (pieceItem) {
        return pieceItem &&
          pieceItem.active &&
          pieceItem.position &&
          pieceItem.position.row === rowIndex &&
          pieceItem.position.col === colIndex;
      });
    }

    // is it valid square
    if (rowIndex >= 0 && colIndex >= 0) {

      // find in white pieces
      foundItem = findPiece(true);
      if (foundItem) {
        return foundItem;
      }

      // find in black pieces
      foundItem = findPiece();
      if (foundItem) {
        return foundItem;
      }
    }
  };

  /**
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

  // create new game
  currentGame = new game();
  global.chess = currentGame;
  global.Session.set('chess', currentGame);

})(window);
