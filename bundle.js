(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/* Classes and Libraries */
const Game = require('./game');
const Vector = require('./vector');
const Camera = require('./camera');
const Player = require('./player');
const BulletPool = require('./bullet_pool');
const Tilemap = require('./tilemap');
const mapdata = require('../tilemaps/background1.json');


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
var bullets = new BulletPool(10);
var missiles = [];
var player = new Player(bullets, missiles);
var tilemap = new Tilemap(mapdata, canvas, true, {
  onload: function() {
    masterLoop(performance.now());
  }
});

/*
var top = new Image()
top.src = 'assets/Levels/Level2/topground.png';
var mid = new Image()
mid.src = 'assets/Levels/Level2/middleground.png';
var back = new Image()
back.src = 'assets/Levels/Level2/background.png';
*/

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
    case "f":
      player.fireBullet();
      event.preventDefault();
      break;
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

  // update the player
  player.update(elapsedTime, input);

  // update the camera
  camera.update(player.position);

  tilemap.moveTo({x:0, y: camera.y});

  // Update bullets
  bullets.update(elapsedTime, function(bullet){
    if(!camera.onScreen(bullet)) return true;
    return false;
  });

  // Update missiles
  var markedForRemoval = [];
  missiles.forEach(function(missile, i){
    missile.update(elapsedTime);
    if(Math.abs(missile.position.x - camera.x) > camera.width * 2)
      markedForRemoval.unshift(i);
  });
  // Remove missiles that have gone off-screen
  markedForRemoval.forEach(function(index){
    missiles.splice(index, 1);
  });
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

/*
  // TODO: Render background
  ctx.drawImage(
    // image
    back,
    // source rectangle
    0, camera.y, back.width, canvas.height,
    // destination rectangle
    0, 0, back.width, canvas.height
  );
  ctx.drawImage(
    // image
    mid,
    // source rectangle
    0, camera.y * (5/3), mid.width, canvas.height,
    // destination rectangle
    0, 0, mid.width, canvas.height
  );
  ctx.drawImage(
    // image
    top,
    // source rectangle
    0, camera.y * (7/3), top.width, canvas.height,
    // destination rectangle
    0, 0, top.width, canvas.height
  );
*/

  tilemap.render(ctx);
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
  renderGUI(elapsedTime, ctx);
}

/**
  * @function renderWorld
  * Renders the entities in the game world
  * IN WORLD COORDINATES
  * @param {DOMHighResTimeStamp} elapsedTime
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function renderWorld(elapsedTime, ctx) {
    // Render the bullets
    bullets.render(elapsedTime, ctx);

    // Render the missiles
    missiles.forEach(function(missile) {
      missile.render(elapsedTime, ctx);
    });

    // Render the player
    player.render(elapsedTime, ctx);
}

/**
  * @function renderGUI
  * Renders the game's GUI IN SCREEN COORDINATES
  * @param {DOMHighResTimeStamp} elapsedTime
  * @param {CanvasRenderingContext2D} ctx
  */
