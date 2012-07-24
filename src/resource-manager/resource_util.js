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
  var numformatter = String;
  if (window.helpers && window.helpers.pretty_print_number)
  {
    numformatter = window.helpers.pretty_print_number;
  }
  if (bytes >= 1048576) // megabytes
  {
    return "" + numformatter(Number(bytes / 1048576).toFixed(2)) + " MB";
  }
  else if (bytes >= 1024)
  {
    return "" + numformatter(Number(bytes / 1024).toFixed(2)) + " kB";
  }
  else
  {
    return "" + numformatter(bytes) + " B";
  }
}

/**
 * Common extensions mapped to generic type strings
 */
cls.ResourceUtil.extension_type_map = {

  html: "markup",
  xhtml: "markup",
  xml: "markup",
  xslt: "markup",
  xsl: "markup",
  wml: "markup",
  rss: "markup",

  png: "image",
  jpg: "image",
  bmp: "image",
  pcx: "image",
  ico: "image",
  jpeg: "image",
  gif: "image",

  oex: "extension",

  woff: "font",
  otf: "font",
  ttf: "font",

  txt: "text",

  css: "css",

  js: "script",
  es: "script",

  rss: "feed"
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
  "text/xml": "markup",
  "application/xml": "markup",
  "application/vnd.wap.xhtml+xml": "markup",

  "text/css": "css",

  "text/plain": "text",

  "application/x-javascript": "script",
  "application/javascript": "script",
  "text/javascript": "script",
  "application/json": "script",
  "text/json": "script",

  "image/png": "image",
  "image/gif": "image",
  "image/jpeg": "image",
  "image/x-icon": "image",
  "image/vnd.microsoft.icon": "image",
  "image/svg+xml": "image",
  "image/vnd.wap.wbmp": "image",

  "application/vnd.ms-fontobject": "font",
  "application/x-font-ttf": "font",
  "application/x-font-otf": "font",
  "application/x-font-woff": "font",
  "application/x-woff": "font",
  "font/opentype": "font",
  "font/ttf": "font",
  "font/otf": "font",
  "font/woff": "font", // not official, but seems to be common

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

cls.ResourceUtil.type_to_string_map = {
  "css": "CSS",
  "pdf": "PDF",
  "postscript": "PostScript"
};

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

cls.ResourceUtil.mime_to_type = function(mime)
{
  if (mime)
  {
    return this.mime_type_map[mime.contains(";") ?
                              mime.split(';')[0].trim() :
                              mime];
  }
}

cls.ResourceUtil.path_to_type = function(path)
{
  if (path)
  {
    var extension = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
    var query = extension.indexOf("?");
    if (query != -1)
      extension = extension.slice(0, query);
    var hash = extension.indexOf("#");
    if (hash != -1)
      extension = extension.slice(0, hash);
    return extension && this.extension_type_map[extension];
  }
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
  if (
    lastslash === -1 || // no slash or
    path === "/"        // the path _is_ a slash means there is no file name
  )
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
  {name: ui_strings.S_NETWORK_HEADER_OVERRIDES_PRESET_NONE, headers: ""},
  {name: "Chrome 18", headers:
    [
      "Connection: keep-alive",
      "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.142 Safari/535.19",
      "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Encoding: gzip,deflate,sdch",
      "Accept-Language: en-US,en;q=0.8",
      "Accept-Charset: ISO-8859-1,utf-8;q=0.7,*;q=0.3",
    ].join("\n")
  },
  {name: "Firefox 11", headers:
    [
      "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.7; rv:11.0) Gecko/20100101 Firefox/11.0",
      "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language: en-us,en;q=0.5",
      "Accept-Encoding: gzip,deflate",
      "Connection: keep-alive",
    ].join("\n")
  },
  {name: "Safari 5.1.5", headers:
    [
      "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/534.55.3 (KHTML, like Gecko) Version/5.1.5 Safari/534.55.3",
      "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language: en-us",
      "Accept-Encoding: gzip, deflate",
      "Connection: keep-alive",
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
  {name: "IE9", headers:
    [
      "Accept: text/html, application/xhtml+xml, */*",
      "Accept-Language: en-gb",
      "User-Agent: Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)",
      "Accept-Encoding: gzip, deflate",
      "Connection: Keep-Alive",
    ].join("\n")
  },
  {name: "Opera 11.62 on Windows", headers:
    [
      "Opera/9.80 (Windows NT 6.1; WOW64; U; en) Presto/2.10.229 Version/11.62",
      "Accept: text/html, application/xml;q=0.9, application/xhtml+xml, image/png, image/webp, image/jpeg, image/gif, image/x-xbitmap, */*;q=0.1",
      "Accept-Language: en-gb,en;q=0.9",
      "Accept-Encoding: gzip, deflate",
      "Connection: Keep-Alive",
    ].join("\n")
  },
  {name: "Opera 11.62 on Linux", headers:
    [
      "User-Agent: Opera/9.80 (X11; Linux x86_64; U; en) Presto/2.10.229 Version/11.62",
      "Accept: text/html, application/xml;q=0.9, application/xhtml+xml, image/png, image/webp, image/jpeg, image/gif, image/x-xbitmap, */*;q=0.1",
      "Accept-Language: en-gb,en;q=0.9",
      "Accept-Encoding: gzip, deflate",
      "Connection: Keep-Alive",
    ].join("\n")
  },
  {name: "Opera 11.62 on Mac OS", headers:
    [
      "User-Agent: Opera/9.80 (Macintosh; Intel Mac OS X 10.7.3; U; en) Presto/2.10.229 Version/11.62",
      "Accept: text/html, application/xml;q=0.9, application/xhtml+xml, image/png, image/webp, image/jpeg, image/gif, image/x-xbitmap, */*;q=0.1",
      "Accept-Language: en-gb,en;q=0.9",
      "Accept-Encoding: gzip, deflate",
      "Connection: Keep-Alive",
    ].join("\n")
  },
  {name: "Mobile Safari on iOS 5.1, iPhone", headers:
    [
      "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 5_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9B176 Safari/7534.48.3",
      "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language: en-us",
      "Accept-Encoding: gzip, deflate",
      "Connection: keep-alive",
    ].join("\n")
  },
  {name: "Mobile Safari on iOS 5.1, iPad", headers:
    [
      "User-Agent: Mozilla/5.0 (iPad; CPU OS 5_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9B176 Safari/7534.48.3",
      "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language: en-us",
      "Accept-Encoding: gzip, deflate",
      "Connection: keep-alive",
    ].join("\n")
  },
  {name: "Android 2.3.3 browser", headers:
    [
      "Connection: keep-alive",
      "Accept-Encoding: gzip",
      "Accept-Language: en-US",
      "x-wap-profile: http://wap.samsungmobile.com/uaprof/GT-I9100.xml",
      "User-Agent: Mozilla/5.0 (Linux; U; Android 2.3.3; en-us; GT-I9100 Build/GINGERBREAD) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1",
      "Accept: application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5",
      "Accept-Charset: utf-8, iso-8859-1, utf-16, *;q=0.7",
    ].join("\n")
  },
  {name: "Blackberry PlayBook 2.0 browser", headers:
    [
      "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Encoding: gzip,deflate",
      "Accept-Language: en-GB, en;q=0.8, en-GB, en;q=0.8",
      "User-Agent: Mozilla/5.0 (PlayBook; U; RIM Tablet OS 2.0.0; en-US) AppleWebKit/535.8+ (KHTML, like Gecko) Version/7.2.0.0 Safari/535.8+",
    ].join("\n")
  },
  {name: "Opera Mini 7.0.1 on iPhone", headers:
    [
      "User-Agent: Opera/9.80 (iPhone; Opera Mini/7.1.32694/27.1366; U; en) Presto/2.8.119 Version/11.10",
      "Accept: text/html, application/xml;q=0.9, application/xhtml+xml, image/png, image/webp, image/jpeg, image/gif, image/x-xbitmap, */*;q=0.1",
      "Accept-Language: en",
      "Accept-Encoding: gzip, deflate",
      "Connection: Keep-Alive",
      "X-OperaMini-Features: advanced, download, file_system, touch, viewport, routing",
      "X-OperaMini-Phone: Apple # iPhone",
      "X-OperaMini-Phone-UA: Mozilla/5.0 (iPhone; U; CPU iPhone OS 5_1 like Mac OS X; en-us)",
    ].join("\n")
  },
  {name: "Opera Mini 6.5 on SonyEricsson K800i", headers:
    [
      "User-Agent: Opera/9.80 (J2ME/MIDP; Opera Mini/6.5.26955/27.1382; U; en) Presto/2.8.119 Version/11.10",
      "Accept: text/html, application/xml;q=0.9, application/xhtml+xml, image/png, image/webp, image/jpeg, image/gif, image/x-xbitmap, */*;q=0.1",
      "Accept-Language: en",
      "Accept-Encoding: gzip, deflate",
      "Connection: Keep-Alive",
      "X-OperaMini-Phone: SonyEricsson # K800i",
      "X-OperaMini-Phone-UA: SonyEricssonK800i/R1KG Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
      "X-OperaMini-Features: advanced, file_system, camera, folding, routing",
    ].join("\n")
  },
  {name: "Opera Mobile 12 on Samsung Galaxy S II", headers:
    [
      "User-Agent: Opera/9.80 (Android 4.0.3; Linux; Opera Mobi/ADR-1203051631; U; en-GB) Presto/2.10.254 Version/12.00",
      "Accept: text/html, application/xml;q=0.9, application/xhtml+xml, multipart/mixed, image/png, image/webp, image/jpeg, image/gif, image/x-xbitmap, */*;q=0.1",
      "Accept-Language: en-GB, en",
      "Accept-Encoding: gzip, deflate",
      "Connection: Keep-Alive",
    ].join("\n")
  },
  {name: "Opera Mobile 12 on Motorola Xoom", headers:
    [
      "User-Agent: Opera/9.80 (Android 4.0.5; Linux; Opera Tablet/ADR-1204201824; U; en) Presto/2.10.254 Version/12.00",
      "Accept: text/html, application/xml;q=0.9, application/xhtml+xml, multipart/mixed, image/png, image/webp, image/jpeg, image/gif, image/x-xbitmap, */*;q=0.1",
      "Accept-Language: en",
      "Accept-Encoding: gzip, deflate",
      "Connection: Keep-Alive",
    ].join("\n")
  },
];
// copied from python's httplib.responses
cls.ResourceUtil.http_status_codes = {
  200: 'OK', 201: 'Created', 202: 'Accepted',
  203: 'Non-Authoritative Information', 204: 'No Content',
  205: 'Reset Content', 206: 'Partial Content', 400: 'Bad Request',
  401: 'Unauthorized', 402: 'Payment Required', 403: 'Forbidden',
  404: 'Not Found', 405: 'Method Not Allowed', 406: 'Not Acceptable',
  407: 'Proxy Authentication Required', 408: 'Request Timeout',
  409: 'Conflict', 410: 'Gone', 411: 'Length Required',
  412: 'Precondition Failed', 413: 'Request Entity Too Large',
  414: 'Request-URI Too Long', 415: 'Unsupported Media Type',
  416: 'Requested Range Not Satisfiable', 417: 'Expectation Failed',
  418: 'I\'m a teapot', 100: 'Continue', 101: 'Switching Protocols',
  300: 'Multiple Choices', 301: 'Moved Permanently', 302: 'Found',
  303: 'See Other', 304: 'Not Modified', 305: 'Use Proxy', 306: '(Unused)',
  307: 'Temporary Redirect', 500: 'Internal Server Error',
  501: 'Not Implemented', 502: 'Bad Gateway', 503: 'Service Unavailable',
  504: 'Gateway Timeout', 505: 'HTTP Version Not Supported'
}
