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
