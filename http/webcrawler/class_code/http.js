
const http = require('http')

http.get('http://www.baidu.com', function(response) {
  response.setEncoding('utf8');
  response.on('data', function(res) {
    console.log(res)
  })
})