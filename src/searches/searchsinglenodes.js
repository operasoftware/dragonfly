/**
 * Subclasses TextSearch. The difference is that this class will only
 * search in single tokens, not span a match over several tokes.
 * Subclassed e.g. by DOMSearch.
 * @see TextSearch
 * @constructor
 */
var SearchSingleNodes = function(min_length)
{
  this._init(min_length);
};

var SearchSingleNodesPrototype = function(min_length)
{
  /**
    * Subclasses TextSearch.
    * Overwrites
    *   _search_node
    *  _consume_node
    * to only match the context of single nodes.
    */

  /* constants */
  const TEXT = document.TEXT_NODE;
  const ELEMENT = document.ELEMENT_NODE;
  const DEFAULT_MATCH_CLASS = TextSearch.DEFAULT_MATCH_CLASS;
  const SELECTED_MATCH_CLASS = TextSearch.SELECTED_MATCH_CLASS;

  this._consume_node = function(node)
  {
    // only called with nodes of type TEXT
    if (this._current_match_index != -1)
    {
      node = node.splitText(this._current_match_index);
      node.splitText(this._search_term_length);
      var span = document.createElement('em');
      this._hits.push([span]);
      node.parentNode.replaceChild(span, node);
      span.appendChild(node);
      span.className = DEFAULT_MATCH_CLASS;
      return span;
    }
    return node;
  };

  this._search_node = function(node, index, arr)
  {
    this._search_node_recursive(node.firstChild, false);
  };

  this._search_node_recursive = function(node, is_match_token)
  {
    while (node)
    {
      switch (node.nodeType)
      {
        case ELEMENT:
        {
          this._search_node_recursive(node.firstChild,
                                      !this._re_match_target ||
                                      this._re_match_target.test(node.nodeName));
          break;
        }
        case TEXT:
        {
          if (is_match_token)
          {
            this._search_target = this.ignore_case ?
                                  node.nodeValue.toLowerCase() :
                                  node.nodeValue;
            if (this._reg_exp)
            {
              this._reg_exp.lastIndex = 0;
            }
            else
            {
              this._search_term_length = this._search_term.length;
              this._last_match_index = 0;
            }
            this._search_next_match();
            node = this._consume_node(node);
          }
          break;
        }
      }
      node = node.nextSibling;
    }
  };

};

SearchSingleNodesPrototype.prototype = TextSearch.prototype;
SearchSingleNodes.prototype = new SearchSingleNodesPrototype();
