"use strict";

const BulletDefinition = require('./bullet_types');

/**
 * @module Bullet
 * A class for managing bullets in-game
 * We use a Float32Array to hold our bullet info,
 * as this creates a single memory buffer we can
 * iterate over, minimizing cache misses.
 * Values stored are: positionX, positionY, velocityX,
 * velocityY in that order.
 */
module.exports = exports = Bullet;

/**
 * @constructor Bullet
 * Creates a Bullet
 */
function Bullet(position, velocity, type, isEnemy) {
  this.position = {x: position.x, y: position.y};
  this.velocity = {x: velocity.x, y: velocity.y};
  this.type = type;
  this.isEnemy = isEnemy;
  this.position.r = BulletDefinition.getTypeDefinition(this.type).renderSource.width / 2;
  this.destroy = false;
}

Bullet.prototype.update = function(elapsedTime){
  this.position.x += this.velocity.x;
  this.position.y += this.velocity.y;
}

Bullet.prototype.render = function(elapsedTime, ctx) {
  // Render the bullets as a single path
  ctx.save();
  ctx.translate(this.position.x, this.position.y);

  if(this.isEnemy) ctx.rotate(Math.PI);

  var source = BulletDefinition.getTypeDefinition(this.type).renderSource;

  ctx.drawImage(
    BulletDefinition.tileset,
    source.x, source.y, source.width, source.height,
    -source.width/2, -source.height/2, source.width, source.height);

  ctx.restore();
}

Bullet.prototype.retain = function(){
  var bounds = this.position.r * 2;
  return !this.destroy && window.camera.onScreen({x: this.position.x, y: this.position.y, width: bounds, height: bounds});
}

Bullet.prototype.collided = function(entity) {
}
