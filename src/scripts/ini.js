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
        [0, 0, 255, 51],
        [41, 41, 51, 153],
        0
      ],
      // padding box
      [
        [51, 51, 184, 114.75],
        [31, 31, 37, 204],
        0
      ],
      // border box
      [
        [63, 63, 112, 178.5],
        [20, 20, 22, 25.5],
        [170, 33, 18, 76.5]
      ],
      // margin box
      null
    ],
    "metrics-hover":
    [
      // inner inner * box
      [
        [0, 0, 255, 51],
        0,
        0
      ],
      // inner box
      [
        [51, 51, 184, 51],
        [31, 31, 37, 204],
        0
      ],
      // active box
      [
        [63, 63, 112, 178.5],
        [20, 20, 22, 204],
        [170, 33, 18, 76.5]
      ]
    ],
    "locked":
    [
      // dimension box
      [
        [0, 0, 255, 12.75],
        [41, 41, 51, 25.5],
        0
      ],
      // padding box
      [
        [51, 51, 184, 25.5],
        [31, 31, 37, 38.25],
        0
      ],
      // border box
      [
        [63, 63, 112, 38.25],
        [170, 33, 18, 127.5],
        0
      ],
      // margin box
      null
    ]
  }
}

