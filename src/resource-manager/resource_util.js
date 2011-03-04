window.cls = window.cls || {};
cls.ResourceUtil = {}
/**
 * Utility class with static members and methods for the resource and network
 * views.
 */


/**
 * Return a human readable string representation of n bytes
 */
cls.ResourceUtil.bytes_to_human_readable = function(bytes)
{
  if (bytes >= 1048576) // megabytes
  {
    return "" + ((bytes / 1048576).toFixed(2)) + "MB";
  }
  else if (bytes >= 10240)
  {
    return "" + Math.ceil((bytes / 1024)) + "KB";
  }
  else
  {
    return "" + bytes + "B";
  }
}

/**
 * Return a human readable string representation of n millis
 */
cls.ResourceUtil.millis_to_human_readable = function(millis)
{
  if (millis > 10000) // > 10 seconds
  {
    return "" + ((millis / 1000).toFixed(1)) + "s";
  }
  else if (millis > 1000) // > 1 second
  {
    return "" + (millis / 1000).toFixed(2) + "s";
  }
  else
  {
    return "" + millis + "ms";
  }
}


/**
 * Common extensions mapped to generic type strings
 */
cls.ResourceUtil.extension_type_map = {
  png: "image",
  jpg: "image",
  bmp: "image",
  pcx: "image",
  ico: "image",
  jpeg: "image",

  oex: "extension",

  otf: "font",
  ttf: "font",
}

/**
 * Common mime types mapped to more generic strings
 */
cls.ResourceUtil.mime_type_map = {
  "text/html": "markup",
  "application/xhtml+xml": "markup",
  "application/mathml+xml": "markup",
  "application/xslt+xml": "markup",
  "text/xsl": "markup",
  "application/xml": "markup",

  "text/css": "css",

  "text/plain": "text",

  "application/x-javascript": "script",
  "application/javascript": "script",
  "text/javascript": "script",

  "image/png": "image",
  "image/gif": "image",
  "image/jpeg": "image",
  "image/x-icon": "image",
  "image/vnd.microsoft.icon": "image",
  "image/svg+xml": "image",
  "image/vnd.wap.wbmp": "image",

  "application/vnd.ms-fontobject": "font",
  "application/x-font-ttf": "font",
  "font/ttf": "font",
  "font/otf": "font",
  "font/opentype": "font",
  "application/x-woff": "font",

  "audio/mid": "audio",
  "audio/mpeg": "audio",
  "audio/ogg": "audio",
  "audio/vorbis": "audio",
  "audio/x-pn-realaudio": "audio",
  "audio/wav": "audio",
  "audio/x-wav": "audio",
  "audio/vnd.wave": "audio",
  "audio/x-ms-wax": "audio",
  "audio/x-ms-wma": "audio",

  "video/3gpp": "video",
  "video/x-matroska": "video",
  "video/mp4": "video",
  "video/mpeg": "video",
  "video/ogg": "video",
  "video/quicktime": "video",
  "video/webm": "video",
  "video/x-ms-wmv": "video",

  "application/json": "data",
  "application/rdf+xml": "data",
  "text/rdf+n3": "data",
  "application/x-turtle": "data",
  "text/turtle": "data",

  "application/atom+xml": "feed",
  "application/rss+xml": "feed",

  "application/pdf": "pdf",
  "application/postscript": "postscript",
  "application/x-shockwave-flash": "flash",
  "application/x-silverlight-app": "silverlight"
}

/**
 * Returns the most sensible way of getting this resource,
 * as datauri or string, based on the mime type.
 */
cls.ResourceUtil.mime_to_content_mode = function(mime)
{
  var type = cls.ResourceUtil.mime_to_type(mime);
  switch (type) {
    case "image":
    case "pdf":
    case "flash":
    case "font":
      return "datauri";
    case "markup":
    case "css":
    case "xml":
    case "script":
      return "text";
  }
  return "text";
}

cls.ResourceUtil.mime_to_type = function(mime, extension)
{
  return this.mime_type_map[mime];
}

cls.ResourceUtil.path_to_type = function(path)
{
  var extension = path.slice(path.lastIndexOf(".") + 1);
}

cls.ResourceUtil.url_path = function(url)
{
  if (!url) { return null; }
  var firstslash = url.replace("://", "xxx").indexOf("/");
  var querystart = url.indexOf("?");
  if (querystart == -1) { querystart = url.length; }
  var path = url.slice(firstslash, querystart);
  return path;
}

