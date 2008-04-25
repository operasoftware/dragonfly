var ObjectDataBase = new function()
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
  MAX_VALUE_LENGTH = 50;
  
  

  this.rt_id = '';
  this.data = [];

  this.parseXML = function(xml, rt_id, obj_id, org_args)
  {
    
    var 
    obj = xml.getElementsByTagName('object')[0],
    props = null, 
    prop = null, 
    i=0,
    prop_type = '',
    index = this.getObject(obj_id),
    unsorted = [index + 1 + this.getCountVirtualProperties(index), 0],
    depth = 0;
    if( obj && index > -1 )
    {
      props = obj.getElementsByTagName('property');
      depth = this.data[index][DEPTH] + 1;
      this.data[index][QUERIED] = 1;

      for( ; prop = props[i]; i++)
      {
        switch(prop.getNodeData('data-type'))
        {
          case 'object':
          {
            unsorted[unsorted.length] = 
            [
              prop.getNodeData('property-name'),
              prop.getNodeData('object-id'),
              'object',
              depth
            ]
            break;
          }
          case 'undefined':
          {
            unsorted[unsorted.length] = 
            [
              prop.getNodeData('property-name'),
              '"undefined"',
              'undefined',
              depth
            ]
            break;
          }
          case 'null':
          {
            unsorted[unsorted.length] = 
            [
              prop.getNodeData('property-name'),
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
              prop.getNodeData('property-name'),
              prop.getNodeData('string'),
              'number',
              depth
            ]
            break;
          }
          case 'string':
          {
            unsorted[unsorted.length] = 
            [
              prop.getNodeData('property-name'),
              '"' + prop.getNodeData('string') + '"',
              'string',
              depth
            ]
            break;
          }
          case 'boolean':
          {
            unsorted[unsorted.length] = 
            [
              prop.getNodeData('property-name'),
              prop.getNodeData('string'),
              'boolean',
              depth
            ]
            break;
          }
        }
      }

      unsorted.sort(function(a, b){ return a[KEY] < b[KEY] ? -1 : a[KEY] > b[KEY] ? 1 : 0});
      this.data.splice.apply(this.data, unsorted);
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
        obj_id
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
    // it's a back refernce, return only the properties from the current level 
    // without the expanded properties
    if( target_depth > this.data[index][DEPTH] ) 
    {
      depth += 1;
      for ( ; ( prop = this.data[i] ); i++ )
      {
        if(  prop[DEPTH] == depth )
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
    var tag = tagManager.setCB(this, this.parseXML, [rt_id, obj_id, org_args]);
    services['ecmascript-debugger'].examineObjects(tag, rt_id, obj_id);
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

  this.prettyPrint = function(data, target_depth, filter, filter_type)
  {
    var ret = "", prop = null, i = 0, val = "", short_val = "";
    // in case of a back reference
    var forced_depth = data[0] && target_depth >= data[0][DEPTH] && target_depth + 1 || 0;
    var depth = 0;
    for( ; prop = data[i]; i++)
    {
      val = prop[VALUE];
      short_val = "";
      if( filter && prop[filter_type] in filter )
      {
        continue;
      }
      if( val.length > MAX_VALUE_LENGTH )
      {
        short_val = val.slice(0, MAX_VALUE_LENGTH) +"...";
        val = val.replace(/</g, '&gt;').replace(/'/g, '&#39;');
      }
      val = val.replace(/</g, "&gt;");

      depth = forced_depth || prop[DEPTH];

      if( prop[TYPE] == 'object')
      {

        ret += "<item style='padding-left:" + ( 9 + 16 * depth ) + "px'" +
                      " obj-id='" + prop[VALUE] + "' "+
                      " depth='" + depth + "'>" +
                  "<input type='button' handler='examine-object-2'  class='folder-key'/>" +
                  "<key>" + prop[KEY] + "</key>" +
                  "<value class='object'>object</value>" +
                "</item>";
        
      }
      else
      {
        if( short_val )
        {
        ret += "<item style='padding-left:" + ( 9 + 16 * depth ) + "px'>" +
                  "<key>" + prop[KEY] + "</key>" +
                  "<value class='" + prop[TYPE] + "' title='" + val + "'>" + 
                      short_val+ 
                  "</value>" + 
                "</item>";
        }
        else
        {
        ret += "<item style='padding-left:" + ( 9 + 16 * depth ) + "px'>" +
                  "<key>" + prop[KEY] + "</key>" +
                  "<value class='" + prop[TYPE] + "'>" + val + "</value>" + 
                "</item>";
        }


      }

    }
    return ret;
  }
 

}