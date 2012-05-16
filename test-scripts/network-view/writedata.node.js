var http = require("http");

var fs = require("fs");
http.createServer(function (req, res)
{
  // console.log("request", req.method);
  // console.dir(req.headers);

  var filename = "data-" + Number(new Date()) + ".json";
  if (req.method === "POST")
  {
    var datastr = "";
    req.on("data", function(chunk)
    {
      datastr += chunk;
      // console.log("got data, now having ", datastr.length);
    });
    req.on("end", function()
    {
      // console.log("request done", datastr.length, "chars, writing", datastr.slice(0, 5) + "…" + datastr.slice(datastr.length - 5));
      fs.writeFile(filename, datastr, "utf8", function (err)
      {
        if (err)
        {
          console.log("error when writing file", err);
        }
        else
        {
          console.log("written", filename);
        }
      });
    });
  }
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.end("");
}).listen(9001, "127.0.0.1");

console.log("Please POST to http://127.0.0.1:9001/ to write files");
