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

cls.ResourceUtil.mime_to_type = function(mime)
{
  return this.mime_type_map[mime] || "unknown";
}