﻿import re
import codecs
import os
import shutil
import tempfile
import sys
import zipfile
import base64
import StringIO
import urllib

"""
uglifyjs is a python wrapper for uglifyjs.
See e.g. https://bitbucket.org/chrisk/uglifyjs

It can be any javascript minifyer. The required interface is:

    def minify(inpath, outpath, encoding="utf_8"):
        Minify input path to outputpath, optionally using encoding
    
    def minify_in_place(path, encoding="utf_8"):
        Minify path and write it to to the same location. Optionally use
        encoding
"""

try:
    import uglifyjs as jsminify
except ImportError:
    import jsminify


_text_exts = (".js", ".html", ".xml", ".css")
_directive_exts = (".xml", ".html", ".xhtml") # files that may have <!-- command.. directives
_keyword_exts = (".css", ".js", ".xml", ".html", ".xhtml", ".txt") # files we will try to do keyword interpolation on
_license_exts = (".js", ".css") # extensions that should get a license
_img_exts = (".png", ".jpg", ".gif")
_script_ele = u"<script src=\"%s\"/>\n"
_style_ele = u"<link rel=\"stylesheet\" href=\"%s\"/>\n"
_base_url = u"<base href=\"%s\" />\n"
_re_command = re.compile("""\s?<!--\s+command\s+(?P<command>\w+)\s+"?(?P<target>.*?)"?\s*(?:if\s+(?P<neg>not)?\s*(?P<cond>\S+?))?\s*-->""")
_re_comment = re.compile("""\s*<!--.*-->\s*""")
_re_script = re.compile("\s?<script +src=\"(?P<src>[^\"]*)\"")
_re_css = re.compile("\s?<link +rel=\"stylesheet\" +href=\"(?P<href>[^\"]*)\"/>")
_re_condition = re.compile("\s+if\s+(not)? (.*)")

_concatcomment =u"""
/* dfbuild: concatenated from: %s */
"""

def _process_directive_files(dirpath, vars):
    for base, dirs, files in os.walk(dirpath, topdown=True):
        for file in [ os.path.join(dirpath, base, f) for f in files if f.endswith(_directive_exts) ]:
            _process_directives(dirpath, file, vars)


def _process_directives(root, filepath, vars):
    """
    Process all directives in the file filepath. The root dir is in root
    
    TODO: Refactor this to use separate functions for each directive and
    just pass in a context for it to keep stuff in.
    """
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
        match_comment = _re_comment.search(line)
        
        
        if match_cmd:
            cmd, target, neg, cond = match_cmd.groups()
            if cond: # check if this directive is conditional
                c = bool(cond in vars and vars[cond])
                if neg:
                    c = not c
                    
                if not c: # the condition was not met, skip rule
                    continue

            # at this point the rule will be honoured
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
            elif cmd == "set_rel_base_url" and \
               vars.has_key("base_url") and vars["base_url"]:
                tmpfile.write(_base_url % vars["base_url"])
                continue
            else: # some other unknown command! Let fall through so line is written
                pass
        elif match_comment:
            continue
        elif match_css:
            if current_css_file:
                known_files[current_css_file].append(match_css.group("href"))
                continue
        elif match_js:
            if current_js_file:
                known_files[current_js_file].append(match_js.group("src"))
                #fixme: The following continue should have been on the same level as this comment. However, that causes lang files to be included. must fix
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

        if not os.path.isdir(outdir): 
            os.makedirs(outdir)

        fout_path = os.path.join(root, outfile)
        fout = codecs.open(fout_path, "w", encoding="utf_8_sig")
        for infile in contentfiles:
            fout.write(_concatcomment % infile)
            fin = codecs.open(os.path.join(root, infile), "r", encoding="utf_8_sig")
            fout.write(fin.read())
            fin.close()
            os.unlink(os.path.join(root, infile))
        fout.close()

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


def _add_license(root, license_path="include-license.txt"):
    """
    Read a license from license_path and append it to all files under root
    whose extension is in _license_exts.
    """
    if not os.path.isfile(license_path):
        return
    
    lfile = codecs.open(license_path, "r", encoding="utf_8_sig")
    license = lfile.read()
    lfile.close()
    
    license_files = []
    for base, dirs, files in os.walk(root):
        license_files.extend( [ os.path.join(base, f) for f in files if f.endswith(_license_exts)] )
    
    for f in license_files:
        source = codecs.open(f, "r", encoding="utf_8_sig")
        tmpfd, tmppath = tempfile.mkstemp(".tmp", "dfbuild.")
        tmpfile = os.fdopen(tmpfd, "w")
        wrapped = codecs.getwriter("utf_8_sig")(tmpfile)
        wrapped.write(license)
        wrapped.write("\n")
        wrapped.write(source.read())
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
        source = codecs.open(f, "r", encoding="utf_8_sig")
        tmpfd, tmppath = tempfile.mkstemp(".tmp", "dfbuild.")
        tmpfile = os.fdopen(tmpfd, "w")
        wrapped = codecs.getwriter("utf_8_sig")(tmpfile)
        for line in source:
            for key, val in keywords.items():
                line = line.replace(key, val)
            wrapped.write(line)
            
        source.close()
        tmpfile.close()
        shutil.copy(tmppath, f)
        os.unlink(tmppath)

