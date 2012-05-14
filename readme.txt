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

Building is done using the DF2 tool. For more information, see

https://bitbucket.org/scope/dragonfly-tools/


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

The translation workflow is as follows [TODO: UPDATE ME]:

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

Translations currently offered:
  Беларуская (be), Български (bg), Česky (cs), Deutsch (de), U.S. English (en), 
  British English (en-GB), Español (España) (es-ES), Español (Latinoamérica) (es-LA), 
  Eesti keel (et), Français (fr), Français Canadien (fr-CA), Frysk (fy), Gàidhlig (gd), 
  Magyar (hu), Bahasa Indonesia (id), Italiano (it), 日本語 (ja), ქართული (ka), 
  македонски јазик (mk), Norsk bokmål (nb), Nederlands (nl), Norsk nynorsk (nn), 
  Polski (pl), Português (pt), Português (Brasil) (pt-BR), Română (ro), Русский язык (ru), 
  Slovenčina (sk), српски (sr), Svenska (sv), Türkçe (tr), Українська (uk), 简体中文 (zh-cn), 
  繁體中文 (zh-tw)
