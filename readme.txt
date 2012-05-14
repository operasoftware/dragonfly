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

Building is done using the df2 tool. For more information, see

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

The translation workflow is as follows:

1. While developing and testing, new strings are added to src/ui-strings/ui_strings-en.js

2. About twice a year, or when lots of new strings are accumulated, Dragonfly has to be
localized. This is handled by the translations team. To request translations from the 
translations team, a DB file has to be created. To generate this file, use the df2 tool,
like so:

  df2 js2db src/ui-strings/ui_strings-en.js dragonfly<revision>.db
  (See df2 js2db -h for help)

3. File a BTS task with the DB file attached, CCing translang. See DFL-2858 for 
reference.

4. When strings are returned from the translations team, they are in PO format,
and needs to be converted back to JS files. This is done like so:
- Check out the translations from the translation team to a directory
- Use the df2 tool as follows:

  df2 po2js translation-dir src/ui-strings src/ui-strings/ui_strings-en.js
  (See df2 po2js -h for help)

- If there were new languages added, the according JS file needs to be added
  to src/client.xml

5. Changes in the languages that are used the most, need to be reviewed. Mostly 
this is done by DevRel or other developers. File an according BTS task, add subtasks
per language. See DFL-3002 for reference.

- Generate a diff of ui_strings-en.js between the last translated revision and the newest:

  hg diff src/ui-strings/ui_strings-en.js -r last-translated-rev -r tip -U 0 > changed_strings

- Generate a .po file, filtered by changed_strings, to attach to the subtasks like so:

  df2 po2po translation-dir output-dir changed_strings


Translations currently offered:
  Беларуская (be), Български (bg), Česky (cs), Deutsch (de), U.S. English (en), 
  British English (en-GB), Español (España) (es-ES), Español (Latinoamérica) (es-LA), 
  Eesti keel (et), Français (fr), Français Canadien (fr-CA), Frysk (fy), Gàidhlig (gd), 
  Magyar (hu), Bahasa Indonesia (id), Italiano (it), 日本語 (ja), ქართული (ka), 
  македонски јазик (mk), Norsk bokmål (nb), Nederlands (nl), Norsk nynorsk (nn), 
  Polski (pl), Português (pt), Português (Brasil) (pt-BR), Română (ro), Русский язык (ru), 
  Slovenčina (sk), српски (sr), Svenska (sv), Türkçe (tr), Українська (uk), 简体中文 (zh-cn), 
  繁體中文 (zh-tw)