def _is_utf8(path):
    """Check if file at path is utf8. Note that this only checks for a
    utf8 BOM, nothing more
    """
    if not os.path.isfile(path): return None
    f = open(path, "rb")
    return "test-scripts" in path and True or f.read(3) == codecs.BOM_UTF8
    
def _minify_buildout(src):
    """
    Run minification on all javascript files in directory src. Minification
    is done in-place, so the original file is replaced with the minified one.
    """
    for base, dirs, files in os.walk(src):
        for file in [f for f in files if f.endswith(".js")]:
            abs = os.path.join(base, file)
            jsminify.minify_in_place(abs)
            
def _localize_buildout(src, langdir):
    """Make a localized version of the build dir. That is, with one
    script.js for each language, with a prefix suffix for each language
    src: directory containing the finished build
    language: dir containing language files. NOT in build dir!
    
    Note, this function knows much more than it should about the structure
    of the build. The whole thing should possibly be refactored :(
    """
    tmpfiles = []
    scriptpath = os.path.normpath(os.path.join(src, "script/dragonfly.js"))
    fp = codecs.open(scriptpath, "r", encoding="utf_8_sig")
    script_data = fp.read()
    fp.close()
 
    clientpath = os.path.normpath(os.path.join(src, "client-en.xml"))
    fp = codecs.open(clientpath, "r", encoding="utf_8_sig")
    clientdata = fp.read()
    fp.close()

    # Grab all english data. Will be put in front of localized strings so
    # there are fallbacks
    englishfile = os.path.join(langdir, "ui_strings-en.js")
    fp = codecs.open(englishfile, "r", encoding="utf_8_sig")
    englishdata = fp.read()
    fp.close()
    
    langnames = [f for f in os.listdir(langdir) if f.startswith("ui_strings-") and f.endswith(".js") ]
    langnames = [f.replace("ui_strings-", "").replace(".js", "") for f in langnames]
    
    for lang, newscriptpath, newclientpath, path in [ (ln, "script/dragonfly-"+ln+".js", "client-"+ln+".xml", os.path.join(langdir, "ui_strings-"+ln+".js")) for ln in langnames ]:
        newscript = codecs.open(os.path.join(src,newscriptpath), "w", encoding="utf_8_sig")
        newclient = codecs.open(os.path.join(src, newclientpath), "w", encoding="utf_8_sig")

        if not options.minify:
            newscript.write(_concatcomment % englishfile)
        newscript.write(englishdata)
        langfile = codecs.open(path, "r", encoding="utf_8_sig")
        if not options.minify:
            newscript.write(_concatcomment % path)
        newscript.write(langfile.read())
        newscript.write(script_data)
        newclient.write(clientdata.replace("dragonfly.js", "dragonfly" + "-" + lang +".js"))
        newclient.close()
        langfile.close()
        newscript.close()
        
    os.unlink(os.path.join(src, "script/dragonfly.js"))
    while tmpfiles:
        os.unlink(tmpfiles.pop())
        

def _get_bad_encoding_files(src):
    """Check the source directory if it passes the criteria for a valid
    build. This means all files should be utf8 with a bom and all language
    strings present in the sources should be present in all the language
    files"""
    files = os.walk(src)
    
    bad = []
    for base, dirs, files in os.walk(src):
        for file in [f for f in files if f.endswith(_text_exts)]:
            abs = os.path.join(base, file)
            if not _is_utf8(abs): bad.append(abs)
            
    return bad

def _get_string_keys(path):
    """Grab all the string keys of out a language file"""
    re_key = re.compile("^ *ui_strings\.([^ =]*)")
    fp = codecs.open(path, "r", "utf_8_sig")
    lang_keys = set()
    for line in fp:
        lang_keys.update(re_key.findall(line))
    fp.close()
    return lang_keys
 
def _get_missing_strings(path, master):
    """Get the differences between the set of all strings and the
    strings in path"""
    keys = _get_string_keys(path)
    diff = master - keys
    return diff

