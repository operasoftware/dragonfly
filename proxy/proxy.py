import ConfigParser
from Connection import Connection
from ScopeConnection import ScopeConnection
from SimpleServer import SimpleServer, asyncore
from common import Options

APP_DEFAULTS = {
    "host": "",
    "server_port": 8002,
    "proxy_port": 7001,
    "root": '.',
    "debug": False,
    "format": False
}

DEFAULT_TYPES = {
    "host": str,
    "server_port": int,
    "proxy_port": int,
    "root": str,
    "debug": bool,
    "format": bool
}

USAGE = """%prog [options]
    
Exit: Control-C
    
Settings:  an optional file CONFIG does overwrite the defaults.
The options file is a standard .ini file, with a single section called
"dragonkeeper":
[dragonkeeper]
host:
root: .
server_port: 8002
proxy_port: 7001
debug: False
format: False"""


def run_proxy(options, count=None): 
    SimpleServer(options.host, options.server_port, Connection, options)
    SimpleServer(options.host, options.proxy_port, ScopeConnection, options)
    print "server on: http://%s:%s/" % ( 
                options.host or "localhost", options.server_port )
    asyncore.loop(timeout = 0.1, count = count)

def _load_config(path):
    """Load an .ini file containing dragonkeeper options. Returns a dict
    with options. If file does not exist, or """
    config = ConfigParser.RawConfigParser()

    okfile = config.read(path)
    if not okfile or not config.has_section("dragonkeeper"):
        return None

    ret = APP_DEFAULTS.copy()
    for name, value in config.items("dragonkeeper"):
        if name in DEFAULT_TYPES:
            ret[name] = DEFAULT_TYPES[name](value)
            
    return ret

def _parse_options():
    """Option resolution:
    
    We use either a config file, or command line options. Not both.
    Any options that are not present after parsiing either file or command
    line, is filled in by the defaults.

    1. -c someconfig.ini
    2. command line options
    3. app defaults.
    
    Anything missing 
    
    """
    from optparse import OptionParser

    parser = OptionParser(USAGE)
    parser.add_option(
        "-c", "--config",
        dest = "config_path", 
        help = "Path to config file"
    )
    parser.add_option(
        "-d", "--debug",
        action = "store_true", 
        dest = "debug", 
        default = APP_DEFAULTS["debug"],
        help = "print message flow"
        )
    parser.add_option(
        "-f", "--format",
        action="store_true", 
        dest = "format", 
        default = APP_DEFAULTS["format"],
        help = "pretty print message flow"
        )
    parser.add_option(
        "-r", "--root", 
        dest = "root", 
        default = APP_DEFAULTS["root"],
        help = "the root directory of the server; default %s" % (
                    APP_DEFAULTS["root"])
        )
    parser.add_option(
        "-p", "--proxy-port",
        dest = "proxy_port", 
        type="int",
        default = APP_DEFAULTS["proxy_port"],
        help = "proxy port; default %s" % APP_DEFAULTS["proxy_port"]
        )
    parser.add_option(
        "-s", "--server-port",
        dest = "server_port", 
        type="int",
        default = APP_DEFAULTS["server_port"],
        help = "server port; default %s" % APP_DEFAULTS["server_port"]
        )
    parser.add_option(
        "--host",
        dest = "host", 
        default = APP_DEFAULTS["host"],
        help = "host; default %s" % APP_DEFAULTS["host"]
        )
    options, args = parser.parse_args()

    if options.config_path:
        config = _load_config(options.config_path)
        if config:
            appopts = Options(config)
        else:
            parser.error("""Invalid path or config file "%s"!""" % options.config_path)
    else:
        appopts = Options()
        for e in APP_DEFAULTS.keys():
            appopts[e] = getattr(options, e)

    # at this point we have an appopts object with all the keys we need!
    
    if not os.path.isdir(appopts.root):
        parser.error("""Root directory "%s" does not exist""" % options.root)
        
    return appopts

if __name__ == "__main__":
    import sys
    import os

    options = _parse_options()

    os.chdir(options.root) 
    try:
        run_proxy(options)
    except KeyboardInterrupt:
        # todo: shut down the open connections cleanly
        pass
    """
    import cProfile, sys
    p=open("profile", "w")
    sys.stdout = p
    cProfile.run("run_proxy(count = 5000, context = options)")
    p.close()
    """
  