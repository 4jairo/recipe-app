const express = require('express')
const userRouter = express.Router()

const { UserModel } = require('../models/user')
const tokenAuth = require('../middleware/tokenAuth')

const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')

//login by name and password
userRouter.post('/login', async (req, res, next) => {
    try{
        if(req.body.name && req.body.password){
            const { name, password } = req.body
            const user = await UserModel.findOne({name: name})
    
            const ispasswordOk = user 
                ? await bcryptjs.compare(`${password}`, user.password)
                : false 
            //
            if(ispasswordOk){
                const payload = {
                    name: user.name,
                    userId: user._id,
                    expiration: new Date
                }
    
                const token = jwt.sign(payload, process.env.SECRET)
                res.json({ 
                    token, 
                    favourites: user.favourites,
                    name: user.name,
                    avatar:user.avatar
                })
    
            } else res.json({error: 'Password or Username not correct'})
        } else next()
        
    } catch (err) {
        console.log('login by password:',err)
        next(err)
    }
})

//by token
userRouter.post('/login', tokenAuth, async (req, res, next) => {
    const {userId} = res.payload
    const token = res.token

    const user = await UserModel.findById(userId)

    const {favourites, name, avatar} = user
    res.json({ 
        token,
        favourites,
        name,
        avatar
    })
})

//signin
userRouter.post('/signin', async (req, res, next) => {
    try {
        const {name, password} = req.body
        const user = await UserModel.findOne({name})


        if(user) {
            res.json({error: 'This user alredy exists'})
        } else {
            const hashedPassword = await bcryptjs.hash(password, 10)
            const newUser = new UserModel({
                name,
                password: hashedPassword
            })

            const savedUser = await newUser.save()
            const payload = {
                name: savedUser.name,
                userId: savedUser._id,
                expiration: new Date
            }
            const token = jwt.sign(payload, process.env.SECRET)
            res.json({token, name: savedUser.name})
        }
    } catch (err) {
        console.log(err.name)
        next(err)
    }
})


//change user data ( fav. recies )

userRouter.patch('/user', tokenAuth, async (req, res, next) => {
    try {
        const {recipeId} = req.body
        const {userId} = res.payload

        const user = await UserModel.findById(userId)

        if(user.favourites.includes(recipeId)){
            const recipeIndex = user.favourites.findIndex(f => f === recipeId)
            user.favourites.splice(recipeIndex, 1)
        } else {
            user.favourites.push(recipeId)
        }

        res.json({favourites: user.favourites})
        user.save()

    } catch (err) {
        console.log('patch user', err.name)
        next(err)
    }
})


module.exports = userRouter

//by token
// userRouter.get('/login', async (req, res, next) => {
//     try {
//         if(req.headers.authorization){
//             const token = req.headers.authorization.split(" ")[1]
//             const payload = jwt.verify(token, process.env.SECRET)
//             const timeDifference = (new Date - new Date(payload.expiration)) / 60000 
        
//             if(timeDifference < 120) {
//                 const user = await UserModel.findById(payload.userId)
//                 const {favourites, name, avatar} = user

//                 res.json({ 
//                     token, 
//                     favourites,
//                     name,
//                     avatar
//                 })
//             } else {
//                 res.json({error: 'token expired'})
//             }
//         } else {
//             next()
//         }
        
//     } catch (err) {
//         console.log('login by token:',err)
//         next(err)
//     }
// })