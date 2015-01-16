
(function() {

  'use strict';

  var columns = ['a','b','c','d','e','f','g','h'];
  var rows    = [ 1,  2,  3,  4,  5,  6,  7,  8 ];
  var pieces = ['king', 'queen', 'rook', 'knight', 'bishop', 'pawn'];

  var user = function() {
    this.id = null;
    this.name = null;
    this.turn = false; // is it current user's turn to play?
    this.lastMove = null; // last move of current user
    this.white = false; // current user has white pieces or not
    this.activePieces = []; // pieces active in game
    this.passivePieces = []; // pieces passive in game
  };
  user.prototype.lastMove = typeof move;

  var position = function() {
    this.row = null; // row in number
    this.col = null; // col in number
    this.text = null; // row,col representation
  }

  var piece = function() {
    this.id = null;
    this.type = null; // type of piece in text
    this.white = false; // is it white or not
    this.position = null; // position of a piece
    return this;
  };
  piece.prototype.position = typeof position;

  var move = function() {
    this.id = null;
    this.piece = null;
    this.beforePosition = null;
    this.afterPosition = null;
    this.check = false;
    this.checkmate = false;
    this.duration = 0;
    return this;
  };
  move.prototype.piece = typeof piece;
  move.prototype.beforePosition = typeof position;
  move.prototype.afterPosition = typeof position;

  var game = function() {
    this.id = null;
    this.history = []; // array of moves
    this.currentDuration = 0;
    this.totalDuration = 0;
    return this;
  };

})();