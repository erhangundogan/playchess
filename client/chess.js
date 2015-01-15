Template.board.helpers({
  rows: [ 1,  2,  3,  4,  5,  6,  7,  8 ],
  charCols: [
    { 'a': 1 },
    { 'b': 2 },
    { 'c': 3 },
    { 'd': 4 },
    { 'e': 5 },
    { 'f': 6 },
    { 'g': 7 },
    { 'h': 8 }
  ]
});

Template.row.helpers({
  cols: [
    { 'a': 1 },
    { 'b': 2 },
    { 'c': 3 },
    { 'd': 4 },
    { 'e': 5 },
    { 'f': 6 },
    { 'g': 7 },
    { 'h': 8 }
  ],
  oddEven: function() {
    return (this % 2 ? 'odd' : 'even');
  }
});

Template.col.helpers({
  getValue: function() {
    return this[Object.keys(this)[0]];
  }
});

Template.charCol.helpers({
  getKey: function() {
    return Object.keys(this)[0];
  }
});