def _get_missing_strings_for_dir(stringsdir, masterlang):
    stringfiles = os.listdir(stringsdir)
    masterfile = os.path.join(stringsdir, "ui_strings-%s.js" % masterlang )
    missing = {}
    if not os.path.isfile(masterfile): return None

    masterstrings = _get_string_keys(masterfile)
    
    for path, lang in [(f, f[-5:-3]) for f in stringfiles]:
        if lang==masterlang: continue
        langfile = os.path.join(stringsdir, "ui_strings-%s.js" % lang)
        if not os.path.isfile(langfile):
            continue
        s = _get_missing_strings(langfile, masterstrings)

        if s:
            missing[lang] = s
            
    return missing

def _clobbering_copytree(src, dst, symlinks=False):
    """This is a modified version of copytree from the shutil module in
    the standard library. This version will allow copying to existing folders
    and will clobber existing files. USE WITH CAUTION!
    Original docstring follows:
    
    Recursively copy a directory tree using copy2().

    The destination directory must not already exist.
    If exception(s) occur, an Error is raised with a list of reasons.

    If the optional symlinks flag is true, symbolic links in the
    source tree result in symbolic links in the destination tree; if
    it is false, the contents of the files pointed to by symbolic
    links are copied.

    XXX Consider this example code rather than the ultimate tool.

    """
    names = os.listdir(src)
    if not os.path.isdir(dst):
        os.makedirs(dst)

    errors = []
    for name in names:
        srcname = os.path.join(src, name)
        dstname = os.path.join(dst, name)
        try:
            if symlinks and os.path.islink(srcname):
                linkto = os.readlink(srcname)
                os.symlink(linkto, dstname)
            elif os.path.isdir(srcname):
                _clobbering_copytree(srcname, dstname, symlinks)
            else:
                shutil.copy2(srcname, dstname)
            # XXX What about devices, sockets etc.?
        except (IOError, os.error), why:
            errors.append((srcname, dstname, str(why)))
        # catch the Error from the recursive copytree so that we can
        # continue with other files
        except Error, err:
            errors.extend(err.args[0])
    try:
        shutil.copystat(src, dst)
    except WindowsError:
        # can't copy file access times on Windows
        pass
    except OSError, why:
        errors.extend((src, dst, str(why)))
    if errors:
        raise Error, errors

def _data_uri_from_path(path):
    if os.path.isfile(path):
        fp = open(path, "rb")
        return "'data:image/png;charset=utf-8;base64," + base64.b64encode(fp.read()) + "'"
    else:
        return None

def _find_file_path(base, file_name):
    for dirpath, dirs, fns in os.walk(base):
        for fn in fns:
            if fn == file_name:
                return os.path.join(dirpath, fn)
    return None

def URI_to_os_path(path):
    return os.path.join(*[urllib.unquote(part) for part in path.split('/')])

def _convert_imgs_to_data_uris(src):
    re_img = re.compile(r""".*?url\((['"]?(.*?)['"]?)\)""")
    deletions = []
    for base, dirs, files in os.walk(src):
        for path in [ os.path.join(base, f) for f in files if f.endswith(".css") ]:
            fp = codecs.open(path, "r", "utf_8_sig")
            dirty = False
            temp = StringIO.StringIO()
            for line in fp:
                match = re_img.findall(line)
                if match:
                    for full, stripped in match:
                        file_path = os.path.join(base, URI_to_os_path(stripped))
                        if not os.path.isfile(file_path):
                            # src is actually the target destination of the build
                            # that means the relations of css and according images 
                            # are lost. Clashing filenames will cause problems.
                            parts = stripped.split('/')
                            file_name = parts[len(parts) - 1]
                            file_path = _find_file_path(src, file_name)
                        uri = ""
                        if file_path:
                            deletions.append(file_path)
                            uri = _data_uri_from_path(file_path)
                        if uri:
                            temp.write(line.replace(full, uri).encode("ascii"))
                        else:
                            if not stripped.startswith("data:"):
                                print "no data uri for path:", os.path.join(base, URI_to_os_path(stripped)) 
                            temp.write(line.encode("ascii"))
                            dirty = True
                else:
                    temp.write(line.encode("ascii", "xmlcharrefreplace"))
                    dirty = True

            if dirty:
                fp.close()
                fp = codecs.open(path, "w", encoding="utf_8_sig")
                temp.seek(0)
                fp.write(temp.read().encode("utf-8"))
                fp.close()
                
    for path in deletions:
        if os.path.isfile(path): os.unlink(path)

