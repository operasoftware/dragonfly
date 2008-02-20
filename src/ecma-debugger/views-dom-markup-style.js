//window.views = window.views || {};

(function()
{

  var View = function(id, name, container_class)
  {
    var self = this;

    const 
    ID = 0, 
    TYPE = 1, 
    NAME = 2, 
    NAMESPACE = 3, 
    VALUE = 4, 
    DEPTH = 5, 
    ATTRS = 6, 
    CHILDREN_LENGTH = 7, 
    IS_TARGET = 8, 
    IS_LAST = 9;

    this.scrollTargetIntoView = function()
    {
      var target = document.getElementById('target-element');
      if(target)
      {
        document.getElementById('target-element').scrollIntoView();
        while( !/container/.test(target.nodeName) && ( target = target.parentElement) );
        if(target)
        {
          target.scrollTop -= 100;
        }
      }
    }

    this.updateTarget = function(ele)
    {
      if(ele)
      {
        var target = document.getElementById('target-element');
        if(target)
        {
          target.removeAttribute('id');
        }
        ele.id = 'target-element';
        topCell.statusbar.updateInfo(dom_data.getCSSPath());
      }
      else
      {
        opera.postError("missing implementation in updateTarget in views['dom-inspector']");
        // TODO
      }
    }

    this.createView = function(container)
    {

      var data = dom_data.getData();

      var tree = '', i = 0, node = null, length = data.length;
      
      var target = dom_data.getCurrentTarget();

      var attrs = null, key = '';

      var is_open = 0;
      var has_only_one_child = 0;
      var one_child_value = ''
      var current_depth = 0;
      var child_pointer = 0;
      var child_level = 0;
      var j = 0;

      var closing_tags = [];

      var force_lower_case = settings[self.id].get('force-lowercase');
      var show_comments = settings[self.id].get('show-comments');
      var show_attrs = settings[self.id].get('show-attributes');
      var node_name = '';
      var tag_head = '';

      if( ! data.length )
      {
        container.innerHTML = "<div class='padding'><p>Probably no runtime is selected</p></div>";
      }
      else
      {
        for( ; node = data[i]; i += 1 )
        {
          while( current_depth > node[DEPTH] )
          {
            tree += closing_tags.pop();
            current_depth--;
          }
          current_depth = node[ DEPTH ];
          child_pointer = 0;
          node_name = node[ NAME ];
          if( force_lower_case )
          {
            node_name = node_name.toLowerCase();
          }
          switch ( node[ TYPE ] )
          {
            case 1:  // elemets
            {
              if( show_attrs )
              {
                attrs = '';
                for( key in node[ ATTRS ] )
                {
                  attrs += " <span class='key'>" + 
                    ( force_lower_case ? key.toLowerCase() : key ) + 
                    "</span>=<span class='value'>\"" + 
                    node[ ATTRS ][key] + 
                    "\"</span>";
                }
              }
              else
              {
                attrs = '';
              }

              child_pointer = i + 1;

              is_open = ( data[ child_pointer ] && ( node[ DEPTH ] < data[ child_pointer ][ DEPTH ] ) );
              if( is_open ) 
              {
                has_only_one_child = 1;
                one_child_value = '';
                child_level = data[ child_pointer ][ DEPTH ];
                for( ; data[child_pointer] &&  data[ child_pointer ][ DEPTH ] == child_level; child_pointer += 1 )
                {
                  one_child_value += data[ child_pointer ] [ VALUE ];
                  if( data[ child_pointer ][ TYPE ] != 3 )
                  {
                    has_only_one_child = 0;
                    one_child_value = '';
                    break;
                  }
                }
              }

              if( is_open )
              {
                if( has_only_one_child )
                {
                  tree += "<div " + ( node[ ID ] == target ? "id='target-element'" : '' ) + 
                          " style='margin-left:" + 16 * node[ DEPTH ] + "px;' "+
                          "ref-id='"+ node[ ID ] + "' handler='spotlight-node'>"+
                          "<span class='node'>&lt;" + node_name +  attrs + "&gt;</span>" +
                          one_child_value + 
                          "<span class='node'>&lt;/" + node_name + "&gt;</span>" +
                          "</div>";
                  i = child_pointer - 1;
                }
                else
                {
                  tree += "<div " + ( node[ ID ] == target ? "id='target-element'" : '' ) + 
                          " style='margin-left:" + 16 * node[ DEPTH ] + "px;' "+
                          "ref-id='"+node[ ID ] + "' handler='spotlight-node'>"+
                          ( node[ CHILDREN_LENGTH ] ? 
                            "<input handler='get-children' type='button' class='open'>" : '' ) +
                          "<span class='node'>&lt;" + node_name + attrs + "&gt;</span>" +
                          "</div>";

                  closing_tags.push("<div class='node' style='margin-left:" + 
                                    ( 16 * node[ DEPTH ] ) + "px;'>" +
                                    "&lt;/" + node_name + "&gt;" +
                                    "</div>");
                }

              }
              else
              {
              tree += "<div " + ( node[ ID ] == target ? "id='target-element'" : '' ) + 
                      " style='margin-left:" + 16 * node[ DEPTH ] + "px;' "+
                      "ref-id='"+ node[ ID ] + "' handler='spotlight-node'>"+
                      ( node[ CHILDREN_LENGTH ] ? 
                        "<input handler='get-children' type='button' class='close'>" : '' ) +
                      "<span class='node'>&lt;" + node_name + attrs + "&gt;</span>" +
                      "</div>";
              }
              break;
            }

            case 8:  // comments
            {
              if( show_comments )
              {
                if( !/^\s*$/.test(node[ VALUE ] ) )
                {
                  tree += "<div style='margin-left:" + 16 * node[ DEPTH ] + "px;' " +      
                          "class='comment'>&lt;!--" + node[ VALUE ] + "--&gt;</div>";
                }
              }
              break;

            }

            case 10:  // doctype
            {
              tree += "<div style='margin-left:" + 16 * node[ DEPTH ] + "px;' class='doctype'>"+
                      "&lt;!doctype " + node[ NAME ] +
                      ( node[ ATTRS ].publicId ? 
                        ( " PUBLIC " + "\"" + node[ATTRS].publicId + "\"" ) :"" ) +
                      ( node[ ATTRS ].systemId ?  
                        ( " \"" + node[ ATTRS ].systemId + "\"" ) : "" ) +
                      "&gt;</div>";
              break;
            }

            default:
            {
              if( !/^\s*$/.test(node[ VALUE ] ) )
              {
                tree += "<div style='margin-left:" + ( 16 * node[ DEPTH ] )  + "px;'>" + 
                        node[ VALUE ]/*.replace(/[\x0A\x09\x0D]/g, '').replace(/ +/g, ' ')*/ + "</div>";
              }
            }

          }
        }
        
        while( closing_tags.length )
        {
          tree += closing_tags.pop();
        }
        var scrollTop = container.scrollTop;
        ( 
          container.firstChild ? 
          container.firstChild : 
          container.render(['div', 'class', 'padding']) 
        ).innerHTML = tree;
        container.scrollTop = scrollTop;
        
        topCell.statusbar.updateInfo(dom_data.getCSSPath());
        
      }

      
    }

    this.init(id, name, container_class);
  }

  View.prototype = ViewBase;

  new View('dom-markup-style', 'DOM markup style', 'scroll dom markup-style');

  new Settings
  (
    'dom-markup-style', 
    {
      'force-lowercase': false, 
      'show-comments': true, 
      'show-attributes': true, 
      'find-with-click': true,
      'highlight_on_hover': false
    }, 
    {
      checkboxes:
      [
        {
          key: 'force-lowercase',
          label: ' always use lower case for tag names'
        },
        {
          key: 'show-comments',
          label: ' show comment nodes'
        },
        {
          key: 'show-attributes',
          label: ' show attributes'
        },
        {
          key: 'find-with-click',
          label: ' find element with click'
        },
        {
          key: 'highlight-on-hover',
          label: ' highlight element on mouseover'
        },
      ]
    }
  );

  new ToolbarConfig
  (
    'dom-markup-style',
    [
      {
        handler: 'dom-inspection-snapshot',
        title: 'Get the whole dom tree'
      }
    ]
  )

  eventHandlers.click['dom-inspection-snapshot'] = function(event, target)
  {
    dom_data.getSnapshot();
  }

})()
