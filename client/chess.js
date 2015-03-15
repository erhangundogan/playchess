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
  },
  checkSquare: function(row, col) {
    var rowIndex = parseInt(row) - 1;
    var colIndex = parseInt(col);
    var piece = window.chess.getPieceAt(rowIndex, colIndex);
    if (piece) {
      var color = piece.white ? 'white' : 'black';
      return ' piece ' + color + ' ' + piece.typeName;
    }
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

    // remove selected flag
    if (window.chess.selectedPiece) {
      window.chess.selectedPiece.selected = false;
      window.chess.selectedPiece = null;
    }

    // remove possible movement squares of previous selected piece
    $('.square.move').removeClass('move');

    // add selected class
    $(event.target).addClass('selected');

    var rowIndex = parseInt($(event.target).attr('data-row') - 1);
    var colIndex = parseInt($(event.target).attr('data-col-index'));
    var piece = window.chess.board[rowIndex][colIndex];

    // set selected flag of piece
    window.chess.selectedPiece = piece;
    window.chess.selectedPiece.selected = true;

    // get possible movements
    var moves = piece.getMoves();

    // add move class to possible movement squares
    _.each(moves, function(item, index) {
      var itemRow = item.row + 1;
      var itemCol = item.col;
      var foundItem = $('.square[data-row='+ itemRow +'][data-col-index='+ itemCol +']');
      $(foundItem).addClass('move');
    });
  },

  // deselect a piece
  'click .piece.selected': function(event) {
    $(event.target).removeClass('selected');
    $('.square.move').removeClass('move');

    // remove selected flag
    if (window.chess.selectedPiece) {
      window.chess.selectedPiece.selected = false;
      window.chess.selectedPiece = null;
    }
  }


});

Template.charCol.helpers({
  getKey: function() {
    return this[0];
  }
});
