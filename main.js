const pjson = require('./package.json');
const arg = require('arg');
const openurl = require("openurl");
const chalk = require('chalk');
const fs = require('fs');
const http = require('http');
const request = require('request');
const progress = require('request-progress');
const unzip = require('unzip2');
const rmdir = require('rmdir');

const args = arg({
  // Types
  '--help': Boolean,
  '--version': Boolean,
  '--init': Boolean,
  '--preview': Boolean,
  '--url': String,
  // Aliases
  '-H': '--help',
  '-V': '--version',
  '-P': '--preview',
  '-U': '--url',
  '-I': '--init',
});
// console.log(args);

console.log(`${pjson.description} 版本:${pjson.version}\n`);
if (args["--version"]) {
  return;
}

if (args["--help"]) {
  console.log(`命令参数:
  -H  --help      帮助，显示参数
  -V  --version   显示程序版本
  -P  --preview   预览效果
  -U  --url       初始化时，要下载的zip包
  -I  --init      初始化
  例如:
  ./miniprogram_tool --init --url 'https://marisfrolg.nos-eastchina1.126.net/UPDATE/public/test.zip'
  ./miniprogram_tool --preview
  `
  );
  return;
}

var url = args["--url"] ? args["--url"] : 'https://marisfrolg.nos-eastchina1.126.net/UPDATE/public/test.zip';

if (args["--init"]) {
  rmdir('./www', function (err, dirs, files) {
    init();
  });
  return;
}

if (args["--preview"]) {
  preview();
  return;
}

function init() {
  var writeStream = fs.createWriteStream('target.zip', { autoClose: true });
  progress(request(url), {
    throttle: 50,// Throttle the progress event to 50ms, defaults to 1000ms
  })
    .on('progress', function (state) {
      console.log(chalk`{yellow 下载进度: ${(state.percent * 100).toFixed(1)}%}`);
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
  writeStream.on('finish', function () {
    console.log(chalk`{green zip文件写入成功}`);
    fs.createReadStream('./target.zip')
      .pipe(unzip.Extract({ path: './www' }))
      .on('finish', function () {
        console.log(chalk`{green 解压完成}`);
        preview();
      })
      .on('error', console.log);
  });
}

function preview() {
  fs.exists("./www",function(exists){
    if(exists){
      console.log(chalk`{white 正在准备启动web服务...}`);
      startServer();
      console.log(chalk`{green 自动打开预览页面}`);
      openurl.open("http://localhost:8080/index.html");
    } else {
      console.log(chalk`{red www目录不存在，请先用--init参数初始化}`);
    }
  });  
}

function startServer() {
  var server = http.createServer(function (req, res) {
    var fileName = './www' + req.url;
    fs.readFile(fileName, function (err, data) {
      if (err) {
        res.write('404');
      } else {
        res.write(data);
      }
      res.end();
    });
  }).listen(8080);
}
