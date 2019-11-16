const request = require('request'); 
const fs = require('fs');
const iconv = require('iconv-lite');
const cheerio = require('cheerio');

const requestPromise = (url) =>{
 return new Promise((resolve,reject)=>{
    request(url, {encoding:null}, function (error, response, body) {
      if(response.statusCode==200){
        const bufs = iconv.decode(body,'gb2312');
        const html = bufs.toString('utf-8');
        resolve(html);
      }else{
        reject(error);
      }
    });
  });
};


const url = 'https://www.ygdy8.net/html/gndy/oumei/list_7_2.html';
const host = 'https://www.ygdy8.net';
requestPromise(url).then(res=>{
  const $ = cheerio.load(res);
  $('.co_content8 table').each((i,item)=>{
     const href = $(item).find('a:nth-child(2)').attr('href');
     getMovieDetail(href);
  });
});

const getMovieDetail = async (url) => {
  const html = await requestPromise(host+url);
  const $ = cheerio.load(html);
  const movie = {
    name:$('#header > div > div.bd2 > div.bd3 > div.bd3l > div.co_area2 > div.title_all > h1 > font').text(),
    desc:'',
    picture:''
  }
  console.log('movie:',movie);
}