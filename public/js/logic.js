/**
 * Chess Game Logic
 * by Erhan Gundogan
 * January 2015
 * MIT License
 */

(function(global) {

  'use strict';

  var currentGame = null;
  var columns = ['a','b','c','d','e','f','g','h'];
  var rows    = [ 1,  2,  3,  4,  5,  6,  7,  8 ];
  var pieces  = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

  var defaultWhitePieces = [0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 2, 4, 5, 2, 1, 3];
  var defaultBlackPieces = [3, 1, 2, 4, 5, 2, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0];

  // [row, col]: +/- analytic plane, row:y, col:x
  // minus means backwards, different direction for white and black
  var patterns = {
    bishop: function(currentPosition) {
      var moves = [];
      var pattern = [
        ['+p', '+p'],
        ['-p', '-p'],
        ['-p', '+p'],
        ['+p', '-p']
      ];

      function testMoves(currentPosition, amount, rowPositive, colPositive) {
        var possibleMoves = [];
        var newRow = rowPositive ? currentPosition.row + amount : currentPosition.row - amount;
        var newCol = colPositive ? currentPosition.col + amount : currentPosition.col - amount;
        var testMove = new position(newRow, newCol);

        while(testMove.isValid()) {
          possibleMoves.push(testMove);
          amount++;
          newRow = rowPositive ? currentPosition.row + amount : currentPosition.row - amount;
          newCol = colPositive ? currentPosition.col + amount : currentPosition.col - amount;
          testMove = new position(newRow, newCol);
        }
        return possibleMoves;
      }

      _.each(pattern, function (pItem, pIndex) {
        var p = 1;
        var newPosition = null;
        if (pItem[0] === '+p') {
          if (pItem[1] === '+p') {
            testMoves(currentPosition, p, true, true);
          } else if (pItem[1] === '-p') {
            testMoves(currentPosition, p, true, false);
          }
        } else if (pItem[0] === '-p') {
          if (pItem[1] === '+p') {
            testMoves(currentPosition, p, false, true);
          } else if (pItem[1] === '-p') {
            testMoves(currentPosition, p, false, false);
          }
        }
      });
    }

  };

  /**
   * position
   *
   * @param row
   * @param col
   * @returns {position}
   */
  var position = function(row, col) {
    this.id = getUniqueId(24);
    this.row = row; // row in number
    this.col = col; // col in number

    // text representation of position
    this.text = function() {
      return columns[this.col] + '' + this.row;
    };
    return this;
  };
  position.prototype.isValid = function() {
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
  var movement = function(before, after) {
    this.id = getUniqueId(24);
    this.before = before; // row, col position before movement
    this.after = after; // row, col position after movement

    // text representation of movement
    this.text = function() {
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
  var piece = function(type, white, position) {
    this.id = getUniqueId(24);
    this.type = type; // type of piece: ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']
    this.typeName = pieces[type];
    this.white = !!white;
    this.active = true; // active or passive piece
    this.selected = false; // selected at that moment
    this.moved = false; // is this piece moved before
    this.position = position; // position of a piece
    return this;
  };
  piece.prototype.position = typeof position;
  piece.prototype.getMoves = function() {
    // we have row, col and piece type
    // so we can extract possible movements according to pattterns
    // underscore library would be essential
    var self = this;
    var moves = [];
    _.each(patterns[self.typeName], function(pattern) {
      //var existingPosition = _.clone(self.position);
      var newPosition = new position(
        self.position.row + parseInt(pattern[0]),
        self.position.col + parseInt(pattern[1]));

      if (newPosition.isValid()) {
        var pieceAtMovement = currentGame.getPieceAt(newPosition.row, newPosition.col);

        if (!pieceAtMovement || (pieceAtMovement && pieceAtMovement.white !== self.white)) {
          moves.push(newPosition);
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
  var move = function() {
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
  var user = function(isWhite) {
    this.id = getUniqueId(24);
    this.info = null;
    this.turn = !!isWhite; // is it current user's turn to play? default white player
    this.lastMove = null; // last move of current user
    this.white = !!isWhite; // current user has white pieces or not
    this.pieces = []; // pieces in game
    this.history = []; // array of moves
    return this;
  };
  user.prototype.lastMove = typeof move;

  /**
   * game
   *
   * @returns {game}
   */
  var game = function() {
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
  game.prototype.init = function(isWhite) {
    var position = isWhite ? defaultWhitePosition : defaultBlackPosition;
    var pieces = isWhite ? defaultWhitePieces : defaultBlackPieces;
    var self = this;

    return _.map(pieces, function(item, index) {
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
  game.prototype.getPieceAt = function(rowIndex, colIndex) {
    var foundItem = null;
    var self = this;

    function findPiece(isWhite) {
      var pieces = isWhite ? self.white.pieces : self.black.pieces;
      return _.find(pieces, function(pieceItem) {
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

/*
 bishop1: [
 ['+p','+p'],
 ['-p','-p'],
 ['-p','+p'],
 ['+p','-p']
 ],
 rook: [
 [ '0','+p'],
 ['-p', '0'],
 [ '0','-p'],
 ['+p', '0']
 ],
 queen: [
 ['+p','+p'],
 ['-p','-p'],
 ['-p','+p'],
 ['+p','-p'],
 [ '0','+p'],
 ['-p', '0'],
 [ '0','-p'],
 ['+p', '0']
 ],
 king: [
 ['+1','+1'],
 ['-1','-1'],
 ['-1','+1'],
 ['+1','-1'],
 [ '0','+1'],
 ['-1', '0'],
 [ '0','-1'],
 ['+1', '0']
 ],
 knight: [
 ['+2','+1'],
 ['+1','+2'],
 ['-1','+2'],
 ['-2','+1'],
 ['-2','-1'],
 ['-1','-2'],
 ['+1','-2'],
 ['+2','-1']
 ],
 pawn: [
 ['+1', '0'],
 ['+1','+1'],
 ['+1','-1']
 ]
 */