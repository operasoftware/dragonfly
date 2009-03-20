"""Common modules, constants, variables and function 
for the scope proxy / server

Overview:

The proxy / server is build as an extension of the asyncore.dispatcher class.
There are two instantiation of SimpleServer to listen on the given ports 
for new connection, on for http and the other for scope. They do dispatch a 
connection to the appropriate classes, Connection for http and 
ScopeConnection for scope. 
There are also two queues, one for getting a new scope message and one for 
scope messages. Getting a new scope message is performed as GET request 
with the path /scope-message. If the scope-message queue is not empty then
the first of that queue is returned, otherwise the request is put 
in the waiting-queue. If a new message arrives on the scope sockets it works 
the other way around: if the waiting-queue is not empty, the message is
returned to the first waiting connection, otherwise it's put on 
the scope-message queue.
In contrast to the previous Java version there is only one waiting connection
for scope messages, the messages are dispatched to the correct service 
on the client side. The target service is added to the response 
as custom header 'X-Scope-Message-Service'. This pattern will be extended 
for the STP 1 version.
The server is named Dragonkeeper to stay in the started namespace.
"""

__version__ = 0.8

import socket
import asyncore
import os
import re
import string
import sys
import time
import codecs
from asyncore import poll
from time import gmtime, strftime, mktime, strptime, time
from calendar import timegm
from os import stat, listdir
from os.path import isfile, isdir
from os.path import exists as path_exists
from os.path import join as path_join

CRLF = '\r\n'
BLANK = ' '
BUFFERSIZE = 8192
RE_HEADER = re.compile(": *")

RESPONSE_BASIC = \
    'HTTP/1.1 %s %s' + CRLF + \
    'Date: %s' + CRLF + \
    'Server: Dragonkeeper/%s' % __version__ + CRLF + \
    '%s'

# RESPONSE_OK_CONTENT % (timestamp, additional headers or empty, mime, content)
#
# HTTP/1.1 200 OK
# Date: %s
# Server: Dragonkeeper/0.8
# %sContent-Type: %s  
# Content-Length: %s
# 
# %s

RESPONSE_OK_CONTENT = RESPONSE_BASIC % (
    200,
    'OK',
    '%s',
    '%s' + \
    'Content-Type: %s' + CRLF + \
    'Content-Length: %s' + 2 * CRLF + \
    '%s'
)

# NOT_MODIFIED % ( timestamp )
# HTTP/1.1 304 Not Modified
# Date: %s
# Server: Dragonkeeper/0.8

NOT_MODIFIED = RESPONSE_BASIC % (
    304,
    'Not Modified',
    '%s',
    CRLF
)

# REDIRECT % ( timestamp, uri)
# HTTP/1.1 301 Moved Permanently
# Date: %s
# Server: Dragonkeeper/0.8
# Location: %s

REDIRECT = RESPONSE_BASIC % (
    301,
    'Moved Permanently',
    '%s',
    'Location: %s' + 2 * CRLF
)

# NOT_FOUND % ( timestamp )
# HTTP/1.1 404 NOT FOUND
# Date: %s
# Server: Dragonkeeper/0.8

NOT_FOUND = RESPONSE_BASIC % (
    404, 
    'NOT FOUND',
    '%s',
    'Content-Length:0' + 2 * CRLF 
)



# scope specific responses

# RESPONSE_SERVICELIST % ( timestamp, content length content )
# HTTP/1.1 200 OK
# Date: %s
# Server: Dragonkeeper/0.8
# Cache-Control: no-cache
# Content-Type: application/xml
# Content-Length: %s
#
# %s

RESPONSE_SERVICELIST =  RESPONSE_OK_CONTENT % ( 
    '%s', 
    'Cache-Control: no-cache' + CRLF, 
    'application/xml', 
    '%s', 
    '%s'
)

# RESPONSE_OK_OK % ( timestamp )
# HTTP/1.1 200 OK
# Date: %s
# Server: Dragonkeeper/0.8
# Cache-Control: no-cache
# Content-Type: application/xml
# Content-Length: 5
#
# <ok/>

RESPONSE_OK_OK = RESPONSE_OK_CONTENT % (
    '%s', 
    'Cache-Control: no-cache' + CRLF,  
    'application/xml', 
    len("<ok/>"), 
    "<ok/>"
)

# RESPONSE_TIMEOUT % ( timestamp )
# HTTP/1.1 200 OK
# Date: %s
# Server: Dragonkeeper/0.8
# Cache-Control: no-cache
# Content-Type: application/xml
# Content-Length: 10
#
# <timeout/>

RESPONSE_TIMEOUT = RESPONSE_OK_CONTENT % (
    '%s', 
    'Cache-Control: no-cache' + CRLF,  
    'application/xml', 
    len('<timeout/>'), 
    '<timeout/>'
)

# SCOPE_MESSAGE % ( timestamp, service, message length, message )
# HTTP/1.1 200 OK
# Date: %s
# Server: Dragonkeeper/0.8
# Cache-Control: no-cache
# X-Scope-Message-Service: %s
# Content-Type: application/xml
# Content-Length: %s
#
# %s

SCOPE_MESSAGE = RESPONSE_OK_CONTENT % (
    '%s',
    'Cache-Control: no-cache' + CRLF + \
    'X-Scope-Message-Service: %s' + CRLF,
    'application/xml',
    '%s',
    '%s'
)

