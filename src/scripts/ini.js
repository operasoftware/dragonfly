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
  default_shortcuts_os:
  {
    generic:
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
          "shift f11": "continue-step-out-of-call",
          "escape": "toggle-command-line",
          "ctrl tab": "navigate-next-top-tab",
          "ctrl shift tab": "navigate-previous-top-tab"
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
          "escape": "toggle-command-line",
          "ctrl tab": "navigate-next-top-tab",
          "ctrl shift tab": "navigate-previous-top-tab"
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
          "delete": "remove-node"
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
          "up": "autocomplete-next",
          "down": "autocomplete-previous",
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
          "ctrl p": "backlog-prev",
          "ctrl n": "backlog-next",
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
          "ctrl k": "kill-to-end-of-line",
          "ctrl u": "kill-to-beginning-of-line",
          "ctrl w": "kill-word-backwards",
          "ctrl y": "yank"
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
          "ctrl l": "clear",
          "ctrl k": "kill-to-end-of-line",
          "ctrl u": "kill-to-beginning-of-line",
          "ctrl w": "kill-word-backwards",
          "ctrl y": "yank"
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
          "shift f7": "continue-step-out-of-call",
          "escape": "toggle-command-line"
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
          "escape": "toggle-command-line"
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
          "delete": "remove-node"
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
          // "ctrl l": "clear-repl",
        },
        "single-line-edit":
        {
          "up": "backlog-prev",
          "down": "backlog-next",
          "tab": "autocomplete",
          "enter": "eval",
          "shift enter": "enter-multiline-mode",
          // "ctrl l": "clear",
          //"ctrl p": "backlog-prev",
          //"ctrl n": "backlog-next",
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
          // "ctrl k": "kill-to-end-of-line",
          // "ctrl u": "kill-to-beginning-of-line",
          // "ctrl w": "kill-word-backwards",
          // "ctrl y": "yank"
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
         // "ctrl l": "cancel-input",
         // "ctrl k": "kill-to-end-of-line",
         // "ctrl u": "kill-to-beginning-of-line",
         // "ctrl w": "kill-word-backwards",
         // "ctrl y": "yank"
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
        [51,117,215, 52],
        0,
        0
      ],
      // padding box
      [
        [51,117,215, 104],
        0,
        0
      ],
      // border box
      [
        [51,117,215, 255],
        0,
        [51,117,215, 128]
      ],
      // margin box
      [
        [51,117,215, 156],
        0,
        0
      ]
    ],
    "metrics-hover":
    [
      // inner inner * box
      [
        [51,117,215, 48],
        0,
        0
      ],
      // inner box
      [
        [51,117,215, 48],
        0,
        0
      ],
      // active box
      [
        [51,117,215, 128],
        0,
        0
      ]
    ],
    "locked":
    [
      // dimension box
      [
        [51,117,215, 24],
        0,
        0
      ],
      // padding box
      [
        [51,117,215, 52],
        0,
        0
      ],
      // border box
      [
        [51,117,215, 128],
        0,
        [51,117,215, 64]
      ],
      // margin box
      [
        [51,117,215, 76],
        0,
        0
      ]
    ]
  }
};
window.ini.default_shortcuts = navigator.platform.toLowerCase().indexOf('mac') == -1 ?
                               ini.default_shortcuts_os.generic :
                               ini.default_shortcuts_os.mac;
