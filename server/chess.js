Meteor.startup(function () {
});

Meteor.publish('games', function() {
  return Games.find({}, { sort: { createdAt: -1 } });
});

Meteor.publish('gameList', function() {
  return Games.find({}, { fields: { '_id':1 }, limit: 5 });
});

Meteor.publish('game', function(id) {
  return Games.findOne(id);
});

Games.allow({
  insert: function (userId, doc) {
    return true;
    //return doc.game.white.id === userId || doc.game.black.id === userId;
  },
  update: function (userId, doc, fields, modifier) {
    return true;
    //return doc.game.white.id === userId || doc.game.black.id === userId;
  },
  remove: function (userId, doc) {
    return false;
  }
})