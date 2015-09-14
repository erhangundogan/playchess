Games = new Mongo.Collection('games');

Games.before.update(function (userId, doc) {
});

Games.after.update(function (userId, doc) {
});

Games.before.insert(function (userId, doc) {
});

Games.after.insert(function (userId, doc) {
});