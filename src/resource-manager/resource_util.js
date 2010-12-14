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
 * Common mime types mapped to more generic strings
 */
cls.ResourceUtil.mime_type_map = {
  "text/html": "markup",
  "application/xhtml+xml": "markup",

  "text/css": "css",

  "application/x-javascript": "script",
  "application/javascript": "script",
  "text/javascript": "script",
  "application/json": "script",

  "image/png": "image",
  "image/gif": "image",
  "image/jpeg": "image",
  "image/x-icon": "image",

  "application/pdf": "pdf",
  "application/x-shockwave-flash": "flash",
  "application/xml": "xml"
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
  return this.mime_type_map[mime] || "unknown";
}

cls.ResourceUtil.url_path = function(url)
{
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
  var host = url.replace(/\w+?:\/\//, "");
  var firstslash = host.indexOf("/");
  host = host.slice(0, firstslash == -1 ? host.length : firstslash);
  return host;
}
