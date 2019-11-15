const http = require('http');
const fs = require('fs');

http.get('http://www.baidu.com',res=>{
    res.setEncoding('utf8');
    res.on('data',data=>{
        // console.log('data:',data);
        fs.appendFile('./public/index.html',data,err=>{
                console.log(err);
        });
    });
})