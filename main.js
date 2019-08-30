const pjson = require('./package.json');
const arg = require('arg');
const openurl = require("openurl");
const chalk = require('chalk');
const fs = require('fs');
const http = require('http');
const request = require('request');
const progress = require('request-progress');
const unzip = require('unzip2');

const args = arg({
  // Types
  '--help': Boolean,
  '--version': Boolean,
  '--preview': Boolean,
  // Aliases
  '-H': '--help',
  '-V': '--version',
  '-P': '--preview',
});
// console.log(args);

console.log(`${pjson.description} 版本:${pjson.version}\n`);
if (args["--version"]){
  return;
}

if (args["--preview"]){
  preview();
  return;
}

function preview() {
  var writeStream = fs.createWriteStream('test.zip',{autoClose:true});
  progress(request('https://marisfrolg.nos-eastchina1.126.net/UPDATE/public/test.zip'), {
    throttle: 50,                    // Throttle the progress event to 2000ms, defaults to 1000ms
    // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms
    // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length
  })
  .on('progress', function (state) {
    // The state is an object that looks like this:
    // {
    //     percent: 0.5,               // Overall percent (between 0 to 1)
    //     speed: 554732,              // The download speed in bytes/sec
    //     size: {
    //         total: 90044871,        // The total payload size in bytes
    //         transferred: 27610959   // The transferred payload size in bytes
    //     },
    //     time: {
    //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
    //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
    //     }
    // }
    console.log(chalk`{yellow 下载进度: ${(state.percent*100).toFixed(1)}%}`);
    // console.log('progress', state);
  })
  .on('error', function (err) {
    console.log(chalk`{yellow 下载错误: ${err}}`);
    // Do something with err
  })
  .on('end', function () {
    console.log(chalk`{green 下载完成}`);
  })
  .pipe(writeStream);

  // 写完文件后就开始解压
  writeStream.on('finish',function(){
    console.log(chalk`{green zip文件写入成功}`);
    fs.createReadStream('./test.zip')
    .pipe(unzip.Extract({path:'./www'}))
    .on('finish', function(){
      console.log(chalk`{green 解压完成}`);

      console.log(chalk`{white 正在准备启动web服务...}`);
      startServer();
      console.log(chalk`{green 准备打开预览页面}`);
      openurl.open("http://localhost:8080/index.html");
    })
    .on('error', console.log);    
  });
}

function startServer() {
  var server = http.createServer(function( req, res ){
    var fileName = './www' + req.url;
    fs.readFile( fileName, function( err, data ){
     if( err ){
      res.write( '404' );
     }else {
      res.write( data );
     }
     res.end();
    } );
   }).listen( 8080 );
}