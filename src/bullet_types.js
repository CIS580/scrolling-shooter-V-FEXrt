"use strict";

module.exports = exports = (function(){
  var Types = {
    Pistol: 0,
    Pistol2: 1,
    Pistol3: 2,
    KingsPistol: 3,
    Beam: 4,
    Beam2: 5,
    Blaster: 6,
    Blaster2: 7,
    Beam3: 8,
    KingsBeam: 9,
    Cannon: 10,
    Cannon2: 11,
    KingsCannon: 12,
    Count: 13
  }

  var image = new Image();
  image.src = 'tilesets/projectiles.png';

  var typeDefinition = [
    {
      name: "Pistol",
      damage: 1,
      renderSource: {x: 0, y: 42, width: 12, height: 14}
    },
    {
      name: "Pistol II",
      damage: 2,
      renderSource: {x: 12, y: 42, width: 12, height: 14}
    },
    {
      name: "Pistol III",
      damage: 3,
      renderSource: {x: 24, y: 42, width: 12, height: 14}
    },
    {
      name: "King's Pistol",
      damage: 5,
      renderSource: {x: 48, y: 42, width: 12, height: 14}
    },
    {
      name: "Beam",
      damage: 10,
      renderSource: {x: 60, y: 42, width: 12, height: 14}
    },
    {
      name: "Beam II",
      damage: 15,
      renderSource: {x: 96, y: 42, width: 12, height: 14}
    },
    {
      name: "Blaster",
      damage: 20,
      renderSource: {x: 72, y: 42, width: 12, height: 14}
    },
    {
      name: "Blaster II",
      damage: 25,
      renderSource: {x: 84, y: 42, width: 12, height: 14}
    },
    {
      name: "Beam III",
      damage: 30,
      renderSource: {x: 180, y: 42, width: 12, height: 14}
    },
    {
      name: "King's Beam",
      damage: 30,
      renderSource: {x: 108, y: 98, width: 24, height: 14}
    },
    {
      name: "Cannon",
      damage: 40,
      renderSource: {x: 12, y: 70, width: 12, height: 42}
    },
    {
      name: "Cannon II",
      damage: 45,
      renderSource: {x: 60, y: 70, width: 12, height: 42}
    },
    {
      name: "King's Cannon",
      damage: 50,
      renderSource: {x: 0, y: 150, width: 12, height: 56}
    }

  ]

  var getTypeDefinition = function(type){
    return typeDefinition[type];
  }

  return {
    Types: Types,
    getTypeDefinition: getTypeDefinition,
    tileset: image
  }

})();
