/**
 * @fileoverview
 * This file contains arrays of valid values for various CSS properties.
 * They are used for autocompletion in the CSS editor
 * @see Editor
 */

const COLORS =
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
[
]

suggest_values['-o-text-overflow'] =
[
  'ellipsis'
]

suggest_values['-o-transform'] =
[
  'none'
]

suggest_values['-o-transform-origin'] =
[
  'left',
  'center',
  'right',
  'top',
  'bottom'
]
suggest_values['-o-transition'] =
[
]

suggest_values['-o-transition-delay'] =
[
]

suggest_values['-o-transition-duration'] =
[
]

suggest_values['-o-transition-property'] =
[
  'none',
  'all'
]

suggest_values['-o-transition-timing-function'] =
[
  'ease',
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'cubic-bezier()'
]

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
]

suggest_values['azimuth']=
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
]

suggest_values['background-attachment']=
[
  'scroll',
  'fixed',
  'local',
  'inherit'
]

suggest_values['background-color'] = COLORS.concat('inherit');

suggest_values['background-clip']=
[
  'border-box',
  'padding-box'
]

suggest_values['background-image']=
[
  // <image>
  'none',
  'inherit'
]

suggest_values['background-origin']=
[
  'border-box',
  'padding-box',
  'content-box'
]

suggest_values['background-position']=
[
  'left',
  'center',
  'right',
  'top',
  'center',
  'bottom'
]

suggest_values['background-size']=
[
  'auto',
  'cover',
  'contain'
]

suggest_values['background-repeat']=
[
  'repeat-x',
  'repeat-y',
  'repeat',
  'space',
  'round',
  'no-repeat',
  'inherit'
]

suggest_values['background']=
[
]

suggest_values['border-collapse']=
[
  'collapse',
  'separate'
]



suggest_values['border-spacing']=
[
  'inherit'
]

suggest_values['border-style']=
suggest_values['border-top-style']=
suggest_values['border-right-style']=
suggest_values['border-bottom-style']=
suggest_values['border-left-style']=
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
]

suggest_values['border-color']=
suggest_values['border-top-color']=
suggest_values['border-right-color']=
suggest_values['border-bottom-color']=
suggest_values['border-left-color']= COLORS.concat('inherit');

suggest_values['border-radius'],
suggest_values['border-top-right-radius'],
suggest_values['border-bottom-right-radius'],
suggest_values['border-bottom-left-radius'],
suggest_values['border-top-left-radius'] =
[
]

suggest_values['border-width']=
suggest_values['border-top-width']=
suggest_values['border-right-width']=
suggest_values['border-bottom-width']=
suggest_values['border-left-width']=
[
  // <length>
  'thin',
  'medium',
  'thick'
]

suggest_values['border']=
suggest_values['border-top']=
suggest_values['border-right']=
suggest_values['border-bottom']=
suggest_values['border-left']=
[
]

suggest_values['bottom']=
[
  'auto',
  'inherit'
]

suggest_values['box-sizing']=
[
  'content-box',
  'border-box',
  'inherit'
]

suggest_values['box-shadow']=
[
  'inset'
]

suggest_values['caption-side']=
[
  'top',
  'bottom',
  'inherit'
]

suggest_values['caption-side']=
[
  'top',
  'bottom',
  'inherit'
]

suggest_values['clear']=
[
  'none',
  'left',
  'right',
  'both',
  'inherit'
]

suggest_values['clip']=
[
  'auto',
  'inherit'
]

suggest_values['color'] = COLORS.concat('inherit');

suggest_values['content']=
[
  'normal',
  'none',
  'attr()',
  'open-quote',
  'close-quote',
  'no-open-quote',
  'no-close-quote',
  'inherit'
]

suggest_values['counter-increment']=
[
  'none',
  'inherit'
]

suggest_values['counter-reset']=
[
  'none',
  'inherit'
]

suggest_values['cue-after']=
[
  'none',
  'inherit'
]

suggest_values['cue-before']=
[
  'none',
  'inherit'
]

suggest_values['cue']=
[
  'inherit'
]

suggest_values['cursor']=
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
  'inherit'
]

suggest_values['direction']=
[
  'ltr',
  'rtl',
  'inherit'
]

suggest_values['display']=
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
]

suggest_values['elevation']=
[
  'below',
  'level',
  'above',
  'higher',
  'lower',
  'inherit'
]

suggest_values['empty-cells']=
[
  'show',
  'hide',
  'inherit'
]

suggest_values['float']=
[
  'left',
  'right',
  'none',
  'inherit'
]

suggest_values['font-family']=
[
  'inherit'
]

suggest_values['font-size']=
[
  'inherit'
]

suggest_values['font-style']=
[
  'normal',
  'italic',
  'oblique',
  'inherit'
]

suggest_values['font-variant']=
[
  'normal',
  'small-caps',
  'inherit'
]

suggest_values['font-weight']=
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
]

suggest_values['font']=
[
  'caption',
  'icon',
  'menu',
  'message-box',
  'small-caption',
  'status-bar',
  'inherit'
]

