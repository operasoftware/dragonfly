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
    "default":
    [
      // dimension box
      [
        // fill rgba
        [54, 68, 130, .3 * 255], 
        // frame rgba
        [54, 68, 130, .6 * 255], 
        // grid rgba
        0
      ],
      // padding box
      [
        // fill rgba
        [54, 68, 130, .5 * 255], 
        // frame rgba
        [54, 68, 130, .8 * 255], 
        // grid rgba
        0
      ],
      // border box
      [
        // fill rgba
        [54, 68, 130, .7 * 255], 
        // frame rgba
        [54, 68, 130, 1 * 255], 
        // grid rgba
        [170, 33, 18, .3 * 255]
      ],
      // margin box
      null
    ],
    "metrics-hover":
    [
      // inner inner * box
      [
        // fill rgba
        [54, 68, 130, .3 * 255], 
        // frame rgba
        0, 
        // grid rgba
        0
      ],
      // inner box
      [
        // fill rgba
        [54, 68, 130, .3 * 255], 
        // frame rgba
        [54, 68, 130, .8 * 255], 
        // grid rgba
        0
      ],
      // active box
      [
        // fill rgba
        [54, 68, 130, .7 * 255], 
        // frame rgba
        0, 
        // grid rgba
        [170, 33, 18, .3 * 255]
      ]
    ]
  }
}

