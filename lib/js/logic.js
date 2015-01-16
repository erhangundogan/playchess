/**
 * Chess Game Logic
 * by Erhan Gundogan
 * January 2015
 * MIT License
 */

(function() {

  'use strict';

  var columns = ['a','b','c','d','e','f','g','h'];
  var rows    = [ 1,  2,  3,  4,  5,  6,  7,  8 ];
  var pieces = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];

  // [row, col]: +/- analytic plane, row:y, col:x
  // minus means backwards, different direction for white and black
  var patterns = {
    bishop: [
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
      ['+2','-1'],
    ],
    pawn: [
      ['+1', '0'],
      ['+1','+1'],
      ['+1','-1'],
    ]
  };

  /**
   * position
   *
   * @param row
   * @param col
   * @returns {position}
   */
  var position = function(row, col) {
    this.row = row; // row in number
    this.col = col; // col in number

    // text representation of position
    this.text = function() {
      return columns[this.col] + '' + this.row;
    };
    return this;
  };

  /**
   * movement
   *
   * @param before
   * @param after
   * @returns {movement}
   */
  var movement = function(before, after) {
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
  var piece = function() {
    this.id = null;
    this.type = null; // type of piece in text
    this.white = false; // is it white or not
    this.position = null; // position of a piece
    return this;
  };
  piece.prototype.position = typeof position;
  piece.prototype.applyMove = function() {
    // we have this.position information
    // we need to apply default movement logic for individual piece
    return this.possibleMoves();
  };
  piece.prototype.possibleMoves = function() {
    // we have row, col and piece type
    // so we can extract possible movements according to pattterns
    // underscore library would be essential
    var self = this;
    return _.map(patterns[this.type], function(pattern) {
      var newPostion = new position(
        self.position.row += pattern[0],
        self.position.col += pattern[1]);


    });
  };

  /**
   * move
   *
   * @returns {move}
   */
  var move = function() {
    this.id = null;
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
  var user = function() {
    this.id = null;
    this.info = null;
    this.turn = false; // is it current user's turn to play?
    this.lastMove = null; // last move of current user
    this.white = false; // current user has white pieces or not
    this.activePieces = []; // pieces active in game
    this.passivePieces = []; // pieces passive in game
    return this;
  };
  user.prototype.lastMove = typeof move;

  /**
   * game
   *
   * @returns {game}
   */
  var game = function() {
    this.id = null;
    this.history = []; // array of moves
    this.currentDuration = 0;
    this.totalDuration = 0;
    return this;
  };

  // reset chessboard
  // reset flags
  // reset pieces
  // reset match
  // create users
  // place pieces
  // arrange match
  function setup() {
    function resetBoard() {

    }
  }

})();