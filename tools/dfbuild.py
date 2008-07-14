import re
import codecs
import os
import shutil
import tempfile
import sys
import zipfile

_directive_exts = (".xml", ".html", ".xhtml") # files that may have <!-- command.. directives
_keyword_exts = (".css", ".js", ".xml", ".html", ".xhtml", ".txt") # files we will try to do keyword interpolation on
_license_exts = (".js", ".css") # extensions that should get a license
_script_ele = "<script src=\"%s\"/>\n"
_style_ele = "<link rel=\"stylesheet\" href=\"%s\"/>\n"
_re_command = re.compile("""\s?<!--\s+command\s+(?P<command>\w+)\s+"?(?P<target>.*?)"?\s*-->""")
_re_script = re.compile("\s?<script +src=\"(?P<src>[^\"]*)\"/>")
_re_css = re.compile("\s?<link +rel=\"stylesheet\" +href=\"(?P<href>[^\"]*)\"/>")

_concatcomment ="""
/* dfbuild: concatenated from: %s */
"""

def _process_directive_files(dirpath):
    for base, dirs, files in os.walk(dirpath, topdown=True):
        for file in [ os.path.join(dirpath, base, f) for f in files if f.endswith(_directive_exts) ]:
            _process_directives(dirpath, file)


def _process_directives(root, filepath):
    file = open(filepath)

    tmpfd, tmppath = tempfile.mkstemp(".tmp", "dfbuild.")
    tmpfile = os.fdopen(tmpfd, "w")
    
    known_files = {}
    current_css_file = None
    current_js_file = None
 
    for line in file:
        match_cmd = _re_command.search(line)
        match_css = _re_css.search(line)
        match_js = _re_script.search(line)
        if match_cmd:
            cmd, target = match_cmd.groups()
            if cmd == "concat_css":
                if target in ["off", "false", "no"]:
                    current_css_file = None
                elif target in known_files:
                    current_css_file = target
                else:
                    known_files[target] = []
                    current_css_file = target
                    tmpfile.write(_style_ele % target)
                continue
            elif cmd == "concat_js":
                if target in ["off", "false", "no"]:
                    current_js_file = None
                elif target in known_files:
                    current_js_file = target
                else:
                    known_files[target] = []
                    current_js_file = target
                    tmpfile.write(_script_ele % target)
                continue
            else: # some other unknown command! Let fall through so line is written
                pass
        elif match_css:
            if current_css_file:
                known_files[current_css_file].append(match_css.group("href"))
                continue
        elif match_js:
            if current_js_file:
                known_files[current_js_file].append(match_js.group("src"))
                continue
        elif line.isspace():
            continue

        tmpfile.write(line)
        
    tmpfile.close()
    
    # write back the temp stuff, which is now the authoritative stuff:
    
    shutil.copy(tmppath, filepath)
    os.unlink(tmppath)

    for outfile, contentfiles in known_files.items():
        outpath = os.path.join(root, outfile)
        outdir = os.path.dirname(outpath)
        if not os.path.isdir(outdir): os.makedirs(outdir)
        fout = open(os.path.join(root, outfile), "w")
        for infile in contentfiles:
            fout.write(_concatcomment % infile)
            fin = open(os.path.join(root, infile))
            fout.write(fin.read())
            fin.close()
            os.unlink(os.path.join(root, infile))


def _clean_dir(root, exclude_dirs, exclude_files):
    """
    Remove anything in either of the blacklists, then remove all empty
    directories under root and its children
    """
    exclude_files = [os.path.normpath(os.path.join(root, f)) for f in exclude_files ]
    exclude_dirs = [os.path.normpath(os.path.join(root, d)) for d in exclude_dirs ]

    # first pass, remove blacklisted files
    for base, dirs, files in os.walk(root, topdown=True):
        if base in exclude_dirs:
            shutil.rmtree(base)
            continue
        
        for file in files:
            absfile = os.path.abspath(os.path.join(base, file))
            if absfile in exclude_files and os.path.isfile(absfile):
                os.unlink(absfile)

    # second pass, remove empty dirs
    for base, dirs, files in os.walk(root, topdown=True):
        if not dirs and not files:
            os.rmdir(base)


def _add_license(root, license_path):
    """
    Read a license from license_path and append it to all files under root
    whose extension is in _license_exts.
    """
    if not os.path.isfile(license_path):
        return
    
    lfile = open(license_path)
    license = lfile.read()
    lfile.close()
    
    license_files = []
    for base, dirs, files in os.walk(root):
        license_files.extend( [ os.path.join(base, f) for f in files if f.endswith(_license_exts)] )
    
    for f in license_files:
        source = open(f)
        tmpfd, tmppath = tempfile.mkstemp(".tmp", "dfbuild.")
        tmpfile = os.fdopen(tmpfd, "w")
        tmpfile.write(license)
        tmpfile.write("\n")
        tmpfile.write(source.read())
        source.close()
        tmpfile.close()
        shutil.copy(tmppath, f)
        os.unlink(tmppath)


