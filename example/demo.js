var Memsql = require('../');

var memsql = new Memsql({
  tables: {
    document: {
      columns :  [ 'name', 'detail', 'status'],
      data : []
    }
  }
});

var sql1 = 'INSERT INTO document(name, detail, status) VALUES ("key", "value", 1)';
var sql2 = 'SELECT * FROM document';
var sql3 = 'SELECT * FROM document WHERE status = 0';

memsql.query(sql1, function (err) {
  memsql.query(sql2, function (err, rows) {
    console.log(rows);
    memsql.query(sql3, function (err, rows) {
      console.log(rows);
    });
  });
});

var sql4 = 'INSERT INTO document(name, detail, status) VALUES ("key1", "value1", 1)';
var sql5 = 'UPDATE document SET detail = "value2" WHERE name ="key1"';
var sql6 = 'SELECT * FROM document WHERE name = "key1"';

memsql.query(sql4, function (err) {
  memsql.query(sql5, function (err) {
    memsql.query(sql6, function (err, rows) {
      console.log(rows);
    });
  });
});

var sql7 = 'INSERT INTO document(name, detail, status) VALUES ("key2", "value2", 1)';
var sql8 = 'SELECT * FROM document WHERE name = :key';

memsql.query(sql7, function (err) {
  memsql.query({sql: sql8, params: {key: 'key2'}}, function (err, rows) {
    console.log(rows);
  });
});