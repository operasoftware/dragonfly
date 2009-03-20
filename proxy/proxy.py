import ConfigParser
from Connection import Connection
from ScopeConnection import ScopeConnection
from SimpleServer import SimpleServer, asyncore
from common import Options

CONFIG_FILE = "dragonkeeper.ini"

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
    with options. If file does not exist, or can't be parsed, return None """
    config = ConfigParser.RawConfigParser()

    okfile = config.read(path)
    if not okfile or not config.has_section("dragonkeeper"):
        return None

    ret = {}
    for name, value in config.items("dragonkeeper"):
        ret[name] = DEFAULT_TYPES[name](value)
            
    return ret

def _print_config():
    print "[dragonkeeper]"
    for item in APP_DEFAULTS.items():
        print "%s: %s" % item   

def _parse_options():
    """Parse command line options.
    
    The option priority is like so:
    Least important, app defaults
    More important, settings in config file
    Most important, command line options
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
        help = "print message flow"
        )
    parser.add_option(
        "-f", "--format",
        action="store_true", 
        dest = "format", 
        help = "pretty print message flow"
        )
    parser.add_option(
        "-r", "--root", 
        dest = "root", 
        help = "the root directory of the server; default %s" % (
                    APP_DEFAULTS["root"])
        )
    parser.add_option(
        "-p", "--proxy-port",
        dest = "proxy_port", 
        type="int",
        help = "proxy port; default %s" % APP_DEFAULTS["proxy_port"]
        )
    parser.add_option(
        "-s", "--server-port",
        dest = "server_port", 
        type="int",
        help = "server port; default %s" % APP_DEFAULTS["server_port"]
        )
    parser.add_option(
        "--host",
        dest = "host", 
        help = "host; default %s" % APP_DEFAULTS["host"]
        )
    parser.add_option(
        "-i", "--make-ini",
        dest = "make_ini", 
        action="store_true",
        default=False,
        help = "Print a default dragonkeeper.ini and exit"
        )
    options, args = parser.parse_args()

    if options.make_ini:
        _print_config()
        sys.exit(0)


    # appopts contains the defaults
    appopts = Options(APP_DEFAULTS)

    if options.config_path: # an explicit config file was given. Overrides everything
        config = _load_config(options.config_path)
        if config:
            appopts = Options(config)
        else:
            parser.error("""Invalid path or config file "%s"!""" % options.config_path)

    elif os.path.isfile(CONFIG_FILE): # if not explicit config, try to load default ini file.
        config = _load_config(CONFIG_FILE)
        if config:
            print config
            for key, value in config.items():
                appopts[key] = value

    # at this point we have an appopts object with all we need. A mix 
    # of defaults and the .ini files
    # Any command line options will override this.

    for name, value in [(e, getattr(options, e)) for e in APP_DEFAULTS.keys()]:
        if not value is None:
            appopts[name] = value

    # All options set. Now we can check if they are OK
    
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
  
