
var request = require('request');
var iconv = require('iconv-lite');
const cheerio = require('cheerio');
const fs = require('fs');

const requestPromise = (url) => {
  return new Promise((resolve, reject) => {
    request(url,{ encoding: null }, function (error, response, body) {
      if (response.statusCode === 200) {
        const bufs = iconv.decode(body, 'gb2312');
        const html = bufs.toString('utf8');
        resolve(html);
      } else {
        reject(error);
      }
    });
  })
}


const url = '/html/gndy/oumei/list_7_{10}.html';

const host = 'https://www.ygdy8.net';

const getList = async (url) => {
  // console.log(url);
  const html = await requestPromise(url);
  const $ = cheerio.load(html);
  $('.co_content8 ul table tbody tr:nth-child(2) td:nth-child(2) b a:nth-child(2)').each((i, item) => {
    getMovieDetail($(item).attr('href'));
  })
}


const getMovieDetail = async (url) => {
  const html = await requestPromise(host + url);
  const $ = cheerio.load(html);
  const movie = {
    name: $('#header > div > div.bd2 > div.bd3 > div.bd3l > div.co_area2 > div.title_all > h1 > font').text(),
    desc: $('#Zoom > span > p:nth-child(1)').text(),
    picture: $('#Zoom > span > p:nth-child(1) > img:nth-child(3)').attr('src'),
  };
  fs.appendFile('./public/index.js', JSON.stringify(movie), function(err) {

  });
  console.log(movie);
}

const arr = [];
for (let i = 1; i <= 225; i++) {
  arr.push(`${host}/html/gndy/oumei/list_7_${i}.html`);
}

arr.reduce((rs, url) => {
  return rs.then(() => {
    return new Promise(async (resolve) => {
      await getList(url);
      resolve();
    })
  })
}, Promise.resolve());

// 2000 * 30 = 30000