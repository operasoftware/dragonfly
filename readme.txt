Dragonfly

Directories:

src: source code for dragonfly client
docs: documentation that is not auto-generated
tools: tools needed for building/distributing/testing

Developing Dragonfly:

When working on the code base you should use the "dragonkeeper"
tool. See the README file for dragonkeeper for more information:

http://bitbucket.org/scope/dragonkeeper/


Building Dragonfly:

*Note:* It is not necessary to build Dragonfly during development. See above.

Building dragonfly means concatenating resources together (js and css),
adding a license preamble to files, generating inline data-uri
versions of graphics, minifying, translating and doing keyword
substitution on the source files to insert version number and so on.

The build is done using the dfbuild.py tool. This requires python. Currently
it will only work in python 2.5 and 2.6, but minimal changes are required to fix this
if necessary. The module depends on the jsminify module for minifying
scripts. This is bundled with dfbuild.
dfbuild lives in the tools directory in the repository.

This is the command line help for dfbuild:

Usage: dfbuild.py [options] source destination

Destination can be either a directory or a zip file

Options:
  -h, --help            show this help message and exit
  -c, --no-concat       Do NOT concatenate script and css
  -l, --no-license      Do NOT append license file to js and css. (license is
                        taken from $cwd/include-license.txt
  -k key=value, --keyword=key=value
                        A key/value pair. All instances of key will be
                        replaced by value in all files. More than one
                        key/value is allowed by adding more -k switches
  -d, --delete          Delete the destination before copying to it. Makes
                        sure that there are no files left over from previous
                        builds. Is destructive!
  -t, --translate       Apply translation changes to the finished build
  -s, --no-string-check
                        Don't check validity of strings before building
  -e, --no-enc-check    Don't check encoding of files before building
  -m, --minify          Minify the sources
  -u, --no-data-uri     Don't generate data URIs for images in css
  -b SET_BASE, --set-base=SET_BASE
                        Set a base url in the document. The value of the
                        setting is the realative root in the destination path.
                        E.g. a the value "app" with the destination "<some
                        loca path>/app/core-2-5" will set the base url to
                        "/app/core-2-5/". The purpose is to ba able to rewrite
                        urls without breaking other urls of the rewritten
                        document, e.g. handling all different core version on
                        the "/app/" path without redirects.




Suitable command line for release builds

python tools/dfbuild.py -l include-license.txt -m -t -s -k "$dfversion$=Dragonfly testversion" -k "$revdate$=<todays datetime>" src build



Running test builds of dragonfly:

Open opera:config#DeveloperTools|DeveloperToolsURL and set the url to the
path to the dragonfly build to use.

Updating translations:

NOTE: While translated strings are placed in the src/ui-strings
directory, that is not the authoritative location for translations.
Strings are kept in Opera's translation infrastructure, which uses .po
files. These are not publicly available.

As a consequence, we can not integrate string fixes from volunteers by
simply merging new versions of the JavaScript string files. The
strings will need to be whetted by the translations team and
integrated into the Opera translation infrastructure.

To work with translations, you will need Python installed. You will also need
polib, which can be installed e.g. by:

  pip install polib

The translation workflow is as follows:

1. While developing and testing, new string are added to src/ui-strings/ui_strings-en.js

2. Before a release, Dragonfly has to be localized. This is handled by the
translations team. To request translations from the translations team, a so
called DB file has to be created. To generate this file, run the js2strings.py
script, like so:

  python ./tools/js2strings.py ./src/ui-strings/ui_strings-en.js > <db_file>

3. File a BTS task in the TRN project with the DB file attached, CCing relevant people.

4. When strings are returned from the translations team, they are in PO format,
and needs to be converted back to JS files. This is done like so:
- Check out the translations from the translation team to a directory
- Run po2js.py as follows:

  python ./tools/po2js.py -d <po translations checkout dir> ./src/ui-strings

- If there were new languages added, the according JS file needs to be added
  to ./src/client.xml

