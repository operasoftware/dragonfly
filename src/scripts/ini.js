var ini =
{
  // all files in http-clients must be updated to the cvs version of this file //
  protocol_version: '5',
  max_frames: 100,
  debug: false,
  dragonfly_version: '$dfversion$',
  revision_number: '$revdate$', 
  mercurial_revision: "",
  browser: window.opera ? 'opera' : window.chrome ? 'chrome' : 'firefox',
  default_shortcuts:
  {
    windows:
    {
      "global":
      {
        "default":
        {
          "ctrl a": "select-all",
          "ctrl i": "invert-spotlight-colors",
          "f8": "continue-run",
          "f10": "continue-step-next-line",
          "f11": "continue-step-into-call",
          "shift f11": "continue-step-out-of-call"
        },
        "edit":
        {
          "f8": "continue-run",
          "f10": "continue-step-next-line",
          "f11": "continue-step-into-call",
          "shift f11": "continue-step-out-of-call",
          "enter": "highlight-next-match",
          "f3": "highlight-next-match",
          "shift enter": "highlight-previous-match",
          "shift f3": "highlight-previous-match",
        }
      },
      "dom":
      {
        "default":
        {
          "up": "nav-up",
          "down": "nav-down",
          "left": "nav-left",
          "right": "nav-right",
          "enter": "dispatch-click",
          "shift enter": "dispatch-click",
          "ctrl enter": "dispatch-dbl-click",
        },
        "edit-attributes-and-text":
        {
          "shift tab": "edit-previous",
          "tab": "edit-next",
          "enter": "submit-edit",
          "escape": "exit-edit",
        },
        "edit-markup":
        {
          "shift tab": "edit-previous",
          "tab": "edit-next",
          "ctrl enter": "submit-edit",
          "escape": "exit-edit",
        }
      },
      "css-inspector":
      {
        "default":
        {
          "up": "nav-up",
          "down": "nav-down",
          "left": "nav-up",
          "right": "nav-down",
          "ctrl enter": "dispatch-dbl-click",
        },
        "edit":
        {
          "up": "autocomplete-previous",
          "down": "autocomplete-next",
          "shift tab": "edit-previous",
          "tab": "edit-next",
          "enter": "submit-edit-and-new-edit",
          "escape": "exit-edit",
        }
      },
      "command_line":
      {
        "default":
        {
          "ctrl l": "clear-repl",
        },
        "single-line-edit":
        {
          "up": "backlog-prev",
          "down": "backlog-next",
          "tab": "autocomplete",
          "enter": "eval",
          "shift enter": "enter-multiline-mode",
          "ctrl l": "clear",
          "ctrl k": "kill-to-end-of-line",
          "ctrl u": "kill-to-beginning-of-line",
          "ctrl e": "move-to-end-of-line",
          "ctrl a": "move-to-beginning-of-line",
          "ctrl w": "kill-word-backwards",
          "ctrl y": "yank"
        },
        "multi-line-edit":
        {
          "shift enter": "exit-multiline-mode",
          "ctrl enter": "eval",
          "tab": "insert-tab-at-point",
        },
        "autocomplete":
        {
          "left": "prev-completion",
          "right": "next-completion",
          "tab": "next-completion",
          "shift tab": "prev-completion",
          "enter": "commit",
          "[": "commit-and-insert",
          "]": "commit-and-insert",
          ".": "commit-and-insert",
          "(": "commit-and-insert",
          ")": "commit-and-insert",
          "escape": "cancel-completion",
          "ctrl l": "cancel-input",
        },
      },
    },
  },
  mac:
    {
      "global":
      {
        "default":
        {
          "cmd shift a": "select-all",
          "cmd i": "invert-spotlight-colors",
          "f5": "continue-run",
          "f6": "continue-step-next-line",
          "f7": "continue-step-into-call",
          "shift f7": "continue-step-out-of-call"
        },
        "edit":
        {
          "f5": "continue-run",
          "f6": "continue-step-next-line",
          "f7": "continue-step-into-call",
          "shift f7": "continue-step-out-of-call",
          "enter": "highlight-next-match",
          "cmd g": "highlight-next-match",
          "shift enter": "highlight-previous-match",
          "cmd shift g": "highlight-previous-match",
        }
      },
      "dom":
      {
        "default":
        {
          "up": "nav-up",
          "down": "nav-down",
          "left": "nav-left",
          "right": "nav-right",
          "enter": "dispatch-click",
          "shift enter": "dispatch-click",
          "cmd enter": "dispatch-dbl-click",
        },
        "edit-attributes-and-text":
        {
          "shift tab": "edit-previous",
          "tab": "edit-next",
          "enter": "submit-edit",
          "escape": "exit-edit",
        },
        "edit-markup":
        {
          "shift tab": "edit-previous",
          "tab": "edit-next",
          "cmd enter": "submit-edit",
          "escape": "exit-edit",
        }
      },
      "css-inspector":
      {
        "default":
        {
          "up": "nav-up",
          "down": "nav-down",
          "left": "nav-up",
          "right": "nav-down",
          "cmd enter": "dispatch-dbl-click",
        },
        "edit":
        {
          "up": "autocomplete-previous",
          "down": "autocomplete-next",
          "shift tab": "edit-previous",
          "tab": "edit-next",
          "enter": "submit-edit-and-new-edit",
          "escape": "exit-edit",
        }
      },
      "command_line":
      {
        "default":
        {
         "cmd l": "clear-repl",
        },
        "single-line-edit":
        {
         "up": "backlog-prev",
         "down": "backlog-next",
         "tab": "autocomplete",
         "enter": "eval",
         "shift enter": "enter-multiline-mode",
         "cmd l": "clear",
         // "ctrl k": "kill-to-end-of-line",
         // "ctrl u": "kill-to-beginning-of-line", // non-existent on mac afaict
         // "ctrl e": "move-to-end-of-LINE",
         // "ctrl a": "move-to-beginning-of-line",
         // "ctrl w": "kill-word-backwards", // non-existent on mac afaict
         // "ctrl y": "yank" // non-existent on mac afaict
        },
        "multi-line-edit":
        {
         "shift enter": "exit-multiline-mode",
         "cmd enter": "eval",
         "tab": "insert-tab-at-point",
        },
        "autocomplete":
        {
         "left": "prev-completion",
         "right": "next-completion",
         "tab": "next-completion",
         "shift tab": "prev-completion",
         "enter": "commit",
         "[": "commit-and-insert",
         "]": "commit-and-insert",
         ".": "commit-and-insert",
         "(": "commit-and-insert",
         ")": "commit-and-insert",
         "escape": "cancel-completion",
         "cmd l": "cancel-input",
        },
      },
    },
  },
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

