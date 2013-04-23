var nQuery = require('node-query');
var Parser = nQuery.Parser;
var AstReader = nQuery.AstReader;
var Executor  = nQuery.Executor;
var doSelectFilter = Executor.doSelectFilter;
var util = require('./util');

function run(str, dc) {
  var ast = Parser.parse(str);
  var ar  = new AstReader(ast);
  var res = doSelectFilter(dc, ar);
  return res;
}

function _query (str, dc, cb) {
  var dc;
  try {
    dc = run(str, dc);
  } catch (e) {
    cb(e);
    return;
  }
  cb(null, dc);
}

var _format = function (sql, params) {
  return sql.replace(/:(\w+)/g, function (w, i) {
    return util.escape(params[i]);
  });
};

var Memsql = function (options) {
  options = options || {};
  this.data = options.tables || {};
}

Memsql.prototype.addTable = function(name, dc) {
  var data = this.data;
  if (data[name]) {
    return 0;
  }
  data[name] = dc;
};

var _addTableRow = function (dc, row) {
  var columns = dc.columns;
  var data = dc.data;
  var items = [];
  for (var i = 0; i < columns.length; i++) {
    items.push(row[columns[i]]);
  }
  data.push(items);
};

Memsql.prototype.query = function(params, cb) {
  var sql = undefined;
  if (typeof params === 'string') {
    sql = params;
  } else if (params.sql &&  params.params) {
    sql = _format(params.sql, params.params);
  }
  try{
    var sqlObject = nQuery.parse(sql);
  } catch(err) {
    return cb(err);
  }
  var type = sqlObject.type;

  var data = this.data;

  //插入
  if ('insert' === type) {
    var table = sqlObject.table;
    var columns = sqlObject.columns;
    var values = sqlObject.values;
    data[table] = data[table];
    for (var i = 0; i < values.length; i++) {
      var value = values[i];
      var row = {};
      var rowData = [];
      for (var j = 0; j < columns.length; j++) {
        var column = columns[j];
        row[column] = value.value[j].value;
      };
      _addTableRow(data[table], row);
    }
  } else if ('select' === type) { //查询
    var table = sqlObject.from[0].table;
    return _query(sql, data[table], function (err, rows) {
      if (err) {
        return cb(err);
      }
      var items = [];
      var columns = rows.columns;
      var data = rows.data;
      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        var obj = {};
        for (var j = 0; j < columns.length; j++) {
          obj[columns[j]] = row[j];
        }
        items.push(obj);
      }
      cb(null, items);
    });
  } else if ('update' === type) {//更新
    var table = sqlObject.table;
    data[table] = data[table];
    var td = data[table];
    var columns = td.columns;
    var tddata = td.data;
    var column = sqlObject.where.left.column;
    var value = sqlObject.where.right.value;
    var index = columns.indexOf(column);
    if (index >= 0) {
      for (var i = 0; i < tddata.length; i++) {
        var row = tddata[i];
        if (row[index] === value) {
          var set = sqlObject.set;
          for (var j = 0; j < set.length; j++) {
            var item = set[j];
            var scolumn = item.column;
            var svalue = item.value.value;
            var sindex = columns.indexOf(scolumn);
            if (sindex >= 0) {
              row[sindex] = svalue
            }
          }
        }
      }
    }
  } else if ('delete' === type) {//删除,暂时不支持delete
  }
  cb();
};

module.exports = Memsql;