def _make_rel_url_path(src, dst):
    """src is a file or dir which wants to adress dst relatively, calculate
    the appropriate path to get from here to there."""
    srcdir = os.path.abspath(src + "/..")
    dst = os.path.abspath(dst)

    # For future reference, I hate doing dir munging with string operations
    # with a fiery passion, but pragmatism won out over making a lib.. .
    
    common = os.path.commonprefix((srcdir, dst))
    
    reldst = dst[len(common):]
    srcdir = srcdir[len(common):]

    newpath = re.sub(""".*?[/\\\]|.+$""", "../", srcdir) or "./"
    newpath = newpath + reldst
    newpath = newpath.replace("\\", "/")
    newpath = newpath.replace("//", "/")
    return newpath

def make_archive(src, dst, in_subdir=True):
    """This simply packs up the contents in the directory src into a zip
    archive dst. This is here so we can easily zip stuff from build files
    without forcing the user to install a command line zip tool. If in_subdir
    is true, the archive will contain a top level directory with the same
    name as the archive, without the extension. If it is false, the files are
    put in the root of the archive
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
           exclude_dirs=[], exclude_files=[], directive_vars={}):
    """
    Build from a directory to a directory.
    
    src: Source dir to build from
    dst: destination directory to build to
    process_directives: if true, process <!-- command.. directives in html/xml files
    Keywords: key/value pairs used for keyword replacement on the sources. As in,
        if the source files contain $date$ the keywords dict could contain
        {"$date$": "23.09.08"}, to insert that date into the sources.
    exclude_dirs: directoriy blacklist. Will not be included in the build
    exclude_files: file blacklist. Will not be included in the build
    license: path to a license file to append to sources
    directive_vars: a dictionary that will passed on to the diretive handling.
        Can be used to control the handling of the directives
    """

    src = os.path.abspath(src); # make sure it's absolute

    # get a temporary place to do stuff
    tmpbase = tempfile.mkdtemp(".tmp", "dfbuild.")
    ## this is kinda dumb but copytree always copy to a non-extant subdir
    tmpdir = os.path.join(tmpbase, "src")
    shutil.copytree(src, tmpdir)

    if process_directives:
        _process_directive_files(tmpdir, directive_vars)
        
    # remove empty directories and stuff in the blacklist
    _clean_dir(tmpdir, exclude_dirs, exclude_files)
        
    if keywords:
        _add_keywords(tmpdir, keywords)
        
    #copy the stuff to its final destination and get rid of temp copy:
    if not os.path.isdir(dst):
        os.mkdir(dst)
    
    # stupid copy function to get around the must-put-in-subdir thingy in shutil.copytree
    for entry in os.listdir(tmpdir):
        path = os.path.join(tmpdir, entry)
        if os.path.isdir(path):
            _clobbering_copytree(path, os.path.join(dst, entry))
        else:
            shutil.copy(os.path.join(tmpdir,entry), dst)

    shutil.rmtree(tmpbase)

def _ansi2utf8(path):
    f = codecs.open(path, 'r', 'utf-8')
    c = f.read()
    f.close()
    f = codecs.open(path, 'w', 'utf_8_sig')
    f.write(c)
    f.close()

def main(argv=sys.argv):
    """
    Entry point when the script is called from the command line, not used
    as a module.
    """
    import optparse
    usage = """%prog [options] source [destination]
    
