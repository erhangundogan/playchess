Router.configure({
  homeTemplate: 'home',
  boardTemplate: 'board',
  gameListTemplate: 'gameList',
  notFoundTemplate: 'notfound',
  loadingTemplate: 'loading',
  layoutTemplate: 'mainLayout'
});

Router.route('/')
  .get(function () {
    this.render('home');
  });

Router.route('/board/:gameId?')
  .get(function () {
    var userId = Meteor.userId();
    var self = this;

    if (!userId) {
      toastr.warning('Please sign in or register to access chess game');
      Router.go('/');
    } else {
      if (this.params && this.params.gameId) {
        Meteor.subscribe('games', function () {
          // Received games
          Session.set('gameId', self.params.gameId);
          var game = Games.findOne(self.params.gameId);

          self.render('board');

          if (game) {
            var isSpectator = _.find(game.spectators, function(spectator) {
              return spectator === userId;
            });
            var isPlayer = _.find(game.players, function(player) {
              return player === userId;
            });

            if (isPlayer) {
              // there are two states
              // waiting for another player
              // game already has begun
              if (game.players && game.players.length === 2) {
                playchess.setGame(game.game);
                playchess.setUser(game.players[0], true);
                playchess.setUser(game.players[1], false);
              }
            } else if (isSpectator) {
              // proceed to spectator mode
            } else {
              // join as spectator
              if (_.isArray(game.spectators)) {
                game.spectators.push(userId);
                Games.update(game._id, { $set: {spectators: game.spectators}});
              }
            }

            Session.set('spectators', game.spectators);

          } else {
            playchess.createGame(self.params.gameId, function (game) {
              Games.insert({
                _id: game.id,
                createdAt: Date.now(),
                game: game,
                players: [],
                spectators: [userId]
              });
              Session.set('spectators', [userId]);
            });
          }

        });

      } else {
        var gameId = Random.id();
        Router.go('/board/' + gameId);
      }
    }

  });
