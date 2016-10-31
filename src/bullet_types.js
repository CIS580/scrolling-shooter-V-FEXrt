"use strict";

module.exports = exports = (function(){
  var Types = {
    Simple: 0,
    Simple2: 1
  }

  var typeDefinition = [
    {
      name: "Pistol",
      damage: 1,
      radius: 2,
      render: function(elapsedTime, ctx){
        ctx.beginPath();
        ctx.fillStyle = "green";
        ctx.arc(0, 0, 2, 0, 2*Math.PI);
        ctx.fill();
      }
    },
    {
      name: "King's Pistol",
      damage: 2,
      radius: 4,
      render: function(elapsedTime, ctx){
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.arc(0, 0, 4, 0, 2*Math.PI);
        ctx.fill();
      }
    }
  ]

  var getTypeDefinition = function(type){
    return typeDefinition[type];
  }

  return {
    Types: Types,
    getTypeDefinition: getTypeDefinition
  }

})();
