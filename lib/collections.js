Games = new Mongo.Collection('games');

Games.before.update(function (userId, doc) {
  debugger;
});

Games.after.update(function (userId, doc) {
  debugger;
});

Games.before.insert(function (userId, doc) {
  doc.createdAt = Date.now();
  doc.spectators = [userId];
  doc.players = [];
});

Games.after.insert(function (userId, doc) {
  debugger;
});