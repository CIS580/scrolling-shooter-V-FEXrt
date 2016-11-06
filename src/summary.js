"use strict";

module.exports = exports = Summary;

/**
 * @constructor Summary
 * Creates a Summary
 */
function Summary(title, player, canvas) {
  this.timer = 0;
  this.size = {width: canvas.width, height: canvas.height};
  this.title = title;
  this.player = player;
}

Summary.prototype.update = function(elapsedTime){
  this.timer += elapsedTime;
}

Summary.prototype.render = function(elapsedTime, ctx) {
  ctx.save();
  if(this.timer <= 1500){
    ctx.globalAlpha = (this.timer / 1500);
  }

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, this.size.width, this.size.height);

  ctx.fillStyle = 'green';
  ctx.font="50px Garamond";
  ctx.textAlign="center";

  var centerX = Math.floor(this.size.width / 2);
  var centerY = Math.floor(this.size.height /2);
  ctx.fillText(this.title, centerX, 50);

  ctx.font="30px Garamond";

  ctx.fillText("This Level", centerX / 4 * 3, 150);
  ctx.fillText("Total", centerX / 4 * 5, 150);

  ctx.fillRect(centerX / 4 * 3 - 75, 175, 150, 2);
  ctx.fillRect(centerX / 4 * 5 - 75, 175, 150, 2);

  ctx.fillText("Score", centerX / 4, 250);
  ctx.fillText("Time", centerX / 4, 350);

  ctx.fillText(this.player.score - this.player.previousScore, centerX / 4 * 3, 250);
  ctx.fillText(this.player.score, centerX / 4 * 5, 250);
  ctx.fillText(Math.floor((this.player.time - this.player.previousTime)/1000), centerX / 4 * 3, 350);
  ctx.fillText(Math.floor(this.player.time / 1000), centerX / 4 * 5, 350);

  ctx.font="25px Garamond";
  var text = (this.title == "Game Over" || this.title == "Game Complete") ? "play again" : "continue to the next level";
  ctx.fillText("Press space to " + text, centerX, 600);

  ctx.restore();
}
