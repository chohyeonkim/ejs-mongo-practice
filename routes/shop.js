var router = require('express').Router();

router.get('/shirts', function(req, res){
    res.send('shirt page .');
});

router.get('/pants', function(req, res){
    res.send('pants page.');
}); 

module.exports = router;