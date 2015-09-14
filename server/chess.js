Meteor.startup(function () {
});

Meteor.publish('games', function() {
  return Games.find();
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