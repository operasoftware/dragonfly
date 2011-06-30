PanelSearch = function()
{
  const
  NO_MATCH = TextSearch.NO_MATCH,
  EMPTY = TextSearch.EMPTY,
  MATCH_NODE_HIGHLIGHT_CLASS = PanelSearch.MATCH_NODE_HIGHLIGHT_CLASS;

  this._update_info = function(type)
  {
    if(this._info_ele)
    {
      var info = "\u00A0";
      switch (type)
      {
        case EMPTY:
        {
          break;
        }
        case NO_MATCH:
        {
          info = "0";
          break;
        }
        default:
        {
          info = String(this._get_search_cursor()) + "/" +
                 String(this._get_match_counts());
        }
      }
      this._info_ele.textContent = info;
      if (type == EMPTY)
      {
        this._info_ele.style.backgroundColor = "transparent";
      }
      else
      {
        this._info_ele.style.removeProperty("background-color");
      }
    }
  };

  this._onhighlightstyle = function(span_list)
  {
    if (span_list.length)
    {
      var target = span_list[0].get_ancestor('.search-match');
      if (this._highligh_node && this._highligh_node != target)
      {
        this._highligh_node.removeClass(MATCH_NODE_HIGHLIGHT_CLASS)
      }
      if (target)
      {
        this._highligh_node = target;
        this._highligh_node.addClass(MATCH_NODE_HIGHLIGHT_CLASS);
      }
    }
  };

};

PanelSearch.MATCH_NODE_HIGHLIGHT_CLASS = "search-match-cursor";

