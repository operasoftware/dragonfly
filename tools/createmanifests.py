from __future__ import with_statement
import re
import os
import sys
from urllib import quote, unquote
from time import gmtime, strftime, mktime, strptime, time

MANIFEST_DIR = "manifests"
_re_client = re.compile("client-(?P<lang>[^.]+)\.xml")
_re_resource = re.compile("(?:<script[^>]*?src=\"([^\"]*))|(?:<link[^>]*?href=\"([^\"]*))")

def get_timestamp(path = None):
    return strftime("%a, %d %b %Y %H:%M:%S GMT", gmtime(path and stat(path).st_mtime or None))

def get_resources(os_path, web_path, file_name):
    resources = []
    with open(os.path.join(os_path, file_name), 'r') as f:
        content = f.read()
        for match in _re_resource.finditer(content):
            resource = filter(bool, match.groups())[0]
            if resource.startswith("/"):
                pass
            elif resource.startswith("./"):
                resource = web_path + resource[1:]
            elif resource.startswidth("../"):
                while resource.startswith("../"):
                    pos = resource.find("/", 3)
                    if pos > -1:
                        resource = resource[pos:]
                    else:
                        resource = ""
            else:
                resourc = web_path + "/" + resource
            resources.append(resource)
    return resources

def write_maifest(os_path, file_name, resources, tag=""):
    with open(os.path.join(os_path, MANIFEST_DIR, file_name), "wb") as f:
        content = ["CACHE MANIFEST", "# created %s %s" % (get_timestamp(), tag)]
        content.extend(resources)
        content.append("")
        f.write("\n".join(content))

def add_manifest(os_path, web_path, client_file, manifest):
    content = None
    manifest_path = "/".join([web_path, MANIFEST_DIR, manifest]) 
    with open(os.path.join(os_path, client_file), "rb") as f:
        content = f.read()
    if content and not ' manifest="' in content:
        with open(os.path.join(os_path, client_file), "wb") as f:
            f.write(content.replace(">", ' manifest="%s">' % manifest_path, 1))

def main(argv=sys.argv):
    """

    """
    import optparse
    usage = """%prog [options] [path]
    
    Create a manifest for all files in path with the pattern client-<lang code>.xml.
    """
    parser = optparse.OptionParser(usage)
    parser.add_option("-d", "--domain", type="string", dest="domain",
                      default=None, help="The domain token of the.")
    parser.add_option("-t", "--tag", dest="tag", default="", 
                      help="A tag to be used in the manifest comment.")
    options, args = parser.parse_args()
    os_path = os.path.abspath(len(args) > 0 and args[0] or ".")
    web_path = os_path
    if options.domain:
        pos = web_path.find(options.domain)
        if pos > -1:
            web_path = web_path[pos + len(options.domain):]
    web_path = "/".join(map(lambda p: quote(p), web_path.split(os.path.sep)))
    if not os.path.exists(os.path.join(os_path, MANIFEST_DIR)):
        os.makedirs(os.path.join(os_path, MANIFEST_DIR))
    for name in os.listdir(os_path):
         match = _re_client.search(name)
         if match:
            resources = [web_path + "/", web_path + "/" + name]
            manifest = "dragonfly-%s.manifest" % match.group("lang")
            if web_path.startswith("/app"):
                if "cutting-edge" in web_path:
                    resources.append("/app/cutting-edge/")
                else:
                    resources.append("/app/")
            resources.extend(get_resources(os_path, web_path, name))
            write_maifest(os_path, manifest, resources, options.tag)
            add_manifest(os_path, web_path, name, manifest)

if __name__ == "__main__":
    sys.exit(main())
