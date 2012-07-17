CanvasRenderingContext2D.prototype.draw_2d_gradient = function(top_color_list,
                                                               bottom_color_list,
                                                               flip)
{
  if (typeof bottom_color_list == "boolean")
  {
    flip = bottom_color_list;
    bottom_color_list = null;
  }

  if (!this._src_canvas)
  {
    this._src_canvas = document.createElement("canvas");
    this._src_ctx = this._src_canvas.getContext("2d");
  }
  var width = this._src_canvas.width = this.canvas.width;
  var height = this._src_canvas.height = this.canvas.height;
  var set_stop = function(color, index, list)
  {
    this.addColorStop((1 / (list.length - 1 || 1)) * index, color);
  };
  var lg = flip
         ? this._src_ctx.createLinearGradient(0, 0, 0, height)
         : this._src_ctx.createLinearGradient(0, 0, width, 0);
  this._src_ctx.clearRect(0, 0, width, height);
  top_color_list.forEach(set_stop, lg);
  this._src_ctx.fillStyle = lg;
  this._src_ctx.globalCompositeOperation = "source-over";
  this._src_ctx.fillRect(0, 0, width, height);
  this.drawImage(this._src_canvas, 0, 0);
  if (bottom_color_list)
  {
    this._src_ctx.clearRect(0, 0, width, height);
    lg = flip
         ? this._src_ctx.createLinearGradient(0, 0, width, 0)
         : this._src_ctx.createLinearGradient(0, 0, 0, height);
    lg.addColorStop(0, "hsla(0, 0%, 0%, 0)");
    lg.addColorStop(1, "hsla(0, 0%, 0%, 1)");
    this._src_ctx.fillStyle = lg;
    this._src_ctx.fillRect(0, 0, width, height);
    this._src_ctx.globalCompositeOperation = "source-in";
    lg = flip
         ? this._src_ctx.createLinearGradient(0, 0, 0, height)
         : this._src_ctx.createLinearGradient(0, 0, width, 0);
    bottom_color_list.forEach(set_stop, lg);
    this._src_ctx.fillStyle = lg;
    this._src_ctx.fillRect(0, 0, width, height);
    this.drawImage(this._src_canvas, 0, 0);
  }
};
