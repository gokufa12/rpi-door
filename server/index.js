var express = require('express');
var path = require('path');

var app = express();

app.use(express.static(path.join(__dirname, '../dist')));

var port = process.env.PORT || 8000;

app.listen(port, function() {
    console.log('Example app listening on port ' + port);
});