suggest_values['height']=
[
  'auto',
  'inherit'
]

suggest_values['left']=
[
  'auto',
  'inherit'
]

suggest_values['letter-spacing']=
[
  'normal',
  'inherit'
]

suggest_values['line-height']=
[
  'normal',
  'inherit'
]

suggest_values['list-style-image']=
[
  'none',
  'inherit'
]

suggest_values['list-style-position']=
[
  'inside',
  'outside',
  'inherit'
]

suggest_values['list-style-type']=
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
]

suggest_values['list-style']=
[
  'inherit'
]

suggest_values['margin']=
suggest_values['margin-top']=
suggest_values['margin-bottom']=
suggest_values['margin-right']=
suggest_values['margin-left']=
[
  'inherit'
]

suggest_values['max-height']=
[
  'none',
  'inherit'
]

suggest_values['max-width']=
[
  'none',
  'inherit'
]

suggest_values['min-height']=
[
  'inherit'
]

suggest_values['min-width']=
[
  'inherit'
]

suggest_values['orphans']=
[
  'inherit'
]

suggest_values['outline-color']=
[
  'invert'
]

suggest_values['outline-style']=
[
  'inherit'
]

suggest_values['outline-width']=
[
  'inherit'
]

suggest_values['outline']=
[
  'inherit'
]

suggest_values['overflow']=
suggest_values['overflow-x']=
suggest_values['overflow-y']=
[
  'visible',
  'hidden',
  'scroll',
  'auto',
  'no-display',
  'no-content',
  'inherit'
]

suggest_values['padding']=
suggest_values['padding-top']=
suggest_values['padding-right']=
suggest_values['padding-bottom']=
suggest_values['padding-left']=
[
  'inherit'
]

suggest_values['page-break-after']=
[
  'auto',
  'always',
  'avoid',
  'left',
  'right',
  'inherit'
]

suggest_values['page-break-before']=
[
  'auto',
  'always',
  'avoid',
  'left',
  'right',
  'inherit'
]

suggest_values['page-break-inside']=
[
  'avoid',
  'auto',
  'inherit'
]

suggest_values['pause-after']=
[
  'inherit'
]

suggest_values['pause-before']=
[
  'inherit'
]

suggest_values['pause']=
[
  'inherit'
]

suggest_values['pitch-range']=
[
  'inherit'
]

suggest_values['pitch']=
[
  'x-low',
  'low',
  'medium',
  'high',
  'x-high',
  'inherit'
]

suggest_values['play-during']=
[
  'mix',
  'repeat',
  'auto',
  'none',
  'inherit'
]

suggest_values['position']=
[
  'static',
  'relative',
  'absolute',
  'fixed',
  'inherit'
]

suggest_values['quotes']=
[
  'none',
  'inherit'
]

suggest_values['richness']=
[
  'inherit'
]

suggest_values['right']=
[
  'auto',
  'inherit'
]

suggest_values['speak-header']=
[
  'once',
  'always',
  'inherit'
]

suggest_values['speak-numeral']=
[
  'digits',
  'continuous',
  'inherit'
]

suggest_values['speak-punctuation']=
[
  'code',
  'none',
  'inherit'
]

suggest_values['speak']=
[
  'normal',
  'none',
  'spell-out',
  'inherit'
]

suggest_values['speech-rate']=
[
  'x-slow',
  'slow',
  'medium',
  'fast',
  'x-fast',
  'faster',
  'slower',
  'inherit'
]

suggest_values['stress']=
[
  'inherit'
]

suggest_values['table-layout']=
[
  'auto',
  'fixed',
  'inherit'
]

suggest_values['text-align']=
[
  'left',
  'right',
  'center',
  'justify',
  'inherit'
]

suggest_values['text-decoration']=
[
  'none',
  'underline',
  'overline',
  'line-through',
  'blink',
  'inherit'
]

suggest_values['text-indent']=
[
  'inherit'
]

suggest_values['text-transform']=
[
  'capitalize',
  'uppercase',
  'lowercase',
  'none',
  'inherit'
]

suggest_values['top']=
[
  'auto',
  'inherit'
]

suggest_values['unicode-bidi']=
[
  'normal',
  'embed',
  'bidi-override',
  'inherit'
]

suggest_values['vertical-align']=
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
]

suggest_values['visibility']=
[
  'visible',
  'hidden',
  'collapse',
  'inherit'
]

suggest_values['voice-family']=
[
  'inherit'
]

suggest_values['volume']=
[
  'silent',
  'x-soft',
  'soft',
  'medium',
  'loud',
  'x-loud',
  'inherit'
]

suggest_values['white-space']=
[
  'normal',
  'pre',
  'nowrap',
  'pre-wrap',
  'pre-line',
  'inherit'
]

suggest_values['widows']=
[
  'inherit'
]

suggest_values['width']=
[
  'auto',
  'inherit'
]

suggest_values['word-spacing']=
[
  'normal',
  'inherit'
]

suggest_values['word-wrap']=
[
  'normal',
  'break-word',
  'inherit'
]

suggest_values['z-index']=
[
  'auto',
  'inherit'
]
