var koa = require('koa');
var server = require('koa-static');
var app = koa();

var opts = {
  maxage: 1000 * 60 * 60 * 24 * 365, // 1年，默认为0
  hidden: false, // 能否返回隐藏文件（以`.`打头），默认false不返回
  index: 'index.html', // 默认文件名
  defer: true, // 在yield* next之后返回静态文件，默认在之前
  gzip: true 
  // 允许传输gzip，如静态文件夹下有两个文件，index.js和index.js.gz，
  // 会优先传输index.js.gz，默认开启
};
app.use(server('../../www/static', opts));

// app.use(function *(){
//   this.body = 'Hello World';
// });

app.listen(8003);