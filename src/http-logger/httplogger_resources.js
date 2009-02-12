/**
 * @fileoverview
 * Mappings between various types of http data and their relevant specs as
 * well as mappings and helpers used for resolving mime types
 */
window.http_header_specification_urls = {
    // from HTTP spec
    "Accept": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.1",
    "Accept-Charset": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.2",
    "Accept-Encoding": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3",
    "Accept-Language": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.4",
    "Accept-Ranges": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.5",
    "Age": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.6",
    "Allow": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.7",
    "Authorization": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.8",
    "Cache-Control": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9",
    "Connection": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.10",
    "Content-Encoding": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.11",
    "Content-Language": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.12",
    "Content-Length": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.13",
    "Content-Location": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.14",
    "Content-MD5": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.15",
    "Content-Range": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.16",
    "Content-Type": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.17",
    "Date": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.18",
    "Clockless Origin Server Operation": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.18.1",
    "ETag": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.19",
    "Expect": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.20",
    "Expires": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.21",
    "From": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.22",
    "Host": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.23",
    "If-Match": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.24",
    "If-Modified-Since": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.25",
    "If-None-Match": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.26",
    "If-Range": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.27",
    "If-Unmodified-Since": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.28",
    "Last-Modified": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.29",
    "Location": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.30",
    "Max-Forwards": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.31",
    "Pragma": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.32",
    "Proxy-Authenticate": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.33",
    "Proxy-Authorization": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.34",
    "Range": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.35",
    "Byte Ranges": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.35.1",
    "Range Retrieval Requests": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.35.2",
    "Referer": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.36",
    "Retry-After": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.37",
    "Server": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.38",
    "TE": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.39",
    "Trailer": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.40",
    "Transfer-Encoding": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.41",
    "Upgrade": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.42",
    "User-Agent": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.43",
    "Vary": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.44",
    "Via": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.45",
    "Warning": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.46",
    "WWW-Authenticate": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.47",
    
    // from Cookie spec (rfc2965)
    "Cookie": "http://www.ietf.org/rfc/rfc2965.txt",
    "Cookie2": "http://www.ietf.org/rfc/rfc2965.txt",
    "Set-Cookie2": "http://www.ietf.org/rfc/rfc2965.txt"
    
}

window.http_method_specification_urls = {
    "options": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.2",
    "get": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.3",
    "head": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.4",
    "post": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.5",
    "put": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.6",
    "delete": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.7",
    "trace": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.8",
    "connect": "http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.9"
}

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
    "css": "text/css",
    "js":  "application/x-javascript"
}

function http_get_mime_from_extension(path)
{
    var ext = path.split(".").pop().toLowerCase();
    return http_file_extension_map[ext] || "";
}