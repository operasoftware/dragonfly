function SpecLinks()
{
  if (SpecLinks.__instance__)
  {
    return SpecLinks.__instance__;
  }
  else
  {
    SpecLinks.__instance__ = this;
  }

  this.get_spec_links = function(spec_notations)
  {
    var specs = [];
    spec_notations = spec_notations.replace(/\s+/g, "").split(",");
    spec_notations.forEach(function(spec_notation)
    {
      var spec_link = this.get_spec_link(spec_notation);
      if (spec_link)
      {
        specs.push(spec_link);
      }
    }, this);
    return specs;
  };

  this.get_spec_link = function(spec_notation)
  {
    var hash_pos = spec_notation.indexOf("#");
    if (hash_pos > 0) {
      var spec = spec_notation.slice(0, hash_pos);
      var prop = spec_notation.slice(hash_pos + 1);
      var props = SpecLinks.specs[spec];
      if (props)
      {
        var url = props[prop];
        if (url)
        {
          return {
            spec: spec,
            prop: prop,
            url: url
          };
        }
      }
    }
    return null;
  };

  this.open_spec_link = function(spec_link)
  {
    if (spec_link)
    {
      window.open(spec_link);
    }
    else
    {
      alert("No specification found.");
    }
  };
}

SpecLinks.specs = {
  "css": {
    "azimuth": "http://www.w3.org/TR/CSS2/aural.html#propdef-azimuth",
    "background-attachment": "http://www.w3.org/TR/CSS2/colors.html#propdef-background-attachment",
    "background-color": "http://www.w3.org/TR/CSS2/colors.html#propdef-background-color",
    "background-image": "http://www.w3.org/TR/CSS2/colors.html#propdef-background-image",
    "background-position": "http://www.w3.org/TR/CSS2/colors.html#propdef-background-position",
    "background-repeat": "http://www.w3.org/TR/CSS2/colors.html#propdef-background-repeat",
    "background": "http://www.w3.org/TR/CSS2/colors.html#propdef-background",
    "border-collapse": "http://www.w3.org/TR/CSS2/tables.html#propdef-border-collapse",
    "border-color": "http://www.w3.org/TR/CSS2/box.html#propdef-border-color",
    "border-spacing": "http://www.w3.org/TR/CSS2/tables.html#propdef-border-spacing",
    "border-style": "http://www.w3.org/TR/CSS2/box.html#propdef-border-style",
    "border-top": "http://www.w3.org/TR/CSS2/box.html#propdef-border-top",
    "border-right": "http://www.w3.org/TR/CSS2/box.html#propdef-border-right",
    "border-bottom": "http://www.w3.org/TR/CSS2/box.html#propdef-border-bottom",
    "border-left": "http://www.w3.org/TR/CSS2/box.html#propdef-border-left",
    "border-top-color": "http://www.w3.org/TR/CSS2/box.html#propdef-border-top-color",
    "border-right-color": "http://www.w3.org/TR/CSS2/box.html#propdef-border-right-color",
    "border-bottom-color": "http://www.w3.org/TR/CSS2/box.html#propdef-border-bottom-color",
    "border-left-color": "http://www.w3.org/TR/CSS2/box.html#propdef-border-left-color",
    "border-top-style": "http://www.w3.org/TR/CSS2/box.html#propdef-border-top-style",
    "border-right-style": "http://www.w3.org/TR/CSS2/box.html#propdef-border-right-style",
    "border-bottom-style": "http://www.w3.org/TR/CSS2/box.html#propdef-border-bottom-style",
    "border-left-style": "http://www.w3.org/TR/CSS2/box.html#propdef-border-left-style",
    "border-top-width": "http://www.w3.org/TR/CSS2/box.html#propdef-border-top-width",
    "border-right-width": "http://www.w3.org/TR/CSS2/box.html#propdef-border-right-width",
    "border-bottom-width": "http://www.w3.org/TR/CSS2/box.html#propdef-border-bottom-width",
    "border-left-width": "http://www.w3.org/TR/CSS2/box.html#propdef-border-left-width",
    "border-width": "http://www.w3.org/TR/CSS2/box.html#propdef-border-width",
    "border": "http://www.w3.org/TR/CSS2/box.html#propdef-border",
    "bottom": "http://www.w3.org/TR/CSS2/visuren.html#propdef-bottom",
    "caption-side": "http://www.w3.org/TR/CSS2/tables.html#propdef-caption-side",
    "clear": "http://www.w3.org/TR/CSS2/visuren.html#propdef-clear",
    "clip": "http://www.w3.org/TR/CSS2/visufx.html#propdef-clip",
    "color": "http://www.w3.org/TR/CSS2/colors.html#propdef-color",
    "content": "http://www.w3.org/TR/CSS2/generate.html#propdef-content",
    "counter-increment": "http://www.w3.org/TR/CSS2/generate.html#propdef-counter-increment",
    "counter-reset": "http://www.w3.org/TR/CSS2/generate.html#propdef-counter-reset",
    "cue-after": "http://www.w3.org/TR/CSS2/aural.html#propdef-cue-after",
    "cue-before": "http://www.w3.org/TR/CSS2/aural.html#propdef-cue-before",
    "cue": "http://www.w3.org/TR/CSS2/aural.html#propdef-cue",
    "cursor": "http://www.w3.org/TR/CSS2/ui.html#propdef-cursor",
    "direction": "http://www.w3.org/TR/CSS2/visuren.html#propdef-direction",
    "display": "http://www.w3.org/TR/CSS2/visuren.html#propdef-display",
    "elevation": "http://www.w3.org/TR/CSS2/aural.html#propdef-elevation",
    "empty-cells": "http://www.w3.org/TR/CSS2/tables.html#propdef-empty-cells",
    "float": "http://www.w3.org/TR/CSS2/visuren.html#propdef-float",
    "font-family": "http://www.w3.org/TR/CSS2/fonts.html#propdef-font-family",
    "font-size": "http://www.w3.org/TR/CSS2/fonts.html#propdef-font-size",
    "font-style": "http://www.w3.org/TR/CSS2/fonts.html#propdef-font-style",
    "font-variant": "http://www.w3.org/TR/CSS2/fonts.html#propdef-font-variant",
    "font-weight": "http://www.w3.org/TR/CSS2/fonts.html#propdef-font-weight",
    "font": "http://www.w3.org/TR/CSS2/fonts.html#propdef-font",
    "height": "http://www.w3.org/TR/CSS2/visudet.html#propdef-height",
    "left": "http://www.w3.org/TR/CSS2/visuren.html#propdef-left",
    "letter-spacing": "http://www.w3.org/TR/CSS2/text.html#propdef-letter-spacing",
    "line-height": "http://www.w3.org/TR/CSS2/visudet.html#propdef-line-height",
    "list-style-image": "http://www.w3.org/TR/CSS2/generate.html#propdef-list-style-image",
    "list-style-position": "http://www.w3.org/TR/CSS2/generate.html#propdef-list-style-position",
    "list-style-type": "http://www.w3.org/TR/CSS2/generate.html#propdef-list-style-type",
    "list-style": "http://www.w3.org/TR/CSS2/generate.html#propdef-list-style",
    "margin-right": "http://www.w3.org/TR/CSS2/box.html#propdef-margin-right",
    "margin-left": "http://www.w3.org/TR/CSS2/box.html#propdef-margin-left",
    "margin-top": "http://www.w3.org/TR/CSS2/box.html#propdef-margin-top",
    "margin-bottom": "http://www.w3.org/TR/CSS2/box.html#propdef-margin-bottom",
    "margin": "http://www.w3.org/TR/CSS2/box.html#propdef-margin",
    "max-height": "http://www.w3.org/TR/CSS2/visudet.html#propdef-max-height",
    "max-width": "http://www.w3.org/TR/CSS2/visudet.html#propdef-max-width",
    "min-height": "http://www.w3.org/TR/CSS2/visudet.html#propdef-min-height",
    "min-width": "http://www.w3.org/TR/CSS2/visudet.html#propdef-min-width",
    "orphans": "http://www.w3.org/TR/CSS2/page.html#propdef-orphans",
    "outline-color": "http://www.w3.org/TR/CSS2/ui.html#propdef-outline-color",
    "outline-style": "http://www.w3.org/TR/CSS2/ui.html#propdef-outline-style",
    "outline-width": "http://www.w3.org/TR/CSS2/ui.html#propdef-outline-width",
    "outline": "http://www.w3.org/TR/CSS2/ui.html#propdef-outline",
    "overflow": "http://www.w3.org/TR/CSS2/visufx.html#propdef-overflow",
    "padding-top": "http://www.w3.org/TR/CSS2/box.html#propdef-padding-top",
    "padding-right": "http://www.w3.org/TR/CSS2/box.html#propdef-padding-right",
    "padding-bottom": "http://www.w3.org/TR/CSS2/box.html#propdef-padding-bottom",
    "padding-left": "http://www.w3.org/TR/CSS2/box.html#propdef-padding-left",
    "padding": "http://www.w3.org/TR/CSS2/box.html#propdef-padding",
    "page-break-after": "http://www.w3.org/TR/CSS2/page.html#propdef-page-break-after",
    "page-break-before": "http://www.w3.org/TR/CSS2/page.html#propdef-page-break-before",
    "page-break-inside": "http://www.w3.org/TR/CSS2/page.html#propdef-page-break-inside",
    "pause-after": "http://www.w3.org/TR/CSS2/aural.html#propdef-pause-after",
    "pause-before": "http://www.w3.org/TR/CSS2/aural.html#propdef-pause-before",
    "pause": "http://www.w3.org/TR/CSS2/aural.html#propdef-pause",
    "pitch-range": "http://www.w3.org/TR/CSS2/aural.html#propdef-pitch-range",
    "pitch": "http://www.w3.org/TR/CSS2/aural.html#propdef-pitch",
    "play-during": "http://www.w3.org/TR/CSS2/aural.html#propdef-play-during",
    "position": "http://www.w3.org/TR/CSS2/visuren.html#propdef-position",
    "quotes": "http://www.w3.org/TR/CSS2/generate.html#propdef-quotes",
    "richness": "http://www.w3.org/TR/CSS2/aural.html#propdef-richness",
    "right": "http://www.w3.org/TR/CSS2/visuren.html#propdef-right",
    "speak-header": "http://www.w3.org/TR/CSS2/aural.html#propdef-speak-header",
    "speak-numeral": "http://www.w3.org/TR/CSS2/aural.html#propdef-speak-numeral",
    "speak-punctuation": "http://www.w3.org/TR/CSS2/aural.html#propdef-speak-punctuation",
    "speak": "http://www.w3.org/TR/CSS2/aural.html#propdef-speak",
    "speech-rate": "http://www.w3.org/TR/CSS2/aural.html#propdef-speech-rate",
    "stress": "http://www.w3.org/TR/CSS2/aural.html#propdef-stress",
    "table-layout": "http://www.w3.org/TR/CSS2/tables.html#propdef-table-layout",
    "text-align": "http://www.w3.org/TR/CSS2/text.html#propdef-text-align",
    "text-decoration": "http://www.w3.org/TR/CSS2/text.html#propdef-text-decoration",
    "text-indent": "http://www.w3.org/TR/CSS2/text.html#propdef-text-indent",
    "text-transform": "http://www.w3.org/TR/CSS2/text.html#propdef-text-transform",
    "top": "http://www.w3.org/TR/CSS2/visuren.html#propdef-top",
    "unicode-bidi": "http://www.w3.org/TR/CSS2/visuren.html#propdef-unicode-bidi",
    "vertical-align": "http://www.w3.org/TR/CSS2/visudet.html#propdef-vertical-align",
    "visibility": "http://www.w3.org/TR/CSS2/visufx.html#propdef-visibility",
    "voice-family": "http://www.w3.org/TR/CSS2/aural.html#propdef-voice-family",
    "volume": "http://www.w3.org/TR/CSS2/aural.html#propdef-volume",
    "white-space": "http://www.w3.org/TR/CSS2/text.html#propdef-white-space",
    "widows": "http://www.w3.org/TR/CSS2/page.html#propdef-widows",
    "width": "http://www.w3.org/TR/CSS2/visudet.html#propdef-width",
    "word-spacing": "http://www.w3.org/TR/CSS2/text.html#propdef-word-spacing",
    "z-index": "http://www.w3.org/TR/CSS2/visuren.html#propdef-z-index"
  }
};

