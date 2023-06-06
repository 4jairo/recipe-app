//const fetch = require('node-fetch')

const express = require('express')
const recipesApi = express.Router()

const recipeApiMainUrl = `https://api.edamam.com/api/recipes/v2` //?type=public//&q=${query}&app_id=771f2ede&app_key=e07cd2b76ca600614a8f12ec61ee4afd${filter}
const recipeApiKey = process.env.RECIPE_API_KEY //type=public&app_id=771f2ede&app_key=e07cd2b76ca600614a8f12ec61ee4afd

// id -> https://api.edamam.com/api/recipes/v2/60dbd058b40243b6716f7ef27c4c7291?type=public&app_id=771f2ede&app_key=e07cd2b76ca600614a8f12ec61ee4afd
//query -> https://api.edamam.com/api/recipes/v2?type=public&q=chicken&app_id=771f2ede&app_key=e07cd2b76ca600614a8f12ec61ee4afd
// -> https://api.edamam.com/api/recipes/v2
//?q=apple&app_key=e07cd2b76ca600614a8f12ec61ee4afd&_cont=CHcVQBtNNQphDmgVQntAEX4BYl1tBAMDR2JEAWobalFzAAAVX3cUVmNBZ1VzVVUPSjNGVTEbYQEgBwQAFWNBBTZFY1RyBxFqX3cWQT1OcV9xBB8VADQWVhFCPwoxXVZEITQeVDcBaR4-SQ%3D%3D&type=public&app_id=771f2ede


//search with specific id
recipesApi.get('/id/:id', async (req, res, next) => {
    const {id} = req.params
    const response = await fetch(`${recipeApiMainUrl}/${id}?${recipeApiKey}`)
    const data = await response.json()
    
    res.json(data)
})

//search with query
recipesApi.post('/query/:query', async (req, res, next) => {
    try {
        const {filters} = req.body
        const {query} = req.params
        console.log(`${recipeApiMainUrl}?q=${query}&${recipeApiKey}`)
        const response = await fetch(`${recipeApiMainUrl}?q=${query}&${recipeApiKey}${filters}`)
        const data = await response.json()
        
        if(data._links.next){
            const {href} = data._links.next
            const next_cont = href.split('&').find(item => item.startsWith('_cont'))
            data._links.next = {cont: next_cont, query}
        }

        res.json(data)
    } catch (error) {
        res.json({error})
        next(error)
    }
})

recipesApi.get('/next/:query/:cont', async (req, res) => {
    const {query, cont} = req.params
    const response = await fetch(`${recipeApiMainUrl}?q=${query}&${recipeApiKey}&${cont}`)
    const data = await response.json()

    if(data._links.next){
        const {href} = data._links.next
        const next_cont = href.split('&').find(item => item.startsWith('_cont'))
        data._links.next = {cont: next_cont, query}
    }

    res.json(data)
})


module.exports = recipesApi