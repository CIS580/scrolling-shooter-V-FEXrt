"use strict";

// Tilemap engine defined using the Module pattern
module.exports = exports = Hud;


function Hud(player, frame){
  this.frame = {
    size: {width: frame.width, height: frame.height},
    origin: {x: frame.x, y: frame.y}
  }
  this.player = player
}

Hud.prototype.render = function(ctx){
  ctx.save();
  ctx.translate(this.frame.origin.x, this.frame.origin.y);

  ctx.fillStyle = 'green';
  ctx.fillRect(0, 0, this.frame.size.width, this.frame.size.height);

  ctx.fillStyle = 'black';
  ctx.font="20px Georgia";
  ctx.fillText("Hello World!",10,20);

  ctx.restore();
}
