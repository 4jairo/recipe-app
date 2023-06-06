const mongoose = require('mongoose')

const UserScheema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    favourites: Array,
    avatar: String
})

const UserModel = mongoose.model('User', UserScheema)

module.exports = {UserModel}