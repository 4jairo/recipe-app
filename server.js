require('dotenv').config()
const mongoose = require('mongoose')

const express = require('express')
const app = express()

const bodyParser = require('body-parser')
const cors = require('cors')

const recipesApi = require('./routes/recipes')
const usersRouter = require('./routes/users')
const uplaodRouter = require('./routes/uploads')

const handleErrors = require('./middleware/handleErrors.js')

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use('/', express.static('public'))

app.use('/api', recipesApi)
app.use('/', usersRouter)
app.use('/upload', uplaodRouter)

//app.use(handleErrors)


app.listen(3000, '192.168.1.50',() => {
    console.log('http://localhost:3000')
})

// mongoose.connect(process.env.MONGO_DB_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// })
mongoose.connect('mongodb://127.0.0.1:27017/recipesDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})