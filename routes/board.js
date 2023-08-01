var router = require('express').Router();

function logined(req, res, next){
  if (req.user) {
    next()
  } else {
    res.send("you are not logined");
  }
}

router.use(logined); // 라우터에 middleware 적용

router.get('/sports', function(req, res){
   res.send('sport');
});

router.get('/game', function(req, res){
   res.send('game');
}); 

module.exports = router;