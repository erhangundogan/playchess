Template.board.helpers({
  rows: [ 8,  7,  6,  5,  4,  3,  2,  1 ],
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
    { 'a': 8 },
    { 'b': 7 },
    { 'c': 6 },
    { 'd': 5 },
    { 'e': 4 },
    { 'f': 3 },
    { 'g': 2 },
    { 'h': 1 }
  ],
  oddEven: function() {
    return (this % 2 ? 'even' : 'odd');
  }
});

Template.col.helpers({
  getValue: function() {
    return Object.keys(this)[0];
  }
});

Template.charCol.helpers({
  getKey: function() {
    return Object.keys(this)[0];
  }
});