"use strict";

const BulletDefinition = require('./bullet_types');
const Player = require('./player');
/**
 * @module Powerup
 * A class representing a Powerup
 */
module.exports = exports = Powerup;

/**
 * @constructor Powerup
 * Creates a Powerup
 */
function Powerup(player, position) {

  this.Type = {
    Plus1: 0,
    Plus2: 1,
    Down1: 2
  }

  this.position = {x: position.x, y: position.y, r: 6};

  this.img = new Image()
  this.img.src = 'tilesets/tyrian.shp.01673F.png';

  this.consumed = false

  this.player = player;

  this.type = rand(3);

  this.frame = 0;
  this.timer = 0;
}

function rand(max){
  return Math.floor(Math.random() * max);
}

/**
 * @function update
 * Updates the Powerup based on the supplied input
 * @param {DOMHighResTimeStamp} elapedTime
 * boolean properties: up, left, right, down
 */
Powerup.prototype.update = function(elapsedTime) {
  this.timer += elapsedTime;
  if(this.timer > 1000/16){
    this.frame = (this.frame + 1) % 6
    this.timer = 0;
  }
}

/**
 * @function render
 * Renders the Powerup helicopter in world coordinates
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
Powerup.prototype.render = function(elapasedTime, ctx) {
  ctx.save();
  ctx.translate(this.position.x, this.position.y);

  ctx.drawImage(
    this.img,
    this.frame * 24, 28 + (28*this.type), 24, 28,
    -12, -14, 24, 28
  );

  ctx.restore();
}

Powerup.prototype.retain = function(){
  return !this.consumed && window.camera.onScreen({x: this.position.x, y: this.position.y, width: this.position.r * 2, height:  this.position.r * 2})
}

Powerup.prototype.collided = function(entity) {
  if(!this.consumed && entity instanceof Player){
    var change = 0;
    if(this.type == this.Type.Plus1) change = 1;
    if(this.type == this.Type.Plus2) change = 2;
    if(this.type == this.Type.Down1) change = -1;
    if(entity.weapon + change < 0 || entity.weapon + change >= BulletDefinition.Types.Count) return;
    entity.weapon += change;
    this.consumed = true;
  }
}
