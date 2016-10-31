(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

window.debug = true;

/* Classes and Libraries */
const Game = require('./game');
const Vector = require('./vector');
const Camera = require('./camera');
const Player = require('./player');
const Enemy = require('./enemy');
const EntityManager = require('./entity_manager');
const Hud = require('./hud');
const Tilemap = require('./tilemap');
const mapdataB1 = require('../tilemaps/background3.json');
const mapdataM1 = require('../tilemaps/middleground3.json');
const mapdataT1 = require('../tilemaps/topground3.json');


/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var input = {
  up: false,
  down: false,
  left: false,
  right: false
}
var camera = new Camera(canvas);
var entityManager = new EntityManager();
var player = new Player(entityManager);

var tilemaps = [];
var hud = new Hud(player, {x: 768, y: 0, width: canvas.width - 768, height: canvas.height});

window.camera = camera;
window.input = input;

entityManager.addEntity(player);
entityManager.addEntity(new Enemy(entityManager, player));

tilemaps.push(new Tilemap(mapdataB1, canvas, true, {
  onload: function() {
    startLevel();
  }
}));
tilemaps.push(new Tilemap(mapdataM1, canvas, true, {
  onload: function() {
    startLevel();
  }
}));
tilemaps.push(new Tilemap(mapdataT1, canvas, true, {
  onload: function() {
    startLevel();
  }
}));

var mapCount = 3
function startLevel(){
  mapCount--;
  if(mapCount == 0){
    masterLoop(performance.now());
  }
}

if(false){
  canvas.onmousemove = function(event) {
    var position = normalizeMouseCoord(event);
    console.log(position);
  }
}


/**
 * @function onkeydown
 * Handles keydown events
 */
window.onkeydown = function(event) {
  switch(event.key) {
    case "ArrowUp":
    case "w":
      input.up = true;
      event.preventDefault();
      break;
    case "ArrowDown":
    case "s":
      input.down = true;
      event.preventDefault();
      break;
    case "ArrowLeft":
    case "a":
      input.left = true;
      event.preventDefault();
      break;
    case "ArrowRight":
    case "d":
      input.right = true;
      event.preventDefault();
      break;
  }
}

/**
 * @function onkeyup
 * Handles keydown events
 */
window.onkeyup = function(event) {
  switch(event.key) {
    case "ArrowUp":
    case "w":
      input.up = false;
      event.preventDefault();
      break;
    case "ArrowDown":
    case "s":
      input.down = false;
      event.preventDefault();
      break;
    case "ArrowLeft":
    case "a":
      input.left = false;
      event.preventDefault();
      break;
    case "ArrowRight":
    case "d":
      input.right = false;
      event.preventDefault();
      break;
  }
  if(event.keyCode == 32){
    player.fireBullet();
    event.preventDefault();
  }
}

/**
 * @function masterLoop
 * Advances the game in sync with the refresh rate of the screen
 * @param {DOMHighResTimeStamp} timestamp the current time
 */
var masterLoop = function(timestamp) {
  game.loop(timestamp);
  window.requestAnimationFrame(masterLoop);
}

/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {
  // update the camera
  camera.update(player.position);

  tilemaps[0].moveTo({x:0, y: camera.y});
  tilemaps[1].moveTo({x:0, y: camera.y * (5/3)});
  tilemaps[2].moveTo({x:0, y: camera.y * (7/3)});

  entityManager.update(elapsedTime);
}

/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {DOMHighResTimeStamp} elapsedTime indicates
  * the number of milliseconds passed since the last frame.
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function render(elapsedTime, ctx) {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  tilemaps.forEach(function(map){
    map.render(ctx);
  });

  // Transform the coordinate system using
  // the camera position BEFORE rendering
  // objects in the world - that way they
  // can be rendered in WORLD cooridnates
  // but appear in SCREEN coordinates
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  renderWorld(elapsedTime, ctx);
  ctx.restore();

  // Render the GUI without transforming the
  // coordinate system
  hud.render(ctx);
}

/**
  * @function renderWorld
  * Renders the entities in the game world
  * IN WORLD COORDINATES
  * @param {DOMHighResTimeStamp} elapsedTime
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function renderWorld(elapsedTime, ctx) {
    entityManager.render(elapsedTime, ctx);
}

function normalizeMouseCoord(event){
  var rect = canvas.getBoundingClientRect();
  var x = event.clientX - rect.left;
  var y = event.clientY - rect.top;
  return {x: x, y: y};
}

},{"../tilemaps/background3.json":13,"../tilemaps/middleground3.json":15,"../tilemaps/topground3.json":16,"./camera":4,"./enemy":5,"./entity_manager":6,"./game":8,"./hud":9,"./player":10,"./tilemap":11,"./vector":12}],2:[function(require,module,exports){
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
  this.position.r = BulletDefinition.getTypeDefinition(this.type).radius
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
  BulletDefinition.getTypeDefinition(this.type).render(elapsedTime, ctx);
  ctx.restore();
}
Bullet.prototype.retain = function(){
  var bounds = this.position.r * 2;
  return !this.destroy && window.camera.onScreen({x: this.position.x, y: this.position.y, width: bounds, height: bounds});
}
Bullet.prototype.collided = function(entity) {
}

},{"./bullet_types":3}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
"use strict";

/* Classes and Libraries */
const Vector = require('./vector');

/**
 * @module Camera
 * A class representing a simple camera
 */
module.exports = exports = Camera;

/**
 * @constructor Camera
 * Creates a camera
 * @param {Rect} screen the bounds of the screen
 */
function Camera(screen) {
  this.x = 0;
  this.y = 0;
  this.width = screen.width;
  this.height = screen.height;
}

/**
 * @function update
 * Updates the camera based on the supplied target
 * @param {Vector} target what the camera is looking at
 */
Camera.prototype.update = function(target) {
  if(target.y - this.y > 650){
    this.y = target.y - 650;
  }

  if(target.y - this.y < 670/2){
    this.y = target.y - 670/2;
  }

  if(this.y < 0){
    this.y = 0;
  }

  if(this.y > 8400 - this.height){
    this.y = 8400 - this.height;
  }
}

/**
 * @function onscreen
 * Determines if an object is within the camera's gaze
 * @param {Vector} target a point in the world
 * @return true if target is on-screen, false if not
 */
Camera.prototype.onScreen = function(target) {
  return (
     target.x > this.x &&
     target.x < this.x + this.width &&
     target.y > this.y &&
     target.y < this.y + this.height
   );
}

/**
 * @function toScreenCoordinates
 * Translates world coordinates into screen coordinates
 * @param {Vector} worldCoordinates
 * @return the tranformed coordinates
 */
Camera.prototype.toScreenCoordinates = function(worldCoordinates) {
  return Vector.subtract(worldCoordinates, this);
}

/**
 * @function toWorldCoordinates
 * Translates screen coordinates into world coordinates
 * @param {Vector} screenCoordinates
 * @return the tranformed coordinates
 */
Camera.prototype.toWorldCoordinates = function(screenCoordinates) {
  return Vector.add(screenCoordinates, this);
}

},{"./vector":12}],5:[function(require,module,exports){
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

},{"./bullet":2,"./bullet_types":3,"./explosion_particles":7,"./player":10,"./vector":12}],6:[function(require,module,exports){
"use strict";

/**
 * @module exports the Car class
 */
module.exports = exports = EntityManager;

/**
 * @constructor car
 * Creates a new EntityManager object
 */
function EntityManager() {
  this.entities = [];
}

EntityManager.prototype.addEntity = function(entity) {
  this.entities.push(entity);
}

EntityManager.prototype.destroyEntity = function(entity){
  var idx = this.entities.indexOf(entity);
  this.entities.splice(idx, 1);
}

EntityManager.prototype.update = function(elapsedTime) {
  var toBeDestroyed = [];
  var self = this;
  this.entities.forEach(function(entity){
    if(entity.retain()){
      entity.update(elapsedTime);
    }
    else{
      toBeDestroyed.push(entity);
    }
  });

  toBeDestroyed.forEach(function(entity){
    self.destroyEntity(entity);
  });

  this.entities.sort(function(a,b){return a.position.x - b.position.x});

  // The active list will hold all balls
  // we are currently considering for collisions
  var active = [];

  // The potentially colliding list will hold
  // all pairs of balls that overlap in the x-axis,
  // and therefore potentially collide
  var potentiallyColliding = [];

  // For each ball in the axis list, we consider it
  // in order
  this.entities.forEach(function(entity, aindex){
    // remove balls from the active list that are
    // too far away from our current ball to collide
    // The Array.prototype.filter() method will return
    // an array containing only elements for which the
    // provided function's return value was true -
    // in this case, all balls that are closer than 30
    // units to our current ball on the x-axis
    active = active.filter(function(oentity){
      return entity.position.x - oentity.position.x  < entity.position.r + oentity.position.r;
    });
    // Since only balls within colliding distance of
    // our current ball are left in the active list,
    // we pair them with the current ball and add
    // them to the potentiallyColliding array.
    active.forEach(function(oentity, bindex){
      potentiallyColliding.push({a: oentity, b: entity});
    });
    // Finally, we add our current ball to the active
    // array to consider it in the next pass down the
    // axisList
    active.push(entity);
  });

  // At this point we have a potentaillyColliding array
  // containing all pairs overlapping in the x-axis.  Now
  // we want to check for REAL collisions between these pairs.
  // We'll store those in our collisions array.
  var collisions = [];
  potentiallyColliding.forEach(function(pair){
    // Calculate the distance between balls; we'll keep
    // this as the squared distance, as we just need to
    // compare it to a distance equal to the radius of
    // both balls summed.  Squaring this second value
    // is less computationally expensive than taking
    // the square root to get the actual distance.
    // In fact, we can cheat a bit more and use a constant
    // for the sum of radii, as we know the radius of our
    // balls won't change.
    var distSquared =
      Math.pow(pair.a.position.x - pair.b.position.x, 2) +
      Math.pow(pair.a.position.y - pair.b.position.y, 2);
    // (15 + 15)^2 = 900 -> sum of two balls' raidius squared
    if(distSquared < Math.pow(pair.a.position.r + pair.b.position.r, 2)) {
      // Color the collision pair for visual debugging
      pair.a.color = 'red';
      pair.b.color = 'red';
      // Push the colliding pair into our collisions array
      collisions.push(pair);
    }
  });

  collisions.forEach(function(pair){
    pair.a.collided(pair.b);
    pair.b.collided(pair.a);
  })
}

EntityManager.prototype.render = function(elapsedTime, ctx) {
  this.entities.forEach(function(entity){
    entity.render(elapsedTime, ctx);
  });
}

},{}],7:[function(require,module,exports){
"use strict";

/**
 * @module ExplosionParticles
 * A class for managing a particle engine that
 * emulates a smoke trail
 */
module.exports = exports = ExplosionParticles;

/**
 * @constructor ExplosionParticles
 * Creates a ExplosionParticles engine of the specified size
 * @param {uint} size the maximum number of particles to exist concurrently
 */
function ExplosionParticles(maxSize) {
  this.pool = new Float32Array(3 * maxSize);
  this.start = 0;
  this.end = 0;
  this.wrapped = false;
  this.max = maxSize;
}

/**
 * @function emit
 * Adds a new particle at the given position
 * @param {Vector} position
*/
ExplosionParticles.prototype.emit = function(position) {
  if(this.end != this.max) {
    this.pool[3*this.end] = position.x;
    this.pool[3*this.end+1] = position.y;
    this.pool[3*this.end+2] = 0.0;
    this.end++;
  } else {
    this.pool[3] = position.x;
    this.pool[4] = position.y;
    this.pool[5] = 0.0;
    this.end = 1;
  }
}

/**
 * @function update
 * Updates the particles
 * @param {DOMHighResTimeStamp} elapsedTime
 */
ExplosionParticles.prototype.update = function(elapsedTime) {
  function updateParticle(i) {
    this.pool[3*i+2] += elapsedTime;
    if(this.pool[3*i+2] > 2000) this.start = i;
  }
  var i;
  if(this.wrapped) {
    for(i = 0; i < this.end; i++){
      updateParticle.call(this, i);
    }
    for(i = this.start; i < this.max; i++){
      updateParticle.call(this, i);
    }
  } else {
    for(i = this.start; i < this.end; i++) {
      updateParticle.call(this, i);
    }
  }
}

/**
 * @function render
 * Renders all bullets in our array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
ExplosionParticles.prototype.render = function(elapsedTime, ctx) {
  function renderParticle(i){
    var alpha = (this.pool[3*i+2] / 1000) / (this.end/3);
    if(alpha < 0) alpha = 0;
    var radius = 0.1 * this.pool[3*i+2];
    if(radius > 20) radius = 20;
    ctx.beginPath();
    ctx.arc(
      this.pool[3*i],   // X position
      this.pool[3*i+1], // y position
      radius, // radius
      0,
      2*Math.PI
    );
    var percentOfColor = Math.floor((this.pool[3*i+2] / 1000) * 200)

    var r = 232 - percentOfColor
    var g = 49 - percentOfColor
    var b = 20 - percentOfColor
    ctx.fillStyle = 'rgba(' + r + ', ' + g + ', ' + b + ',' + alpha + ')';
    ctx.fill();
  }

  // Render the particles individually
  var i;
  if(this.wrapped) {
    for(i = 0; i < this.end; i++){
      renderParticle.call(this, i);
    }
    for(i = this.start; i < this.max; i++){
      renderParticle.call(this, i);
    }
  } else {
    for(i = this.start; i < this.end; i++) {
      renderParticle.call(this, i);
    }
  }
}

},{}],8:[function(require,module,exports){
"use strict";

/**
 * @module exports the Game class
 */
module.exports = exports = Game;

/**
 * @constructor Game
 * Creates a new game object
 * @param {canvasDOMElement} screen canvas object to draw into
 * @param {function} updateFunction function to update the game
 * @param {function} renderFunction function to render the game
 */
function Game(screen, updateFunction, renderFunction) {
  this.update = updateFunction;
  this.render = renderFunction;

  // Set up buffers
  this.frontBuffer = screen;
  this.frontCtx = screen.getContext('2d');
  this.backBuffer = document.createElement('canvas');
  this.backBuffer.width = screen.width;
  this.backBuffer.height = screen.height;
  this.backCtx = this.backBuffer.getContext('2d');

  // Start the game loop
  this.oldTime = performance.now();
  this.paused = false;
}

/**
 * @function pause
 * Pause or unpause the game
 * @param {bool} pause true to pause, false to start
 */
Game.prototype.pause = function(flag) {
  this.paused = (flag == true);
}

/**
 * @function loop
 * The main game loop.
 * @param{time} the current time as a DOMHighResTimeStamp
 */
Game.prototype.loop = function(newTime) {
  var game = this;
  var elapsedTime = newTime - this.oldTime;
  this.oldTime = newTime;

  if(!this.paused) this.update(elapsedTime);
  this.render(elapsedTime, this.frontCtx);

  // Flip the back buffer
  this.frontCtx.drawImage(this.backBuffer, 0, 0);
}

},{}],9:[function(require,module,exports){
"use strict";

const Tilemap = require('./tilemap');
const mapdata = require('../tilemaps/hud.json');
const BulletDefinition = require('./bullet_types');

module.exports = exports = Hud;

function Hud(player, frame){
  this.frame = {
    size: {width: frame.width, height: frame.height},
    origin: {x: frame.x, y: frame.y}
  }
  this.player = player
  this.tilemap = new Tilemap(mapdata, {width: frame.width, height: frame.height}, true, {});
}

Hud.prototype.render = function(ctx){
  ctx.save();
  ctx.translate(this.frame.origin.x, this.frame.origin.y);

  drawTitle(this, ctx);
  drawScore(this, ctx);
  drawHealth(this, ctx);
  drawWeapon(this, ctx);
  drawProgress(this, ctx);
  drawHudOverlay(this, ctx);

  ctx.restore();
}

function drawWeapon(self, ctx){
  ctx.fillStyle = 'green';
  ctx.font="30px Garamond";
  ctx.textAlign="center";

  var centerX = Math.floor(self.frame.size.width / 2);
  ctx.fillText("WEAPON", centerX, 95);

  var weapon = BulletDefinition.getTypeDefinition(self.player.weapon);
  // Draw details
  ctx.font="20px Garamond";
  ctx.fillText(weapon.name, centerX, 150);

  ctx.font="15px Garamond";
  ctx.fillText("Damage: " + weapon.damage, centerX, 175)
}

function drawProgress(self, ctx){
  ctx.fillStyle = 'green';
  ctx.font="30px Garamond";
  ctx.textAlign="center";

  var centerX = Math.floor(self.frame.size.width / 2);
  ctx.fillText("PROGRESS", centerX, 232);

  ctx.font="40px Garamond";

  var percent = Math.floor(((8375 - self.player.position.y) / 8375) * 100);
  ctx.fillText(percent + '%', centerX, 305);
}

function drawTitle(self, ctx){
  ctx.fillStyle = 'green';
  ctx.font="30px Garamond";
  ctx.textAlign="center";

  var centerX = Math.floor(self.frame.size.width / 2);
  ctx.fillText("YEERYAN", centerX, 373);
}

function drawHealth(self, ctx){
  ctx.fillStyle = 'green';
  ctx.font="30px Garamond";
  ctx.textAlign="center";

  var centerX = Math.floor(self.frame.size.width / 2);
  ctx.fillText("H", centerX, 450);
  ctx.fillText("E", centerX, 475);
  ctx.fillText("A", centerX, 500);
  ctx.fillText("L", centerX, 525);
  ctx.fillText("T", centerX, 550);
  ctx.fillText("H", centerX, 575);

  var percentFull = self.player.health / self.player.maxHealth;

  var grad = ctx.createLinearGradient(50, 392, 50, 392+280);
  grad.addColorStop(0, "green");
  grad.addColorStop(1, "yellow");

  ctx.fillStyle = grad;

  // left health Bar
  var height = 280 * (percentFull - 0.5) * 2;
  ctx.fillRect(0, 392 + (280 - height), 96, height);

  var grad2 = ctx.createLinearGradient(200, 392, 200, 392+280);
  grad2.addColorStop(0, "yellow");
  grad2.addColorStop(1, "red");

  ctx.fillStyle = grad2;

  // Right health Bar
  var percentH = (percentFull >= 0.5) ? 1 : percentFull * 2
  var height2 = 280 * percentH;
  ctx.fillRect(144, 392 + (280 - height2), 96, height2);

}

function drawScore(self, ctx) {
  ctx.fillStyle = 'green';
  ctx.font="30px Garamond";
  ctx.textAlign="center";

  ctx.fillText("SCORE",75,37);
  ctx.fillText(self.player.score, 190, 37);
}

function drawHudOverlay(self, ctx){
  //Draw Hud overlay on top of everything
  //Shift over by one tile so the edges line up correctly
  ctx.save();
  ctx.translate(-self.tilemap.tileWidth, 0);
  self.tilemap.render(ctx);
  ctx.restore();
}

},{"../tilemaps/hud.json":14,"./bullet_types":3,"./tilemap":11}],10:[function(require,module,exports){
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
  this.weapon = BulletDefinition.Types.Simple2;

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
  if(this.position.x > 1008) this.position.x = 1008;
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
    ctx.drawImage(this.img, 48+offset, 57, 24, 28, -12, -14, 24, 28);
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

},{"./bullet":2,"./bullet_types":3,"./enemy":5,"./explosion_particles":7,"./vector":12}],11:[function(require,module,exports){
"use strict";

// Tilemap engine defined using the Module pattern
module.exports = exports = Tilemap;


function Tilemap(mapData, canvas, smoothScroll, options){
  this.tiles = [],
  this.tilesets = [],
  this.layers = [],
  this.tileWidth = mapData.tilewidth,
  this.tileHeight = mapData.tileheight,
  this.mapWidth = mapData.width,
  this.mapHeight = mapData.height;

  this.smoothScroll = smoothScroll;

  this.draw = {};
  this.draw.origin = {x: 0, y: 0};

  // We add one so that we go slightly beyond the canvas
  this.draw.size = {
    width: Math.floor(canvas.width / this.tileWidth) + 1,
    height: Math.floor(canvas.height / this.tileHeight) + 1
  }
  this.draw.offset = {x: 0, y: 0};

  this.loading = 0;

  var self = this;

  // Load the tileset(s)
  mapData.tilesets.forEach( function(tilesetmapData, index) {
    // Load the tileset image
    var tileset = new Image();
    self.loading++;
    tileset.onload = function() {
      self.loading--;
      if(self.loading == 0 && options.onload) options.onload();
    }
    tileset.src = tilesetmapData.image;
    self.tilesets.push(tileset);

    // Create the tileset's tiles
    var colCount = Math.floor(tilesetmapData.imagewidth / self.tileWidth),
        rowCount = Math.floor(tilesetmapData.imageheight / self.tileHeight),
        tileCount = colCount * rowCount;

    for(var i = 0; i < tileCount; i++) {
      var tile = {
        // Reference to the image, shared amongst all tiles in the tileset
        image: tileset,
        // Source x position.  i % colCount == col number (as we remove full rows)
        sx: (i % colCount) * self.tileWidth,
        // Source y position. i / colWidth (integer division) == row number
        sy: Math.floor(i / colCount) * self.tileHeight,
      }
      self.tiles.push(tile);
    }
  });

  // Parse the layers in the map
  mapData.layers.forEach( function(layerData) {

    // Tile layers need to be stored in the engine for later
    // rendering
    if(layerData.type == "tilelayer") {
      // Create a layer object to represent this tile layer
      var layer = {
        name: layerData.name,
        width: layerData.width,
        height: layerData.height,
        visible: layerData.visible
      }

      // Set up the layer's data array.  We'll try to optimize
      // by keeping the index data type as small as possible
      if(self.tiles.length < Math.pow(2,8))
        layer.data = new Uint8Array(layerData.data);
      else if (self.tiles.length < Math.pow(2, 16))
        layer.data = new Uint16Array(layerData.data);
      else
        layer.data = new Uint32Array(layerData.data);

      // save the tile layer
      self.layers.push(layer);
    }
  });
}

Tilemap.prototype.moveTo = function(position){
  // Note: position should be in pixel coordinates
  //       and it should be the top left corner
  this.draw.origin = {
    x: Math.floor(position.x / this.tileWidth),
    y: Math.floor(position.y / this.tileHeight)
  }

  if(this.smoothScroll){
    this.draw.offset.x = Math.floor(position.x - this.draw.origin.x * this.tileWidth)
    this.draw.offset.y = Math.floor(position.y - this.draw.origin.y * this.tileHeight)
  }
}

Tilemap.prototype.getDrawOrigin = function(){
  return {x: this.draw.origin.x, y: this.draw.origin.y};
}

Tilemap.prototype.render = function(screenCtx) {
  // Render tilemap layers - note this assumes
  // layers are sorted back-to-front so foreground
  // layers obscure background ones.
  // see http://en.wikipedia.org/wiki/Painter%27s_algorithm
  var self = this;
  this.layers.forEach(function(layer){
    // Only draw layers that are currently visible
    if(layer.visible) {
      for(var y = self.draw.origin.y; y - self.draw.origin.y < Math.min(layer.height, self.draw.size.height); y++) {
        for(var x = self.draw.origin.x; x - self.draw.origin.x < Math.min(layer.width, self.draw.size.width); x++) {
          var tileId = layer.data[x + layer.width * y];

          // tiles with an id of 0 don't exist
          if(tileId != 0) {
            var tile = self.tiles[tileId - 1];
            if(tile.image) { // Make sure the image has loaded
              screenCtx.drawImage(
                tile.image,     // The image to draw
                tile.sx, tile.sy, self.tileWidth, self.tileHeight, // The portion of image to draw
                (x-self.draw.origin.x)*self.tileWidth - self.draw.offset.x, (y-self.draw.origin.y)*self.tileHeight - self.draw.offset.y, self.tileWidth, self.tileHeight // Where to draw the image on-screen
              );
            }
          }
        }
      }
    }
  });
}

Tilemap.prototype.tileAt = function(x, y, layer) {
  // sanity check
  if(layer < 0 || x < 0 || y < 0 || layer >= this.layers.length || x > this.mapWidth || y > this.mapHeight)
    return undefined;
  return this.tiles[this.layers[layer].data[x + y*this.mapWidth] - 1];
}

},{}],12:[function(require,module,exports){
"use strict";

/**
 * @module Vector
 * A library of vector functions.
 */
module.exports = exports = {
  add: add,
  subtract: subtract,
  scale: scale,
  rotate: rotate,
  dotProduct: dotProduct,
  magnitude: magnitude,
  normalize: normalize
}


/**
 * @function rotate
 * Scales a vector
 * @param {Vector} a - the vector to scale
 * @param {float} scale - the scalar to multiply the vector by
 * @returns a new vector representing the scaled original
 */
function scale(a, scale) {
 return {x: a.x * scale, y: a.y * scale};
}

/**
 * @function add
 * Computes the sum of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed sum
*/
function add(a, b) {
 return {x: a.x + b.x, y: a.y + b.y};
}

/**
 * @function subtract
 * Computes the difference of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed difference
 */
function subtract(a, b) {
  return {x: a.x - b.x, y: a.y - b.y};
}

/**
 * @function rotate
 * Rotates a vector about the Z-axis
 * @param {Vector} a - the vector to rotate
 * @param {float} angle - the angle to roatate by (in radians)
 * @returns a new vector representing the rotated original
 */
function rotate(a, angle) {
  return {
    x: a.x * Math.cos(angle) - a.y * Math.sin(angle),
    y: a.x * Math.sin(angle) + a.y * Math.cos(angle)
  }
}

/**
 * @function dotProduct
 * Computes the dot product of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed dot product
 */
function dotProduct(a, b) {
  return a.x * b.x + a.y * b.y
}

/**
 * @function magnitude
 * Computes the magnitude of a vector
 * @param {Vector} a the vector
 * @returns the calculated magnitude
 */
function magnitude(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y);
}

/**
 * @function normalize
 * Normalizes the vector
 * @param {Vector} a the vector to normalize
 * @returns a new vector that is the normalized original
 */
function normalize(a) {
  var mag = magnitude(a);
  return {x: a.x / mag, y: a.y / mag};
}

},{}],13:[function(require,module,exports){
module.exports={ "height":300,
 "layers":[
        {
         "data":[73, 74, 74, 74, 74, 74, 74, 72, 84, 84, 84, 84, 84, 84, 84, 84, 71, 74, 74, 74, 74, 74, 74, 74, 74, 74, 75, 66, 66, 66, 11, 12, 73, 74, 74, 74, 74, 74, 72, 85, 48, 49, 49, 49, 49, 49, 49, 50, 83, 71, 74, 74, 74, 74, 74, 74, 74, 74, 75, 66, 66, 66, 11, 635, 73, 74, 74, 74, 74, 72, 85, 48, 46, 194, 194, 194, 194, 194, 194, 47, 50, 83, 71, 74, 74, 74, 74, 74, 74, 74, 75, 66, 66, 1, 4, 633, 73, 74, 74, 74, 74, 75, 48, 46, 194, 194, 194, 194, 194, 194, 194, 194, 47, 50, 73, 74, 74, 74, 74, 74, 74, 74, 75, 66, 1, 4, 635, 643, 73, 74, 74, 74, 74, 75, 58, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 60, 73, 74, 74, 74, 74, 74, 74, 72, 85, 66, 11, 635, 643, 645, 73, 74, 74, 74, 74, 75, 58, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 60, 83, 71, 74, 74, 74, 74, 72, 85, 66, 66, 11, 633, 645, 645, 73, 74, 74, 74, 72, 85, 58, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 47, 50, 83, 84, 84, 84, 84, 85, 66, 66, 1, 4, 633, 645, 645, 73, 74, 72, 84, 85, 48, 46, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 47, 50, 66, 66, 66, 66, 66, 66, 66, 11, 12, 633, 645, 645, 83, 84, 85, 48, 49, 46, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 47, 49, 50, 66, 66, 66, 66, 66, 11, 12, 633, 626, 627, 83, 48, 49, 46, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 47, 50, 66, 66, 66, 1, 4, 635, 643, 636, 637, 66, 58, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 47, 49, 49, 50, 11, 12, 633, 626, 629, 637, 66, 58, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 57, 70, 11, 12, 633, 636, 637, 637, 66, 58, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 60, 66, 11, 635, 643, 636, 637, 637, 66, 68, 69, 56, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 57, 70, 1, 4, 633, 626, 629, 637, 637, 2, 2, 3, 58, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 57, 70, 1, 4, 635, 643, 636, 637, 637, 637, 12, 12, 13, 58, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 57, 70, 1, 4, 12, 633, 645, 636, 637, 637, 637, 12, 12, 13, 68, 56, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 57, 70, 1, 4, 12, 635, 643, 645, 636, 637, 637, 637, 12, 12, 5, 3, 68, 56, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 57, 70, 1, 4, 12, 12, 633, 645, 645, 636, 637, 637, 637, 12, 12, 12, 5, 3, 68, 56, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 47, 50, 11, 12, 12, 12, 633, 645, 626, 629, 637, 637, 637, 12, 12, 12, 12, 5, 3, 68, 69, 69, 56, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 60, 11, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 12, 12, 12, 12, 12, 5, 2, 2, 3, 58, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 60, 11, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 13, 68, 56, 194, 194, 194, 194, 194, 194, 194, 194, 194, 60, 11, 12, 12, 635, 643, 645, 636, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 5, 3, 58, 194, 194, 194, 194, 194, 194, 194, 194, 194, 60, 11, 12, 12, 633, 645, 626, 629, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 58, 194, 194, 194, 194, 194, 194, 194, 194, 57, 70, 11, 12, 635, 643, 645, 636, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 58, 194, 194, 194, 194, 194, 194, 194, 57, 70, 1, 4, 12, 633, 645, 626, 629, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 68, 69, 56, 194, 194, 194, 57, 69, 70, 1, 4, 12, 635, 643, 626, 629, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 5, 2, 3, 58, 194, 194, 194, 60, 1, 2, 4, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 68, 69, 69, 69, 70, 11, 42, 42, 12, 635, 643, 626, 629, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 42, 5, 2, 2, 2, 2, 2, 4, 42, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 42, 42, 42, 42, 42, 42, 42, 42, 42, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 42, 42, 42, 42, 55, 52, 54, 42, 12, 12, 12, 635, 643, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 947, 949, 12, 12, 12, 55, 52, 52, 52, 53, 34, 41, 42, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 967, 969, 12, 12, 12, 43, 34, 34, 34, 34, 34, 41, 12, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 41, 12, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 41, 12, 12, 12, 12, 625, 623, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 41, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 31, 44, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 41, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 41, 12, 12, 12, 947, 949, 12, 633, 645, 646, 639, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 41, 12, 12, 12, 967, 969, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 51, 54, 12, 12, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 41, 12, 12, 12, 12, 12, 633, 645, 626, 629, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 51, 54, 12, 12, 12, 635, 643, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 633, 645, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 633, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 41, 12, 12, 635, 643, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 51, 54, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 34, 41, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 55, 53, 34, 34, 34, 34, 34, 34, 34, 41, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 34, 31, 44, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 31, 44, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 45, 33, 34, 34, 34, 34, 34, 41, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 31, 32, 44, 12, 12, 12, 633, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 41, 12, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 41, 12, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 41, 12, 12, 12, 12, 12, 633, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 55, 53, 34, 34, 34, 41, 12, 12, 12, 12, 12, 633, 645, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 947, 949, 12, 12, 12, 43, 34, 34, 34, 34, 51, 52, 54, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 967, 969, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 55, 53, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 55, 53, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 625, 623, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 55, 53, 34, 34, 34, 34, 34, 31, 32, 32, 44, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 12, 12, 12, 635, 643, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 51, 52, 52, 54, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 45, 33, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 625, 623, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 31, 32, 44, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 43, 34, 34, 34, 34, 34, 34, 51, 52, 54, 12, 12, 12, 12, 633, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 947, 949, 12, 12, 12, 45, 32, 33, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 967, 969, 12, 12, 12, 12, 12, 45, 32, 32, 32, 32, 32, 32, 44, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 625, 623, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 635, 643, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 645, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 645, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 625, 622, 623, 645, 645, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 625, 623, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 625, 623, 645, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 625, 623, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 625, 623, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 12, 633, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 12, 12, 623, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 646, 639, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 645, 636, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 626, 629, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 633, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 633, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 645, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 645, 645, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 645, 645, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 947, 949, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 633, 645, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 967, 969, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 625, 623, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 625, 623, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 632, 632, 12, 12, 625, 623, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 632, 632, 632, 632, 632, 632, 632, 947, 949, 632, 632, 12, 12, 633, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 632, 632, 632, 632, 632, 632, 632, 967, 969, 632, 632, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 632, 632, 632, 632, 632, 632, 632, 632, 632, 632, 632, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 632, 632, 632, 632, 632, 632, 632, 632, 632, 632, 632, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 947, 949, 632, 632, 632, 632, 632, 632, 947, 949, 632, 632, 12, 12, 633, 645, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 967, 969, 632, 632, 632, 632, 632, 632, 967, 969, 632, 632, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 632, 632, 632, 632, 632, 632, 632, 632, 632, 632, 632, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 632, 632, 632, 632, 632, 632, 632, 632, 632, 632, 632, 12, 12, 633, 645, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 632, 632, 632, 632, 632, 632, 632, 632, 632, 632, 632, 12, 635, 643, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 967, 969, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 633, 645, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 635, 643, 645, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 645, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 645, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 625, 623, 645, 645, 645, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 633, 645, 645, 645, 645, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 625, 623, 645, 645, 645, 645, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 625, 623, 645, 645, 645, 645, 646, 647, 639, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 625, 623, 645, 645, 645, 645, 645, 636, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 645, 645, 645, 645, 646, 639, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 625, 623, 645, 645, 645, 645, 645, 646, 647, 639, 637, 637, 637, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 625, 623, 645, 645, 645, 645, 645, 645, 646, 647, 639, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 645, 645, 645, 645, 645, 645, 645, 646, 647, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 625, 622, 623, 645, 645, 645, 645, 645, 645, 645, 645, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 625, 623, 645, 645, 645, 645, 645, 645, 645, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 625, 622, 623, 645, 645, 645, 645, 645, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 625, 622, 623, 645, 645, 645, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 625, 623, 645, 645, 12, 12, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 633, 645, 645, 12, 12, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 645, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 645, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 645, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 645, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 645, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 645, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 15, 22, 22, 22, 22, 14, 633, 645, 645, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 12, 12, 15, 22, 22, 22, 22, 22, 22, 22, 22, 23, 66, 66, 66, 66, 11, 633, 645, 645, 947, 949, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 11, 633, 645, 645, 967, 969, 12, 12, 12, 12, 12, 15, 22, 22, 22, 22, 22, 22, 23, 66, 48, 49, 49, 49, 49, 49, 49, 50, 66, 66, 66, 66, 11, 633, 645, 645, 12, 12, 12, 12, 12, 12, 15, 23, 66, 66, 66, 66, 66, 66, 66, 48, 46, 194, 194, 194, 194, 194, 194, 47, 49, 50, 66, 66, 11, 633, 645, 645, 12, 12, 12, 12, 12, 12, 13, 66, 66, 66, 48, 49, 49, 49, 49, 46, 194, 194, 194, 194, 194, 194, 194, 194, 194, 60, 66, 66, 11, 633, 645, 645, 12, 12, 12, 12, 12, 15, 23, 66, 48, 49, 46, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 60, 66, 66, 11, 633, 645, 645, 12, 12, 12, 12, 12, 13, 66, 66, 58, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 60, 66, 66, 11, 633, 645, 645, 12, 12, 12, 12, 12, 13, 66, 66, 58, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 60, 66, 66, 11, 633, 645, 645, 12, 12, 12, 12, 12, 13, 66, 66, 58, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 57, 69, 70, 66, 1, 4, 633, 645, 645, 12, 12, 947, 949, 12, 13, 66, 66, 58, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 60, 66, 66, 66, 11, 12, 633, 645, 645, 12, 12, 967, 969, 12, 13, 66, 66, 58, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 57, 70, 66, 1, 2, 635, 642, 643, 645, 645, 12, 12, 12, 12, 12, 13, 66, 66, 68, 56, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 60, 66, 66, 11, 635, 643, 645, 645, 645, 645, 12, 12, 12, 12, 12, 5, 3, 66, 68, 58, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 57, 70, 66, 1, 635, 643, 645, 645, 626, 627, 628, 12, 12, 12, 12, 12, 12, 13, 66, 66, 58, 194, 194, 194, 194, 194, 194, 194, 194, 194, 194, 57, 70, 66, 66, 11, 633, 645, 645, 645, 636, 637, 638, 12, 12, 12, 12, 12, 12, 5, 3, 66, 68, 69, 56, 194, 194, 194, 194, 194, 194, 194, 57, 70, 66, 66, 66, 11, 633, 645, 645, 645, 636, 637, 638, 12, 947, 949, 12, 12, 12, 12, 13, 66, 66, 66, 68, 69, 69, 69, 69, 69, 69, 69, 70, 66, 66, 66, 66, 11, 633, 645, 645, 645, 636, 637, 638, 12, 967, 969, 12, 12, 12, 12, 5, 2, 3, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 1, 2, 2, 4, 633, 645, 645, 626, 629, 637, 638, 12, 12, 12, 12, 12, 12, 947, 949, 12, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 12, 12, 12, 633, 645, 645, 636, 637, 637, 630, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 633, 645, 626, 629, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 626, 629, 637, 637, 637, 637, 52, 52, 52, 52, 54, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 626, 629, 637, 637, 637, 637, 637, 34, 34, 34, 34, 51, 52, 54, 12, 12, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 635, 643, 626, 629, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 51, 54, 12, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 635, 643, 645, 636, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 51, 52, 54, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 51, 54, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 51, 52, 52, 52, 54, 12, 12, 12, 12, 635, 643, 645, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 51, 52, 54, 12, 12, 633, 645, 645, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 633, 645, 645, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 31, 44, 12, 12, 633, 645, 645, 645, 626, 629, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 633, 645, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 633, 645, 645, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 635, 643, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 31, 44, 12, 12, 633, 645, 645, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 31, 947, 949, 12, 635, 643, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 31, 44, 967, 969, 635, 643, 645, 645, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 31, 44, 12, 12, 635, 643, 645, 645, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 31, 44, 12, 12, 12, 633, 645, 626, 627, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 947, 949, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 967, 969, 12, 633, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 635, 643, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 633, 645, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 51, 54, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 51, 54, 12, 633, 645, 645, 646, 647, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 633, 645, 645, 645, 645, 646, 647, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 51, 54, 625, 622, 623, 645, 645, 645, 645, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 625, 623, 645, 645, 645, 645, 646, 647, 639, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 51, 54, 12, 12, 625, 622, 623, 645, 645, 645, 645, 646, 639, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 51, 52, 54, 12, 12, 625, 622, 622, 623, 645, 645, 646, 647, 639, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 51, 52, 52, 52, 54, 12, 625, 622, 622, 622, 623, 646, 639, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 51, 54, 12, 12, 12, 12, 625, 623, 636, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 51, 52, 52, 54, 12, 12, 633, 646, 647, 647, 647, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 633, 645, 645, 645, 645, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 633, 645, 645, 645, 645, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 633, 645, 645, 626, 627, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 633, 645, 645, 636, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 635, 643, 626, 627, 629, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 31, 32, 32, 32, 32, 32, 44, 12, 633, 645, 636, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 31, 44, 12, 12, 12, 12, 12, 12, 635, 643, 626, 629, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 12, 12, 635, 642, 642, 643, 626, 629, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 31, 44, 12, 12, 635, 642, 643, 645, 645, 645, 636, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 31, 32, 44, 12, 12, 12, 625, 623, 645, 645, 645, 626, 629, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 31, 32, 32, 44, 12, 12, 12, 12, 12, 12, 625, 623, 645, 645, 636, 637, 637, 637, 637, 637, 637, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 44, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 626, 629, 637, 637, 637, 637, 637, 637, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 947, 949, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 967, 969, 12, 12, 12, 12, 12, 12, 12, 633, 626, 629, 637, 637, 637, 637, 637, 637, 637, 22, 22, 22, 22, 22, 22, 22, 14, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 66, 66, 66, 63, 64, 65, 66, 21, 22, 14, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 66, 66, 66, 73, 74, 62, 65, 66, 1, 4, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 636, 637, 637, 637, 637, 637, 637, 637, 637, 66, 66, 63, 61, 74, 74, 75, 66, 21, 22, 14, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 63, 64, 61, 74, 74, 74, 75, 66, 66, 66, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 73, 74, 74, 74, 74, 74, 75, 66, 66, 1, 4, 12, 12, 947, 949, 12, 12, 12, 12, 12, 635, 643, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 73, 74, 74, 74, 74, 74, 75, 66, 66, 21, 14, 12, 12, 967, 969, 12, 12, 12, 12, 12, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 61, 74, 74, 74, 74, 74, 75, 66, 66, 66, 11, 12, 12, 12, 12, 12, 12, 12, 12, 635, 643, 626, 627, 629, 637, 637, 637, 637, 637, 637, 637, 637, 74, 74, 74, 74, 74, 72, 85, 66, 66, 66, 11, 12, 12, 12, 12, 12, 12, 12, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 74, 74, 74, 74, 74, 75, 66, 66, 66, 66, 11, 12, 12, 12, 12, 12, 12, 12, 12, 633, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 74, 74, 74, 74, 74, 75, 66, 66, 66, 66, 21, 14, 12, 12, 12, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 74, 74, 74, 74, 74, 75, 66, 66, 66, 66, 66, 11, 12, 12, 12, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 74, 74, 74, 74, 74, 75, 66, 66, 66, 66, 66, 11, 12, 947, 949, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 74, 74, 74, 74, 74, 75, 66, 66, 66, 66, 66, 11, 12, 967, 969, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 74, 74, 74, 74, 72, 85, 66, 66, 66, 66, 66, 11, 12, 12, 12, 12, 12, 12, 12, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 74, 74, 74, 74, 75, 66, 66, 66, 66, 66, 66, 21, 14, 12, 12, 12, 12, 12, 635, 643, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 74, 74, 74, 74, 75, 66, 66, 66, 66, 66, 66, 66, 11, 12, 12, 12, 12, 635, 643, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 74, 74, 74, 74, 75, 66, 66, 66, 66, 66, 66, 66, 11, 12, 12, 12, 635, 643, 645, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 71, 74, 72, 84, 85, 66, 66, 66, 66, 66, 66, 66, 11, 12, 12, 635, 643, 626, 627, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 83, 84, 85, 66, 66, 66, 66, 66, 66, 66, 66, 66, 11, 12, 635, 643, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 2, 2, 2, 2, 2, 2, 2, 2, 3, 66, 66, 66, 11, 635, 643, 645, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 52, 52, 52, 52, 52, 52, 52, 54, 5, 2, 3, 66, 11, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 51, 52, 54, 5, 2, 4, 633, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 51, 52, 54, 12, 625, 623, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 51, 52, 54, 625, 623, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 51, 54, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 625, 623, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 51, 54, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 633, 645, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 625, 623, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 51, 54, 625, 623, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 51, 54, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 633, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 31, 44, 633, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 633, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 31, 44, 635, 643, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 635, 643, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 31, 44, 633, 645, 626, 629, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 635, 643, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 633, 645, 645, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 625, 623, 645, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 625, 623, 645, 636, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 633, 645, 646, 639, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 41, 12, 12, 633, 645, 645, 646, 647, 637, 637, 637, 637, 637, 637, 637, 637, 637, 637],
         "height":300,
         "name":"Tile Layer 1",
         "opacity":1,
         "type":"tilelayer",
         "visible":true,
         "width":32,
         "x":0,
         "y":0
        }],
 "nextobjectid":1,
 "orientation":"orthogonal",
 "renderorder":"right-down",
 "tileheight":28,
 "tilesets":[
        {
         "columns":10,
         "firstgid":1,
         "image":".\/tilesets\/shapesz.png",
         "imageheight":1736,
         "imagewidth":240,
         "margin":0,
         "name":"shapesz",
         "spacing":0,
         "terrains":[
                {
                 "name":"Grass",
                 "tile":-1
                }, 
                {
                 "name":"Rock",
                 "tile":-1
                }, 
                {
                 "name":"Mountain",
                 "tile":-1
                }, 
                {
                 "name":"Hole",
                 "tile":-1
                }],
         "tilecount":620,
         "tileheight":28,
         "tiles":
            {
             "0":
                {
                 "terrain":[1, 1, 1, -1]
                },
             "1":
                {
                 "terrain":[1, 1, -1, -1]
                },
             "10":
                {
                 "terrain":[1, -1, 1, -1]
                },
             "12":
                {
                 "terrain":[-1, 1, -1, 1]
                },
             "13":
                {
                 "terrain":[-1, -1, 1, -1]
                },
             "14":
                {
                 "terrain":[-1, -1, -1, 1]
                },
             "193":
                {
                 "terrain":[3, 3, 3, 3]
                },
             "2":
                {
                 "terrain":[1, 1, -1, 1]
                },
             "20":
                {
                 "terrain":[1, -1, 1, 1]
                },
             "21":
                {
                 "terrain":[-1, -1, 1, 1]
                },
             "22":
                {
                 "terrain":[-1, 1, 1, 1]
                },
             "3":
                {
                 "terrain":[1, -1, -1, -1]
                },
             "30":
                {
                 "terrain":[0, 0, 0, -1]
                },
             "31":
                {
                 "terrain":[0, 0, -1, -1]
                },
             "32":
                {
                 "terrain":[0, 0, -1, 0]
                },
             "33":
                {
                 "terrain":[0, 0, 0, 0]
                },
             "4":
                {
                 "terrain":[-1, 1, -1, -1]
                },
             "40":
                {
                 "terrain":[0, -1, 0, -1]
                },
             "42":
                {
                 "terrain":[-1, 0, -1, 0]
                },
             "43":
                {
                 "terrain":[0, -1, -1, -1]
                },
             "44":
                {
                 "terrain":[-1, 0, -1, -1]
                },
             "45":
                {
                 "terrain":[-1, 3, 3, 3]
                },
             "46":
                {
                 "terrain":[3, -1, 3, 3]
                },
             "47":
                {
                 "terrain":[-1, -1, -1, 3]
                },
             "48":
                {
                 "terrain":[-1, -1, 3, 3]
                },
             "49":
                {
                 "terrain":[-1, -1, 3, -1]
                },
             "50":
                {
                 "terrain":[0, -1, 0, 0]
                },
             "51":
                {
                 "terrain":[-1, -1, 0, 0]
                },
             "52":
                {
                 "terrain":[-1, 0, 0, 0]
                },
             "53":
                {
                 "terrain":[-1, -1, 0, -1]
                },
             "54":
                {
                 "terrain":[-1, -1, -1, 0]
                },
             "55":
                {
                 "terrain":[3, 3, -1, 3]
                },
             "56":
                {
                 "terrain":[3, 3, 3, -1]
                },
             "57":
                {
                 "terrain":[-1, 3, -1, 3]
                },
             "59":
                {
                 "terrain":[3, -1, 3, -1]
                },
             "60":
                {
                 "terrain":[-1, 2, 2, 2]
                },
             "61":
                {
                 "terrain":[2, -1, 2, 2]
                },
             "62":
                {
                 "terrain":[-1, -1, -1, 2]
                },
             "63":
                {
                 "terrain":[-1, -1, 2, 2]
                },
             "64":
                {
                 "terrain":[-1, -1, 2, -1]
                },
             "65":
                {
                 "terrain":[1, 1, 1, 1]
                },
             "67":
                {
                 "terrain":[-1, 3, -1, -1]
                },
             "68":
                {
                 "terrain":[3, 3, -1, -1]
                },
             "69":
                {
                 "terrain":[3, -1, -1, -1]
                },
             "70":
                {
                 "terrain":[2, 2, -1, 2]
                },
             "71":
                {
                 "terrain":[2, 2, 2, -1]
                },
             "72":
                {
                 "terrain":[-1, 2, -1, 2]
                },
             "73":
                {
                 "terrain":[2, 2, 2, 2]
                },
             "74":
                {
                 "terrain":[2, -1, 2, -1]
                },
             "82":
                {
                 "terrain":[-1, 2, -1, -1]
                },
             "83":
                {
                 "terrain":[2, 2, -1, -1]
                },
             "84":
                {
                 "terrain":[2, -1, -1, -1]
                }
            },
         "tilewidth":24
        }, 
        {
         "columns":10,
         "firstgid":621,
         "image":".\/tilesets\/shapesy.png",
         "imageheight":1876,
         "imagewidth":240,
         "margin":0,
         "name":"shapesy",
         "spacing":0,
         "terrains":[
                {
                 "name":"Island",
                 "tile":-1
                }, 
                {
                 "name":"DeepWater",
                 "tile":-1
                }],
         "tilecount":670,
         "tileheight":28,
         "tiles":
            {
             "0":
                {
                 "terrain":[-1, -1, -1, 0]
                },
             "1":
                {
                 "terrain":[-1, -1, 0, 0]
                },
             "10":
                {
                 "terrain":[-1, 0, -1, 0]
                },
             "11":
                {
                 "terrain":[0, 0, 0, 0]
                },
             "12":
                {
                 "terrain":[0, -1, 0, -1]
                },
             "13":
                {
                 "terrain":[0, 0, -1, 0]
                },
             "14":
                {
                 "terrain":[0, 0, 0, -1]
                },
             "15":
                {
                 "terrain":[-1, 1, -1, 1]
                },
             "16":
                {
                 "terrain":[1, 1, 1, 1]
                },
             "17":
                {
                 "terrain":[1, -1, 1, -1]
                },
             "18":
                {
                 "terrain":[1, 1, -1, 1]
                },
             "19":
                {
                 "terrain":[1, 1, 1, -1]
                },
             "2":
                {
                 "terrain":[-1, -1, 0, -1]
                },
             "20":
                {
                 "terrain":[-1, 0, -1, -1]
                },
             "21":
                {
                 "terrain":[0, 0, -1, -1]
                },
             "22":
                {
                 "terrain":[0, -1, -1, -1]
                },
             "25":
                {
                 "terrain":[-1, 1, -1, -1]
                },
             "26":
                {
                 "terrain":[1, 1, -1, -1]
                },
             "27":
                {
                 "terrain":[1, -1, -1, -1]
                },
             "3":
                {
                 "terrain":[-1, 0, 0, 0]
                },
             "4":
                {
                 "terrain":[0, -1, 0, 0]
                },
             "5":
                {
                 "terrain":[-1, -1, -1, 1]
                },
             "6":
                {
                 "terrain":[-1, -1, 1, 1]
                },
             "7":
                {
                 "terrain":[-1, -1, 1, -1]
                },
             "8":
                {
                 "terrain":[-1, 1, 1, 1]
                },
             "9":
                {
                 "terrain":[1, -1, 1, 1]
                }
            },
         "tilewidth":24
        }],
 "tilewidth":24,
 "version":1,
 "width":32
}
},{}],14:[function(require,module,exports){
module.exports={ "height":24,
 "layers":[
        {
         "data":[103, 94, 92, 92, 92, 92, 95, 94, 92, 92, 95, 103, 104, 112, 112, 112, 112, 105, 104, 112, 112, 105, 103, 94, 92, 92, 92, 92, 92, 92, 92, 92, 95, 103, 104, 112, 112, 112, 112, 112, 112, 112, 112, 105, 103, 94, 92, 92, 92, 92, 92, 92, 92, 92, 95, 103, 101, 0, 0, 0, 0, 0, 0, 0, 0, 103, 103, 104, 112, 112, 112, 112, 112, 112, 112, 112, 105, 103, 94, 92, 92, 92, 92, 92, 92, 92, 92, 95, 103, 104, 112, 112, 112, 112, 112, 112, 112, 112, 105, 103, 94, 92, 92, 92, 92, 92, 92, 92, 92, 95, 103, 101, 0, 0, 0, 0, 0, 0, 0, 0, 103, 103, 104, 112, 112, 112, 112, 112, 112, 112, 112, 105, 103, 94, 92, 92, 92, 92, 92, 92, 92, 92, 95, 103, 104, 112, 112, 112, 112, 112, 112, 112, 112, 105, 103, 94, 92, 92, 95, 94, 95, 94, 92, 92, 95, 103, 101, 0, 0, 103, 101, 103, 101, 0, 0, 103, 103, 101, 0, 0, 103, 101, 103, 101, 0, 0, 103, 103, 101, 0, 0, 103, 101, 103, 101, 0, 0, 103, 103, 101, 0, 0, 103, 101, 103, 101, 0, 0, 103, 103, 101, 0, 0, 103, 101, 103, 101, 0, 0, 103, 103, 101, 0, 0, 103, 101, 103, 101, 0, 0, 103, 103, 101, 0, 0, 103, 104, 105, 101, 0, 0, 103, 103, 101, 0, 0, 103, 149, 150, 101, 0, 0, 103, 103, 104, 112, 112, 105, 159, 160, 104, 112, 112, 105],
         "height":24,
         "name":"Tile Layer 1",
         "opacity":1,
         "type":"tilelayer",
         "visible":true,
         "width":11,
         "x":0,
         "y":0
        }],
 "nextobjectid":1,
 "orientation":"orthogonal",
 "renderorder":"right-down",
 "tileheight":28,
 "tilesets":[
        {
         "columns":10,
         "firstgid":1,
         "image":".\/tilesets\/shapesz.png",
         "imageheight":1736,
         "imagewidth":240,
         "margin":0,
         "name":"shapesz",
         "spacing":0,
         "tilecount":620,
         "tileheight":28,
         "tilewidth":24
        }],
 "tilewidth":24,
 "version":1,
 "width":11
}
},{}],15:[function(require,module,exports){
module.exports={ "height":500,
 "layers":[
        {
         "data":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 27, 26, 7, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 27, 26, 26, 27, 26, 26, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 19, 27, 26, 27, 27, 26, 27, 27, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 27, 19, 19, 26, 27, 27, 27, 27, 19, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 27, 26, 19, 26, 26, 27, 27, 19, 19, 19, 7, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 26, 19, 19, 27, 19, 27, 19, 19, 19, 26, 27, 19, 27, 7, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 19, 27, 19, 27, 19, 26, 19, 19, 19, 27, 26, 27, 26, 26, 26, 27, 26, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 19, 27, 19, 19, 26, 27, 27, 27, 26, 26, 26, 19, 27, 27, 19, 27, 19, 19, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 26, 27, 27, 27, 26, 27, 27, 27, 27, 26, 26, 26, 27, 26, 19, 27, 26, 27, 26, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 27, 19, 27, 19, 27, 19, 27, 27, 19, 27, 27, 26, 27, 26, 27, 19, 19, 27, 27, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 19, 19, 19, 27, 26, 19, 27, 26, 26, 26, 27, 27, 26, 26, 19, 27, 19, 19, 26, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 26, 19, 26, 27, 26, 26, 26, 26, 19, 26, 19, 26, 19, 27, 26, 19, 26, 26, 27, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 27, 27, 27, 19, 26, 27, 19, 19, 27, 27, 27, 19, 26, 27, 27, 19, 26, 19, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 26, 26, 26, 26, 19, 19, 26, 27, 27, 26, 26, 26, 26, 27, 19, 27, 19, 19, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 19, 19, 27, 26, 19, 27, 26, 26, 27, 19, 26, 19, 26, 27, 19, 27, 26, 19, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 16, 27, 27, 26, 19, 19, 26, 19, 26, 19, 19, 27, 27, 19, 27, 26, 19, 27, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 16, 27, 27, 26, 27, 26, 27, 27, 19, 27, 19, 27, 19, 26, 19, 17, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 29, 29, 16, 26, 27, 19, 27, 26, 27, 27, 26, 19, 26, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 26, 19, 19, 19, 27, 26, 19, 17, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 29, 29, 16, 19, 19, 27, 19, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 29, 29, 29, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 26, 7, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 19, 27, 26, 26, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 26, 27, 27, 27, 26, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 19, 26, 19, 26, 27, 27, 26, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 19, 19, 26, 27, 19, 27, 19, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 19, 26, 26, 26, 26, 27, 26, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 26, 19, 26, 19, 27, 26, 26, 27, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 19, 27, 27, 26, 26, 26, 26, 27, 26, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 19, 26, 19, 19, 19, 19, 19, 19, 19, 19, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 19, 26, 26, 27, 19, 19, 19, 19, 26, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 27, 27, 26, 27, 26, 26, 19, 26, 26, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 27, 26, 19, 19, 19, 19, 19, 27, 26, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 19, 26, 19, 27, 26, 19, 19, 19, 19, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 19, 27, 19, 19, 19, 27, 26, 27, 26, 19, 19, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 27, 27, 19, 26, 26, 19, 27, 27, 19, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 19, 27, 26, 19, 26, 19, 27, 19, 27, 19, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 19, 19, 26, 19, 26, 27, 19, 19, 26, 27, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 27, 27, 26, 27, 19, 27, 19, 19, 27, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 19, 26, 19, 27, 27, 26, 26, 26, 19, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 16, 26, 19, 26, 26, 19, 27, 26, 27, 19, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 19, 19, 27, 19, 26, 19, 26, 19, 19, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 16, 27, 19, 26, 26, 19, 19, 27, 27, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 16, 27, 27, 27, 26, 26, 17, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 29, 29, 29, 29, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 6, 26, 26, 26, 27, 26, 27, 27, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 26, 26, 27, 26, 19, 26, 26, 19, 27, 26, 26, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 19, 27, 26, 26, 26, 27, 27, 27, 27, 19, 27, 19, 19, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 6, 19, 26, 19, 26, 26, 26, 27, 19, 27, 26, 19, 19, 27, 26, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 26, 26, 27, 27, 19, 27, 26, 26, 19, 19, 26, 27, 26, 26, 19, 19, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 27, 19, 26, 19, 19, 19, 27, 26, 27, 19, 26, 26, 27, 26, 26, 27, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 27, 19, 26, 26, 19, 26, 27, 27, 27, 26, 27, 19, 19, 27, 27, 19, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 26, 19, 27, 26, 26, 27, 27, 19, 19, 19, 26, 19, 27, 27, 26, 27, 19, 19, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 27, 27, 26, 26, 26, 27, 19, 26, 19, 27, 19, 19, 26, 19, 19, 26, 19, 27, 19, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 27, 27, 27, 27, 19, 19, 19, 26, 26, 27, 26, 27, 27, 27, 19, 19, 26, 19, 19, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 19, 26, 26, 19, 19, 19, 27, 26, 26, 26, 19, 27, 27, 19, 19, 19, 26, 19, 19, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 27, 27, 27, 19, 26, 27, 19, 26, 19, 26, 26, 27, 27, 26, 19, 27, 27, 26, 27, 19, 20, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 27, 19, 19, 19, 27, 19, 27, 27, 26, 19, 26, 27, 19, 26, 19, 27, 19, 26, 26, 26, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 18, 19, 27, 27, 19, 19, 26, 19, 27, 26, 26, 19, 19, 27, 27, 19, 26, 26, 19, 27, 19, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 26, 19, 27, 26, 27, 19, 26, 26, 27, 19, 27, 19, 19, 26, 27, 27, 26, 26, 19, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 19, 27, 26, 19, 26, 26, 19, 27, 26, 26, 27, 19, 27, 27, 27, 26, 27, 19, 26, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 26, 26, 19, 26, 27, 19, 27, 27, 19, 27, 19, 19, 27, 26, 19, 19, 17, 29, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 19, 27, 26, 19, 27, 26, 19, 26, 19, 27, 26, 26, 27, 26, 19, 19, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 26, 19, 27, 27, 26, 27, 26, 19, 27, 17, 29, 16, 19, 17, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 16, 27, 19, 26, 19, 27, 19, 26, 17, 29, 30, 0, 28, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 19, 19, 27, 19, 26, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 16, 26, 26, 26, 17, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 29, 29, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 27, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 6, 26, 19, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 27, 26, 26, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 19, 19, 19, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 10, 0, 0, 0, 0, 0, 8, 6, 19, 26, 27, 27, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 6, 26, 26, 20, 0, 0, 0, 0, 8, 6, 26, 19, 26, 19, 26, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 6, 19, 26, 26, 19, 7, 10, 0, 0, 8, 6, 19, 27, 27, 26, 27, 27, 20, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 6, 27, 27, 26, 19, 26, 19, 27, 19, 19, 7, 9, 9, 6, 27, 19, 27, 26, 26, 27, 17, 30, 0, 0, 0, 0, 0, 0, 0, 18, 27, 27, 27, 27, 27, 27, 26, 27, 26, 19, 26, 19, 19, 19, 26, 26, 26, 26, 26, 19, 19, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 26, 27, 27, 26, 19, 26, 19, 26, 26, 19, 26, 26, 26, 19, 27, 27, 26, 26, 26, 26, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 27, 26, 26, 27, 27, 27, 19, 19, 26, 26, 27, 27, 19, 19, 26, 27, 19, 19, 27, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 19, 26, 26, 26, 26, 19, 19, 19, 27, 19, 19, 19, 26, 26, 27, 26, 26, 26, 19, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 27, 26, 26, 27, 27, 19, 27, 26, 26, 26, 19, 27, 26, 19, 27, 26, 19, 26, 19, 27, 27, 20, 0, 0, 0, 0, 0, 0, 0, 8, 6, 27, 27, 19, 27, 26, 27, 27, 27, 27, 27, 26, 26, 19, 19, 27, 19, 19, 26, 26, 27, 26, 17, 30, 0, 0, 0, 0, 0, 0, 0, 18, 19, 19, 26, 26, 26, 27, 26, 27, 26, 19, 26, 27, 19, 26, 27, 27, 27, 26, 27, 27, 19, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 19, 27, 19, 27, 27, 19, 19, 19, 19, 26, 19, 26, 26, 27, 26, 26, 27, 19, 27, 19, 17, 30, 0, 0, 0, 0, 0, 0, 0, 8, 6, 19, 26, 19, 26, 27, 26, 19, 19, 27, 27, 27, 19, 27, 27, 19, 26, 19, 26, 19, 26, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 26, 26, 27, 26, 27, 26, 26, 19, 26, 19, 19, 19, 27, 26, 26, 27, 26, 26, 17, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 19, 19, 19, 26, 27, 26, 26, 19, 19, 19, 19, 19, 27, 26, 19, 26, 17, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 19, 26, 19, 19, 19, 26, 19, 26, 27, 27, 27, 19, 19, 26, 27, 17, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 29, 16, 26, 19, 27, 19, 19, 27, 19, 19, 27, 26, 26, 27, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 6, 27, 26, 27, 27, 19, 19, 19, 27, 19, 19, 7, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 6, 19, 27, 26, 26, 19, 19, 26, 26, 26, 27, 27, 26, 26, 26, 26, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 27, 19, 26, 27, 19, 27, 19, 27, 26, 26, 26, 27, 26, 26, 19, 26, 27, 27, 7, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 27, 26, 19, 19, 19, 19, 27, 26, 19, 27, 19, 26, 19, 27, 19, 27, 26, 26, 27, 26, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 18, 19, 26, 19, 27, 19, 27, 19, 26, 27, 27, 26, 27, 19, 19, 27, 26, 26, 19, 27, 27, 26, 27, 7, 10, 0, 0, 0, 0, 0, 0, 0, 18, 26, 19, 27, 27, 26, 26, 27, 26, 19, 19, 19, 27, 19, 19, 19, 26, 19, 26, 26, 19, 27, 26, 26, 20, 0, 0, 0, 0, 0, 0, 0, 18, 27, 27, 26, 26, 27, 27, 26, 27, 27, 27, 26, 26, 27, 27, 27, 26, 19, 26, 27, 19, 27, 26, 26, 7, 10, 0, 0, 0, 0, 0, 0, 18, 19, 27, 27, 26, 27, 26, 26, 27, 26, 26, 27, 26, 19, 27, 26, 26, 26, 27, 27, 26, 27, 26, 27, 27, 20, 0, 0, 0, 0, 0, 0, 18, 26, 27, 26, 26, 26, 26, 26, 19, 19, 26, 26, 27, 19, 27, 26, 26, 19, 26, 26, 26, 26, 27, 19, 27, 20, 0, 0, 0, 0, 0, 0, 18, 27, 19, 19, 19, 19, 19, 26, 26, 26, 26, 26, 26, 27, 26, 27, 19, 19, 19, 27, 26, 26, 19, 26, 27, 20, 0, 0, 0, 0, 0, 0, 18, 19, 19, 27, 19, 19, 27, 26, 26, 27, 26, 19, 27, 19, 26, 19, 27, 19, 26, 19, 19, 26, 27, 26, 27, 20, 0, 0, 0, 0, 0, 0, 28, 16, 27, 27, 26, 19, 26, 19, 27, 27, 19, 26, 19, 27, 27, 27, 19, 19, 26, 27, 26, 27, 26, 26, 19, 20, 0, 0, 0, 0, 0, 0, 0, 18, 27, 27, 27, 19, 27, 19, 26, 27, 19, 19, 19, 26, 26, 26, 27, 19, 27, 27, 19, 27, 27, 19, 19, 20, 0, 0, 0, 0, 0, 0, 0, 28, 16, 27, 19, 19, 19, 19, 26, 27, 27, 26, 26, 27, 26, 26, 26, 19, 19, 26, 27, 27, 19, 27, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 26, 27, 19, 27, 27, 26, 27, 19, 26, 26, 27, 27, 19, 26, 19, 27, 26, 19, 27, 19, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 16, 19, 27, 19, 19, 26, 27, 27, 26, 19, 26, 26, 19, 19, 26, 26, 19, 19, 27, 26, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 16, 26, 19, 26, 26, 19, 26, 27, 19, 27, 26, 19, 19, 27, 19, 27, 26, 26, 19, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 16, 26, 27, 27, 26, 27, 26, 27, 27, 26, 26, 19, 26, 19, 26, 26, 19, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 29, 16, 27, 27, 26, 26, 19, 27, 27, 26, 27, 26, 27, 19, 17, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 29, 29, 16, 27, 26, 26, 26, 27, 19, 19, 19, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 16, 19, 26, 27, 27, 27, 17, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 29, 29, 29, 29, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 7, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 26, 19, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 26, 19, 26, 7, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 26, 26, 26, 26, 27, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 26, 27, 27, 27, 27, 19, 7, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 27, 26, 26, 19, 19, 19, 19, 19, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 26, 27, 19, 27, 27, 26, 19, 19, 19, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 27, 27, 26, 26, 19, 26, 26, 26, 19, 26, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 27, 26, 19, 26, 19, 26, 27, 27, 27, 19, 19, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 27, 19, 19, 19, 26, 27, 19, 27, 19, 19, 27, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 19, 19, 19, 26, 26, 26, 27, 27, 26, 27, 26, 27, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 19, 26, 19, 26, 27, 19, 19, 27, 27, 19, 19, 27, 27, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 19, 26, 26, 19, 26, 27, 27, 19, 19, 19, 26, 27, 19, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 19, 26, 27, 26, 27, 26, 26, 27, 27, 19, 26, 19, 27, 19, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 19, 19, 26, 27, 19, 19, 19, 19, 27, 26, 19, 26, 19, 19, 19, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 19, 27, 27, 27, 27, 27, 27, 26, 19, 27, 26, 26, 19, 26, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 26, 26, 19, 19, 19, 19, 19, 19, 19, 27, 19, 26, 19, 27, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 19, 26, 27, 26, 19, 19, 26, 27, 27, 19, 26, 26, 19, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 26, 19, 27, 26, 26, 19, 27, 19, 19, 26, 27, 26, 19, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 26, 27, 26, 27, 19, 19, 19, 27, 19, 26, 27, 19, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 26, 19, 19, 19, 26, 27, 26, 26, 19, 27, 27, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 26, 19, 27, 26, 19, 26, 27, 27, 26, 27, 27, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 27, 27, 19, 27, 26, 26, 26, 19, 19, 27, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 19, 19, 26, 27, 19, 27, 27, 26, 26, 26, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 27, 27, 27, 26, 26, 26, 27, 19, 26, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 27, 19, 19, 26, 26, 27, 26, 26, 26, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 19, 19, 26, 19, 19, 26, 27, 19, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 27, 19, 26, 26, 19, 26, 26, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 27, 26, 19, 27, 19, 26, 26, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 27, 27, 19, 19, 19, 26, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 27, 27, 26, 27, 26, 19, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 26, 26, 19, 26, 26, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 27, 19, 26, 19, 17, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 19, 27, 19, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 19, 19, 17, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 17, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 29, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 6, 26, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 6, 27, 27, 27, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 6, 27, 27, 19, 19, 19, 27, 26, 27, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 26, 27, 27, 27, 19, 19, 26, 26, 26, 26, 26, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 6, 19, 27, 26, 27, 27, 26, 19, 27, 27, 26, 27, 27, 20, 0, 0, 0, 0, 0, 8, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 8, 6, 27, 26, 19, 26, 19, 26, 27, 19, 19, 19, 26, 27, 27, 20, 0, 0, 0, 0, 0, 18, 19, 19, 19, 27, 27, 19, 26, 7, 10, 8, 6, 27, 27, 26, 19, 27, 19, 17, 16, 27, 19, 19, 26, 26, 19, 20, 0, 0, 0, 8, 9, 6, 26, 26, 19, 27, 27, 19, 26, 27, 7, 6, 27, 27, 26, 26, 27, 17, 29, 30, 18, 27, 26, 17, 16, 26, 19, 7, 0, 0, 8, 6, 26, 19, 26, 19, 26, 19, 19, 27, 27, 26, 26, 27, 27, 26, 27, 26, 19, 20, 0, 8, 6, 27, 27, 7, 6, 26, 27, 26, 0, 8, 6, 27, 26, 26, 27, 26, 19, 17, 29, 16, 19, 27, 27, 17, 29, 16, 19, 19, 19, 20, 8, 6, 26, 19, 27, 19, 19, 27, 26, 26, 0, 18, 26, 27, 26, 19, 26, 26, 26, 7, 9, 6, 19, 19, 19, 7, 10, 18, 26, 19, 26, 7, 6, 27, 26, 26, 27, 19, 27, 19, 27, 17, 0, 18, 27, 19, 19, 19, 19, 26, 26, 27, 19, 19, 17, 16, 27, 27, 20, 18, 27, 27, 26, 19, 19, 26, 26, 19, 26, 26, 27, 26, 19, 20, 8, 6, 19, 19, 26, 27, 19, 27, 27, 19, 26, 26, 20, 28, 16, 26, 20, 28, 16, 19, 19, 27, 19, 27, 19, 26, 19, 19, 27, 26, 19, 20, 18, 19, 19, 26, 19, 17, 16, 27, 19, 27, 27, 26, 7, 10, 18, 27, 7, 9, 6, 26, 26, 27, 26, 26, 26, 26, 27, 27, 27, 26, 27, 20, 18, 26, 26, 26, 26, 20, 18, 27, 19, 27, 17, 16, 19, 20, 18, 26, 27, 26, 17, 29, 29, 29, 29, 16, 19, 19, 27, 17, 29, 16, 26, 20, 18, 27, 27, 26, 26, 20, 18, 19, 19, 27, 7, 6, 26, 20, 18, 27, 27, 26, 7, 9, 9, 10, 8, 6, 26, 26, 26, 20, 8, 6, 27, 7, 18, 27, 19, 26, 17, 30, 18, 26, 27, 27, 26, 27, 19, 20, 18, 27, 19, 27, 19, 26, 26, 7, 6, 19, 19, 26, 26, 7, 6, 27, 27, 26, 18, 27, 27, 27, 20, 0, 28, 16, 27, 27, 26, 27, 26, 7, 6, 19, 26, 27, 17, 29, 16, 19, 19, 26, 27, 26, 26, 27, 19, 26, 27, 27, 28, 16, 19, 19, 7, 9, 9, 6, 27, 19, 19, 26, 19, 26, 19, 19, 27, 27, 7, 9, 6, 26, 19, 27, 27, 27, 17, 29, 29, 16, 26, 26, 0, 28, 16, 27, 27, 26, 19, 26, 27, 27, 26, 27, 26, 26, 27, 27, 26, 27, 19, 19, 27, 19, 19, 19, 19, 27, 7, 9, 10, 28, 16, 26, 0, 0, 18, 26, 27, 19, 26, 26, 26, 19, 19, 26, 26, 26, 27, 19, 17, 29, 29, 29, 16, 26, 27, 17, 29, 16, 19, 27, 7, 10, 18, 26, 0, 0, 18, 27, 27, 26, 26, 19, 27, 26, 26, 27, 27, 27, 27, 19, 7, 10, 0, 0, 28, 16, 27, 7, 10, 18, 27, 19, 19, 7, 6, 17, 0, 0, 28, 16, 19, 19, 19, 26, 19, 27, 19, 17, 16, 26, 26, 27, 19, 7, 9, 9, 10, 18, 26, 27, 20, 18, 19, 26, 19, 27, 27, 7, 0, 0, 0, 18, 26, 26, 26, 27, 27, 26, 19, 20, 18, 26, 19, 19, 19, 26, 27, 27, 7, 6, 26, 27, 7, 6, 27, 27, 19, 27, 26, 26, 0, 0, 0, 18, 26, 19, 19, 27, 19, 27, 27, 20, 18, 27, 27, 26, 26, 17, 29, 16, 27, 27, 19, 27, 19, 27, 27, 27, 26, 19, 26, 27, 0, 0, 8, 6, 26, 27, 27, 27, 19, 27, 27, 20, 28, 29, 16, 27, 19, 7, 10, 28, 16, 26, 27, 19, 26, 26, 17, 29, 16, 19, 27, 26, 0, 0, 18, 27, 27, 19, 27, 26, 26, 26, 19, 7, 9, 10, 28, 16, 19, 27, 7, 10, 28, 29, 16, 17, 29, 29, 30, 0, 18, 19, 19, 27, 0, 0, 18, 19, 26, 17, 16, 26, 26, 19, 19, 26, 26, 20, 0, 28, 29, 29, 16, 7, 9, 9, 6, 7, 9, 9, 9, 9, 6, 27, 26, 26, 0, 0, 18, 27, 19, 20, 28, 16, 26, 26, 19, 19, 27, 20, 0, 0, 0, 8, 6, 19, 26, 26, 27, 27, 26, 27, 19, 27, 19, 19, 27, 26, 0, 0, 28, 16, 26, 7, 10, 18, 26, 26, 19, 19, 27, 7, 9, 9, 9, 6, 19, 26, 27, 19, 26, 27, 19, 19, 26, 19, 19, 19, 19, 27, 0, 0, 0, 18, 19, 27, 20, 28, 16, 19, 27, 26, 19, 19, 27, 27, 27, 26, 17, 16, 19, 26, 26, 19, 27, 19, 26, 19, 27, 26, 26, 17, 0, 0, 0, 28, 16, 27, 7, 9, 6, 19, 27, 26, 19, 27, 27, 26, 27, 26, 7, 6, 26, 27, 19, 27, 27, 27, 26, 27, 27, 27, 19, 20, 0, 0, 0, 0, 28, 16, 26, 26, 27, 27, 27, 27, 27, 26, 26, 19, 27, 26, 26, 27, 27, 19, 19, 26, 17, 29, 29, 29, 16, 26, 27, 20, 0, 0, 0, 0, 0, 28, 29, 16, 26, 27, 27, 19, 27, 26, 27, 27, 17, 29, 29, 16, 26, 17, 16, 26, 20, 8, 9, 9, 6, 26, 27, 20, 0, 0, 0, 0, 0, 0, 0, 28, 29, 16, 26, 27, 27, 27, 27, 19, 7, 9, 9, 6, 19, 20, 18, 19, 20, 18, 19, 26, 19, 26, 26, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 27, 27, 27, 19, 26, 17, 16, 27, 26, 19, 19, 7, 6, 27, 7, 6, 27, 26, 26, 27, 27, 26, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 27, 27, 26, 27, 7, 6, 26, 17, 16, 27, 19, 26, 19, 27, 27, 26, 27, 27, 26, 27, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 16, 26, 17, 16, 26, 27, 19, 26, 7, 6, 27, 19, 26, 17, 16, 26, 17, 16, 27, 26, 27, 26, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 29, 30, 18, 27, 26, 19, 27, 27, 19, 19, 27, 17, 30, 18, 26, 20, 18, 27, 19, 19, 26, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 16, 27, 17, 16, 27, 27, 26, 26, 20, 0, 18, 27, 20, 18, 27, 27, 27, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 7, 6, 27, 27, 27, 27, 7, 9, 6, 26, 7, 6, 26, 19, 26, 26, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 26, 27, 19, 19, 26, 27, 26, 26, 27, 27, 27, 27, 19, 26, 27, 26, 26, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 16, 26, 19, 17, 29, 29, 16, 26, 26, 17, 16, 19, 17, 16, 19, 26, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 19, 26, 7, 10, 0, 18, 26, 17, 30, 18, 19, 20, 18, 27, 26, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 16, 26, 27, 7, 9, 6, 17, 30, 8, 6, 19, 7, 6, 19, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 29, 16, 19, 26, 19, 7, 9, 6, 26, 26, 26, 19, 26, 19, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 29, 29, 16, 19, 19, 26, 26, 26, 19, 17, 16, 27, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 29, 16, 26, 19, 19, 19, 7, 6, 26, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 29, 29, 29, 16, 26, 19, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 29, 29, 29, 29, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 26, 19, 7, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 27, 19, 26, 19, 7, 9, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 19, 27, 19, 19, 27, 19, 19, 26, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 27, 26, 26, 26, 27, 26, 26, 27, 26, 7, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 26, 27, 19, 26, 27, 27, 26, 19, 19, 27, 26, 7, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 19, 19, 26, 19, 19, 26, 26, 19, 26, 19, 27, 26, 27, 7, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 26, 26, 19, 27, 26, 27, 26, 19, 26, 26, 27, 27, 19, 26, 26, 7, 9, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 26, 19, 26, 27, 27, 19, 27, 26, 27, 27, 27, 26, 19, 19, 26, 26, 26, 26, 7, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 19, 27, 26, 27, 19, 19, 19, 26, 27, 19, 26, 26, 27, 19, 27, 27, 26, 26, 27, 26, 7, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 27, 19, 19, 27, 27, 27, 27, 27, 27, 27, 19, 27, 27, 27, 27, 26, 27, 27, 27, 27, 26, 27, 26, 7, 9, 10, 0, 0, 0, 0, 0, 0, 27, 19, 19, 26, 27, 27, 27, 19, 27, 26, 27, 26, 19, 26, 19, 19, 26, 26, 26, 27, 19, 26, 27, 19, 27, 7, 10, 0, 0, 0, 0, 0, 26, 26, 27, 19, 27, 27, 19, 27, 26, 27, 19, 19, 26, 19, 27, 26, 19, 19, 27, 19, 19, 27, 27, 26, 27, 19, 7, 10, 0, 0, 0, 0, 27, 27, 19, 27, 27, 27, 26, 27, 26, 26, 19, 19, 26, 26, 26, 26, 26, 27, 19, 27, 26, 27, 19, 27, 26, 27, 19, 7, 10, 0, 0, 0, 27, 27, 27, 26, 19, 19, 19, 27, 26, 19, 26, 26, 19, 27, 26, 26, 26, 27, 27, 19, 27, 19, 27, 26, 27, 26, 27, 26, 7, 9, 9, 10, 27, 19, 27, 26, 19, 19, 26, 26, 19, 19, 27, 26, 27, 19, 19, 26, 26, 19, 26, 26, 26, 27, 26, 26, 26, 26, 26, 19, 19, 27, 19, 7, 19, 19, 19, 19, 26, 19, 19, 27, 27, 26, 27, 19, 27, 26, 26, 27, 26, 26, 26, 26, 27, 27, 27, 19, 27, 27, 26, 19, 19, 27, 26, 26, 19, 19, 19, 26, 26, 26, 27, 19, 27, 27, 27, 27, 19, 19, 27, 26, 26, 26, 27, 26, 26, 26, 19, 26, 27, 19, 26, 26, 26, 26, 19, 27, 27, 19, 26, 19, 19, 26, 19, 27, 26, 19, 26, 27, 19, 26, 26, 19, 27, 19, 19, 26, 19, 19, 27, 19, 27, 19, 26, 26, 19, 26, 19, 26, 27, 27, 19, 19, 26, 27, 27, 26, 19, 26, 19, 27, 26, 26, 26, 19, 26, 19, 27, 27, 26, 19, 26, 27, 19, 26, 26, 26, 26, 27, 19, 27, 26, 26, 19, 26, 27, 19, 19, 27, 19, 19, 27, 27, 26, 26, 27, 19, 26, 19, 26, 19, 26, 19, 26, 27, 27, 19, 27, 27, 19, 27, 26, 26, 26, 27, 19, 26, 19, 26, 26, 26, 27, 26, 19, 19, 26, 26, 27, 26, 26, 26, 27, 26, 26, 19, 19, 19, 26, 19, 26, 27, 19, 26, 19, 19, 19, 19, 26, 26, 19, 19, 27, 19, 27, 27, 19, 26, 26, 19, 26, 19, 26, 26, 26, 27, 19, 27, 26, 19, 19, 26, 27, 27, 26, 26, 27, 26, 27, 27, 27, 19, 19, 26, 27, 27, 27, 26, 27, 27, 19, 19, 27, 19, 26, 27, 19, 27, 26, 19, 19, 26, 19, 27, 19, 27, 19, 27, 27, 27, 19, 19, 27, 27, 26, 27, 26, 19, 26, 27, 26, 26, 26, 27, 27, 26, 26, 26, 27, 27, 19, 27, 27, 26, 19, 26, 27, 19, 19, 26, 26, 19, 27, 26, 27, 26, 27, 27, 27, 27, 19, 26, 19, 19, 26, 26, 26, 26, 26, 27, 26, 26, 27, 27, 19, 27, 27, 19, 26, 26, 19, 26, 27, 19, 19, 19, 27, 27, 27, 26, 26, 27, 19, 26, 27, 27, 26, 26, 27, 27, 27, 19, 27, 27, 19, 27, 26, 27, 19, 27, 26, 26, 19, 19, 27, 26, 27, 27, 26, 26, 19, 19, 19, 27, 26, 27, 26, 19, 19, 27, 27, 19, 19, 26, 26, 27, 26, 26, 26, 27, 19, 26, 27, 26, 19, 27, 19, 27],
         "height":500,
         "name":"Tile Layer 1",
         "opacity":1,
         "type":"tilelayer",
         "visible":true,
         "width":32,
         "x":0,
         "y":0
        }],
 "nextobjectid":1,
 "orientation":"orthogonal",
 "renderorder":"right-down",
 "tileheight":28,
 "tilesets":[
        {
         "columns":10,
         "firstgid":1,
         "image":".\/tilesets\/shapesz.png",
         "imageheight":1736,
         "imagewidth":240,
         "margin":0,
         "name":"shapesz",
         "spacing":0,
         "terrains":[
                {
                 "name":"Cloud",
                 "tile":-1
                }],
         "tilecount":620,
         "tileheight":28,
         "tiles":
            {
             "15":
                {
                 "terrain":[0, 0, -1, 0]
                },
             "16":
                {
                 "terrain":[0, 0, 0, -1]
                },
             "17":
                {
                 "terrain":[-1, 0, -1, 0]
                },
             "18":
                {
                 "terrain":[0, 0, 0, 0]
                },
             "19":
                {
                 "terrain":[0, -1, 0, -1]
                },
             "25":
                {
                 "terrain":[0, 0, 0, 0]
                },
             "26":
                {
                 "terrain":[0, 0, 0, 0]
                },
             "27":
                {
                 "terrain":[-1, 0, -1, -1]
                },
             "28":
                {
                 "terrain":[0, 0, -1, -1]
                },
             "29":
                {
                 "terrain":[0, -1, -1, -1]
                },
             "5":
                {
                 "terrain":[-1, 0, 0, 0]
                },
             "6":
                {
                 "terrain":[0, -1, 0, 0]
                },
             "7":
                {
                 "terrain":[-1, -1, -1, 0]
                },
             "8":
                {
                 "terrain":[-1, -1, 0, 0]
                },
             "9":
                {
                 "terrain":[-1, -1, 0, -1]
                }
            },
         "tilewidth":24
        }],
 "tilewidth":24,
 "version":1,
 "width":32
}
},{}],16:[function(require,module,exports){
module.exports={ "height":700,
 "layers":[
        {
         "data":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 87, 87, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 90, 87, 87, 87, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 87, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 99, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 89, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 107, 107, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 107, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 107, 107, 107, 107, 107, 107, 107, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 87, 87, 87, 87, 87, 87, 87, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 87, 87, 89, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 87, 87, 87, 87, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 86, 87, 87, 87, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 107, 108, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 107, 108, 0, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 107, 107, 107, 108, 0, 0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 107, 107, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 107, 107, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 107, 107, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 100, 107, 107, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 100, 107, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 107, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 87, 87, 87, 87, 87, 87, 87, 87, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 87, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 107, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 107, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 107, 107, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 107, 107, 99, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 107, 107, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 87, 87, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 90, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 90, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 90, 87, 87, 87, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 87, 87, 87, 87, 87, 87, 87, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 87, 88, 0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 107, 108, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 107, 107, 108, 0, 0, 0, 0, 106, 107, 107, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 107, 107, 107, 107, 107, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 107, 107, 107, 107, 107, 107, 107, 107, 107, 107, 107, 107, 107, 107, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 87, 87, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 87, 89, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 90, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 90, 87, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 107, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 107, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 100, 107, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 107, 107, 107, 107, 107, 107, 107, 107, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 87, 87, 87, 87, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 87, 87, 89, 97, 97, 97, 97, 97, 90, 87, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 87, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 87, 87, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 0, 106, 107, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 0, 0, 0, 106, 107, 107, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 0, 0, 0, 0, 0, 0, 106, 107, 107, 107, 107, 107, 107, 107, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 107, 107, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 107, 107, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 90, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 90, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 107, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 87, 87, 87, 87, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 87, 89, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 87, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 88, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 90, 87, 88, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 86, 89, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 100, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 107, 107, 99, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 106, 107, 107, 107, 107, 107, 107, 107, 107, 107, 107, 107, 107, 107, 107, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         "height":700,
         "name":"Tile Layer 1",
         "opacity":1,
         "type":"tilelayer",
         "visible":true,
         "width":32,
         "x":0,
         "y":0
        }],
 "nextobjectid":1,
 "orientation":"orthogonal",
 "renderorder":"right-down",
 "tileheight":28,
 "tilesets":[
        {
         "columns":10,
         "firstgid":1,
         "image":".\/tilesets\/shapesz.png",
         "imageheight":1736,
         "imagewidth":240,
         "margin":0,
         "name":"shapesz",
         "spacing":0,
         "terrains":[
                {
                 "name":"thingy",
                 "tile":-1
                }],
         "tilecount":620,
         "tileheight":28,
         "tiles":
            {
             "105":
                {
                 "terrain":[-1, 0, -1, -1]
                },
             "106":
                {
                 "terrain":[0, 0, -1, -1]
                },
             "107":
                {
                 "terrain":[0, -1, -1, -1]
                },
             "85":
                {
                 "terrain":[-1, -1, -1, 0]
                },
             "86":
                {
                 "terrain":[-1, -1, 0, 0]
                },
             "87":
                {
                 "terrain":[-1, -1, 0, -1]
                },
             "88":
                {
                 "terrain":[-1, 0, 0, 0]
                },
             "89":
                {
                 "terrain":[0, -1, 0, 0]
                },
             "95":
                {
                 "terrain":[-1, 0, -1, 0]
                },
             "96":
                {
                 "terrain":[0, 0, 0, 0]
                },
             "97":
                {
                 "terrain":[0, -1, 0, -1]
                },
             "98":
                {
                 "terrain":[0, 0, -1, 0]
                },
             "99":
                {
                 "terrain":[0, 0, 0, -1]
                }
            },
         "tilewidth":24
        }],
 "tilewidth":24,
 "version":1,
 "width":32
}
},{}]},{},[1]);
