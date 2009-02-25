var ini =
{
  // all files in http-clients must be updated to the cvs version of this file //
  protocol_version: '5',
  max_frames: 100,
  debug: false,
  dragonfly_version: '$dfversion$',
  revision_number: '$revdate$', 
  mercurial_revision: "",
  hostspotlight_matrixes:
  {
    /*
      box : null | [fill-color , frame-color, grid-color]
      color: 0 | [r, g, b, alpha]
    */
    "default":
    [
      // dimension box
      [
        [54, 68, 130, .3 * 255], 
        [54, 68, 130, .6 * 255], 
        0
      ],
      // padding box
      [
        [54, 68, 130, .5 * 255], 
        [54, 68, 130, .8 * 255], 
        0
      ],
      // border box
      [
        [54, 68, 130, .7 * 255], 
        [54, 68, 130, 1 * 255], 
        [170, 33, 18, .3 * 255]
      ],
      // margin box
      null
    ],
    "metrics-hover":
    [
      // inner inner * box
      [
        [54, 68, 130, .3 * 255], 
        0, 
        0
      ],
      // inner box
      [
        [54, 68, 130, .3 * 255], 
        [54, 68, 130, .8 * 255], 
        0
      ],
      // active box
      [
        [54, 68, 130, .7 * 255], 
        [54, 68, 130, .8 * 255], 
        [170, 33, 18, .3 * 255]
      ]
    ],
    "locked":
    [
      // dimension box
      null,
      // padding box
      null,
      // border box
      [
        0, 
        [170, 33, 18, .9 * 255], 
        0
      ],
      // margin box
      null
    ],
  }
}

