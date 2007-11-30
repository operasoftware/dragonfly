//window.views = window.views || {};

(function()
{


  var View = function(id, name, container_class)
  {
    var self = this;

    var container_id = 'dom-view';
      /*
      0: object-id,
      1: type
      2: name
      3: ns
      4: text content
      5: level
      6: attrs
      7: has children
      8: is target
      9: is last
      */

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



    var renderView = function(tree, target, view_container)
    {
      view_container.innerHTML = tree;
      //alert(view_container);
      //var scrollTop = view_container.parentNode.scrollTop;
      if( target )
      {
        if(document.getElementById('target-element'))
        {
        document.getElementById('target-element').scrollIntoView();
        view_container.parentNode.scrollTop -= 100;
        }
        else
        {
          opera.postError("missing target in renderView in views['dom-inspector']");
        }
      }
      else
      {
       // view_container.parentNode.scrollTop = scrollTop;
      }
      var status_bar = document.getElementById('status-bar-' + container_id);
      if(status_bar)
      {
        status_bar.textContent = dom_data.getCSSPath();
      }
      //alert('time: '+(new Date().getTime() - window.time_dom_tree ));
    }

    this.createView = function(container)
    {
      updateMarkupStyle(null, null, container);
    }
/*
    this.update = function(target, caller)
    {

      if( ( document.getElementById('radio-markup-view') || {} ).checked )
      {
        updateMarkupStyle(target, caller);
        
      }
      else
      {
        updateDOMStyle(target, caller);
      }
    }
*/
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
        var status_bar = document.getElementById('status-bar-' + container_id);
        if(status_bar)
        {
          status_bar.textContent = dom_data.getCSSPath();
        }
      }
      else
      {
        opera.postError("missing implementation in updateTarget in views['dom-inspector']");
        // TODO
      }
    }

    this.isVisible = function()
    {
      return document.getElementById(container_id) && true;
    }




    var updateDOMStyle = function(target)
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

      var force_lower_case = ( document.getElementById('checkbox-force-lower-case') || {} ).checked;
      var show_comments = ( document.getElementById('checkbox-show-comments') || {} ).checked;
      var show_attrs = ( document.getElementById('checkbox-show-attributes') || {} ).checked;
      var show_white_space_nodes = 
          ( document.getElementById('checkbox-show-white-space-nodes') || {} ).checked;
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
      

      renderView(tree, target);
      //createGraphic(graphic_arr);
    }

    /*

  <svg  height='500px' width='500px' viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"><path style="stroke:#666; fill:none; stroke-width:1; stroke-dasharray:2 2;" d=" M 10.5 10 v 400 M 10 10.5 h 400 "/></svg>

  data:image/svg-xml,%3Csvg%20  %20height%3D'500px'%20width%3D'500px'%20viewBox%3D%22





  */
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

    var updateMarkupStyle = function(target, caller, container)
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

      var force_lower_case = ( document.getElementById('checkbox-force-lower-case') || {} ).checked;
      var show_comments = ( document.getElementById('checkbox-show-comments') || {} ).checked;
      var show_attrs = ( document.getElementById('checkbox-show-attributes') || {} ).checked;
      var node_name = '';
      var tag_head = '';

      if( ! data.length )
      {
        renderView('<p>Probably no runtime is selected</p>', target, container);
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

        renderView(tree, target, container);
      }
    }
    this.init(id, name, container_class);
  }

  View.prototype = ViewBase;
  new View('dom-inspector', 'DOM markup style', 'scroll dom-markup-style');


})()
