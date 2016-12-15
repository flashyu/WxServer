var koa = require('koa');
var server = require('koa-static');
var router  = require('koa-router')();
var koaBody = require('koa-body')();
var app = koa();

var crypto = require('crypto');
var request = require('request');

var ticketCache = '';
var lastRequestTime = 0;
var expiresIn = 0;

var config = {
	appId: 'wxfd34115fe57ef370',
	appSecret: 'c9f96381e1a1907c2e99eea9797f92f6'
};

router.getJ('/api/getWxConfig', koaBody, function *(next){
	var timestamp = getTimesTamp();
	var isExpire = timestamp - lastRequestTime > expiresIn;
	var nonceStr = getNonceStr();
	var url = this.query.url;
	var ticket;
	if (ticketCache && !isExpire) {
		ticket = ticketCache;
	}else{
		var token = yield getToken(config);
		var data = yield getNewTicket(token);
		ticketCache = data.ticket;
		expiresIn = data.expires_in || 0;
		lastRequestTime = getTimesTamp();
	}
	signature = calcSignature(ticket, nonceStr, timestamp, url);
	this.body = { appId:config.appId, timestamp:timestamp, nonceStr:nonceStr, signature:signature };
});

app.use(router.routes());
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
//
function getToken(config) {
	return new Promise(function(resolve, reject){
		var tokenUrl = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appId=' + config.appId + '&secret=' + config.appSecret;
	    request.get(tokenUrl, function(error, response, body) {
	        if (error) {
	            reject('getToken error', error);
	        }
	        else {
	            try {
	                var token = JSON.parse(body).access_token;
	                // cb(null, token);
	                resolve(token);
	            }
	            catch (e) {
	                reject('getToken error', e);
	            }
	        }
	    });
	});
}
//
function getNewTicket(token) {
	return new Promise(function(resolve, reject){
	    request.get('https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + token + '&type=jsapi', function(error, res, body) {
	        if (error) {
	            reject('getNewTicket error', error);
	        }
	        else {
	            try {
	                var data = JSON.parse(body);
	                console.log(data)
	                resolve({token:data.ticket, expires_in:data.expires_in})
	            }
	            catch (e) {
	                reject('getNewTicket error', e);
	            }
	        }
	    });
	});
}

function getTimesTamp() {
    return parseInt(new Date().getTime() / 1000) + '';
}
function getNonceStr() {
    return Math.random().toString(36).substr(2, 15);
}

function calcSignature(ticket, noncestr, ts, url) {
	var str = 'jsapi_ticket=' + ticket + '&noncestr=' + noncestr + '&timestamp='+ ts +'&url=' + url;
	return crypto.createHash('sha1').update(str).digest('hex');
}

app.listen(8003);