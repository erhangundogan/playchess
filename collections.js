/*
Games = new Meteor.Collection('games');


if(Meteor.isClient) {
  // insert a new game
  if(Games.find().count() === 0)
    Games.insert({
      player1: '23fffsd244232ew',
      player2: 'ewrwerwe4232ew',
      specators: [],
      figures: {
        black: {
          towerLeft: [2,5],
          horseLeft: [4,2]
          //...
        },
        white: {
          tower: [2,5]
          //...
        }
      }
    });


  // user makes a move through event
  //Games.update("S8GJ22LkmeA2QdQ6C",{$set: {'figures.black.towerLeft': [0,5]}}


  // Get the other user changes
  Tracker.autorun(function(){
    var mygame = Games.findOne();
    console.log(mygame);

    // move figures
  });
}
*/