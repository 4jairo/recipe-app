const express = require('express')
const multer = require('multer')
//const sharp = require('sharp')
const {UserModel} = require('../models/user')
const fs = require('fs').promises
const path = require('path')
const tokenAuth = require('../middleware/tokenAuth')

const uplaodRouter = express.Router()

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads')
    },
    filename: (req, file, cb) => {
        const ext = file.originalname.split('.').pop()
        cb(null, `${Math.random().toString().substring(2)}${Date.now()}.${ext}`)
    }
})
const upload = multer({storage}).single('file')

uplaodRouter.post('/', tokenAuth, upload, async (req, res, next) => {
    try {
        const {filename} = req.file
        const {userId} = res.payload
        res.json({ok: true})

        const user = await UserModel.findById(userId)
        if(user.avatar){

            fs.unlink(path.join(__dirname, '..', 'uploads', user.avatar))
        }

        user.avatar = filename
        user.save()

    } catch (err) {
        next(err)
        console.log('upload', err.name)
    }
})

uplaodRouter.use('/imgs', express.static(path.join(__dirname, '..', 'uploads')))

// uplaodRouter.get('/:name', tokenAuth, async (req, res, next) => {
//     try {
//         const {name} = req.params
//         const user = await UserModel.findOne({name})

//         if(user.avatar){
//             //res.redirect(`/uploads/image/${user.avatar}`)
//             res.sendFile(path.join(__dirname, '..', 'uploads', user.avatar))
//         } else {
//             res.json({error: 'this user has not avatar'})
//         }
//     } catch (err) {
//         console.log('get img', err.name)
//         next(err)
//     }
// })


module.exports = uplaodRouter
