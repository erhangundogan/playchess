
(function() {

  'use strict';

  var columns = ['a','b','c','d','e','f','g','h'];
  var rows    = [ 1,  2,  3,  4,  5,  6,  7,  8 ];
  var pieces = ['king', 'queen', 'rook', 'knight', 'bishop', 'pawn'];

  var board = function() {
    this.row = null;
    this.col = null;
    this.white = false;
    return this;
  };

  var piece = function() {
    this.type = null;
    this.active = false;
    this.white = false;
    this.row = null;
    this.col = null;
    return this;
  };

  var move = function() {
    this.before = null;
    this.after = null;
    this.check = false;
    this.checkmate = false;
    this.duration = 0;
    return this;
  };
  move.prototype.piece = typeof piece;

  var game = function() {
    this.history = [];
    this.currentDuration = 0;
    this.totalDuration = 0;
    return this;
  };

  var user = function() {
    this.name = null;
    this.turn = false;
    this.white = false;
  };

})();