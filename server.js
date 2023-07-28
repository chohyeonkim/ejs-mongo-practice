const express = require('express')
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs'); //server side rendering
app.use('/css', express.static('css'));

const MongoClient = require('mongodb').MongoClient;


var db;
MongoClient.connect('mongodb+srv://Elly:2647@sandbox.mlfko8v.mongodb.net/?retryWrites=true&w=majority')
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
    req.body._id = numOfPost + 1;

    console.log(res.totalPost);

    db.collection('post').insertOne(req.body,function(req, res){
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

app.delete('/delete', function(req, resp) {

  req.body._id = parseInt(req.body._id);
  db.collection('post').deleteOne(req.body, function(err, res){
    console.log("deleted!!");
    resp.status(200).send({message: "success"});
  });

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