def _add_keywords(root, keywords):
    """
    Do keyword replacement on all files in and under root which has an
    extension in _keyword_exts. keywords is a dictionary, the key will be
    replaced with the value.
    """
    keyword_files = []
    for base, dirs, files in os.walk(root):
        keyword_files.extend( [ os.path.join(base, f) for f in files if f.endswith(_keyword_exts)] )
    
    for f in keyword_files:
        source = open(f)
        tmpfd, tmppath = tempfile.mkstemp(".tmp", "dfbuild.")
        tmpfile = os.fdopen(tmpfd, "w")
        for line in source:
            for key, val in keywords.items():
                line = line.replace(key, val)
            tmpfile.write(line)
            
        source.close()
        tmpfile.close()
        shutil.copy(tmppath, f)
        os.unlink(tmppath)


def make_archive(src, dst, in_subdir=True):
    """
    This simply packs up the contents in the directory src into a zip archive
    dst. This is here so we can easily zip stuff from build files without
    forcing the user to install a command line zip tool. If in_subdir is true,
    the archive will contain a top level directory with the same name as the
    archive, without the extension. If it is false, the files are put in the
    root of the archive
    """
    src = os.path.abspath(src)
    z = zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED)
    
    if in_subdir:
        subdir = os.path.basename(dst)
        subdir = subdir[:subdir.rfind(".")]
        subdir = subdir + "/"
    else:
        subdir=""
    
    for base, dirs, files in os.walk(src):
        for file in files:
            abs = os.path.join(base, file)
            rel = subdir + os.path.join(base, file)[len(src)+1:]
            z.write(abs, rel)

    z.close()
    

def export(src, dst, process_directives=True, keywords={},
           exclude_dirs=[], exclude_files=[], license=None):
    src = os.path.abspath(src); # make sure it's absolute

    # get a temporary place to do stuff
    tmpbase = tempfile.mkdtemp(".tmp", "dfbuild.")
    ## this is kinda dumb but copytree always copy to a non-extant subdir
    tmpdir = os.path.join(tmpbase, "src")
    shutil.copytree(src, tmpdir)

    if process_directives:
        _process_directive_files(tmpdir)
        
    # remove empty directories and stuff in the blacklist
    _clean_dir(tmpdir, exclude_dirs, exclude_files)
        
    if license and os.path.isfile(license):
        _add_license(tmpdir, license)
        
    if keywords:
        _add_keywords(tmpdir, keywords)
        
    #copy the stuff to its final destination and get rid of temp copy:
    if not os.path.isdir(dst):
        os.mkdir(dst)
    
    # stupid copy function to get around the must-put-in-subdir thingy in shutil.copytree
    for entry in os.listdir(tmpdir):
        path = os.path.join(tmpdir, entry)
        if os.path.isdir(path):
            shutil.copytree(path, os.path.join(dst, entry))
        else:
            shutil.copy(os.path.join(tmpdir,entry), dst)


    shutil.rmtree(tmpbase)




def main(argv=sys.argv):
    import optparse
    usage = """%prog [options] source destination
    
Destination can be either a directory or a zip file"""
    parser = optparse.OptionParser(usage)
    parser.add_option("-c", "--no-concat", dest="concat",
                      default=True, action="store_false",
                      help="don't concatenate script and css")
    parser.add_option("-l", "--license", dest="license",
                      default=None, type="string",
                      help="append license file to js and css")
    parser.add_option("-k", "--keyword", dest="kwlist",
                      default=None, type="string", action="append",
                      help="A key/value pair. All instances of key will be replaced by value in all files. More than one key/value is allowed by adding more -k switches", metavar="key=value")
    parser.add_option("-d", "--delete", default=False,
                      action="store_true", dest="delete_dst",
                      help="Delete the destination before copying to it. Makes sure that there are no files left over from previous builds. Is destructive!")

    options, args = parser.parse_args()
    
    # Make sure we have a source and destination
    if len(args) != 2:
        parser.error("Source and destination argument is required")
    else:
        src, dst = args
    
    # Parse the keyword definitons
    keywords = {}
    if options.kwlist:
        try:
            for kw in options.kwlist:
                key, val = kw.split("=")
                keywords[key] = val
        except ValueError:
            parser.error("""Could not parse keyword option: "%s" """ % kw)
    
    if dst.endswith(".zip"): # export to a zip file
        if os.path.isfile(dst):
            if not options.delete_dst:
                parser.error("Destination exists! use -d to force overwrite")
            else:
                os.unlink(dst)
        tempdir = tempfile.mkdtemp(".tmp", "dfbuild.")
        export(src, tempdir, process_directives=options.concat,
               keywords=keywords, license=options.license)
        make_archive(tempdir, dst)
        shutil.rmtree(tempdir)
    else: # export to a directory
        if os.path.isdir(dst):
            if not options.delete_dst:
                parser.error("Destination exists! use -d to force overwrite")
            else:
                shutil.rmtree(dst)

        export(src, dst, process_directives=options.concat,
               keywords=keywords, license=options.license)
        


if __name__ == "__main__":
    sys.exit(main())
 
