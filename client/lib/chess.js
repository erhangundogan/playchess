Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});

Template.board.helpers({
  rows: [ 8,  7,  6,  5,  4,  3,  2,  1 ],
  chars: [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h' ],
  spectators: function() {
    var game = Games.findOne(Session.get('gameId'));
    if (game && game.spectators && game.spectators.length > 0) {
      return game.spectators;
    } else {
      return [];
    }
  },
  players: function() {
    var game = Games.findOne(Session.get('gameId'));
    if (game && game.players && game.players.length > 0) {
      return game.players;
    } else {
      return [];
    }
  }
});

Template.board.events({
  'click .join-button': function(event) {
    var userId = Meteor.userId();
    var gameId = Session.get('gameId');
    var game = Games.findOne(gameId);

    if (userId && game && game.players) {
      // remove user from spectators and add to players
      // check players count
      var isPlayer = _.find(game.players, function(player) {
        return player === userId;
      });

      if (!isPlayer && game.players.length < 2) {
        game.spectators = _.without(game.spectators, userId);
        game.players.push(userId);

        if (playchess && game.players.length === 2) {
          playchess.setUser(game.players[0], true);
          playchess.setUser(game.players[1], false);
        }

        Games.update(game._id, {
          $set: {
            spectators: game.spectators,
            players: game.players,
            game: game.game
          }
        });
        Session.set('spectators', game.spectators);
      }

    } else {
      toastr.warning('Please sign in or register to join');
    }
  }
});

Template.home.helpers({
  gameList: function() {
    Meteor.subscribe('gameList');
    var gameList = Games.find({}, {fields: {'_id':1}}).fetch();
    return gameList;
  }
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
    var chess = window.chess || Session.get('chess');
    if (chess) {
      var rowIndex = parseInt(row) - 1;
      var colIndex = parseInt(col);

      if (chess.getPieceAt) {
        var piece = chess.getPieceAt(rowIndex, colIndex);

        if (piece) {
          var color = piece.white ? 'white' : 'black';
          return ' piece ' + color + ' ' + piece.typeName;
        }
      }
    }
  }
});

Template.col.events({

  // move over a piece
  'mouseover .piece': function(event) {
    if ($(event.target).hasClass(window.chess.turn)) {
      $(event.target).addClass('over');
    }
  },

  // move out a piece
  'mouseout .piece': function(event) {
    $(event.target).removeClass('over');
  },

  // select a piece
  'click .piece:not(.selected)': function(event) {
    if (!$(event.target).hasClass(window.chess.turn)) return;

    // clear if there is another selected piece
    $('.square.selected').removeClass('selected');

    // remove selected flag
    if (window.chess.selectedPiece) {
      window.chess.selectedPiece.selected = false;
      window.chess.selectedPiece = null;
    }

    // remove possible movement squares of previous selected piece
    $('.square.move')
      .removeClass('move')
      .removeClass('enpassant')
      .removeClass('promote')
      .removeClass('left-castling')
      .removeClass('right-castling')
      .removeClass('check');

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

      if (item.isEnPassant) {
        $(foundItem).addClass('enpassant');
      }
      if (item.isCastling) {
        $(foundItem).addClass(item.isCastling + '-castling');
      }
      if (item.isCheck) {
        $(foundItem).addClass('check');
      }
      if (item.isPromote) {
        $(foundItem).addClass('promote');
      }
    });
  },

  // deselect a piece
  'click .piece.selected': function(event) {
    $(event.target).removeClass('selected');
    $('.square.move')
      .removeClass('move')
      .removeClass('enpassant')
      .removeClass('promote')
      .removeClass('left-castling')
      .removeClass('right-castling')
      .removeClass('check');

    // remove selected flag
    if (window.chess.selectedPiece) {
      window.chess.selectedPiece.selected = false;
      window.chess.selectedPiece = null;
    }
  },

  'click .square.move': function(event) {
    var newRow = parseInt($(event.target).attr('data-row') - 1);
    var newCol = parseInt($(event.target).attr('data-col-index'));
    var isEnPassant = $(event.target).hasClass('enpassant');
    var isLeftCastling = $(event.target).hasClass('left-castling');
    var isRightCastling = $(event.target).hasClass('right-castling');
    var currentPiece = window.chess.selectedPiece;

    if (!(currentPiece && currentPiece.position)) {
      return;
    }

    var moveResult = currentPiece.moveTo(newRow, newCol, isEnPassant, isLeftCastling, isRightCastling);

    if (moveResult.check && moveResult.check.position) {
      $('[data-row='
        + (moveResult.check.position.row+1)
        +'][data-col-index='
        + moveResult.check.position.col +']')
        .addClass('check');
    } else {
      $('.square.check').removeClass('check');
    }

    $('.square.selected').removeClass('selected');
    $('.square.move').removeClass('move');
    $('.square.enpassant').removeClass('enpassant');
    $('.square.promote').removeClass('promote');
    $('.square.left-castling').removeClass('left-castling');
    $('.square.right-castling').removeClass('right-castling');

    Session.set('chess', window.chess);

  }
});

Template.charCol.helpers({
  getKey: function() {
    return this[0];
  }
});
