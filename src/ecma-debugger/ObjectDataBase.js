window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["5.0"] || (cls.EcmascriptDebugger["5.0"] = {});

/**
  * @constructor 
  */

cls.EcmascriptDebugger["5.0"].ObjectDataBase = function()
{
  const 
  KEY = 0,
  VALUE = 1,
  TYPE = 2,
  DEPTH = 3,
  QUERIED = 4,
  SEARCH = 5,
  CONSTRUCTOR = 6,
  IS_VIRTUAL = 7,
  ITEM = 8,
  MAX_VALUE_LENGTH = 30;
  
  

  this.rt_id = '';
  this.data = [];

  this.parseXML = function(status, message, rt_id, obj_id, org_args)
  {
    const
    OBJECT_LIST = 0,
    // sub message ObjectInfo 
    VALUE = 0,
    PROPERTY_LIST = 1,
    // sub message ObjectValue 
    OBJECT_ID = 0,
    IS_CALLABLE = 1,
    IS_FUNCTION = 2,
    TYPE = 3,
    PROTOTYPE_ID = 4,
    NAME = 5,
    // sub message Property 
    PROPERTY_NAME = 0,
    PROPERTY_TYPE = 1,
    PROPERTY_VALUE = 2,
    OBJECT_VALUE = 3;


    var 
    obj = message[OBJECT_LIST][0],
    class_name = obj[VALUE] && obj[VALUE][NAME],
    props = null, 
    prop = null, 
    i=0,
    prop_type = '',
    index = this.getObject(obj_id),
    data_splice_args = [index + 1 + this.getCountVirtualProperties(index), 0],
    unsorted = [],
    depth = 0;

    
    // each object should have a class attribute 
    // this is a workaround 
    this.data[index][CONSTRUCTOR] || ( this.data[index][CONSTRUCTOR] = class_name );
    
    if( obj && index > -1 )
    {
      props = obj[PROPERTY_LIST];
      depth = this.data[index][DEPTH] + 1;
      this.data[index][QUERIED] = 1;
      
      if (props)
      {
        for( ; prop = props[i]; i++)
        {
          switch(prop[PROPERTY_TYPE])
          {
            case 'object':
            {
              unsorted[unsorted.length] = 
              [
                prop[PROPERTY_NAME],
                prop[OBJECT_VALUE][OBJECT_ID],
                'object',
                depth,
                ,
                ,
                prop[OBJECT_VALUE][NAME]
              ]
              break;
            }
            case 'undefined':
            {
              unsorted[unsorted.length] = 
              [
                prop[PROPERTY_NAME],
                'undefined',
                'undefined',
                depth
              ]
              break;
            }
            case 'null':
            {
              unsorted[unsorted.length] = 
              [
                prop[PROPERTY_NAME],
                'null',
                'null',
                depth
              ]
              break;
            }
            case 'number':
            {
              unsorted[unsorted.length] = 
              [
                prop[PROPERTY_NAME],
                prop[PROPERTY_VALUE].toString(),
                'number',
                depth
              ]
              break;
            }
            case 'string':
            {
              unsorted[unsorted.length] = 
              [
                prop[PROPERTY_NAME],
                '"' + prop[PROPERTY_VALUE] + '"',
                'string',
                depth
              ]
              break;
            }
            case 'boolean':
            {
              unsorted[unsorted.length] = 
              [
                prop[PROPERTY_NAME],
                prop[PROPERTY_VALUE],
                'boolean',
                depth
              ]
              break;
            }
          }
        }
      }

      var sort_key = function(a, b)
      { 
        return a[KEY] < b[KEY] ? -1 : a[KEY] > b[KEY] ? 1 : 0;
      }

      var sort_item = function(a, b)
      { 
        return a[ITEM] < b[ITEM] ? -1 : a[ITEM] > b[ITEM] ? 1 : 0;
      }

      if( class_name == "Array" )
      {
        // not very efficent, but dunno how to do it better
        var
        items = [],
        attributes = [],
        cursor = null,
        i = 0,
        re_d = /\d+/;

        for( ; cursor = unsorted[i]; i++)
        {
          if( re_d.test(cursor[KEY]) )
          {
            cursor[ITEM] = parseInt(cursor[KEY]);
            items[items.length] = cursor;
          }
          else
          {
            attributes[attributes.length] = cursor;
          }
        }
        items = items.sort(sort_item);
        attributes = attributes.sort(sort_key);
        unsorted = items.concat(attributes);
      }
      else
      {
        unsorted.sort(sort_key);
      }
      this.data.splice.apply(this.data, data_splice_args.concat(unsorted));

      if( org_args && !org_args[0].__call_count )
      {
        org_args[0].__call_count = 1;
        org_args.callee.apply(null, org_args)
      }
      
    }
  }


  this.getObject = function(obj_id, depth, key)
  {
    var prop = null, i = 0;
    for( ; prop = this.data[i]; i++)
    {
      if( prop[VALUE] == obj_id  
          && ( isNaN(depth) || prop[DEPTH] == depth )
          && ( !key || prop[KEY] == key )
        )
      {
        return i;
      }
    }
    return -1;
  }

  this.getCountVirtualProperties = function(index)
  {
    var prop = null, i = index + 1, depth = this.data[index][DEPTH] + 1, count = 0;
    
    for( ; ( prop = this.data[i] ) && prop[IS_VIRTUAL] && prop[DEPTH] == depth ; i++)
    {
      count += 1;
    }
    return count;
  }

  this.setObject = function(rt_id, obj_id, virtualProperties)
  {
    this.rt_id = rt_id;
    this.__cache = null;
    this.__cached_index = 0;
    this.data = 
    [
      [
        '',
        obj_id,
        'object',
        -1
      ]
    ]
    if( virtualProperties )
    {
      var prop = null, i = 0;
      for( ; prop = virtualProperties[i]; i++)
      {
        prop[IS_VIRTUAL] = 1;
      }
      this.data = this.data.concat(virtualProperties);
    }    
  }

  this.__cache = null;
  this.__cached_index = 0;

  this.__getData = function(index, target_depth)
  {
    /* TODO test if this works and if it's needed
    if( this.__cached_index == index && this.__cache )
    {
      return this.__cache;
    }
    */
    var ret = [], i = index + 1, depth = this.data[index][DEPTH], prop = null;
    ret.object_index = index;
    // it's a back refernce, return only the properties from the current level 
    // without the expanded properties
    if( target_depth > depth ) 
    {
      depth += 1;
      for ( ; ( prop = this.data[i] ); i++ )
      {
        if(  prop[DEPTH] == depth && !prop[IS_VIRTUAL] )
        {
          ret[ret.length] = prop;
        }
      }
    }
    else
    {
      for ( ; ( prop = this.data[i] ) && prop[DEPTH] > depth; i++ )
      {
        ret[ret.length] = prop;
      }
    }
    //this.__cache = ret;
    //this.__cached_index = index;
    return ret;
  }

  this.getData = function(rt_id, obj_id, depth, org_args)
  {
    var index = this.getObject(obj_id);
    if( rt_id == this.rt_id && index > -1 )
    {
      if( this.data[index][QUERIED] )
      {
        return this.__getData(index, depth);
      }
    }
    if(rt_id && obj_id)
    {
      var tag = tagManager.set_callback(this, this.parseXML, [rt_id, obj_id, org_args]);
      services['ecmascript-debugger'].requestExamineObjects(tag, [rt_id, [obj_id]]);
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
        "not valid id.\n  rt id: " + rt_id + "\n  object id: " + obj_id);
    }
    return null;
  }

  this.clearData = function(rt_id, obj_id, depth, key)
  {
    // obj_id is a string
    if(obj_id)
    {
      // back references can be tricky
      var index = this.getObject(obj_id, depth, key), i = 0, depth = 0, prop = null;
      if( rt_id == this.rt_id && index > -1 )
      {
        i = index + 1;
        depth = this.data[index][DEPTH];
        for ( ; ( prop = this.data[i] ) && prop[DEPTH] > depth; i++ );
        this.data.splice(index + 1, i - ( index + 1 ) );
        delete this.data[index][QUERIED];
      }
    }
    else
    {
      this.data = [];
    }
  }

  this.prettyPrint = function(data, target_depth, use_filter, filter_type)
  {
    var 
    ret = "", 
    prop = null, 
    i = 0, 
    val = "", 
    short_val = "",
    filter = {};
    // TODO: create for each Interface a filter with the default value
    if( use_filter )
    {
      if( filter_type == VALUE )
      {
        filter = { '""': 1, "null" : 1 };
      }
      else
      {
        filter = js_object_filters[ this.data[data.object_index][CONSTRUCTOR]] || {};
      }
    }
   
    // in case of a back reference
    var forced_depth = data[0] && target_depth >= data[0][DEPTH] && target_depth + 1 || 0;
    var depth = 0;

    for( ; prop = data[i]; i++)
    {
      val = prop[VALUE];

      //if(prop[KEY]
     
      short_val = "";
      if( filter && prop[filter_type] in filter  )
      {
        if( filter_type == KEY )
        {
          switch (prop[TYPE])
          {
            case 'object':
            case 'null':
            case 'undefined':
            {
              if ( prop[TYPE] == filter[prop[KEY]] )
              {
                continue;
              }
            }
            case 'string':
            {
              if ( val  == '"' + filter[prop[KEY]] + '"')
              {
                continue;
              }
            }
            case 'number':
            case 'boolean':
            {
              if ( val == filter[prop[KEY]] )
              {
                continue;
              }
            }
          }

        }
        else
        {
          continue;
        }
      }

      // FIXME: this is a bit problematic if it breaks in an entity/character reference.
      // Should be done with text-overflow: ellipsis
      // DFL-1037
      if (val.length > MAX_VALUE_LENGTH)
      {
        short_val = val.slice(0, MAX_VALUE_LENGTH) + "...";
      }

      if (typeof val == 'string')
      {
        // The escape of ' is for not messing up innerHTML down the line
        val = helpers.escapeTextHtml(val).replace(/'/g, '&#39;');
      }

      depth = forced_depth || prop[DEPTH];

      if( prop[TYPE] == 'object')
      {

        ret += "<item" + 
                      " obj-id='" + prop[VALUE] + "' "+
                      " depth='" + depth + "'>" +
                  "<input type='button' handler='examine-object-2'  class='folder-key'/>" +
                  "<key>" + prop[KEY] + "</key>" +
                  "<value class='object'>" + prop[CONSTRUCTOR] + "</value>" +
                "</item>";
        
      }
      else
      {
        if( short_val )
        {
            var item = document.createElement("item");
            item.innerHTML =
                  "<input type='button' handler='expand-value'  class='folder-key'/>" +
                  "<key>" + prop[KEY] + "</key>" +
                  "<value class='" + prop[TYPE] + "' data-value='" + val + "'/>";
            item.querySelector("value").textContent = short_val;
            ret += item.outerHTML;
        }
        else
        {
        ret += "<item>" + 
                  "<key class='no-expander'>" + prop[KEY] + "</key>" +
                  "<value class='" + prop[TYPE] + "'>" + val + "</value>" + 
                "</item>";
        }


      }

    }
    return ret;
  }
 

}
