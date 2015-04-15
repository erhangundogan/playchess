/**
 * Chess Game Logic
 * by Erhan Gundogan <erhan.gundogan@gmail.com>
 * January 2015
 * MIT License
 */

(function (global) {

  'use strict';

  var currentGame = null;

  /**
   * Chessboard column names
   * @type {string[]}
   */
  var columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  /**
   * Chessboard row names
   * @type {number[]}
   */
  var rows = [1, 2, 3, 4, 5, 6, 7, 8];

  /**
   * Chessboard piece types
   * @type {string[]}
   */
  var pieces = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

  /**
   * White player pieces
   * [0-7] array items indicates pawns
   * [8-15] array items indicates second row pieces
   * @type {number[]}
   */
  var defaultWhitePieces = [0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 2, 4, 5, 2, 1, 3];

  /**
   * Black player pieces
   * [0-7] array items indicates second row pieces
   * [8-15] array items indicates pawns
   * @type {number[]}
   */
  var defaultBlackPieces = [3, 1, 2, 4, 5, 2, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0];

  /**
   * Represents movement patterns of chess pieces.
   * Each piece's pattern combined of multiple movements.
   * Each movement combined of [row, column] action.
   * Each action may contain ±{number}, ±p or 0.
   * [+p, +p] indicates same amount of positive movement in cartesian coordinate which has current position as an origin.
   * [-p, -p] indicates same amount of negative movement in cartesian coordinate which has current position as an origin.
   * @type {{bishop: *[], rook: *[], queen: *[], knight: *[], king: Function, pawn: Function}}
   */
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
    /**
     * King has castling feature, so we need a function to handle it's movements.
     * @param {boolean} isWhite - Finds out if it is white user (isWhite === true)
     * @returns {Array.<[string, string]>} - Possible movements array
     */
    king : function(isWhite) {
      var movementPattern = [
          ['+1', '+1'],
          ['-1', '-1'],
          ['-1', '+1'],
          ['+1', '-1'],
          ['0', '+1'],
          ['-1', '0'],
          ['0', '-1'],
          ['+1', '0']
        ];
      var currentUser = currentGame[isWhite ? 'white' : 'black'];
      return movementPattern.concat(currentUser.getCastlingMove());
    },
    /**
     * Pawn has special moves, so we need a function to handle them.
     * @param {boolean} isWhite - Is it white user (isWhite === true)
     * @param {boolean} isFirstMove - Is it pawn's first movement
     * @param {position} currentPosition - Current position of pawn
     * @returns {Array.<[string, string]>} - Possible movements array
     */
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
   * Represents any square on chessboard.
   * @constructor
   * @param {number} row - Represents a row shown by 1-8 numbers on a chessboard (bottom:0, top:7)
   * @param {number} col - Represents a column shown by a-h characters on a chessboard (left:0, right:7)
   * @returns {position}
   */
  var position = function (row, col) {
    this.row = row; // row in number
    this.col = col; // col in number
    return this;
  };

  /**
   * Validates the bounds of itself.
   * @returns {boolean}
   */
  position.prototype.isValid = function () {
    return this.row <= 7 && this.row >= 0 && this.col <= 7 && this.col >= 0;
  };
  /**
   * Default white user's first (pawn's) row
   * @type {position}
   */
  var defaultWhitePosition = new position(1, 0);

  /**
   * Default black user's first (pawn's) row.
   * @type {position}
   */
  var defaultBlackPosition = new position(7, 0);

  /**
   * Represents movement of a piece.
   * @constructor
   * @param {position} before - position before movement
   * @param {position} after - position after movement
   * @returns {movement}
   */
  var movement = function (before, after) {
    this.id = getUniqueId(24);
    this.before = before; // row, col position before movement
    this.after = after; // row, col position after movement

    // TODO: put piece instead of pieceId or put _id and subDocument
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
  /**
   * before holds position object.
   * @type {position}
   */
  movement.prototype.before = typeof position;

  /**
   * after holds position object.
   * @type {position}
   */
  movement.prototype.after = typeof position;


  /**
   * Represents any chess piece of a user.
   * @constructor
   * @param {number} type - index of item located in "pieces" variable
   * @param {boolean} white - is it white user?
   * @param {position} position - current position of created piece
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
  /**
   * Current position of this piece
   * @type {position}
   */
  piece.prototype.position = typeof position;

  /**
   * Validates piece type.
   * @param {string} pieceType - string representation of piece type to validate (e.g 'pawn')
   * @returns {boolean} - this piece has same type as pieceType
   */
  piece.prototype.is = function (pieceType) {
    return this.typeName === pieceType; // this.piece.is('pawn') ?
  };

  /**
   * Is it first movement of this piece.
   * @returns {boolean}
   */
  piece.prototype.isFirstMovement = function () {
    return this.moves.length === 1;
  };

  /**
   * whenever piece moved to another position this method does:
   *   remove selected piece from board position
   *   remove opponent's piece if it is captured
   *   change captured piece to passive
   *   add selected piece to clicked square in board array
   *   change position of selected piece
   *   add movement to piece's moves array
   *   add movement to user's history
   *   remove selected flag
   *   change turn
   *   reset timer
   *   clear selected, move classes
   *
   * @param {number} newRow - New position to be moved
   * @param {number} newCol - Old position moved from
   * @param {boolean} isEnPassant - Is it en passant movement (pawn captures 2 square moved pawn by intercepting it)
   * @param {boolean} isLeftCastling - Is it left castling
   * @param {boolean} isRightCastling - Is it right castling
   */
  piece.prototype.moveTo = function (newRow, newCol, isEnPassant, isLeftCastling, isRightCastling) {
    var oldPosition = this.position;
    var newPosition = new position(newRow, newCol);
    var capturedPiece = null;

    if (isEnPassant) {
      // remove en passant capture
      capturedPiece = currentGame.getPieceAt( (this.white ? newRow - 1 : newRow + 1), newCol );
      if (capturedPiece) {
        capturedPiece.capture();
      }
    } else if (isLeftCastling) {
      // TODO: finish him
    } else if (isRightCastling) {

    } else {
      // remove piece if it is captured
      capturedPiece = currentGame.getPieceAt(newRow, newCol);
      if (capturedPiece) {
        capturedPiece.capture();
      }
    }

    /**
     * is it rook and not played before?
     * if so, which rook is it?
     */
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
   * Captures this piece and set it as passive.
   * @returns {undefined}
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
   * Gets possible movements of a piece.
   * @returns {Array}
   */
  piece.prototype.getMoves = function () {
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
          } else if (self.is('king') && Math.abs(colDiff) === 2) {
            // it is castling
            if ((self.white && colAmount === '+2') || (!self.white && colAmount === '+2')) {
              // white right castling
              testMove.isCastling = 'right';
              return testMove;
            } else if ((self.white && colAmount === '-2') || (!self.white && colAmount === '-2')) {
              // white left castling
              testMove.isCastling = 'left';
              return testMove;
            }
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
      if (self.is('pawn')) {
        pattern = pattern(self.white, self.moves.length === 0, currentPosition);
      } else if (self.is('king')) {
        var castlingOption = self.white ? currentGame.white.castling : currentGame.black.castling;
        pattern = pattern(self.white);
      }
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
   * Represents a user either white or black.
   * @constructor
   * @param {boolean} isWhite - is it white user?
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
   * Gets the user's last movement.
   * It would be necessary to determine en passant movement
   * @returns {movement|null}
   */
  user.prototype.getLastMove = function () {
    if (this.history.length > 0) {
      var last = this.history.length - 1;
      return this.history[last];
    }
    return null;
  };

  /**
   * Current user's last movement caused check?
   * @param {boolean} isWhite - is it white user?
   */
  user.prototype.isCheck = function (isWhite) {
    var self = this;

    _.each(self.pieces, function (piece) {
      // TODO: scan all pieces and find out if king is in threat
    });
  };

  /**
   * Checks if you can do castling or not.
   * king should not be moved
   * rook should not be moved
   * squares have to be unoccupied between rook and king
   * cannot do castling if it is check
   * there must be no threat through kings movement points or end point
   */
  user.prototype.getCastlingMove = function() {
    var self = this;

    var castlingMovement = [
    ];

    function checkProcess(currentUser, isLeft) {

      // determine castling row
      var castlingRow = currentUser.white ? 0 : 7;

      // set castling index, left:0, right:1
      var castlingArrayIndex = isLeft ? 0 : 1;

      // check appropriate rook
      var rookColumn = isLeft ? 0 : 7;

      // occupied squares list
      var occupiedSquares = isLeft ? [1,2,3] : [5,6];

      // threat squares list
      var threatSquares = isLeft ? [4,3,2,1] : [4,5,6];

      // get rook
      var rook = currentGame.board[castlingRow][rookColumn];

      // if rook is available
      var isRookAvailable = rook && rook.is('rook') && rook.moves.length === 0 && rook.white === self.white;

      if (isRookAvailable) {
        // is path between rook and king unoccupied
        var occupied = _.find(occupiedSquares, function(squareIndex) {
          return currentGame.board[castlingRow][squareIndex];
        });

        if (!occupied) {
          // if it is check or king's castling path in threat
          var threat = _.find(threatSquares, function(squareIndex) {
            return currentGame.checkPositionThreat(currentUser.white, castlingRow, squareIndex);
          });

          // if there is no threat we can do castling otherwise no
          return !!threat;

        } else {
          // squares betweek rook and king occupied. this castling cannot available
          return false;
        }
      } else {
        // rook is not available
        return false;
      }
    }

    if (!this.castling[0] && !this.castling[1]) {
      return castlingMovement;
    }

    var king = _.find(self.pieces, function(item) {
      return item.is('king');
    });

    if (king.moves.length > 0) {
      this.castling = [false, false];
      return castlingMovement;
    }

    // left
    if (this.castling[0]) {
      if (checkProcess(self, true)) {
        castlingMovement.push(['0', '-2']);
      }
    }

    // right
    if (this.castling[1]) {
      if (checkProcess(self)) {
        castlingMovement.push(['0', '+2']);
      }
    }

    return castlingMovement;

  };

  /**
   * Represents current game and it's arguments
   * @constructor
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

  /**
   * Represents current user's selected piece
   * @type {piece}
   */
  game.prototype.selectedPiece = typeof piece;

  /**
   * Game initialization sequence
   * @param {boolean} isWhite - is it white player?
   * @returns {Array.<piece>} - current user's pieces
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
   * @param {number} rowIndex - row of chessboard to be searched
   * @param {number} colIndex - column of chessboard to be searched
   * @returns {piece|undefined} - returns piece in that position otherwise undefined
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
   * Finds threats for position indicated by rowIndex, colIndex against player white/black
   * @param {boolean} isWhite - if true, it finds threat against white player's piece otherwise black
   * @param {number} rowIndex - row number (0-7)
   * @param {number} colIndex - column number (0-7)
   * @returns {boolean}
   */
  game.prototype.checkPositionThreat = function(isWhite, rowIndex, colIndex) {

    // we are looking threats against isWhite specific user's possible position
    // If isWhite === true then we will check black user's pieces
    var checkPiecesOf = isWhite ? this.black : this.white;

    var hasThreat = _.find(checkPiecesOf.pieces, function(piece) {
      var moves = piece.getMoves();
      var isPositionThreaten = _.find(moves, function(move) {
        return move.row === rowIndex && move.col === colIndex;
      });

      if (isPositionThreaten >= 0) {
        return piece
      } else {
        return false;
      }
    });

    debugger;

    return hasThreat;
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
