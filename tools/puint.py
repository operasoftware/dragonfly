import sys
import os
import re

class Method(object):
    def __init__(self, line, line_nr, name, args):
        self.line = line;
        self.line_nr = line_nr
        self.name = name
        self.args = args
        self.re = re.compile("\. *" + name + "(?: |\()")
        self.matches = {}

def check_file(file_name, check_list):
    for ending in check_list:
        if file_name.endswith(ending):
            return True
    return False

def check_interface(methods, path):
    lines = []
    hits = []
    with open(path, 'r') as f:
        lines = f.readlines()
    
    for line, line_nr in zip(lines, range(1, len(lines) + 1)):
        for method in methods:
            match = method.re.search(line)
            if match:
                if not path in method.matches:
                    method.matches[path] = []
                method.matches[path].append("%4i  %s" %(line_nr, line.rstrip()))

def main(argv=sys.argv):
    import optparse
    usage = """%prog [options] file
    
    Extract all method of a file and checkes them against all files of a project.
    """
    parser = optparse.OptionParser(usage)
   
    parser.add_option("-r", "--root", type="string", dest="root",
                      default=None, 
                      help="The root directory of the project.")

    options, args = parser.parse_args()

    if not options.root:
        raise Exception("Project root is missing.")
    project_root = os.path.abspath(options.root)
    if not os.path.isdir(project_root):
        raise Exception("The project root is not a direcory.")
    if not len(args) == 1:
        raise Exception("File path is missing.")
    file_path = os.path.abspath(args[0])
    if not os.path.isfile(file_path):
        raise Exception("The argument is not a file.")

    lines = []
    hits = []
    re_f = re.compile("this *\. *([^ ]+) *\= *function\(([^)]*\))")
    with open(file_path, 'r') as f:
        lines = f.readlines()
    for line, index in zip(lines, range(1, len(lines) + 1)):
        match = re_f.search(line)
        if match:
            name, args = match.groups()
            hits.append(Method(line, index, name, args))
    file_endings = ['.xml', '.js']
    for root, dirs, files in os.walk(project_root):
        for file in files:
            if check_file(file, file_endings):
                path = os.path.join(root, file)
                if not os.path.abspath(path) == file_path:
                    matches = check_interface(hits, path)
    for hit in hits:
        if hit.matches:
            print ''
            print len(hit.name) * '='
            print hit.name
            print len(hit.name) * '='
            for path in hit.matches:
                print ''
                print path
                print len(path) * '-'
                for line in hit.matches[path]:
                    print line
        elif not hit.name.startswith('_'):
            print ''
            print ">>>>> not use interface:", hit.name
        
if __name__ == "__main__":
    sys.exit(main())