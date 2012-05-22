var http = require("http");

var fs = require("fs");
var data = {};
var filename;
var inc_items;

http.createServer(function (req, res)
{
  // console.log("request", req.method);
  // console.dir(req.headers);
  var url = require("url").parse(req.url);
  console.log("incoming", req.url);
  filename = "data" + url.path.replace(/\//g, "-") + ".json";
  var str = "";

  if (req.method === "POST")
  {
    req.on("data", function(chunk)
    {
      str += chunk;
    });
    req.on("end", function()
    {
      if (!data[filename])
        data[filename] = [];

      inc_items = JSON.parse(str);
    });
  }
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.end("");
}).listen(9001, "127.0.0.1");

var check_to_write_file = function()
{
  if (filename && inc_items)
  {
    // Open file for reading and writing. The file is created (if it does not exist) or truncated (if it exists).
    var open = fs.openSync(filename, "w+");
    data[filename] = data[filename].concat(inc_items);
    var writedata = "{\"events\":" + JSON.stringify(data[filename]) + "}";
    fs.writeFileSync(filename, writedata, "utf8");
    console.log("written", filename);
    inc_items = null;
    fs.closeSync(open);
  }
}
setInterval(check_to_write_file, 2000);

console.log("POST to http://127.0.0.1:9001/YOUR-FILENAME to write files");
