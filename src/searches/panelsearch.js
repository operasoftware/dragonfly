var PanelSearch = function()
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
      var target = span_list[0].get_ancestor('.' + PanelSearch.MATCH_NODE_CLASS);
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

  this._validate_reg_exp = function()
  {
    try
    {
      var re = new RegExp(this._last_query, this.ignore_case ? 'ig' : 'g');
      return re.test("") && ui_strings.S_INFO_REGEXP_MATCHES_EMPTY_STRING;
    }
    catch(e)
    {
      return ui_strings.S_INFO_INVALID_REGEXP;
    }
  };

  this._update_match_highlight = function(event, target)
  {
    var line = event.target.get_ancestor('.' + PanelSearch.MATCH_NODE_CLASS);
    if (line)
    {
      var matches = line.getElementsByTagName('em');
      var ev_left = event.clientX;
      var ev_top = event.clientY;
      var min_dist = Infinity;
      var match = null;
      for (var i = 0, cur; cur = matches[i]; i++)
      {
        Array.prototype.forEach.call(cur.getClientRects(), function(box)
        {
          var dx = ev_left < box.left ?
                   box.left - ev_left :
                   ev_left > box.right ?
                   ev_left - box.right :
                   0;
          var dy = ev_top < box.top ?
                   box.top - ev_top :
                   ev_top > box.bottom ?
                   ev_top - box.bottom :
                   0;
          var dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy * 100, 2));
          if (dist < min_dist)
          {
            min_dist = dist;
            match = cur;
          }
        });
      }
      if (match)
      {
        this.set_match_cursor(match);
        this._update_info();
      }
    }
  };

  this.set_match_cursor = function(target)
  {
    for (var i = 0, hit = null; hit = this._hits[i]; i++)
    {
      if (hit.indexOf(target) != -1)
      {
        this._hits[this._match_cursor].forEach(this._set_default_style, this);
        this._match_cursor = i;
        this._hits[this._match_cursor].forEach(this._set_highlight_style, this);
        break;
      }
    }
  };

};

PanelSearch.MATCH_NODE_CLASS = "search-match";
PanelSearch.MATCH_NODE_HIGHLIGHT_CLASS = "search-match-cursor";

PanelSearch.adjust_search_controls = function(container)
{
  if (container)
  {
    var controls = container.querySelector('.advanced-search-controls');
    var search_container = container.querySelector('.panel-search-container');
    if (controls && search_container)
    {
      search_container.style.top = controls.offsetHeight + 'px';
    }
  }
};

var DetailResourceSearch = function(min_length)
{
  this._init(min_length);
};

var DetailResourceSearchPrototype = function()
{
  this._update_info = new PanelSearch()._update_info;
  this._query_selector = "pre";
};

DetailResourceSearchPrototype.prototype = TextSearch.prototype;
DetailResourceSearch.prototype = new DetailResourceSearchPrototype();
