"use strict";

/* Classes and Libraries */
const Vector = require('./vector');
const ExplosionParticles = require('./explosion_particles');
const Bullet = require('./bullet');
const Enemy = require('./enemy');
const BulletDefinition = require('./bullet_types');

/* Constants */
const PLAYER_SPEED = 5;
const BULLET_SPEED = 10;

/**
 * @module Player
 * A class representing a player's helicopter
 */
module.exports = exports = Player;

/**
 * @constructor Player
 * Creates a player
 * @param {EntityManager} em
 */
function Player(em) {
  this.entityManager = em;
  this.angle = 0;
  this.position = {x: 200, y: 8375, r: 12};
  this.velocity = {x: 0, y: 0};
  this.img = new Image()
  this.img.src = 'tilesets/tyrian.shp.007D3C.png';

  this.maxHealth = 100;
  this.health = 100;
  this.score = 0;
  this.weapon = BulletDefinition.Types.Blaster2;

  this.timeSinceDeath = 0;
  this.explosionParticles = new ExplosionParticles(1000);

  this.color = 'green';
}

/**
 * @function update
 * Updates the player based on the supplied input
 * @param {DOMHighResTimeStamp} elapedTime
 * @param {Input} input object defining input, must have
 * boolean properties: up, left, right, down
 */
Player.prototype.update = function(elapsedTime) {
  var input = window.input;

  if(this.health <= 0 && this.timeSinceDeath < 2000){
    // Draw particle death

    this.explosionParticles.emit({x: -6, y: 0});
    this.explosionParticles.emit({x: 6, y: -6});
    this.explosionParticles.emit({x: 6, y: 6});

    this.explosionParticles.update(elapsedTime);
    this.timeSinceDeath += elapsedTime;
    return
  }

  // set the velocity
  this.velocity.x = 0;
  if(input.left) this.velocity.x -= PLAYER_SPEED;
  if(input.right) this.velocity.x += PLAYER_SPEED;
  this.velocity.y = 0;
  if(input.up) this.velocity.y -= PLAYER_SPEED / 2;
  if(input.down) this.velocity.y += PLAYER_SPEED / 2;

  // determine player angle
  this.angle = 0;
  if(this.velocity.x < 0) this.angle = -1;
  if(this.velocity.x > 0) this.angle = 1;

  // move the player
  this.position.x += this.velocity.x;
  this.position.y += this.velocity.y;

  // don't let the player move off-screen
  if(this.position.x < 0) this.position.x = 0;
  if(this.position.x > 758) this.position.x = 758;
  if(this.position.y > 8375) this.position.y = 8375;
  if(this.position.y < 672/2) this.position.y = 672/2;
}

/**
 * @function render
 * Renders the player helicopter in world coordinates
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
Player.prototype.render = function(elapasedTime, ctx) {
  var offset = this.angle * 24;
  ctx.save();
  ctx.translate(this.position.x, this.position.y);
  if(window.debug){
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.position.r, 0, 2*Math.PI);
    ctx.stroke();
    this.color = 'green';
  }

  if(this.health <= 0 && this.timeSinceDeath < 2000){
    this.explosionParticles.render(elapasedTime, ctx);
  }else if(this.health > 0){
    ctx.drawImage(this.img, 48+offset, 56, 24, 28, -12, -14, 24, 28);
  }

  ctx.restore();
}

Player.prototype.retain = function(){
  return true;
}
/**
 * @function fireBullet
 * Fires a bullet
 * @param {Vector} direction
 */
Player.prototype.fireBullet = function() {
  var position = {x: this.position.x, y: this.position.y}; //Vector.add(this.position, {x:30, y:30});
  var velocity = Vector.scale(Vector.normalize({x: 0, y: -1}), BULLET_SPEED);
  this.entityManager.addEntity(new Bullet(position, velocity, this.weapon, false));
}

Player.prototype.damage = function(amount) {
  this.health -= amount;
}

Player.prototype.collided = function(entity) {
  if(entity instanceof Bullet){
    if(entity.isEnemy){
      this.damage(BulletDefinition.getTypeDefinition(entity.type).damage);
      entity.destroy = true;
    }
  }

  if(entity instanceof Enemy && entity.health > 0){
    this.damage(20);
    entity.health = 0;
    this.score += 20;
  }
}
