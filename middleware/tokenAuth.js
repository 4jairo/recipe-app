const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    try {
        
        const token = req.headers.authorization.split(" ").pop()
        const payload = jwt.verify(token, process.env.SECRET)
        const lifeTime = (new Date - new Date(payload.expiration)) / 60000

        if(lifeTime < 120){
            res.payload = payload
            res.token = token
            next()
        } else {
            console.log('test')
            res.json({error: 'token expired'})
        }
        
    } catch (error) {
        res.json({error: 'invalid token'})

        console.log('token auth', error.name)
        //next(error)
    }
}