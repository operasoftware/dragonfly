var NodeList = function(message)
{
  this.nodeList = message[0] && message[0].map(function(node){return new NodeInfo(node)}) || [];
}

var NodeInfo = function(node)
{
  this.objectID = node[0];
  this.type = node[1];
  this.name = node[2];
  this.depth = node[3];
  this.namespacePrefix = node[4];
  this.attributeList = node[5] && node[5].map(function(attr){return new Attribute(attr);}) || [];
  this.childrenLength = node[6];
  this.value = node[7];
  this.publicID = node[8];
  this.systemID = node[9];
}

var Attribute = function(attr)
{
  this.namePrefix = attr[0];
  this.name = attr[1];
  this.value = attr[2];
}
