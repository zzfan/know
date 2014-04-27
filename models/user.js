var mongodb = require('./db');
function User(user){ 
  //注册用户需要的信息name,password,email等
  this.name = user.name; 
  this.password = user.password; 
  this.email = user.email; 
 //用户在后面能保存更新的一些信息
  this.address = user.address; 
  this.company=user.company; 
  this.school=user.school; 
  this.info=user.info; 
  this.imgUrl=user.imgUrl;
}; 
module.exports = User; 
User.prototype.save=function(callback){ 
 //callback 是执行玩保存后的回调函数
  var user = { 
      name: this.name, 
      password: this.password, 
      //下面内容在注册时不用填，在个人首页可以修改，所以先设置默认值和默认头像
      address:"暂无",
      company:"暂无",
      school:"暂无",
      info:"暂无",
      imgUrl:"./public/images/11.jpg"
  }; 
  //打开数据库
  mongodb.open(function(err,db){ 
    //如果打开出错，err会有出错信息，否则为null
    if(err){ 
      //将注册信息错误信息作为参数返回给回调函数
      return callback(err); 
    } 
    //连接数据库中的名为user的表，没有就创建
    db.collection('user',function(err,collection){ 
      //连接失败会将错误信息返回给回调函数，并且关闭数据库连接
      if(err){ 
        mongodb.close(); 
        return callback(err); 
      } 
       //插入新的数据
      collection.insert(user,{safe: true},function(err,result){ 
        //不管是否成功都关闭数据库
        mongodb.close(); 
        //如果错误err有错误信息，将err和user返回给回调函数
        callback(err, user);//成功！返回插入的用户信息 
      }); 
    }); 
  }) 
}
//读取用户信息 
User.get = function(name, callback){ 
  //打开数据库 
  mongodb.open(function(err, db){ 
    if(err){ 
      return callback(err); 
    } 
    //读取 users 集合 
    db.collection('user', function(err, collection){ 
      if(err){ 
        mongodb.close(); 
        return callback(err); 
      } 
      //查找用户名 name 值为 name文档 
      collection.findOne({name: name},function(err, doc){ 
        mongodb.close(); 
        if(doc){ 
          var user = new User(doc); 
          callback(err, user);//成功！返回查询的用户信息 
        } else { 
          callback(err, null);//失败！返回null 
        } 
      }); 
    }); 
  }); 
};

User.ask = function(ask, callback){
  mongodb.open(function(err,db){ 
    if(err){ 
      return callback(err); 
    } 
    var date = new Date(); //获取当前时间，在存入问题时，我们给问题添加一个时间属性
    var time = { 
      date: date, 
      year : date.getFullYear(), 
      month : date.getFullYear() + "-" + (date.getMonth()+1), 
      day : date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate(), 
      minute : date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() 
    } 
    ask.time=time; 
    ask.hide=true; //这样用于未来后台管理，控制是否显示还是屏蔽问题
  
    db.collection('question',function(err,collection){ //存入question表中
      if(err){ 
        mongodb.close(); 
        return callback(err); 
      } 
      //下面这段是一个知识点，我们的网站可以显示每个问题，这样就需要一个唯一的id，而mongodb不支持自增益，所以我们需要处理一下，mongodb默认的是自动生成一个id，但是我们暂时不知道规律，所以我们将这个id值设置为自增益。
      collection.find().sort({time:-1}).toArray(function(err,items){//按照添加时间查找，查找最近的一个
        if(items.length==0){ //如果没有，就从0 开始
          ids=0; 
        }else{ 
          ids=items[0]._id;  //如果有，就获取到最近一个的id值，然后+1
          ids++; 
        } 
        ask._id=ids; //这个_id是我们自己定义的
        collection.insert(ask,{safe: true},function(err,result){ 
          mongodb.close(); 
          callback(err, ask);//成功！返回插入的用户信息 
        }); 
      }); 
    }); 
  });
}; 


User.getQuestion=function(callback){ 
  mongodb.open(function(err, db){ 
    if(err){ 
      return callback(err); 
    } 
    //读取 question 集合 
    db.collection('question', function(err, collection){ 
      if(err){ 
        mongodb.close(); 
        return callback(err); 
      } 
      //查找用户名 name 值为 name文档 ,并且hide为true
      collection.find({hide:{$ne:false}}).limit(5).sort({time:-1}).toArray(function(err,items){ 
        if(err) throw err; 
        //因为question中没有用户的图片，所以需要二次查询
        var open=0 
        db.collection('user', function(err, collection){ 
          if(items.length!=0){
            for(var i=0,l=items.length;i<l;i++){
              collection.findOne({name: items[i].name},function(err, doc){
                items[open].imgUrl=doc.imgUrl;
                open++;
                if(open==l){
                  mongodb.close();
                  return callback(items);
                }
              });
            }
          }else{//如果数据库没有内容
            mongodb.close();
            return callback(items);
          } 
        }); 
      }); 
    }); 
  }); 
};


User.getQuestionPage=function(page,callback){
  //打开数据库
  var num=page*5;
  mongodb.open(function(err, db){
    if(err){
      return callback(err);
    }
    db.collection('question', function(err, collection){ 
      if(err){ 
        mongodb.close(); 
        return callback(err); 
      } 
      //查找用户名 name 值为 name文档 
      collection.find({hide:{$ne:false}}).skip(num).limit(5).sort({time:-1}).toArray(function(err,items){ 
        if(err) throw err; 
        //二次查询 
        var open=0 
        db.collection('user', function(err, collection){ 
          for(var i=0,l=items.length;i<l;i++){ 
            collection.findOne({name: items[i].name},function(err, doc){ 
              items[open].imgUrl=doc.imgUrl; 
              open++; 
              if(open==l){ 
                mongodb.close(); 
                return callback(items); 
              } 
            }); 
          } 
        }); 
      }); 
    });  
  }); 
};
