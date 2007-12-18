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
      IS_LAST = 9;
      NEXT = 10;

      var data = dom_data.getData();
      var tree = '', i = 0, length = data.length;
      var scrollTop = document.documentElement.scrollTop;

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
      var show_white_space_nodes = settings[self.id].get('show-whitespace-nodes');
      var node_name = '';
      var tag_head = '';

      var graphic_arr = [];
      var line_count = 0;

      for( ; i < length; i += 10 )
      {



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
              for( ; data[child_pointer] &&  data[child_pointer + DEPTH] == child_level; 
                    child_pointer += 10 )
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
              tree += "<div " + ( data [ i + IS_TARGET ] ? "id='target-element'" : '' ) + 
                      " style='margin-left:" + 16 * data[ i + DEPTH ] + "px;' "+
                      "ref-id='"+data[ i + ID ] + "'>"+
                      ( data[ i + CHILDREN_LENGTH ] && !has_only_one_child ? 
                        "<input handler='get-children' type='button' class='open'>" : '' ) +
                      "<span class='node'>" + node_name + attrs + "</span>" +
                      "</div>";


              

            }
            else
            {
            tree += "<div " + ( data [ i + IS_TARGET ] ? "id='target-element'" : '' ) + 
                    " style='margin-left:" + 16 * data[ i + DEPTH ] + "px;' "+
                    "ref-id='"+data[ i + ID ] + "'>"+
                    ( data[ i + CHILDREN_LENGTH ] ? 
                      "<input handler='get-children' type='button' class='close'>" : '' ) +
                    "<span class='node'>" + node_name + attrs + "</span>" +
                    "</div>";
            }
            /*
            if( !graphic_arr[current_depth] ) 
            {
              graphic_arr[current_depth] = [ line_count ];
            }
            
            else
            {
              graphic_arr[current_depth].push( line_count );
            }
            */
            line_count++;

            break;
          }

          case 8:  // comments
          {
            if( show_comments )
            {
              tree += "<div style='margin-left:" + 16 * data[i+5] + "px;' " +      
                      "class='comment'>" + data[ i + NAME ] + "</div>";

              /*
              if( !graphic_arr[current_depth] ) 
              {
                graphic_arr[current_depth] = [ line_count ];
              }
              else
              {
                graphic_arr[current_depth].push( line_count );
              }
              */
              line_count++;

            }
            break;

          }

          case 10:  // doctype
          {
            tree += "<div style='margin-left:" + 16 * data[i+5] + "px;' " +
              "class='doctype'>doctype</div>";
            /*
            if( !graphic_arr[current_depth] ) 
            {
              graphic_arr[current_depth] = [ line_count ];
            }
            else
            {
              graphic_arr[current_depth].push( line_count );
            }
            */
            line_count++;

            break;
          }

          default:
          {
            if( !( show_white_space_nodes ) && ( data[ i + TYPE ] == 3 ) )
            {
              if( !/^\s*$/.test( data[ i + VALUE ] ) ) 
              {
                tree += "<div style='margin-left:" + 16 * data[i+5] + "px;'>"+data[i+2]+"</div>";

                /*
                if( !graphic_arr[current_depth] ) 
                {
                  graphic_arr[current_depth] = [ line_count ];
                }
                else
                {
                  graphic_arr[current_depth].push( line_count );
                }
                */
                line_count++;


              }
            }
            else
            {
              tree += "<div style='margin-left:" + 16 * data[i+5] + "px;'>"+data[i+2]+"</div>";
              /*
              if( !graphic_arr[current_depth] ) 
              {
                graphic_arr[current_depth] = [ line_count ];
              }
              else
              {
                graphic_arr[current_depth].push( line_count );
              }
              */
              line_count++;

            }
          }

        }
      }
      

      
      //createGraphic(graphic_arr);
        var scrollTop = container.scrollTop;
        ( 
          container.firstChild ? 
          container.firstChild : 
          container.render(['div', 'class', 'padding']) 
        ).innerHTML = tree;
        container.scrollTop.scrollTop = scrollTop;
        topCell.statusbar.updateInfo(dom_data.getCSSPath());
        
      }

    var img_head_part = "data:image/svg-xml," + encodeURIComponent("<svg ");
    var img_content_part = encodeURIComponent(" xmlns='http://www.w3.org/2000/svg'><path "+
      "style='stroke:#ccc; fill:none; stroke-width:1; stroke-dasharray:1 1;' d='");
    var img_end_part = encodeURIComponent("'/></svg>");
    var line_height = 16;
    var margin = 16;

    var createGraphic = function(arr)
    {
      var p = null, i = 0;
      var path = '';
      var img_viewBox = '';
      var max_x = 0;
      var max_y = 0;
      var move_to = 0;
      var y_2 = 0;
      var out = ' ';
      for( ; p = arr[i]; i++)
      {
        if( p.length > 1 )
        {
          out += p + '\n';
          max_x = move_to = 6.5 + ( margin * ( i - 1 ) );
          y_2 = ( 8.5 + ( p[ p.length - 1 ] ) * line_height ); 
          path += 'M%20' + move_to + "%20" + ( p[0] * line_height ) + "%20" +
            "V%20" + y_2 + "%20";
          if( y_2 > max_y ) 
          {
            max_y = y_2;
          }
        }
      }
      img_viewBox = "width='" + ( ( max_x + margin ) >> 0 ) +"' "+
        "height='" + ( ( max_y + line_height ) >> 0 ) + "' " +
        "viewBox='0 0 " + ( ( max_x + margin ) >> 0 ) + " " + ( ( max_y + line_height ) >> 0 ) + "' ";
      var view_container = document.getElementById('dom-view');
      var img = img_head_part + encodeURIComponent(img_viewBox) + img_content_part +
        path + img_end_part;

      view_container.style.backgroundImage = 'url("' + img + '")';
      
    }
    

    this.init(id, name, container_class);
  }

  View.prototype = ViewBase;

  new View('dom-tree-style', 'DOM tree style', 'scroll dom tree-style');

  new Settings
  (
    'dom-tree-style', 
    {
      'force-lowercase': false, 
      'show-comments': true, 
      'show-attributes': true,
      'show-whitespace-nodes': true,
      'find-with-click': true,
      'highlight_on_hover': false,
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
          key: 'show-whitespace-nodes',
          label: ' show whitespace nodes'
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
