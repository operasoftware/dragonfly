# Opera Dragonfly

## Directories

`src`: source code for dragonfly client

`docs`: documentation that is not auto-generated

`tools`: tools needed for building/distributing/testing

## Developing Dragonfly

When working on the code base you should use the `dragonkeeper`
tool. See [dragonkeeper's README](https://github.com/operasoftware/dragonkeeper/blob/master/README.md)
for more information.

## Building Dragonfly

**Note:** It is not necessary to build Dragonfly during development. See above.

Building is done using the `df2` tool. For more information, see
[https://github.com/operasoftware/dragonfly-build-tools](https://github.com/operasoftware/dragonfly-build-tools).

## Running test builds of dragonfly

Open [opera:config#DeveloperTools|DeveloperToolsURL](opera:config#DeveloperTools|DeveloperToolsURL) and set the URL to the
path to the Dragonfly build to use.

## Updating translations

**NOTE**: While translated strings are placed in the `src/ui-strings`
directory, that is not the authoritative location for translations.
Strings are kept in Opera's translation infrastructure, which uses .po
files. These are not publicly available.

As a consequence, we can not integrate string fixes from volunteers by
simply merging new versions of the JavaScript string files.

Translations currently offered:
  Беларуская (be), Български (bg), Česky (cs), Deutsch (de), U.S. English (en),
  British English (en-GB), Español (España) (es-ES), Español (Latinoamérica) (es-LA),
  Eesti keel (et), Français (fr), Français Canadien (fr-CA), Frysk (fy), Gàidhlig (gd),
  Magyar (hu), Bahasa Indonesia (id), Italiano (it), 日本語 (ja), ქართული (ka),
  македонски јазик (mk), Norsk bokmål (nb), Nederlands (nl), Norsk nynorsk (nn),
  Polski (pl), Português (pt), Português (Brasil) (pt-BR), Română (ro), Русский язык (ru),
  Slovenčina (sk), српски (sr), Svenska (sv), Türkçe (tr), Українська (uk), 简体中文 (zh-cn),
  繁體中文 (zh-tw)

