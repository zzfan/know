
/*
 * GET home page.
 */

//exports.index = function(req, res){
//  res.render('index', { title: 'Express' });
//};
var crypto = require('crypto'),//加密模块
    User = require('../models/user.js');//引入用户登陆函数
module.exports = function(app){
    //http://localhost:3000/ 请求地址
    app.get('/',function(req,res){
          //因为登陆成功会将信息记录到session中，所有如果不存在就到登陆注册页面，如果存在就表示用户已经登陆，直接跳转到展示页面
        if(!req.session.user){ 
            res.render('index', {  
                title:"知道", 
                name:"问答平台", 
                user:req.session.user, //这里可以用ejs摸版的locals.user 访问到
                error: req.flash('error').toString(),  //这里可以用ejs摸版的locals.error 访问到
                success: req.flash('success').toString()  //这里可以用ejs摸版的locals.success 访问到
            }); 
        }else{ 
            res.redirect('/show'); 
        } 
    });
    //http://localhost:3000/loginout  登出请求地址
    app.get('/loginout',function(req,res){
        req.session.user = null;
        req.flash('success','登出成功！');
        res.redirect('/');
    });
    //发送登陆信息接受地址http://localhost:3000/login
    app.post('/login',function(req,res){
            //post过来的密码加密
        var md5 = crypto.createHash('md5'), 
          password = md5.update(req.body.password).digest('hex'); 
        var newUser = new User({ 
          name: req.body.name, 
          password: password 
        }); 
        //查找用户
        User.get(newUser.name, function(err, user){ 
            if(user){ 
                //如果存在，就返回用户的所有信息，取出password来和post过来的password比较
                if(user.password != password){ 
                    req.flash('error','密码不正确'); 
                    res.redirect('/'); 
                }else{ 
                    req.session.user = user; 
                    res.redirect('/show'); 
                } 
            }else{ 
                req.flash('error','用户不存在'); 
                res.redirect('/'); 
            } 
        }); 
    });
    //发送注册信息接受地址http://localhost:3000/reg
    app.post('/reg',function(req,res){
              //在post请求后的反应
   //post信息中发送过来的name,password和repassword,用req.body获取
    var name = req.body.name, 
          password = req.body.password, 
          password_re = req.body['repassword']; 
        //后端判断两次注册的密码是否相等
        if(password_re != password){
            //如果密码不相等，将信息记录到页面通知flash,然后跳转到http://localhost:3000/
            req.flash('error','两次输入的密码不一致!');  
            return res.redirect('/'); 
        }
        //对密码进行加密操作 
        var md5 = crypto.createHash('md5'), 
          password = md5.update(req.body.password).digest('hex'); 
        var newUser = new User({ 
          name: req.body.name, 
          password: password 
        }); 
       //使用user.js中的user.get() 函数来读取用户信息
        User.get(newUser.name, function(err, user){ 
            //如果有返回值，表示存在用户
            if(user){ 
              err = '用户已存在!'; 
            } 
            if(err){
              //如果报错，记录错误信息和页面跳转
              req.flash('error', err); 
              return res.redirect('/'); 
            } 
            //使用user.js的user.save() 保存信息函数
            newUser.save(function(err,user){ 
              if(err){ 
                req.flash('error',err); 
                return res.redirect('/'); 
              } 
              //成功后，将用户信息记录在页面间的会话req.session中，并且跳转到一个新页面，就是内容集中展示页面
              req.session.user = user; 
              req.flash('success','注册成功!'); 
              res.redirect('/show'); 
            }); 
        });  
    });
    //http://localhost:3000/show  网站登陆后内容展示页
    app.get('/show',function(req,res){
        User.getQuestion(function(data){  //使用User.getQuestion()获取问题
          if(data.length==0){//数据库没有内容
            res.render('show',{
              lists:data,
              user:req.session.user
            });
            return;
          }
          for(var i=0,l=data.length;i<l;i++){ 
              data[i].url="/people/"+data[i].name; 
              data[i].imgUrl=data[i].imgUrl.replace("./public/",""); 
          }    
          res.render('show',{ 
              lists:data, 
              user:req.session.user 
          }); 
        });  
    });
    //ajax异步的get请求获取地址http://localhost:3000/getQuestion
    app.get('/getQuestion',function(req,res){
        User.getQuestionPage(req.query.page,function(data){ 
           //对返回的数据做些处理
            for(var i=0,l=data.length;i<l;i++){
               // data[i].url = "/people/" + data[i].name;
                data[i].imgUrl=data[i].imgUrl.replace("./public/","");
            }
            //console.log(data);
            res.send(data) 
           // console.log('ll');
        });  
    });
    //http://localhost:3000/people/tang  tang这个用户的展示页面
    app.get('/people/:user',function(req,res){
    });
    //发生编辑和修改个人信息的请求地址http://localhost:3000/people
    app.post('/people',function(req,res){
    });
    //http://localhost:3000/question/1 具体问题展示页
    app.get('/question/:id',function(req,res){
    });
    //http://localhost:3000/error 404和错误页面展示地址
    app.get('/error',function(req,res){
    });
    //ajax异步提问发生问题地址http://localhost:3000/ask
    app.post('/ask',function(req,res){
        var ask={}; 
          ask.title=req.body.title; //post发送的问题标题
          ask.askText=req.body.askText; //post发送的问题内容
          ask.answer=[]; //先设置一个空数组，这个数组以后push问题的回答
          ask.name=req.session.user.name; //提问者的名字
          //调用ask函数，存入用户提问
          User.ask(ask,function(err, doc){
               if(err){
                    req.flash('error',err);
                   return res.redirect('/');
               }
               //如果成功存入，返回{"status": 1}给客户端
               res.send({"status": 1});
          })
    });
    //ajax异步回答问题地址http://localhost:3000/answer
    app.post('/answer',function(req,res){
    });
    //百度百科爬虫获取地址
    app.get('/baike',function(req,res){
    });
      
    //后台管理
    app.get('/admin',function(req,res){
    });
    //管理员登陆发送信息地址
    app.post('/adminLogin',function(req,res){  
    });
    //信息管理页面地址
    app.get('/admincon',function(req,res){
    });
    //发生修改信息地址
    app.post('/adminchange',function(req,res){
    });
};
