/**
 * @fileoverview
 * Stuff related to mime types and figuring out what kind of content we're
 * dealing with.
 */

function http_map_mime_to_type(mime)
{
    mime = mime.toLowerCase();

    if (mime in http_mime_type_map)
    {
        return http_mime_type_map[mime];
    }

    if (mime.indexOf("image/") == 0)
    {
        return "image";
    }

    if (mime.indexOf("video/") == 0)
    {
        return "video";
    }
    
    if (mime.indexOf("audio/") == 0)
    {
        return "audio";
    }
    
    return "unknown";
}

window.http_mime_type_map = {
    "text/html": "markup",
    "text/css": "css",
    "application/x-javascript": "javascript",
    "application/xhtml+xml": "markup",
    "application/pdf": "pdf",
    "application/x-shockwave-flash": "flash",
    "application/xml": "xml"
}

/**
 * This one will be deprecated when we get mime types straight from core.
 */
window.http_file_extension_map = {
    "html": "text/html", "htm": "text/html",
    "xml": "application/xml",
    "xhtml": "application/xhtml+xml", "xht": "application/xhtml+xml",
    "swf": "application/x-shockwave-flash",
    "png": "image/png",
    "ico": "image/x-icon",
    "gif": "image/gif",
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "jpe": "image/jpeg",
    "css": "text/css"
}

function http_get_mime_from_extension(path)
{
    var ext = path.split(".").pop().toLowerCase();
    return http_file_extension_map[ext] || "";
}