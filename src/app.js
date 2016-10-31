"use strict";

window.debug = false;

/* Classes and Libraries */
const Game = require('./game');
const Vector = require('./vector');
const Camera = require('./camera');
const Player = require('./player');
const EntitySpawner = require('./entity_spawner')
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
var entitySpawner = new EntitySpawner(entityManager, player);

var tilemaps = [];
var hud = new Hud(player, {x: 768, y: 0, width: canvas.width - 768, height: canvas.height});

window.camera = camera;
window.input = input;

entityManager.addEntity(player);

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
    case "p":
      game.pause(true);
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
  entitySpawner.update(elapsedTime);
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
