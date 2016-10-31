"use strict";

/* Classes and Libraries */
const Vector = require('./vector');
const Bullet = require('./bullet');
const Player = require('./player');
const ExplosionParticles = require('./explosion_particles');
const BulletDefinition = require('./bullet_types');

/* Constants */
const PLAYER_SPEED = 5;
const BULLET_SPEED = 10;

/**
 * @module Enemy
 * A class representing a Enemy
 */
module.exports = exports = Enemy;

/**
 * @constructor Enemy
 * Creates a Enemy
 * @param {EntityManager} em
 */
function Enemy(em, player) {
  this.entityManager = em;
  this.angle = 0;
  this.position = {x: 220, y: 7775, r: 12};
  this.velocity = {x: 0, y: 1};
  this.img = new Image()
  this.img.src = 'tilesets/tyrian.shp.007D3C.png';


  this.health = 3;
  this.weapon = BulletDefinition.Types.Simple;

  this.timeSinceDeath = 0;
  this.explosionParticles = new ExplosionParticles(1000);

  this.color = 'green';

  this.fireTimeout = 1000;
  this.player = player;
}

/**
 * @function update
 * Updates the Enemy based on the supplied input
 * @param {DOMHighResTimeStamp} elapedTime
 * boolean properties: up, left, right, down
 */
Enemy.prototype.update = function(elapsedTime) {
  if(this.health <= 0 && this.timeSinceDeath < 2000){
    // Draw particle death

    this.explosionParticles.emit({x: -6, y: 0});
    this.explosionParticles.emit({x: 6, y: -6});
    this.explosionParticles.emit({x: 6, y: 6});

    this.explosionParticles.update(elapsedTime);
    this.timeSinceDeath += elapsedTime;
    return
  }

  // Fire if necessary
  this.fireTimeout -= elapsedTime;
  if(this.fireTimeout <= 0){
    this.fireBullet();
    this.fireTimeout += 1000;
  }

  // move the enemy
  this.position.x += this.velocity.x;
  this.position.y += this.velocity.y;

}

/**
 * @function render
 * Renders the Enemy helicopter in world coordinates
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
Enemy.prototype.render = function(elapasedTime, ctx) {
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
    ctx.drawImage(this.img, 48+offset, 57, 24, 28, -12, -14, 24, 28);
  }

  ctx.restore();
}

Enemy.prototype.retain = function(){
  return window.camera.onScreen({x: this.position.x, y: this.position.y, width: this.position.r * 2, height:  this.position.r * 2}) &&
          (this.health > 0 || (this.health <= 0 && this.timeSinceDeath < 2000));
}
/**
 * @function fireBullet
 * Fires a bullet
 * @param {Vector} direction
 */
Enemy.prototype.fireBullet = function() {
  var position = {x: this.position.x, y: this.position.y};
  var velocity = Vector.scale(Vector.normalize({x: 0, y: 1}), BULLET_SPEED);
  this.entityManager.addEntity(new Bullet(position, velocity, this.weapon, true));
}

Enemy.prototype.damage = function(amount) {
  this.health -= amount;
}

Enemy.prototype.collided = function(entity) {
  if(entity instanceof Bullet){
    if(!entity.isEnemy){
      var damage = BulletDefinition.getTypeDefinition(entity.type).damage
      this.damage(damage);
      entity.destroy = true;
      this.player.score += damage;
    }
    return
  }
}
