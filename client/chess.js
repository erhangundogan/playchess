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

UI.registerHelper('checkSquare', function(row, col, options) {
  var rowIndex = parseInt(row) - 1;
  var colIndex = parseInt(col);
  var piece = window.chess.getPieceAt(rowIndex, colIndex);
  if (piece) {
    var color = piece.white ? 'white' : 'black';
    return ' ' + color + ' ' + piece.typeName;
  }
});

Template.charCol.helpers({
  getKey: function() {
    return this[0];
  }
});