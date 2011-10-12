/**
 * @Constructor
 *
 * @param {Array} data The chart data. This is an array of objects, each
 * having the following properties:
 *  - 'amount': The amount of the total as an integer;
 *  - 'color': The color of the slice. If 'color' is missing, a
 *    random one will be generated;
 *  - 'data': Auxillary data to be returned from method calls.
 *
 * Example:
 *
 *   var data = [
 *     {amount: 120},
 *     {amount: 200, color: red},
 *     {amount: 30, data: {title: "I'm smaller"}}
 *   ];
 *   var chart = new Chart(data);
 */
var Chart = function(data)
{
  this._data = data || [];
};

/**
 * Return a random color in hex notation.
 */
Chart.prototype._generate_random_color = function()
{
  var hex_chars = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++)
  {
    color += hex_chars[Math.floor(Math.random() * hex_chars.length)];
  }
  return color;
};

/**
 * Return an object with the following properties:
 *  - 'size': The height and width in integers;
 *  - 'slices': An array of objects that has a 'path' and a 'color'
 *    property. The 'path' is the 'd' attribute of an SVG 'path' element;
 *  - 'data': Auxillary data that was passed to the constructor.
 *
 * This is kept general for use with templates.
 *
 * @param {int} size The size of the SVG document. Default is 200.
 *
 * @param {int} padding The padding around the pie chart. Default is 0.
 */
Chart.prototype.get_pie_chart = function(size, padding)
{
  padding || (padding = 0);
  var radius = size / 2;
  var center = radius + padding;
  size = (size || 200) + padding * 2;

  // Filter out negative values, they don't make sense in a pie chart
  this._data = this._data.filter(function(slice) {
    return slice.amount >= 0;
  });

  var total_amount = this._data.reduce(function(prev, curr) {
    return prev + curr.amount;
  }, 0);

  // Calculate angles
  this._data.forEach(function(slice) {
    slice.angle = (slice.amount * 360) / total_amount;
  });

  var start_angle = 0;
  var end_angle = -90;
  var slices = this._data.map(function(slice) {
    start_angle = end_angle;
    end_angle += slice.angle;

    var x1 = center + radius * Math.cos(Math.PI * start_angle / 180);
    var y1 = center + radius * Math.sin(Math.PI * start_angle / 180);
    var x2 = center + radius * Math.cos(Math.PI * end_angle / 180);
    var y2 = center + radius * Math.sin(Math.PI * end_angle / 180);
    var large_arc_flag = slice.angle > 180 ? 1 : 0;

    return {
      path: ["M", center, ",", center, // Start path
            " L", x1, ",", y1,         // Line
            " A", radius, ",", radius, " 0 ", large_arc_flag, ",1 ", x2, ",", y2, // Arc
            " Z"].join(""),            // End path
      color: slice.color || this._generate_random_color(),
      data: slice.data
    };
  }, this);

  return {
    size: size,
    slices: slices
  };
};