function renderGUI(elapsedTime, ctx) {
  // TODO: Render the GUI
}

},{"../tilemaps/background1.json":8,"./bullet_pool":2,"./camera":3,"./game":4,"./player":5,"./tilemap":6,"./vector":7}],2:[function(require,module,exports){
"use strict";

/**
 * @module BulletPool
 * A class for managing bullets in-game
 * We use a Float32Array to hold our bullet info,
 * as this creates a single memory buffer we can
 * iterate over, minimizing cache misses.
 * Values stored are: positionX, positionY, velocityX,
 * velocityY in that order.
 */
module.exports = exports = BulletPool;

/**
 * @constructor BulletPool
 * Creates a BulletPool of the specified size
 * @param {uint} size the maximum number of bullets to exits concurrently
 */
function BulletPool(maxSize) {
  this.pool = new Float32Array(4 * maxSize);
  this.end = 0;
  this.max = maxSize;
}

/**
 * @function add
 * Adds a new bullet to the end of the BulletPool.
 * If there is no room left, no bullet is created.
 * @param {Vector} position where the bullet begins
 * @param {Vector} velocity the bullet's velocity
*/
BulletPool.prototype.add = function(position, velocity) {
  if(this.end < this.max) {
    this.pool[4*this.end] = position.x;
    this.pool[4*this.end+1] = position.y;
    this.pool[4*this.end+2] = velocity.x;
    this.pool[4*this.end+3] = velocity.y;
    this.end++;
  }
}

/**
 * @function update
 * Updates the bullet using its stored velocity, and
 * calls the callback function passing the transformed
 * bullet.  If the callback returns true, the bullet is
 * removed from the pool.
 * Removed bullets are replaced with the last bullet's values
 * and the size of the bullet array is reduced, keeping
 * all live bullets at the front of the array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {function} callback called with the bullet's position,
 * if the return value is true, the bullet is removed from the pool
 */
BulletPool.prototype.update = function(elapsedTime, callback) {
  for(var i = 0; i < this.end; i++){
    // Move the bullet
    this.pool[4*i] += this.pool[4*i+2];
    this.pool[4*i+1] += this.pool[4*i+3];
    // If a callback was supplied, call it
    if(callback && callback({
      x: this.pool[4*i],
      y: this.pool[4*i+1]
    })) {
      // Swap the current and last bullet if we
      // need to remove the current bullet
      this.pool[4*i] = this.pool[4*(this.end-1)];
      this.pool[4*i+1] = this.pool[4*(this.end-1)+1];
      this.pool[4*i+2] = this.pool[4*(this.end-1)+2];
      this.pool[4*i+3] = this.pool[4*(this.end-1)+3];
      // Reduce the total number of bullets by 1
      this.end--;
      // Reduce our iterator by 1 so that we update the
      // freshly swapped bullet.
      i--;
    }
  }
}

/**
 * @function render
 * Renders all bullets in our array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
BulletPool.prototype.render = function(elapsedTime, ctx) {
  // Render the bullets as a single path
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "white";
  for(var i = 0; i < this.end; i++) {
    ctx.moveTo(this.pool[4*i], this.pool[4*i+1]);
    ctx.arc(this.pool[4*i], this.pool[4*i+1], 2, 0, 2*Math.PI);
  }
  ctx.fill();
  ctx.restore();
}

},{}],3:[function(require,module,exports){
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

},{"./vector":7}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
"use strict";

/* Classes and Libraries */
const Vector = require('./vector');
//const Missile = require('./missile');

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
 * @param {BulletPool} bullets the bullet pool
 */
function Player(bullets, missiles) {
  this.missiles = missiles;
  this.missileCount = 4;
  this.bullets = bullets;
  this.angle = 0;
  this.position = {x: 200, y: 8375};
  this.velocity = {x: 0, y: 0};
  this.img = new Image()
  this.img.src = 'tilesets/tyrian.shp.007D3C.png';
}

/**
 * @function update
 * Updates the player based on the supplied input
 * @param {DOMHighResTimeStamp} elapedTime
 * @param {Input} input object defining input, must have
 * boolean properties: up, left, right, down
 */
Player.prototype.update = function(elapsedTime, input) {

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
  if(this.position.y > 8375) this.position.y = 8375; // TODO: this number need to match actual height
  if(this.position.y < 672/2) this.position.y = 672/2;
}

/**
 * @function render
 * Renders the player helicopter in world coordinates
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
Player.prototype.render = function(elapasedTime, ctx) {
  var offset = this.angle * 23;
  ctx.save();
  ctx.translate(this.position.x, this.position.y);
  ctx.drawImage(this.img, 48+offset, 57, 23, 27, -12.5, -12, 23, 27);
  ctx.restore();
}

/**
 * @function fireBullet
 * Fires a bullet
 * @param {Vector} direction
 */
Player.prototype.fireBullet = function() {
  var position = this.position; //Vector.add(this.position, {x:30, y:30});
  var velocity = Vector.scale(Vector.normalize({x: 0, y: -1}), BULLET_SPEED);
  this.bullets.add(position, velocity);
}

/**
 * @function fireMissile
 * Fires a missile, if the player still has missiles
 * to fire.
 */
Player.prototype.fireMissile = function() {
  if(this.missileCount > 0){
    var position = Vector.add(this.position, {x:0, y:30})
    var missile = new Missile(position);
    this.missiles.push(missile);
    this.missileCount--;
  }
}

},{"./vector":7}],6:[function(require,module,exports){
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
    this.draw.offset.x = position.x - this.draw.origin.x * this.tileWidth
    this.draw.offset.y = position.y - this.draw.origin.y * this.tileHeight
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

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
module.exports={ "height":300,
 "layers":[
        {
         "data":[25, 331, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 333, 25, 25, 331, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 333, 25, 25, 331, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 333, 25, 25, 331, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 325, 343, 25, 25, 341, 324, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 325, 375, 353, 25, 25, 351, 374, 324, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 325, 375, 385, 363, 25, 25, 361, 384, 374, 324, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 325, 375, 385, 363, 25, 25, 25, 25, 361, 384, 374, 324, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 325, 375, 385, 363, 25, 25, 25, 25, 25, 25, 361, 384, 374, 324, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 332, 325, 375, 385, 363, 25, 25, 25, 25, 25, 25, 25, 25, 361, 384, 374, 326, 326, 326, 326, 326, 326, 326, 324, 332, 332, 325, 326, 326, 326, 326, 326, 326, 375, 385, 363, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 361, 384, 336, 336, 336, 336, 336, 336, 336, 334, 332, 332, 335, 336, 336, 336, 336, 336, 336, 385, 363, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 361, 346, 346, 346, 346, 346, 346, 346, 344, 332, 332, 335, 346, 346, 346, 346, 346, 346, 363, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 331, 332, 332, 345, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 321, 322, 323, 25, 25, 25, 25, 25, 25, 25, 25, 25, 341, 326, 326, 343, 25, 25, 25, 25, 25, 25, 25, 25, 25, 321, 322, 323, 25, 25, 25, 25, 331, 332, 333, 25, 25, 25, 25, 25, 25, 25, 25, 25, 351, 336, 336, 353, 25, 25, 25, 25, 25, 25, 25, 25, 25, 331, 332, 333, 25, 25, 25, 25, 341, 342, 343, 25, 25, 25, 25, 25, 25, 25, 25, 25, 361, 346, 346, 363, 25, 25, 25, 25, 25, 25, 25, 25, 25, 341, 342, 343, 25, 25, 25, 25, 351, 352, 353, 321, 322, 323, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 321, 322, 323, 351, 352, 353, 25, 25, 25, 25, 361, 362, 363, 331, 332, 333, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 331, 332, 333, 361, 362, 363, 25, 25, 25, 25, 25, 25, 25, 341, 342, 343, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 341, 342, 343, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 351, 352, 353, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 351, 352, 353, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 361, 362, 363, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 361, 362, 363, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 321, 322, 323, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 321, 322, 323, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 331, 332, 333, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 331, 332, 333, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 341, 342, 343, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 341, 342, 343, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 351, 352, 353, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 351, 352, 353, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 361, 362, 363, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 361, 362, 363, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 321, 322, 323, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 321, 322, 323, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 331, 332, 333, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 331, 332, 333, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 341, 342, 343, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 341, 342, 343, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 351, 352, 353, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 351, 352, 353, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 361, 362, 363, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 361, 362, 363, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 7, 7, 7, 7, 7, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 9, 17, 17, 17, 17, 17, 17, 10, 7, 7, 7, 7, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 7, 7, 9, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 9, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 9, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 10, 7, 8, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 26, 27, 27, 27, 27, 27, 19, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 27, 19, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 27, 19, 17, 17, 17, 17, 17, 17, 20, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 321, 322, 323, 25, 25, 25, 16, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 331, 332, 333, 25, 25, 25, 16, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 1, 2, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 341, 342, 343, 25, 25, 25, 16, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 1, 4, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 351, 352, 353, 25, 25, 25, 16, 17, 17, 17, 17, 18, 25, 25, 25, 25, 1, 4, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 361, 362, 363, 25, 25, 6, 9, 17, 17, 17, 17, 18, 25, 25, 25, 25, 11, 12, 12, 15, 23, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 18, 25, 25, 25, 1, 4, 12, 12, 13, 25, 25, 25, 25, 25, 25, 6, 7, 7, 7, 7, 7, 7, 8, 25, 25, 25, 16, 17, 17, 17, 17, 17, 18, 25, 1, 2, 4, 12, 12, 12, 5, 3, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 10, 7, 7, 7, 9, 17, 17, 17, 17, 17, 18, 1, 4, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 26, 27, 27, 27, 27, 27, 19, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 11, 12, 12, 15, 14, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 27, 27, 19, 17, 17, 17, 17, 17, 17, 17, 18, 21, 22, 22, 23, 11, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 1, 2, 2, 2, 2, 2, 3, 25, 26, 27, 19, 17, 17, 17, 17, 17, 10, 8, 25, 25, 25, 11, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 5, 2, 3, 25, 16, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 21, 14, 12, 15, 23, 25, 25, 25, 25, 1, 2, 4, 12, 12, 12, 12, 12, 12, 12, 13, 25, 26, 19, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 21, 22, 23, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 5, 3, 25, 26, 19, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 5, 3, 25, 26, 19, 17, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 26, 19, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 16, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 26, 19, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 5, 3, 25, 25, 25, 26, 19, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 16, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 16, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 6, 9, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 21, 22, 14, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 16, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 21, 22, 14, 12, 12, 12, 12, 12, 12, 12, 15, 23, 25, 25, 6, 9, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 16, 17, 17, 17, 17, 18, 25, 321, 322, 323, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 21, 14, 12, 12, 12, 12, 15, 22, 23, 25, 25, 25, 16, 17, 17, 17, 17, 18, 25, 331, 332, 333, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 21, 22, 22, 22, 22, 23, 25, 25, 25, 6, 7, 9, 17, 17, 17, 20, 28, 25, 341, 342, 343, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 7, 7, 7, 9, 17, 17, 17, 17, 17, 18, 25, 25, 351, 352, 353, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 361, 362, 363, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 7, 9, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 321, 322, 323, 25, 6, 9, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 331, 332, 333, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 10, 7, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 341, 342, 343, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 25, 351, 352, 353, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 361, 362, 363, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 20, 27, 27, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 20, 27, 27, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 17, 20, 27, 27, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 20, 27, 27, 27, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 1, 2, 2, 3, 1, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 18, 25, 25, 25, 1, 2, 2, 2, 2, 2, 2, 2, 2, 4, 12, 12, 5, 4, 5, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 20, 28, 25, 25, 1, 4, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 5, 3, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 18, 25, 25, 1, 4, 327, 328, 328, 328, 329, 12, 12, 12, 12, 12, 327, 329, 12, 12, 12, 12, 5, 3, 25, 25, 25, 25, 25, 25, 25, 16, 17, 18, 25, 1, 4, 12, 337, 338, 338, 338, 338, 329, 12, 12, 12, 12, 347, 349, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 16, 17, 18, 25, 11, 12, 12, 347, 340, 338, 338, 338, 338, 329, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 16, 17, 18, 25, 11, 12, 12, 12, 347, 340, 338, 338, 338, 339, 12, 12, 12, 12, 12, 327, 329, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 16, 17, 18, 25, 11, 12, 12, 12, 12, 347, 340, 338, 338, 339, 12, 12, 12, 12, 12, 347, 349, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 16, 17, 10, 8, 11, 12, 12, 327, 329, 12, 347, 348, 348, 349, 15, 22, 22, 14, 12, 12, 12, 12, 12, 12, 5, 3, 25, 25, 25, 25, 25, 25, 16, 17, 17, 18, 21, 14, 12, 347, 349, 12, 12, 12, 15, 22, 23, 25, 1, 4, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 16, 17, 17, 18, 25, 11, 12, 12, 12, 12, 12, 15, 23, 25, 25, 25, 11, 12, 12, 12, 12, 327, 328, 329, 12, 13, 25, 25, 25, 25, 25, 25, 16, 17, 17, 18, 25, 21, 22, 22, 22, 22, 22, 23, 25, 25, 25, 1, 4, 12, 12, 12, 12, 337, 338, 339, 12, 13, 25, 25, 25, 25, 25, 25, 16, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 1, 4, 12, 12, 12, 12, 12, 347, 348, 349, 12, 13, 25, 25, 25, 25, 25, 25, 16, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 25, 1, 4, 12, 12, 12, 12, 12, 12, 12, 12, 12, 15, 23, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 11, 12, 327, 328, 329, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 11, 12, 337, 338, 339, 12, 327, 329, 12, 12, 12, 13, 25, 25, 25, 321, 322, 25, 25, 16, 17, 17, 17, 17, 17, 10, 7, 7, 8, 25, 25, 25, 11, 12, 347, 348, 349, 12, 347, 349, 12, 12, 15, 23, 25, 25, 25, 331, 332, 25, 25, 26, 27, 27, 19, 17, 17, 17, 17, 17, 18, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 15, 23, 25, 25, 25, 25, 341, 342, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 17, 10, 8, 25, 25, 21, 14, 12, 12, 12, 12, 12, 12, 15, 23, 25, 25, 25, 25, 25, 351, 352, 25, 25, 25, 25, 25, 25, 26, 27, 19, 17, 17, 17, 18, 25, 25, 25, 21, 22, 22, 22, 22, 22, 22, 23, 25, 25, 25, 25, 25, 25, 361, 362, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 321, 322, 323, 25, 16, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 331, 332, 333, 25, 16, 17, 17, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 341, 342, 343, 25, 16, 17, 17, 17, 17, 17, 10, 7, 7, 7, 7, 7, 7, 7, 7, 7, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 351, 352, 353, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 361, 362, 363, 6, 9, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 9, 17, 17, 17, 17, 17, 17, 20, 27, 27, 27, 27, 27, 27, 19, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 20, 27, 27, 28, 25, 25, 25, 25, 25, 25, 26, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 20, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 20, 28, 25, 25, 1, 2, 2, 2, 2, 3, 25, 25, 25, 1, 2, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 18, 25, 25, 25, 11, 12, 12, 12, 12, 5, 3, 25, 25, 11, 12, 5, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 18, 25, 25, 25, 11, 12, 12, 12, 12, 12, 5, 2, 2, 4, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 10, 8, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 18, 25, 25, 21, 22, 22, 14, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 10, 8, 25, 25, 25, 25, 21, 22, 14, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 10, 8, 25, 25, 25, 25, 25, 21, 22, 22, 22, 22, 22, 22, 23, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 17, 17, 17, 17, 10, 8, 25, 25, 25, 321, 322, 323, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 17, 17, 17, 17, 10, 8, 25, 25, 331, 332, 333, 25, 25, 25, 25, 25, 6, 7, 7, 8, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 17, 17, 17, 17, 10, 8, 25, 341, 342, 343, 25, 25, 25, 25, 6, 9, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 17, 17, 17, 17, 18, 25, 351, 352, 353, 25, 25, 25, 6, 9, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 27, 27, 19, 17, 17, 17, 17, 18, 25, 361, 362, 363, 25, 25, 6, 9, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 10, 7, 8, 25, 25, 25, 6, 9, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 1, 2, 2, 3, 26, 27, 19, 17, 17, 17, 10, 8, 25, 25, 16, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 13, 25, 25, 26, 27, 19, 17, 17, 10, 7, 7, 9, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 5, 2, 3, 25, 25, 26, 27, 19, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 5, 3, 25, 25, 25, 26, 27, 19, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 21, 14, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 5, 3, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 1, 2, 4, 12, 12, 12, 12, 12, 13, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 1, 2, 4, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 15, 22, 22, 22, 22, 22, 23, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 21, 22, 22, 22, 23, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 7, 7, 8, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 20, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 7, 7, 7, 9, 17, 17, 17, 10, 7, 8, 25, 25, 25, 16, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 321, 322, 323, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 10, 7, 8, 6, 9, 17, 17, 20, 27, 28, 25, 25, 25, 25, 25, 25, 331, 332, 333, 25, 25, 26, 27, 19, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 10, 9, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 341, 342, 343, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 20, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 351, 352, 353, 25, 25, 6, 7, 9, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 361, 362, 363, 25, 25, 16, 17, 17, 17, 17, 17, 20, 27, 27, 27, 19, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 20, 27, 27, 27, 28, 25, 25, 25, 16, 17, 17, 17, 17, 17, 18, 25, 25, 1, 2, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 18, 25, 25, 321, 322, 323, 25, 25, 16, 17, 17, 17, 17, 20, 28, 25, 25, 11, 12, 5, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 27, 28, 25, 25, 331, 332, 333, 25, 25, 16, 17, 17, 17, 17, 18, 25, 25, 25, 11, 12, 12, 5, 2, 2, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 341, 342, 343, 25, 6, 9, 17, 17, 17, 17, 18, 1, 2, 2, 4, 12, 12, 12, 12, 12, 5, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 351, 352, 353, 25, 16, 17, 17, 17, 17, 20, 28, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 361, 362, 363, 25, 16, 17, 17, 17, 20, 28, 25, 11, 12, 12, 12, 12, 12, 12, 12, 15, 22, 23, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 18, 25, 25, 11, 12, 12, 12, 12, 12, 12, 15, 23, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 18, 25, 25, 11, 12, 12, 12, 12, 15, 22, 23, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 18, 25, 25, 21, 14, 12, 15, 22, 23, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 18, 25, 25, 25, 21, 22, 23, 25, 25, 25, 25, 25, 6, 7, 7, 7, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 10, 8, 25, 25, 25, 6, 7, 7, 7, 8, 6, 7, 9, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 10, 7, 7, 7, 9, 17, 17, 17, 10, 9, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 9, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 20, 27, 27, 27, 27, 27, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 20, 27, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 9, 17, 17, 17, 17, 17, 17, 17, 17, 17, 20, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 20, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 17, 20, 27, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 20, 27, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 20, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 20, 27, 28, 25, 25, 25, 25, 25, 1, 2, 2, 2, 2, 2, 2, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 18, 25, 25, 25, 25, 25, 1, 2, 4, 12, 12, 12, 12, 12, 12, 5, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 18, 25, 25, 1, 2, 2, 4, 12, 12, 327, 328, 328, 328, 329, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 18, 25, 25, 11, 12, 327, 328, 329, 12, 337, 338, 338, 338, 338, 329, 12, 5, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 18, 25, 25, 11, 12, 337, 338, 339, 12, 337, 338, 338, 338, 338, 338, 329, 12, 5, 2, 2, 2, 3, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 18, 25, 25, 11, 12, 337, 338, 339, 12, 337, 338, 338, 338, 338, 338, 338, 329, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 10, 8, 25, 11, 12, 347, 348, 349, 12, 347, 348, 340, 338, 338, 338, 338, 338, 329, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 10, 8, 21, 22, 22, 22, 22, 22, 14, 12, 337, 338, 338, 338, 338, 338, 338, 329, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 18, 25, 25, 25, 25, 25, 25, 11, 12, 337, 338, 338, 338, 338, 338, 338, 338, 329, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 10, 7, 8, 25, 25, 25, 25, 11, 12, 337, 338, 338, 338, 338, 338, 338, 338, 360, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 18, 25, 25, 25, 25, 11, 12, 347, 340, 338, 338, 338, 338, 338, 338, 339, 15, 23, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 10, 8, 25, 25, 25, 11, 12, 12, 347, 348, 348, 348, 348, 348, 348, 349, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 10, 7, 8, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 10, 8, 21, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 10, 7, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 17, 17, 17, 17, 17, 10, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 20, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 19, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 27, 27, 27, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 1, 2, 2, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 1, 2, 4, 12, 12, 5, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 5, 3, 25, 25, 25, 25, 321, 322, 323, 25, 25, 25, 25, 16, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 331, 332, 333, 25, 25, 25, 25, 16, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 341, 342, 343, 25, 25, 25, 6, 9, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 21, 14, 12, 12, 12, 12, 12, 5, 3, 25, 25, 25, 351, 352, 353, 25, 25, 25, 16, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 361, 362, 363, 25, 25, 6, 9, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 21, 22, 22, 22, 22, 14, 12, 13, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 21, 22, 23, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 20, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 7, 9, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 17, 20, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 20, 27, 27, 28, 25, 25, 25, 1, 2, 2, 2, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 5, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 1, 2, 2, 4, 12, 12, 327, 329, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 347, 349, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 11, 12, 327, 328, 329, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 1, 4, 12, 337, 338, 339, 12, 12, 12, 5, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 11, 12, 12, 347, 348, 349, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 21, 14, 12, 12, 12, 12, 327, 328, 329, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 11, 12, 327, 329, 12, 337, 338, 339, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 21, 14, 347, 349, 12, 347, 348, 349, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 21, 22, 14, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 6, 7, 7, 7, 7, 8, 16, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 21, 22, 22, 22, 22, 22, 23, 25, 25, 25, 25, 16, 17, 17, 17, 17, 10, 9, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 8, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 6, 7, 7, 7, 7, 7, 7, 7, 9, 17, 18, 25, 25, 25, 25, 26, 27, 27, 19, 17, 17, 17, 17, 17, 17, 17, 18, 25, 6, 7, 7, 7, 9, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 26, 27, 27, 19, 17, 17, 17, 17, 10, 7, 9, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 20, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 27, 19, 17, 17, 17, 17, 17, 17, 20, 19, 17, 17, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 20, 27, 28, 26, 27, 27, 27, 27, 27, 27, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 321, 322, 323, 25, 25, 25, 25, 16, 17, 17, 20, 28, 25, 25, 25, 25, 1, 2, 2, 2, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 331, 332, 333, 25, 25, 25, 25, 16, 17, 20, 28, 25, 25, 25, 25, 25, 11, 12, 12, 12, 5, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 341, 342, 343, 25, 25, 25, 25, 16, 17, 18, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 351, 352, 353, 25, 25, 25, 6, 9, 17, 18, 25, 25, 25, 25, 25, 25, 21, 14, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 361, 362, 363, 25, 25, 25, 16, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 21, 22, 14, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 9, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 21, 22, 23, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 9, 17, 17, 20, 27, 19, 17, 10, 7, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 20, 27, 28, 25, 26, 19, 17, 17, 10, 7, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 27, 27, 28, 25, 25, 25, 25, 26, 19, 17, 17, 17, 10, 7, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 27, 19, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 1, 2, 3, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 10, 7, 7, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 1, 4, 12, 5, 2, 2, 2, 2, 3, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 15, 23, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 10, 7, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 5, 3, 25, 25, 25, 26, 19, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 21, 14, 12, 15, 14, 12, 12, 12, 13, 25, 25, 25, 25, 26, 19, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 21, 22, 23, 11, 12, 12, 15, 23, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 13, 25, 25, 25, 25, 6, 7, 7, 9, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 15, 23, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 1, 2, 2, 2, 2, 2, 4, 12, 13, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 17, 17, 20, 27, 28, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 15, 22, 23, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 1, 4, 12, 15, 22, 22, 22, 23, 25, 25, 25, 25, 25, 26, 27, 27, 19, 17, 17, 17, 17, 20, 28, 25, 1, 3, 25, 25, 25, 25, 25, 25, 11, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 20, 27, 28, 1, 2, 4, 5, 3, 25, 25, 25, 25, 25, 21, 22, 22, 23, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 9, 17, 20, 28, 25, 25, 11, 15, 22, 22, 23, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 7, 7, 7, 9, 17, 17, 17, 18, 1, 2, 2, 4, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 7, 9, 17, 17, 17, 17, 17, 20, 19, 17, 18, 11, 12, 327, 329, 5, 2, 2, 3, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 20, 28, 26, 27, 28, 21, 14, 347, 349, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 10, 8, 25, 25, 25, 25, 21, 22, 22, 22, 22, 22, 23, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 17, 17, 10, 7, 7, 7, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 27, 19, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 1, 2, 2, 2, 2, 2, 3, 25, 25, 25, 26, 19, 17, 17, 20, 19, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 5, 3, 25, 25, 25, 26, 27, 27, 28, 26, 27, 19, 17, 10, 7, 7, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 5, 2, 2, 2, 2, 2, 3, 25, 25, 25, 26, 19, 17, 17, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 5, 3, 25, 25, 25, 26, 27, 19, 17, 17, 17, 10, 7, 8, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 15, 22, 22, 22, 22, 22, 23, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 1, 4, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 5, 3, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 21, 14, 12, 12, 12, 12, 12, 12, 12, 12, 13, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 21, 22, 14, 12, 15, 22, 22, 22, 22, 23, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 10, 8, 25, 25, 25, 25, 25, 25, 25, 21, 22, 23, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 7, 7, 9, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 9, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 27, 27, 27, 19, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 1, 3, 25, 25, 25, 25, 25, 26, 27, 27, 19, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 1, 2, 4, 5, 3, 25, 25, 25, 25, 25, 25, 25, 26, 19, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 12, 5, 2, 2, 2, 3, 25, 25, 25, 25, 26, 19, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 1, 2, 2, 3, 21, 14, 12, 12, 12, 327, 329, 12, 5, 3, 25, 25, 25, 25, 16, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 5, 3, 21, 22, 14, 12, 347, 349, 12, 12, 13, 25, 25, 25, 25, 16, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 21, 14, 12, 12, 13, 25, 1, 4, 12, 12, 15, 22, 22, 23, 25, 25, 25, 25, 16, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 15, 22, 23, 25, 11, 12, 327, 329, 5, 3, 25, 25, 25, 25, 25, 6, 9, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 21, 23, 25, 25, 25, 21, 14, 347, 349, 15, 23, 25, 25, 25, 25, 25, 16, 17, 20, 28, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 11, 12, 12, 13, 25, 25, 25, 25, 25, 25, 16, 17, 10, 8, 25, 25, 321, 322, 323, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 21, 14, 12, 5, 2, 2, 3, 25, 25, 25, 16, 17, 17, 18, 25, 25, 331, 332, 333, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 21, 22, 22, 22, 22, 23, 25, 25, 6, 9, 17, 17, 18, 25, 25, 341, 342, 343, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 6, 7, 9, 17, 20, 27, 28, 25, 25, 351, 352, 353, 25, 25, 25, 25, 25, 25, 6, 7, 8, 25, 25, 25, 25, 25, 6, 7, 7, 7, 7, 7, 9, 17, 17, 20, 28, 25, 25, 25, 25, 361, 362, 363, 25, 25, 25, 25, 25, 25, 16, 17, 10, 7, 7, 7, 7, 7, 9, 17, 17, 17, 17, 17, 17, 17, 17, 10, 7, 7, 7, 7, 8, 25, 25, 25, 25, 25, 25, 25, 25, 25, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 18, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 28, 25, 25, 25],
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
},{}]},{},[1]);