cls.ResourceUtil.url_filename = function(url)
{
  var path = cls.ResourceUtil.url_path(url);
  var lastslash = path.lastIndexOf("/");
  if (lastslash < 1) // 0 and -1 both mean there is no file name
  {
    return null;
  }
  else {
    return path.slice(lastslash+1);
  }
}

cls.ResourceUtil.url_host = function(url)
{
  if (!url) { return null; }
  var host = url.replace(/\w+?:\/\//, "");
  var firstslash = host.indexOf("/");
  host = host.slice(0, firstslash == -1 ? host.length : firstslash);
  return host;
}

cls.ResourceUtil.header_presets = [
  {name: "None", headers: ""},
  {name: "Chrome 9", headers:
    [
      "Accept: application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5",
      "Accept-Charset: ISO-8859-1,utf-8;q=0.7,*;q=0.3",
      "Accept-Encoding: gzip,deflate,sdch",
      "Accept-Language: en-GB,en-US;q=0.8,fr;q=0.6,en;q=0.4",
      "User-Agent: Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US) AppleWebKit/534.13 (KHTML, like Gecko) Chrome/9.0.597.98 Safari/534.13",
    ].join("\n")
  },
  {name: "Firefox 4 beta 11", headers:
    [
      "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Charset: ISO-8859-1,utf-8;q=0.7,*;q=0.7",
      "Accept-Encoding: gzip,deflate,sdch",
      "Accept-Language: en-gb,en;q=0.5",
      "Connection: keep-alive",
      "Keep-Alive: 115",
      "User-Agent: Mozilla/5.0 (Windows NT 6.0; rv:2.0b11) Gecko/20100101 Firefox/4.0b11",
    ].join("\n")
  },
  {name: "IE8 (compatibility mode)", headers:
    [
      "Accept: */*",
      "Accept-Encoding: gzip, deflate",
      "Accept-Language: en-gb",
      "Connection: Keep-Alive",
      "User-Agent: Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0; Trident/4.0; chromeframe; SLCC1; .NET CLR 2.0.50727; Media Center PC 5.0; MDDC; .NET CLR 3.5.30729; .NET CLR 1.1.4322; .NET CLR 3.0.30729; .NET4.0C)",
    ].join("\n")
  },
  {name: "IE8", headers:
    [
      "Accept: image/gif, image/jpeg, image/pjpeg, application/x-ms-application, application/vnd.ms-xpsdocument, application/xaml+xml, application/x-ms-xbap, application/x-shockwave-flash, */*",
      "Accept-Encoding: gzip, deflate",
      "Accept-Language: en-gb",
      "Connection: Keep-Alive",
      "User-Agent: Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; chromeframe; SLCC1; .NET CLR 2.0.50727; Media Center PC 5.0; MDDC; .NET CLR 3.5.30729; .NET CLR 1.1.4322; .NET CLR 3.0.30729; .NET4.0C)",
    ].join("\n")
  },
  {name: "IE9 platform preview", headers:
    [
      "Accept: text/html, application/xhtml+xml",
      "Accept-Encoding: gzip, deflate",
      "Accept-Language: en-gb",
      "Connection: Keep-Alive",
      "User-Agent: Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0)",
    ].join("\n")
  },
  {name: "Opera 11.01", headers:
    [
      "Accept: text/html, application/xml;q=0.9, application/xhtml+xml, image/png, image/jpeg, image/gif, image/x-xbitmap, */*;q=0.1",
      "Accept-Charset: iso-8859-1, utf-8, utf-16, *;q=0.1",
      "Accept-Encoding: deflate, gzip, x-gzip, identity, *;q=0",
      "Accept-Language: en-gb,en;q=0.9",
      "Connection: Keep-Alive, TE",
      "Keep-Alive: 115",
      "Transfer-Encoding: deflate, gzip, chunked, identity, trailers",
      "User-Agent: Opera/9.80 (Windows NT 6.0; U; en-GB) Presto/2.7.62 Version/11.01",
    ].join("\n")
  },
  {name: "Safari 5", headers:
    [
      "Accept: application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5",
      "Accept-Encoding: gzip, deflate",
      "Accept-Language: en-us",
      "Connection: keep-alive",
      "User-Agent: Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US) AppleWebKit/533.19.4 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4",
    ].join("\n")
  },
];
