const AV = require('leanengine');
const https = require('https');
const requestjson = require('request-json');

/**
 * 一个简单的云代码方法

 AV.Cloud.define('hello', function(request) {
  var token = AV.Object.createWithoutData('Global', '5957121e128fe100582b6461');
  token.set('value', 'hello');
  token.save();
  return 'Hello world!';
});
 */

AV.Cloud.define('postNotification', function(request) {
  var params = request.params
  const user = request.currentUser;
  if (!user) {
    return {'error' : '用户未登录'};
  }
  const authData = user.get('authData');
  if (!authData || !authData.lc_weapp) {
    return {'error' : '当前用户不是小程序用户'};
  }
  if (params == null) {
    return {'error' : 'no params'};
  }else{
    var contents = {
      "touser": authData.lc_weapp.openid,  
      "template_id": params.template_id,         
      "form_id": params.form_id,
      "page": params.page,
      "data": params.data,
      "emphasis_keyword": params.emphasis_keyword
    };
    console.log(contents)
    var token = AV.Object.createWithoutData('Global', '5957121e128fe100582b6461');
    token.fetch().then(function(){

      try {
        var value = JSON.parse(token.get('value'))
        var url = "/cgi-bin/message/wxopen/template/send?access_token=";
        url += value.access_token;
        var client = requestjson.createClient('https://api.weixin.qq.com');
    
        client.post(url, contents, function(err, res, body) {
          console.log(res.statusCode,body);
        });
      
      } catch (e) {
        console.error(e.message);
        return e.message;
      }
  
    }, function (error) {
      console.error(error.message);
      return error.message;
    });
    };
  
});

AV.Cloud.define('getAccessToken', function(request) {
  var url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid="+process.env.APPID+"&secret="+process.env.APPSECRET;
  console.log(url);
  https.get(url, (res) => {
    const { statusCode } = res;
    const contentType = res.headers['content-type'];

    let error;
    if (statusCode !== 200) {
      error = new Error('请求失败。\n' +
        '状态码: ${statusCode}');
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error('无效的 content-type.\n' +
        '期望 application/json 但获取的是 ${contentType}');
    }
    if (error) {
      console.error(error.message);
      // 消耗响应数据以释放内存
      res.resume();
      return;
    }
  
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(rawData);
        console.log(parsedData);
        var token = AV.Object.createWithoutData('Global', '5957121e128fe100582b6461');
        token.fetch().then(function(){
          token.set('value', rawData);
          token.save();
        }, function (e) {
          console.error(e.message);
        });
        } catch (e) {
          console.error(e.message);
        }
    });
  }).on('error', (e) => {
    console.error(`错误: ${e.message}`);
  });
})
