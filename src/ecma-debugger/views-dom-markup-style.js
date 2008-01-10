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
      IS_LAST = 9,
      NEXT = 10;

      var data = dom_data.getData();

      var tree = '', i = 0, length = data.length;
      var scrollTop = document.documentElement.scrollTop;
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
        for( ; i < length; i += 10 )
        {
          while( current_depth > data[i+5] )
          {
            tree += closing_tags.pop();
            current_depth--;
          }
          current_depth = data[ i + DEPTH ];
          child_pointer = 0;
          node_name = data[ i + NAME ];
          if( force_lower_case )
          {
            node_name = node_name.toLowerCase();
          }
          switch ( data[ i + TYPE ] )
          {
            case 1:  // elemets
            {
              if( show_attrs )
              {
                attrs = '';
                for( key in data[ i + ATTRS ] )
                {
                  attrs += " <span class='key'>" + 
                    ( force_lower_case ? key.toLowerCase() : key ) + 
                    "</span>=<span class='value'>\"" + 
                    data[ i + ATTRS ][key] + 
                    "\"</span>";
                }
              }
              else
              {
                attrs = '';
              }

              child_pointer = i + NEXT;

              is_open = ( data[ child_pointer ] && ( data[ i + DEPTH ] < data[ child_pointer + DEPTH ] ) );
              if( is_open ) 
              {
                has_only_one_child = 1;
                one_child_value = '';
                child_level = data[ child_pointer + DEPTH ];
                for( ; data[child_pointer] &&  data[child_pointer + DEPTH] == child_level; child_pointer += 10 )
                {
                  one_child_value += data[ child_pointer + VALUE ];
                  if( data[ child_pointer + TYPE ] != 3 )
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
                  tree += "<div " + ( data[ i + ID ] == target ? "id='target-element'" : '' ) + 
                          " style='margin-left:" + 16 * data[ i + DEPTH ] + "px;' "+
                          "ref-id='"+data[ i + ID ] + "' handler='spotlight-node'>"+
                          "<span class='node'>&lt;" + node_name +  attrs + "&gt;</span>" +
                          one_child_value + 
                          "<span class='node'>&lt;/" + node_name + "&gt;</span>" +
                          "</div>";
                  i = child_pointer - 10;
                }
                else
                {
                  tree += "<div " + ( data[ i + ID ] == target ? "id='target-element'" : '' ) + 
                          " style='margin-left:" + 16 * data[ i + DEPTH ] + "px;' "+
                          "ref-id='"+data[ i + ID ] + "' handler='spotlight-node'>"+
                          ( data[ i + CHILDREN_LENGTH ] ? 
                            "<input handler='get-children' type='button' class='open'>" : '' ) +
                          "<span class='node'>&lt;" + node_name + attrs + "&gt;</span>" +
                          "</div>";

                  closing_tags.push("<div class='node' style='margin-left:" + 
                                    ( 16 * data[ i + DEPTH ] ) + "px;'>" +
                                    "&lt;/" + node_name + "&gt;" +
                                    "</div>");
                }

              }
              else
              {
              tree += "<div " + ( data[ i + ID ] == target ? "id='target-element'" : '' ) + 
                      " style='margin-left:" + 16 * data[ i + DEPTH ] + "px;' "+
                      "ref-id='"+data[ i + ID ] + "' handler='spotlight-node'>"+
                      ( data[ i + CHILDREN_LENGTH ] ? 
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
                if( !/^\s*$/.test(data[ i + VALUE ] ) )
                {
                  tree += "<div style='margin-left:" + 16 * data[i+5] + "px;' " +      
                          "class='comment'>&lt;!--" + data[ i + VALUE ] + "--&gt;</div>";
                }
              }
              break;

            }

            case 10:  // doctype
            {
              tree += "<div style='margin-left:" + 16 * data[i+5] + "px;' class='doctype'>"+
                      "&lt;!doctype " + data[ i + NAME ] +
                      ( data[ i + ATTRS ].publicId ? 
                        ( " PUBLIC " + "\"" + data[i+ATTRS].publicId + "\"" ) :"" ) +
                      ( data[ i + ATTRS ].systemId ?  
                        ( " \"" + data[ i + ATTRS ].systemId + "\"" ) : "" ) +
                      "&gt;</div>";
              break;
            }

            default:
            {
              if( !/^\s*$/.test(data[i+4] ) )
              {
                tree += "<div style='margin-left:" + 16 * data[ i + DEPTH ] + "px;'>" + 
                        data[ i + VALUE ] + "</div>";
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
        container.scrollTop.scrollTop = scrollTop;
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

})()
