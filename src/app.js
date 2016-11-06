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
const Summary = require('./summary');
const Tilemap = require('./tilemap');
const mapdataB1 = require('../tilemaps/background1.json');
const mapdataM1 = require('../tilemaps/middleground1.json');
const mapdataT1 = require('../tilemaps/topground1.json');
const mapdataB2 = require('../tilemaps/background2.json');
const mapdataM2 = require('../tilemaps/middleground2.json');
const mapdataT2 = require('../tilemaps/topground2.json');
const mapdataB3 = require('../tilemaps/background3.json');
const mapdataM3= require('../tilemaps/middleground3.json');
const mapdataT3 = require('../tilemaps/topground3.json');

/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var input = {
  up: false,
  down: false,
  left: false,
  right: false
}

var GameState = {
  Level1: 0,
  Level2: 1,
  Level3: 2,
  Dead: 3,
  Summary1: 4,
  Summary2: 5,
  Summary3: 6
}


var camera = new Camera(canvas);
var entityManager = new EntityManager();
var player = new Player(entityManager);
var entitySpawner = new EntitySpawner(entityManager, player);

var tilemaps = [];
var summary = new Summary("Placeholder", player, canvas);
var hud = new Hud(player, {x: 768, y: 0, width: canvas.width - 768, height: canvas.height});
var gameState = GameState.Level1;
var level = 0;

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

tilemaps.push(new Tilemap(mapdataB2, canvas, true, {
  onload: function() {
    startLevel();
  }
}));
tilemaps.push(new Tilemap(mapdataM2, canvas, true, {
  onload: function() {
    startLevel();
  }
}));
tilemaps.push(new Tilemap(mapdataT2, canvas, true, {
  onload: function() {
    startLevel();
  }
}));

tilemaps.push(new Tilemap(mapdataB3, canvas, true, {
  onload: function() {
    startLevel();
  }
}));
tilemaps.push(new Tilemap(mapdataM3, canvas, true, {
  onload: function() {
    startLevel();
  }
}));
tilemaps.push(new Tilemap(mapdataT3, canvas, true, {
  onload: function() {
    startLevel();
  }
}));

var mapCount = 9
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
  if(event.keyCode == 32 || event.keyCode == 16){
    event.preventDefault();

    if(gameState < GameState.Dead){
      player.fireBullet();
    }else if (gameState == GameState.Dead || gameState == GameState.Summary3){
      // reset everything
      player.reset();
      entityManager.reset();
      entityManager.addEntity(player);
      gameState = GameState.Level1;
      level = 0;
    }else{
      // move to next level
      entityManager.reset();
      entityManager.addEntity(player);
      player.levelUp();
      level = (level + 1) % 3;
      gameState -= 3;
    }
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

  if(gameState > GameState.Level3){
    summary.update(elapsedTime);
    return;
  }

  if(player.health <= 0){
    // Game over. Start new game
    summary = new Summary("Game Over", player, canvas);
    setTimeout(function(){gameState = GameState.Dead;}, 2000);
  }

  if(player.position.y <= 336){
    // Display summary. Prepare for next level.
    if(gameState == GameState.Level1){
      summary = new Summary("Level 1 Complete", player, canvas);
      gameState = GameState.Summary1;
    }
    if(gameState == GameState.Level2){
      summary = new Summary("Level 2 Complete", player, canvas);
      gameState = GameState.Summary2;
    }
    if(gameState == GameState.Level3){
      summary = new Summary("Game Complete", player, canvas);
      gameState = GameState.Summary3;
    }
    return;
  }

  // update the camera
  camera.update(player.position);

  var idx = level * 3;

  tilemaps[idx].moveTo({x:0, y: camera.y});
  tilemaps[idx + 1].moveTo({x:0, y: camera.y * (5/3)});
  tilemaps[idx + 2].moveTo({x:0, y: camera.y * (7/3)});

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

  var idx = level * 3;
  tilemaps[idx].render(ctx);
  tilemaps[idx + 1].render(ctx);
  tilemaps[idx + 2].render(ctx);

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

  if(gameState > GameState.Level3){
    summary.render(elapsedTime, ctx);
  }
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
