"use strict";

const Enemy = require('./enemy');
const Powerup = require('./powerup');

/**
 * @module EntitySpawner
 * A class representing a EntitySpawner
 */
module.exports = exports = EntitySpawner;

/**
 * @constructor EntitySpawner
 * Creates a EntitySpawner
 */
function EntitySpawner(em, player) {
  this.entityManager = em;
  this.player = player;

  this.timer = rand(500) + 100;

}

EntitySpawner.prototype.update = function(elapsedTime){
    this.timer -= elapsedTime;
    if(this.timer <= 0){
      this.timer = rand(1500) + 500;
      (Math.random() > 0.5) ? spawnPowerup(this) : spawnEnemy(this);
    }
}

function spawnPowerup(self){
  self.entityManager.addEntity(new Powerup(self.player, generatePosition(self)));
}

function spawnEnemy(self){
  self.entityManager.addEntity(new Enemy(self.entityManager, self.player, generatePosition(self)));
}

function generatePosition(self){
  var pos = window.camera.toScreenCoordinates(self.player.position);

  var x = rand(673);
  var y = rand(50);

  if(pos.x == x) x += (rand(40) - 19);

  return window.camera.toWorldCoordinates({x: x, y: y});
}

function rand(max){
  return Math.floor(Math.random() * max);
}
