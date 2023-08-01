const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const bcrypt = require('bcrypt');

require('dotenv').config()
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs'); //server side rendering
app.use('/css', express.static('css'));
const methodOverride = require('method-override')
app.use(methodOverride('_method'))

app.use(session({secret : 'secretCode', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/shop', require('./routes/shop.js')); // 라우터 나누기
app.use('/board/sub', require('./routes/board.js'));
const MongoClient = require('mongodb').MongoClient;


var db;
MongoClient.connect(process.env.DB)
  .then(client => {
    // use client.db() to access your database if needed

    db = client.db('todoapp');

    app.listen('8080', function(){
      console.log('listening on 8080')
    });
  })
  .catch(err => console.error(err));

app.get('/pet', function(req, res) {
  res.send("buy pet items")
})

app.get('/beauty', function(req, res) {
  res.send("buy beauty items")
})

app.get('/', function(req, res) {
  res.render('index.ejs')
})

app.get('/write', function(req, res) {
  res.render('write.ejs')
})

app.post('/add', function(req, res) {

  const obj = req.body
  db.collection('counter').findOne({name: 'number of Posts'}, function(err, res) {

    let numOfPost = res.totalPost;

    console.log(res.totalPost);

    const data = { _id : numOfPost + 1, title: req.body.title, date: req.body.date,
      writer: req.user._id }

    db.collection('post').insertOne(data, function(req, res){
      console.log(obj);

      db.collection('counter').updateOne({name: 'number of Posts'}, { $inc:{ totalPost:1 }}, function(err, res){

      });
    })
  });

  res.send(" post request")
})

app.get('/list', function(req, resp) {

  db.collection('post').find().toArray(function(err, res){
    console.log(res);
    resp.render('list.ejs', { posts: res });
  });

});

app.get('/search', function(req, resp) {
  console.log(req.query.value);

  const filter =  [
    {
      $search: {
        index: 'titleSearch',
        text: {
          query: req.query.value,
          path: 'title'  // or [title', 'date']
        }
      }
    },
    { $sort : { _id : 1 } },
    { $limit : 5},
    { $project : { title : 1, _id : 0 } } // only get title from database
  ] 

  db.collection('post').aggregate(filter).toArray((err, res) => {

    
      if (err) {
      console.log(err);
      resp.status(500).send("Internal server error"); // 500 Internal Server Error
    } else if (res === null) {
      resp.status(404).send("Not found"); // 404 Not Found
    } else {
      console.log(res);
      resp.render('search.ejs', { posts: res });
    }
  })

});


app.get('/detail/:id', function(req, resp) {
  db.collection('post').findOne({_id : parseInt(req.params.id)}, function(err, res){

      if (err) {
      console.log(err);
      resp.status(500).send("Internal server error"); // 500 Internal Server Error
    } else if (res === null) {
      resp.status(404).send("Not found"); // 404 Not Found
    } else {
      console.log(res);
      resp.render('detail.ejs', { data: res });
    }
  })

});

app.get('/edit/:id', function(req, resp) {

  db.collection('post').findOne({_id: parseInt(req.params.id)}, function(err, res){
      if (err) {
      console.log(err);
      resp.status(500).send("Internal server error"); // 500 Internal Server Error
    } else if (res === null) {
      resp.status(404).send("Not found"); // 404 Not Found
    } else {
      console.log(res);
      resp.render('edit.ejs', {post: res})
    }


  });

});

app.put('/edit', function(req, resp) {

  db.collection('post').updateOne({_id : parseInt(req.body.id) },{ $set : {title: req.body.title, date: req.body.date }}, function(err, res) {


    if (err) {
      console.log(err);
      resp.status(500).send("Internal server error"); // 500 Internal Server Error
    } else if (res === null) {
      resp.status(404).send("Not found"); // 404 Not Found
    } else {
      console.log(res);
      resp.redirect('/list');
    }
  });

});

// implement Login Feature

const saltRounds = parseInt(process.env.SALTROUNDS, 10);

app.get('/login', function(req, resp) {
  resp.render('login.ejs');
});


app.get('/register', function(req, resp) {
  resp.render('register.ejs');
});

app.post('/register', function(req, res) {

  db.collection('login').findOne({ id: req.body.id }, function(err, user) {
    if (err) {
      console.error(err);
      return res.status(500).send();
    }
    
    if (user) {
      console.log("User ID already exists.");
      return res.status(400).send();  // Bad request
    }

    bcrypt.hash(req.body.pw, saltRounds, function(err, hashedPassword) {
      if (err) {
        console.error(err);
        return res.status(500).send();
      }

      // Store the user with the hashed password
      db.collection('login').insertOne({ id: req.body.id, pw: hashedPassword }, function(err, result) {
        if (err) {
          console.error(err);
          return res.status(500).send();
        }
        console.log("register completed!")
        return res.status(200).send();
      });
    });
  });
});

app.post('/login', passport.authenticate('local', {
  failureRedirect: '/fail'
}), function(req, res) {
  res.redirect('/');
});

app.get('/fail', function(req, resp) {
  resp.render('fail.ejs');
});

app.get('/mypage', logined, function(req, resp) { // use middle ware to check the user is logined
  console.log(req.user);
  resp.render('mypage.ejs', { data: req.user})

});

function logined(req, res, next){
  if (req.user) {
    next()
  } else {
    res.send("you are not logined");
  }
}


passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (inputId, inputPw, done) {
  //console.log(inputId, inputPw);
  db.collection('login').findOne({ id: inputId }, function (err, res) {
    if (err) return done(err)

    if (!res) return done(null, false, { message: 'No id exsits' })

    // Compare the hashed password stored in the database with the input password
    bcrypt.compare(inputPw, res.pw, function(err, result) {
      if (err) return done(err);

      if (result) {  // If the comparison result is true (passwords match)
        return done(null, res)
      } else {
        return done(null, false, { message: 'Wrong password' })
      }
    });
  })
}));

passport.serializeUser(function (user, done) { // saved session, user is from the res above
  done(null, user.id) //use user.id to create session -> send the cookie
});

passport.deserializeUser(function (userid, done) { // find session fata from DB
  
  db.collection('login').findOne({id: userid}, function(err, res) {
    done(null, res)
  })
  
}); 

app.get('/logout', function(req, resp) {
  req.logout(function(err) {
    if (err) {
      // handle error
      console.error(err);
      return resp.status(500).send();
    }
    console.log('logout done')
    return resp.status(200).redirect('/');
  });
});

app.delete('/delete', function(req, resp) {

  req.body._id = parseInt(req.body._id);

  const deleteData = {_id : req.body._id, writer: req.user._id }

  db.collection('post').deleteOne(deleteData, function(err, res){
    console.log("deleted!!");
    resp.status(200).send({message: "success"});
  });

});
