Template.board.helpers({
  rows: [ 8,  7,  6,  5,  4,  3,  2,  1 ],
  chars: [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h' ]
});

Template.row.helpers({
  cols: [ 0, 1, 2, 3, 4, 5, 6, 7 ],
  oddEven: function() {
    return (this % 2 ? 'even' : 'odd');
  }
});

Template.col.helpers({
  getColumnIndex: function() {
    return this;
  },
  getColumnChar: function() {
    var chars = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h' ];
    return chars[this];
  }
});

Template.col.events({

  // move over a piece
  'mouseover .piece': function(event) {
    $(event.target).addClass('over');
  },

  // move out a piece
  'mouseout .piece': function(event) {
    $(event.target).removeClass('over');
  },

  // select a piece
  'click .piece:not(.selected)': function(event) {
    // clear if there is a selected piece
    $('.square.selected').removeClass('selected');

    // add selected class
    $(event.target).addClass('selected');

    var rowIndex = parseInt($(event.target).attr('data-row') - 1);
    var colIndex = parseInt($(event.target).attr('data-col-index'));
    var piece = window.chess.board[rowIndex][colIndex];

    window.chess.selectedPiece = piece;
    piece.selected = true;
    var moves = piece.possibleMoves();
    debugger;
  },

  // deselect a piece
  'click .piece.selected': function(event) {
    $(event.target).removeClass('selected');
  }


});

Template.charCol.helpers({
  getKey: function() {
    return this[0];
  }
});

UI.registerHelper('checkSquare', function(row, col, options) {
  var rowIndex = parseInt(row) - 1;
  var colIndex = parseInt(col);
  var piece = window.chess.getPieceAt(rowIndex, colIndex);
  if (piece) {
    var color = piece.white ? 'white' : 'black';
    return ' piece ' + color + ' ' + piece.typeName;
  }
});