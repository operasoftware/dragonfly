var frame_inspection = new function()
{
  var frame = 
  {
    items: [],
    runtime_id: ''
  };

  var self = this;



  this.handleExamineObject = function(xml, path_arr)
  {
    if( window.__profiling__ ) 
    {
      window.__times__[1] =  new Date().getTime();
    }

    var obj = xml.getElementsByTagName('object')[0];

    if( obj )
    {
      var props = obj.getElementsByTagName('property'), prop = null, i=0;
      var prop_type = '';
      var unsorted = []; 

      for( ; prop = props[i]; i++)
      {
        switch(prop.getNodeData('data-type'))
        {
          case 'object':
          {
            unsorted[unsorted.length] = 
            {
              key: prop.getNodeData('property-name'),
              value: prop.getNodeData('object-id'),
              type: 'object',
              items: []
            }
            break;
          }
          case 'undefined':
          {
            unsorted[unsorted.length] = 
            {
              key: prop.getNodeData('property-name'),
              value: '"undefined"',
              type: 'undefined'
            }
            break;
          }
          case 'null':
          {
            unsorted[unsorted.length] = 
            {
              key: prop.getNodeData('property-name'),
              value: 'null',
              type: 'null'
            }
            break;
          }
          case 'number':
          {
            unsorted[unsorted.length] = 
            {
              key: prop.getNodeData('property-name'),
              value: prop.getNodeData('string'),
              type: 'number'
            }
            break;
          }
          case 'string':
          {
            unsorted[unsorted.length] = 
            {
              key: prop.getNodeData('property-name'),
              value: '"' + prop.getNodeData('string') + '"',
              type: 'string'
            }
            break;
          }
          case 'boolean':
          {
            unsorted[unsorted.length] = 
            {
              key: prop.getNodeData('property-name'),
              value: prop.getNodeData('string'),
              type: 'boolean'
            }
            break;
          }
        }
      }

      if( window.__profiling__ ) 
      {
        window.__times__[2] =  new Date().getTime(); // parsing
      }

      unsorted.sortByFieldName('key');

      if( window.__profiling__ ) 
      {
        window.__times__[3] =  new Date().getTime(); // sorting
      }

      self.getObject( path_arr ).items = unsorted;

    }
  }

  this.setNewFrame = function(runtime_id)
  {
    frame.items = [];
    frame.runtime_id = runtime_id;
  }

  this.addObjects = function(path_arr, index, object_arr)
  {
    var _frame = self.getObject(path_arr);
    if( _frame && _frame.items )
    {
      _frame.items.splice(index, 0, object_arr);
    }
  }

  this.getRuntimeId = function()
  {
    return frame.runtime_id;
  }

  this.getObject = function( path_arr )
  {
    // cache last path
    var cur = frame, prov = null, length = 0, i = 0;
    if( path_arr )
    {
      length = path_arr.length;
      for( ; i < length; i++ )
      {
        if( cur && cur.items )
        {
          cur = cur.items[ path_arr[i] ];
        }
        else
        {
          opera.postError('Error in frame_inspection.getObject');
          break;
        }
      }
    }
    return cur;
  }

}