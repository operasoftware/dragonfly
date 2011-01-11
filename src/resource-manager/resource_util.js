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
