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
  ctx.fillText("Tyrian", centerX, 373);
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
