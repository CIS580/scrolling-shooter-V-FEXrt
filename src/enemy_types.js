"use strict";

module.exports = exports = (function(){
  var generateTypeDefinition = function(){
    var track = rand(5);
    return {
          frame: rand(5),
          aim: (rand(2) == 0),
          velocity: {x: (track == 3) ? 0 : rand(3)-1, y: (track == 3) ? 0 : rand(3)-1},
          weapon: rand(13),
          health: rand(25) + 1,
          fireTimeout: rand(1500) + 500,
          update: function(self, elapsedTime){
            switch(track){
              case 0:
                trackPlayerX(self);
                break;
              case 1:
                trackPlayerY(self);
                break;
              case 2:
                trackPlayerXY(self);
                break;
          }
        }
      }
  }

  function trackPlayerX(self){
    if(self.position.x > self.player.position.x) self.velocity.x = -1;
    if(self.position.x < self.player.position.x) self.velocity.x = 1;
    if(self.position.x == self.player.position.x) self.velocity.x = 0;
  }

  function trackPlayerY(self){
    if(self.position.y > self.player.position.y) self.velocity.y = -1;
    if(self.position.y < self.player.position.y) self.velocity.y = 1;
    if(self.position.y == self.player.position.y) self.velocity.y = 0;
  }

  function trackPlayerXY(self){
    trackPlayerX(self);
    trackPlayerY(self);
  }

  function rand(max){
    return Math.floor(Math.random() * max);
  }

  return {
    generate: generateTypeDefinition
  }

})();