# The template to create a html directory view
DIR_VIEW = \
"""
<!doctype html>
<html>
<head>
<title> </title>
<style>
  body 
  {
    font-family: "Lucida Sans Unicode", sans-serif;
    font-size: .8em;
  }
  ul 
  {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li 
  {
    padding-left: 0;
  }
  a 
  {
    text-decoration: none;
  }
  icon
  {
    display: inline-block;
    background-repeat: no-repeat;
    vertical-align: middle;
    width: -o-skin;
    height: -o-skin;
    margin-right: 3px;
  }
  .directory icon
  {
    background-image: -o-skin('Folder');
  }
  .file icon
  {
    background-image: -o-skin('Window Document Icon');
  }   
</style>
</head>
<body>
<ul>%s</ul>
</body>
</html>
"""
    
ITEM_DIR = """<li class="directory"><a href="./%s/"><icon></icon>%s</a></li>"""
ITEM_FILE = """<li class="file"><a href="./%s"><icon></icon>%s</a></li>"""

# scope scpecific markup
SERVICE_LIST = """<services>%s</services>"""
SERVICE_ITEM = """<service name="%s"/>"""
XML_PRELUDE = """<?xml version="1.0"?>%s"""
TIMEOUT = 30

# the two queues
connections_waiting = []
scope_messages = []


class Scope(object):
    """Used as a namespace for scope with methods to register 
    the send command and the service list"""
    def __init__(self):
        self.serviceList = []
        self.sendCommand = self.empty_call
        self.commands_waiting = {}
        self.services_enabled = {}

    def empty_call(self, msg):
        pass
    
    def setSendCommand(self, send):
        self.sendCommand = send

    def setServiceList(self, list):
        self.serviceList = list

    def reset(self):
        self.serviceList = []
        self.sendCommand = self.empty_call  
        self.commands_waiting = {}
        self.services_enabled = {}
 
scope = Scope()

UNRESERVED = frozenset([c for s in \
    [
        string.uppercase,
        string.lowercase,
        string.digits,
        ['-', '_', '.', '!', '~', '*', '\'', '(', ')', ';', 
            '/', '?', ':', '@', '&', '=', '+', '$', ',' '#']
    ] for c in s])

def encodeURI(str):
    return "".join([c in UNRESERVED and c or "%s%x" % ( 
            "%", ord(c)) for c in str])
    
def decodeURI(str):
    return re.sub(r"%([0-9a-fA-F]{2})", lambda m: chr(int(m.group(1), 16)), str)

def webURIToSystemPath(path):
    return os.path.join(*[decodeURI(part) for part in path.split('/')])

def systemPathToWebUri(path):
    return "/".join([encodeURI(part) for part in path.split(os.path.sep)])

def getTimestamp(path = None):
    return strftime("%a, %d %b %Y %H:%M:%S GMT", 
                            gmtime(path and stat(path).st_mtime or None))

def timestampToTime(stamp):
    """see http://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1 
    only this format is supported: Fri, 16 Nov 2007 16:09:43 GMT
    from the spec:
    HTTP applications have historically allowed three different formats 
    for the representation of date/time stamps: 
      Sun, 06 Nov 1994 08:49:37 GMT  ; RFC 822, updated by RFC 1123
      Sunday, 06-Nov-94 08:49:37 GMT ; RFC 850, obsoleted by RFC 1036
      Sun Nov  6 08:49:37 1994       ; ANSI C's asctime() format"""
    return timegm(strptime(stamp, "%a, %d %b %Y %H:%M:%S %Z"))

def formatXML(in_string):
    """To pretty print STP 0 messages"""
    in_string = re.sub(r"<\?[^>]*>", "", in_string)
    ret = []
    indent_count = 0
    INDENT = "  "
    LF = "\n"
    TEXT = 0
    TAG = 1
    CLOSING_TAG = 2
    OPENING_CLOSING_TAG = 3
    OPENING_TAG = 4
    matches_iter = re.finditer(r"([^<]*)(<(\/)?[^>/]*(\/)?>)", in_string)
    try:
        while True:
            m = matches_iter.next()
            matches = m.groups()
            if matches[CLOSING_TAG]:
                indent_count -= 1
                if matches[TEXT] or last_match == OPENING_TAG:
                    ret.append(m.group())
                else:
                    ret.extend([LF, indent_count * INDENT, m.group()])
                last_match = CLOSING_TAG
            elif matches[OPENING_CLOSING_TAG] or "<![CDATA[" in matches[1]:
                last_match = OPENING_CLOSING_TAG
                ret.extend([LF, indent_count * INDENT, m.group()])
            else:
                last_match = OPENING_TAG
                ret.extend([LF, indent_count * INDENT, m.group()])
                indent_count += 1
    except:
        pass
    return "".join(ret)

class Options(object):
    #todo: subclass dict
    def __init__(self, *args, **kwargs):
        for arg in args:
            for key, val in arg.iteritems():
                self.__dict__[key]=val
            
    def __getitem__(self, name):
        return self.__dict__[name]
        
    def __getattr__(self, name):
        return self.__dict__[name]
        
    def __setitem__(self, name, value):
        self.__dict__[name]=value

    def __setattr__(self, name, value):
        self.__dict__[name]=value
    
    def __delattr__(self, name):
        del self.__dict__[name]
        
    def __deltitem__(self, name):
        del self.__items__[name]
        

class FileObject(object):
    def write(self, str):
        pass
    def read(self):
        pass
    def flush(self):
        pass
