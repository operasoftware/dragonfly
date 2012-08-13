"use strict";

/**
 * @fileoverview
 * This file contains arrays of valid values for various CSS properties.
 * They are used for autocompletion in the CSS editor
 * @see Editor
 */

window.suggest_values = (function() {

var COLORS =
[
  'transparent',
  'currentColor',

  // HTML4 color keywords and SVG color keywords
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'greenyellow',
  'grey',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen',

  // CSS System Colors (these are deprecated)
  'ActiveBorder',
  'ActiveCaption',
  'AppWorkspace',
  'Background',
  'ButtonFace',
  'ButtonHighlight',
  'ButtonShadow',
  'ButtonText',
  'CaptionText',
  'GrayText',
  'Highlight',
  'HighlightText',
  'InactiveBorder',
  'InactiveCaption',
  'InactiveCaptionText',
  'InfoBackground',
  'InfoText',
  'Menu',
  'MenuText',
  'Scrollbar',
  'ThreeDDarkShadow',
  'ThreeDFace',
  'ThreeDHighlight',
  'ThreeDLightShadow',
  'ThreeDShadow',
  'Window',
  'WindowFrame',
  'WindowText'
];

var suggest_values = {};

suggest_values['-apple-dashboard-region'] =
suggest_values['-o-link'] =
suggest_values['-o-link-source'] =
suggest_values['-o-tab-size'] =
suggest_values['-o-table-baseline'] =
suggest_values['-o-border-image'] =
[
];

suggest_values['animation'] =
suggest_values['-o-animation'] =
[
];

suggest_values['animation-delay'] =
suggest_values['-o-animation-delay'] =
[
  // <time>
  '0'
];

suggest_values['animation-direction'] =
suggest_values['-o-animation-direction'] =
[
  'normal',
  'alternate'
];

suggest_values['animation-duration'] =
suggest_values['-o-animation-duration'] =
[
  '0'
];

suggest_values['animation-fill-mode'] =
suggest_values['-o-animation-fill-mode'] =
[
  'none',
  'forwards',
  'backwards',
  'both'
];

suggest_values['animation-iteration-count'] =
suggest_values['-o-animation-iteration-count'] =
[
  // <number>
  'infinite'
];

suggest_values['animation-name'] =
suggest_values['-o-animation-name'] =
[
  'none'
];

suggest_values['animation-play-state'] =
suggest_values['-o-animation-play-state'] =
[
  'running',
  'paused'
];

suggest_values['animation-timing-function'] =
suggest_values['-o-animation-timing-function'] =
[
  'ease',
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'cubic-bezier()'
];

suggest_values['-o-object-fit'] =
[
  'fill',
  'contain',
  'cover',
  'inherit'
];

suggest_values['-o-object-position'] =
[
  'top',
  'right',
  'bottom',
  'left',
  'center',
  'inherit'
];

suggest_values['-o-text-overflow'] =
[
  'ellipsis'
];

suggest_values['transform'] =
suggest_values['-o-transform'] =
[
  'none'
];

suggest_values['transform-origin'] =
suggest_values['-o-transform-origin'] =
[
  'left',
  'center',
  'right',
  'top',
  'bottom'
];

suggest_values['transition'] =
suggest_values['-o-transition'] =
[
];

suggest_values['transition-delay'] =
suggest_values['-o-transition-delay'] =
[
];

suggest_values['transition-duration'] =
suggest_values['-o-transition-duration'] =
[
];

suggest_values['transition-property'] =
suggest_values['-o-transition-property'] =
[
  'none',
  'all'
];

suggest_values['transition-timing-function'] =
suggest_values['-o-transition-timing-function'] =
[
  'ease',
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'cubic-bezier()'
];

suggest_values['-wap-accesskey'] =
suggest_values['-wap-input-format'] =
suggest_values['-wap-input-required'] =
suggest_values['-wap-marquee-dir'] =
suggest_values['-wap-marquee-loop'] =
suggest_values['-wap-marquee-speed'] =
suggest_values['-wap-marquee-style'] =
suggest_values['-xv-interpret-as'] =
suggest_values['-xv-phonemes'] =
suggest_values['-xv-voice-balance'] =
suggest_values['-xv-voice-duration'] =
suggest_values['-xv-voice-pitch'] =
suggest_values['-xv-voice-pitch-range'] =
suggest_values['-xv-voice-rate'] =
suggest_values['-xv-voice-stress'] =
suggest_values['-xv-voice-volume'] =
[
];

suggest_values['azimuth'] =
[
  // <angle>
  'left-side',
  'far-left',
  'left',
  'center-left',
  'center',
  'center-right',
  'right',
  'far-right',
  'right-side',
  'behind',
  'leftwards',
  'rightwards',
  'inherit'
];

suggest_values['background-attachment'] =
[
  'scroll',
  'fixed',
  'local',
  'inherit'
];

suggest_values['background-color'] = COLORS.concat('inherit');

suggest_values['background-clip'] =
[
  'border-box',
  'padding-box',
  'content-box',
  'inherit'
];

suggest_values['background-image'] =
[
  // <image>
  'none',
  '-o-linear-gradient()',
  '-o-repeating-linear-gradient()',
  '-o-radial-gradient()',
  '-o-repeating-radial-gradient()',
  'inherit'
];

suggest_values['background-origin'] =
[
  'border-box',
  'padding-box',
  'content-box'
];

suggest_values['background-position'] =
[
  'left',
  'center',
  'right',
  'top',
  'center',
  'bottom'
];

suggest_values['background-size'] =
[
  'auto',
  'cover',
  'contain'
];

suggest_values['background-repeat'] =
[
  'repeat-x',
  'repeat-y',
  'repeat',
  'space',
  'round',
  'no-repeat',
  'inherit'
];

suggest_values['background'] =
  suggest_values['background-attachment']
  .concat(suggest_values['background-color'])
  .concat(suggest_values['background-image'])
  .concat(suggest_values['background-origin'])
  .concat(suggest_values['background-position'])
  .concat(suggest_values['background-size'])
  .concat(suggest_values['background-repeat']);

suggest_values['border-collapse'] =
[
  'collapse',
  'separate'
];

suggest_values['border-spacing'] =
[
  'inherit'
];

suggest_values['border-style'] =
suggest_values['border-top-style'] =
suggest_values['border-right-style'] =
suggest_values['border-bottom-style'] =
suggest_values['border-left-style'] =
[
  'none',
  'hidden',
  'dotted ',
  'dashed',
  'solid',
  'double',
  'groove',
  'ridge',
  'inset',
  'outset',
  'inherit'
];

suggest_values['border-color'] =
suggest_values['border-top-color'] =
suggest_values['border-right-color'] =
suggest_values['border-bottom-color'] =
suggest_values['border-left-color'] = COLORS.concat('inherit');

suggest_values['border-radius'],
suggest_values['border-top-right-radius'],
suggest_values['border-bottom-right-radius'],
suggest_values['border-bottom-left-radius'],
suggest_values['border-top-left-radius'] =
[
];

suggest_values['border-width'] =
suggest_values['border-top-width'] =
suggest_values['border-right-width'] =
suggest_values['border-bottom-width'] =
suggest_values['border-left-width'] =
[
  // <length>
  'thin',
  'medium',
  'thick'
];

suggest_values['border'] =
suggest_values['border-top'] =
suggest_values['border-right'] =
suggest_values['border-bottom'] =
suggest_values['border-left'] =
[
];

suggest_values['bottom'] =
[
  'auto',
  'inherit'
];
suggest_values['box-decoration-break'] =
[
  'slice',
  'clone',
  'inherit'
];

suggest_values['box-sizing'] =
[
  'content-box',
  'border-box',
  'inherit'
];

suggest_values['box-shadow'] =
[
  'inset'
];

suggest_values['break-after'] =
[
  'auto',
  'always',
  'avoid',
  'left',
  'right',
  'page',
  'column',
  'avoid-page',
  'avoid-column'
];

suggest_values['break-before'] =
[
  'auto',
  'always',
  'avoid',
  'left',
  'right',
  'page',
  'column',
  'avoid-page',
  'avoid-column'
];

suggest_values['break-inside'] =
[
  'auto',
  'avoid',
  'avoid-page',
  'avoid-column'
];

suggest_values['caption-side'] =
[
  'top',
  'bottom',
  'inherit'
];

suggest_values['caption-side'] =
[
  'top',
  'bottom',
  'inherit'
];

suggest_values['clear'] =
[
  'none',
  'left',
  'right',
  'both',
  'inherit'
];

suggest_values['clip'] =
[
  'auto',
  'inherit'
];

suggest_values['color'] = COLORS.concat('inherit');

suggest_values['column-count'] =
[
  'auto'
];

suggest_values['column-fill'] =
[
];

suggest_values['column-gap'] =
[
  'normal'
];

suggest_values['column-rule'] =
[
];

suggest_values['column-rule-color'] = COLORS.concat('inherit');

suggest_values['column-rule-style'] =
[
  'none',
  'hidden',
  'dotted ',
  'dashed',
  'solid',
  'double',
  'groove',
  'ridge',
  'inset',
  'outset',
  'inherit'
];

suggest_values['column-rule-width'] =
[
  // <length>
  'thin',
  'medium',
  'thick'
];

suggest_values['column-span'] =
[
  'a',
  'all'
];

suggest_values['column-width'] =
[
  'auto'
];

suggest_values['columns'] =
[
  'auto'
];

suggest_values['content'] =
[
  'normal',
  'none',
  'attr()',
  'open-quote',
  'close-quote',
  'no-open-quote',
  'no-close-quote',
  'inherit'
];

suggest_values['counter-increment'] =
[
  'none',
  'inherit'
];

suggest_values['counter-reset'] =
[
  'none',
  'inherit'
];

suggest_values['cue-after'] =
[
  'none',
  'inherit'
];

suggest_values['cue-before'] =
[
  'none',
  'inherit'
];

suggest_values['cue'] =
[
  'inherit'
];

suggest_values['cursor'] =
[
  'auto',
  'crosshair',
  'default',
  'pointer',
  'move',
  'e-resize',
  'ne-resize',
  'nw-resize',
  'n-resize',
  'se-resize',
  'sw-resize',
  's-resize',
  'w-resize',
  'text',
  'wait',
  'help',
  'progress',
  'inherit',
  '-zoom-in',
  '-zoom-out'
];

suggest_values['direction'] =
[
  'ltr',
  'rtl',
  'inherit'
];

suggest_values['display'] =
[
  'inline',
  'block',
  'list-item',
  'run-in',
  'inline-block',
  'table',
  'inline-table',
  'table-row-group',
  'table-header-group',
  'table-footer-group',
  'table-row',
  'table-column-group',
  'table-column',
  'table-cell',
  'table-caption',
  'none',
  'inherit'
];

suggest_values['elevation'] =
[
  'below',
  'level',
  'above',
  'higher',
  'lower',
  'inherit'
];

suggest_values['empty-cells'] =
[
  'show',
  'hide',
  'inherit'
];

suggest_values['float'] =
[
  'left',
  'right',
  'none',
  'inherit'
];

suggest_values['font-family'] =
[
  'inherit',
  'serif',
  'sans-serif',
  'cursive',
  'fantasy',
  'monospace'
];

suggest_values['font-size'] =
[
  'inherit'
];

suggest_values['font-style'] =
[
  'normal',
  'italic',
  'oblique',
  'inherit'
];

suggest_values['font-variant'] =
[
  'normal',
  'small-caps',
  'inherit'
];

suggest_values['font-weight'] =
[
  'normal',
  'bold',
  'bolder',
  'lighter',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  'inherit'
];

suggest_values['font'] =
[
  'caption',
  'icon',
  'menu',
  'message-box',
  'small-caption',
  'status-bar',
  'inherit'
];

suggest_values['height'] =
[
  'auto',
  'inherit'
];

suggest_values['left'] =
[
  'auto',
  'inherit'
];

suggest_values['letter-spacing'] =
[
  'normal',
  'inherit'
];

suggest_values['line-height'] =
[
  'normal',
  'inherit'
];

suggest_values['list-style-image'] =
[
  'none',
  '-o-linear-gradient()',
  '-o-repeating-linear-gradient()',
  '-o-radial-gradient()',
  '-o-repeating-radial-gradient()',
  'inherit'
];

suggest_values['list-style-position'] =
[
  'inside',
  'outside',
  'inherit'
];

suggest_values['list-style-type'] =
[
  'disc',
  'circle',
  'square',
  'decimal',
  'decimal-leading-zero',
  'lower-roman',
  'upper-roman',
  'lower-greek',
  'lower-latin',
  'upper-latin',
  'armenian',
  'georgian',
  'lower-alpha',
  'upper-alpha',
  'none',
  'inherit'
];

suggest_values['list-style'] =
[
  'inherit'
];

suggest_values['margin'] =
suggest_values['margin-top'] =
suggest_values['margin-bottom'] =
suggest_values['margin-right'] =
suggest_values['margin-left'] =
[
  'inherit'
];

suggest_values['max-height'] =
[
  'none',
  'inherit'
];

suggest_values['max-width'] =
[
  'none',
  'inherit'
];

suggest_values['max-zoom'] =
[
  'auto'
];

suggest_values['min-height'] =
[
  'inherit'
];

suggest_values['min-width'] =
[
  'inherit'
];

suggest_values['min-zoom'] =
[
  'auto'
];

suggest_values['orphans'] =
[
  'inherit'
];

suggest_values['outline-color'] =
[
  'invert'
];

suggest_values['outline-style'] =
[
  'inherit'
];

suggest_values['outline-width'] =
[
  'inherit'
];

suggest_values['outline'] =
[
  'inherit'
];

suggest_values['overflow'] =
suggest_values['overflow-x'] =
suggest_values['overflow-y'] =
[
  'visible',
  'hidden',
  'scroll',
  'auto',
  'no-display',
  'no-content',
  'inherit'
];

suggest_values['padding'] =
suggest_values['padding-top'] =
suggest_values['padding-right'] =
suggest_values['padding-bottom'] =
suggest_values['padding-left'] =
[
  'inherit'
];

suggest_values['page-break-after'] =
[
  'auto',
  'always',
  'avoid',
  'left',
  'right',
  'inherit'
];

suggest_values['page-break-before'] =
[
  'auto',
  'always',
  'avoid',
  'left',
  'right',
  'inherit'
];

suggest_values['page-break-inside'] =
[
  'avoid',
  'auto',
  'inherit'
];

suggest_values['pause-after'] =
[
  'inherit'
];

suggest_values['pause-before'] =
[
  'inherit'
];

suggest_values['pause'] =
[
  'inherit'
];

suggest_values['pitch-range'] =
[
  'inherit'
];

suggest_values['pitch'] =
[
  'x-low',
  'low',
  'medium',
  'high',
  'x-high',
  'inherit'
];

suggest_values['play-during'] =
[
  'mix',
  'repeat',
  'auto',
  'none',
  'inherit'
];

suggest_values['position'] =
[
  'static',
  'relative',
  'absolute',
  'fixed',
  'inherit'
];

suggest_values['quotes'] =
[
  'none',
  'inherit'
];

suggest_values['richness'] =
[
  'inherit'
];

suggest_values['right'] =
[
  'auto',
  'inherit'
];

suggest_values['speak-header'] =
[
  'once',
  'always',
  'inherit'
];

suggest_values['speak-numeral'] =
[
  'digits',
  'continuous',
  'inherit'
];

suggest_values['speak-punctuation'] =
[
  'code',
  'none',
  'inherit'
];

suggest_values['speak'] =
[
  'normal',
  'none',
  'spell-out',
  'inherit'
];

suggest_values['speech-rate'] =
[
  'x-slow',
  'slow',
  'medium',
  'fast',
  'x-fast',
  'faster',
  'slower',
  'inherit'
];

suggest_values['stress'] =
[
  'inherit'
];

suggest_values['table-layout'] =
[
  'auto',
  'fixed',
  'inherit'
];

suggest_values['text-align'] =
[
  'left',
  'right',
  'center',
  'justify',
  'inherit'
];

suggest_values['text-decoration'] =
[
  'none',
  'underline',
  'overline',
  'line-through',
  'blink',
  'inherit'
];

suggest_values['text-indent'] =
[
  'inherit'
];

suggest_values['text-overflow'] =
[
  'clip',
  'ellipsis',
  'inherit'
];

suggest_values['text-transform'] =
[
  'capitalize',
  'uppercase',
  'lowercase',
  'none',
  'inherit'
];

suggest_values['top'] =
[
  'auto',
  'inherit'
];

suggest_values['unicode-bidi'] =
[
  'normal',
  'embed',
  'bidi-override',
  'inherit'
];

suggest_values['user-zoom'] =
[
  'zoom',
  'fixed'
];

suggest_values['vertical-align'] =
[
  'baseline',
  'sub',
  'super',
  'top',
  'text-top',
  'middle',
  'bottom',
  'text-bottom',
  'inherit'
];

suggest_values['visibility'] =
[
  'visible',
  'hidden',
  'collapse',
  'inherit'
];

suggest_values['voice-family'] =
[
  'inherit'
];

suggest_values['volume'] =
[
  'silent',
  'x-soft',
  'soft',
  'medium',
  'loud',
  'x-loud',
  'inherit'
];

suggest_values['white-space'] =
[
  'normal',
  'pre',
  'nowrap',
  'pre-wrap',
  'pre-line',
  'inherit'
];

suggest_values['widows'] =
[
  'inherit'
];

suggest_values['width'] =
[
  'auto',
  'inherit'
];

suggest_values['word-spacing'] =
[
  'normal',
  'inherit'
];

suggest_values['word-wrap'] =
[
  'normal',
  'break-word',
  'inherit'
];

suggest_values['zoom'] =
[
  'auto'
];

suggest_values['z-index'] =
[
  'auto',
  'inherit'
];


// SVG properties

suggest_values["clip-path"] =
[
  // <funciri>
  'none',
  'inherit'
];

suggest_values["clip-rule"] =
[
  'nonzero',
  'evenodd',
  'inherit'
];


suggest_values["nav-up"] =
suggest_values["nav-right"] =
suggest_values["nav-down"] =
suggest_values["nav-left"] =
[
  'auto',
  'current',
  'root',
  'inherit'
];

suggest_values["mask"] =
[
  // <funciri>
  'none',
  'inherit'
];

suggest_values["enable-background"] =
[
  'accumulate',
  // new [ <x> <y> <width> <height> ]
  'inherit'
];

suggest_values["filter"] =
[
  //<funciri>
  'none',
  'inherit'
];

suggest_values["flood-color"] = COLORS.concat('inherit');

suggest_values["flood-opacity"] =
[
  //<opacity-value>
  'inherit'
];

suggest_values["lighting-color"] = COLORS.concat('inherit');

suggest_values["stop-color"] = COLORS.concat('inherit');

suggest_values["stop-opacity"] =
[
  //<opacity-value>
  'inherit'
];

suggest_values["pointer-events"] =
[
  'visiblePainted',
  'visibleFill',
  'visibleStroke',
  'visible',
  'painted',
  'fill',
  'stroke',
  'all',
  'none',
  'inherit'
];

suggest_values["color-interpolation"] =
[
  'auto',
  'sRGB',
  'linearRGB',
  'inherit'
];

suggest_values["color-interpolation-filters"] =
[
  'auto',
  'sRGB',
  'linearRGB',
  'inherit'
];

suggest_values["color-profile"] =
[
  'auto',
  'sRGB',
  // <name> | <iri>
  'inherit'
];

suggest_values["color-rendering"] =
[
  'auto',
  'optimizeSpeed',
  'optimizeQuality',
  'inherit'
];

suggest_values["fill"] = COLORS.concat('none', 'inherit');

suggest_values["fill-rule"] =
[
  'nonzero',
  'evenodd',
  'inherit'
];

suggest_values["fill-opacity"] =
[
  //<opacity-value>
  'inherit'
];

suggest_values["image-rendering"] =
[
  'auto',
  'optimizeSpeed',
  'optimizeQuality',
  'inherit'
];

suggest_values["marker"] =
[
];

suggest_values["marker-end"] =
[
  'none',
  // <funciri>
  'inherit'
];

suggest_values["marker-mid"] =
[
  'none',
  // <funciri>
  'inherit'
];


suggest_values["marker-start"] =
[
  'none',
  // <funciri>
  'inherit'
];


suggest_values["shape-rendering"] =
[
  'auto',
  'optimizeSpeed',
  'crispEdges',
  'geometricPrecision',
  'inherit'
];

suggest_values["stroke"] = COLORS.concat('none', 'inherit');

suggest_values["stroke-dasharray"] =
[
  'none',
  //<dasharray>
  'inherit'
];

suggest_values["stroke-dashoffset"] =
[
  //<percentage> | <length>
  'inherit'
];

suggest_values["stroke-width"] =
[
  //<percentage> | <length>
  'inherit'
];

suggest_values["stroke-linecap"] =
[
  'butt',
  'round',
  'square',
  'inherit'
];

suggest_values["stroke-linejoin"] =
[
  'miter',
  'round',
  'bevel',
  'inherit'
];

suggest_values["stroke-miterlimit"] =
[
  // <miterlimit>
  'inherit'
];

suggest_values["stroke-opacity"] =
[
  // <opacity-value>
  'inherit'
];

suggest_values["text-rendering"] =
[
  'auto',
  'optimizeSpeed',
  'optimizeLegibility',
  'geometricPrecision',
  'inherit'
];

suggest_values["alignment-baseline"] =
[
  'auto',
  'baseline',
  'before-edge',
  'text-before-edge',
  'middle',
  'central',
  'after-edge',
  'text-after-edge',
  'ideographic',
  'alphabetic',
  'hanging',
  'mathematical',
  'inherit'
];

suggest_values["baseline-shift"] =
[
  'baseline',
  'sub',
  'super',
  // <percentage> | <length>
  'inherit'
];

suggest_values["dominant-baseline"] =
[
  'auto',
  'use-script',
  'no-change',
  'reset-size',
  'ideographic',
  'alphabetic',
  'hanging',
  'mathematical',
  'central',
  'middle',
  'text-after-edge',
  'text-before-edge',
  'inherit'
];

suggest_values["glyph-orientation-horizontal"] =
[
  //<angle>
  'inherit'
];

suggest_values["glyph-orientation-vertical"] =
[
  'auto',
  // <angle>
  'inherit'
];

suggest_values["kerning"] =
[
  'auto',
  // <angle>
  'inherit'
];

suggest_values["text-anchor"] =
[
  'start',
  'middle',
  'end',
  'inherit'
];

suggest_values["writing-mode"] =
[
  'lr-tb',
  'rl-tb',
  'tb-rl',
  'lr',
  'rl',
  'tb',
  'inherit'
];


// SVG 1.2 Tiny properties

suggest_values["audio-level"] =
[
  // <number>
  'inherit'
];

suggest_values["buffered-rendering"] =
[
  'auto',
  'dynamic',
  'static',
  'inherit'
];

suggest_values["display-align"] =
[
  'auto',
  'before',
  'center',
  'after',
  'inherit'
];

suggest_values["line-increment"] =
[
  'auto',
  // <number>
  'inherit'
];

suggest_values["solid-color"] = COLORS.concat('inherit');

suggest_values["solid-opacity"] =
[
  // <opacity-value>
  'inherit'
];

// Overlaps with the CSS text-align property
//suggest_values["text-align"] =
//[
//start | end | center | inherit
//];

suggest_values["vector-effect"] =
[
  'non-scaling-stroke',
  'none',
  'inherit'
];

suggest_values["viewport-fill"] = COLORS.concat('inherit');

suggest_values["viewport-fill-opacity"] =
[
  // <opacity-value>
  'inherit'
];

return suggest_values;

})();

