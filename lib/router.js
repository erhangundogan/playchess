Router.configure({
  homeTemplate: 'home',
  boardTemplate: 'board',
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
              // proceed to game on reconnect
            } else if (isSpectator) {
              // proceed to spectator mode
            } else {
              // join as spectator
              if (_.isArray(game.spectators)) {
                game.spectators.push(userId);
                Games.update(game._id, { $set: {spectators: game.spectators}});
              }
            }

          } else {
            Session.set('gameId', self.params.gameId);
            playchess.createGame(self.params.gameId, function (game) {
              Games.insert({_id: game.id, game: game});
              Meteor.subscribe('games');
            });
          }

          debugger;

        });

      } else {
        var gameId = Random.id();
        Router.go('/board/' + gameId);
      }
    }

  });