Destination can be either a directory or a zip file"""
    parser = optparse.OptionParser(usage)
    parser.add_option("-c", "--no-concat", dest="concat",
                      default=True, action="store_false",
                      help="Do NOT concatenate script and css")
    parser.add_option("-l", "--no-license", dest="license",
                      default=True, action="store_false",
                      help="Do NOT append license file to js and css. (license is taken from $cwd/include-license.txt")
    parser.add_option("-k", "--keyword", dest="kwlist",
                      default=None, type="string", action="append",
                      help="A key/value pair. All instances of key will be replaced by value in all files. More than one key/value is allowed by adding more -k switches", metavar="key=value")
    parser.add_option("-d", "--delete", default=False,
                      action="store_true", dest="overwrite_dst",
                      help="Delete the destination before copying to it. Makes sure that there are no files left over from previous builds. Is destructive!")
    parser.add_option("-t", "--translate", default=False,
                      action="store_true", dest="translate_build",
                      help="Apply translation changes to the finished build")
    parser.add_option("-s", "--no-string-check", default=True,
                      action="store_false", dest="check_strings",
                      help="Don't check validity of strings before building")
    parser.add_option("-e", "--no-enc-check", default=True,
                      action="store_false", dest="check_encodings",
                      help="Don't check encoding of files before building")
    parser.add_option("-m", "--minify", default=False,
                      action="store_true", dest="minify",
                      help="Minify the sources")
    parser.add_option("-u", "--no-data-uri", default=True,
                      action="store_false", dest="make_data_uris",
                      help="Don't generate data URIs for images in css")

    parser.add_option("-b", "--set-base", default=None,
                      type="string", dest="set_base",
                      help="""Set a base url in the document. """
                      """The value of the setting is the realative root in the """
                      """destination path. E.g. a the value "app" with the destination"""
                      """ "<some loca path>/app/core-2-5" will set the base url"""
                      """ to "/app/core-2-5/". The purpose is to ba able to rewrite"""
                      """ urls without breaking other urls of the rewritten document,"""
                      """ e.g. handling all different core version on the "/app/" path"""
                      """ without redirects.""")

    parser.add_option("--fixBOM", default=False,
                      action="store_true", dest="fix_BOM",
                      help="Try to convert ANSI to UTF8 with BOM. Use only with source.")

    options, args = parser.parse_args()
    globals()['options'] = options

    if len(args) == 1 and options.fix_BOM:
        bad = _get_bad_encoding_files(args[0])
        for path in bad:
            _ansi2utf8(path)
        return 0
    
    # Make sure we have a source and destination
    if len(args) != 2:
        parser.error("Source and destination argument is required")
    else:
        src, dst = args
    
    dirvars = {}
    
    if options.concat:
        exdirs = ["scripts", "ui-style", "ecma-debugger", "ui-strings"]
    else:
        exdirs = []
    
    if options.translate_build:
        dirvars["exclude_uistrings"]=True

    if options.set_base:
        path_segs = os.path.normpath(dst).split(os.sep)
        pos = path_segs.index(options.set_base)
        dirvars["base_url"] = pos > -1 and "/%s/" % "/".join(path_segs[pos:]) or ""
    
    # Parse the keyword definitons
    keywords = {}
    if options.kwlist:
        try:
            for kw in options.kwlist:
                key, val = kw.split("=")
                keywords[key] = val
        except ValueError:
            parser.error("""Could not parse keyword option: "%s" """ % kw)
    
    if options.translate_build and not options.concat:
        parser.error("""Can't translate when not concatenateing. use --no-concat OR --translate""")
    
    if options.check_encodings:
        bad = _get_bad_encoding_files(src)
        if bad:
            print "The following files do not seem to be UTF8 with BOM encoded:"
            for b in bad: print "\t%s" % b
            sys.exit()

    if options.check_strings:
        missingstrings = _get_missing_strings_for_dir(os.path.join(src, "ui-strings"), "en")
        if missingstrings==None:
            print "couldn't parse the master string list!"
            sys.exit()
        elif missingstrings:
            for lang, strings in missingstrings.items():
                print """Language "%s" is missing the following strings:""" % lang
                for s in strings: print "\t%s" % s
            sys.exit()
    
    if dst.endswith(".zip"): # export to a zip file
        if os.path.isfile(dst):
            if not options.overwrite_dst:
                parser.error("Destination exists! use -d to force overwrite")
            else:
                os.unlink(dst)

        tempdir = tempfile.mkdtemp(".tmp", "dfbuild.")
        export(src, tempdir, process_directives=options.concat, exclude_dirs=exdirs,
               keywords=keywords, directive_vars=dirvars)

        if options.translate_build:
            _localize_buildout(tempdir, os.path.join(os.path.abspath(src), "ui-strings"))

        if options.make_data_uris:
            _convert_imgs_to_data_uris(dst)

        if options.minify:
            _minify_buildout(dst)

        if options.license:
            _add_license(tempdir)

        make_archive(tempdir, dst)
        shutil.rmtree(tempdir)

    else: # export to a directory
        if os.path.isdir(dst) and not options.overwrite_dst:
            parser.error("Destination exists! use -d to force overwrite")

        export(src, dst, process_directives=options.concat, exclude_dirs=exdirs,
               keywords=keywords, directive_vars=dirvars)

        if options.translate_build:
            _localize_buildout(dst, os.path.join(os.path.abspath(src), "ui-strings"))

        if options.make_data_uris:
            _convert_imgs_to_data_uris(dst)
            # any remaining image in ui-images is not used
            img_dir = os.path.join(dst, 'ui-images')
            shutil.rmtree(img_dir)
 
        if options.minify:
            _minify_buildout(dst)

        if options.license:
            _add_license(dst)

        AUTHORS = os.path.join(src, '..', 'AUTHORS')
        if os.path.isfile(AUTHORS):
            shutil.copy(AUTHORS, os.path.join(dst, 'AUTHORS'))
            


if __name__ == "__main__":
    sys.exit(main())
 
