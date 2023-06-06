//!todo: filters, change theme 

//main menu (btns -> user container, search container), deployeables
function mainMenuBtns(){
    const allBtns = mainMenu.querySelectorAll('div')
    for (const btn of allBtns) {
        btn.addEventListener('click', () => {
            if(btn.id === 'mainMenu-menu'){
                const imgSrc = btn.querySelector('img').src.split('/').pop()
            
                imgSrc === 'login.svg'
                ? loginUser()
                : moveUserMenu('open')

            } else if(btn.id === 'mainMenu-search'){
                moveSearchMenu('open')
            }
        })
    }
}

function moveUserMenu(whatOperation){
    if(whatOperation === 'close'){
        userMenuContainer.style.right = '100%'
    } else if(whatOperation === 'open') {
        showFavourites()
        userMenuContainer.style.right = '0'
    }
}
function userMenuUtils(){
    closeUserMenuContainer.addEventListener('click', () => {
        console.log('click')
        moveUserMenu('close')
    })
}

function moveSearchMenu(whatOperation){
    if(whatOperation === 'close') searchContainer.style.top = '-70px'
    else if(whatOperation === 'open') searchContainer.style.top = '0'
}
function searchContainerUtils(){
    searchRecipe.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') {
            recipeApiRequest(searchRecipe.value).then(response => showRecipes(response, true))
        }
    })

    searchRecipeBtn.addEventListener('click', () =>  {
        recipeApiRequest(searchRecipe.value).then(response => showRecipes(response, true))
    })

    closeSearchContent.addEventListener('click', () => moveSearchMenu('close'))
}

function interactiveDeployeables(containerId){
    const mainContainer = document.getElementById(containerId)
    const allDeployeables = mainContainer.querySelectorAll('.deploy')
    for (const element of allDeployeables) {
        const deployContent = element.querySelector('.deployContent')

        element.addEventListener('click', (e) => {
            if(['INPUT', 'IMG', 'LABEL'].includes(e.target.tagName)) return

            if(element.getAttribute('data-deployed')){
                deployContent.style.height = '0'
                element.removeAttribute('data-deployed')
            } else {
                deployContent.style.height = 'auto'
                element.setAttribute('data-deployed','true')
            }
        })
    }
}

// recipes
let favouriteRecipes = []
async function showRecipes(response, eraseRecipes){ 
    //if error
    if(response.error){
        localStorage.removeItem('lastSearch')
        showError('try to search a different thing or change the filters')
        return
    }
    moveSearchMenu('close')

    if(eraseRecipes) recipesContainer.innerHTML = ''

    //show more btn
    const {from, to, count, _links} = response
    pageBtnsControl(to, count, _links)

    //show recipes
    let content = ''
    for (const r of response.hits) {

        const {label, image, dishType, calories, url} = r.recipe
        const {href: recipeUrl} = r._links.self
        const recipeId = recipeUrl.split('/')[6].split('?').shift()
        const favImg = favouriteRecipes.includes(recipeId)
        ? 'imgs/favourite-fill.svg'
        : 'imgs/favourite.svg'
    
        content += `
        <div class="recipe" data-recipeid="${recipeId}" data-requestnum="${from}">
            <h2>${label}</h2>
            <div class="imgContainer"><img src="${image}"></div>
            <p><b>Dish type:</b> ${dishType}</p> 
            <p><b>Calories:</b> ${calories.toFixed(2)}</p>
            <div class="iconContainer">
                <div data-operation="favourite"><img src="${favImg}" class="icon"></div>
                <div data-operation="share" data-share="${url}"><img src="imgs/share.svg" class="icon"></div>
            </div>
        </div>`
    }

    if(eraseRecipes) recipesContainer.innerHTML = content
    else recipesContainer.innerHTML += content

    //show more details (recipes container)
    const allRecipes = recipesContainer.querySelectorAll(`[data-requestnum="${from}"]`)
    for (const recipe of allRecipes) {
        recipe.addEventListener('click', (e) => {
            const isIcon = e.target.closest('.iconContainer') || e.target.classList.contains('.iconContainer')
            if(!isIcon){
                const recipeId = recipe.getAttribute('data-recipeid')
                showRecipeDetails(recipeId)
            }
        })
    }

    //share and favourite btns (every recipe)
    const iconContainerBtns = recipesContainer.querySelectorAll(`[data-requestnum="${from}"] .iconContainer div`)
    for (const btn of iconContainerBtns) {
        btn.addEventListener('click', async () => {
            const whatOperation = btn.getAttribute('data-operation')
            const imgBtn = btn.querySelector('img')

            if(whatOperation === 'favourite'){
                const recipeId = btn.closest('.recipe').getAttribute('data-recipeid')
                await addRemoveFavourite(recipeId)

                if(imgBtn.src.split('/').pop() === `${whatOperation}.svg`) imgBtn.src = `imgs/${whatOperation}-fill.svg`
                else imgBtn.src = `imgs/${whatOperation}.svg`

            } else {
                const shareUrl = btn.getAttribute('data-share')
                Swal.fire({
                    title: 'Share url',
                    text: shareUrl,
                    showConfirmButton: true,
                    confirmButtonText: 'Copy',
                    showCancelButton: true,
                    cancelButtonText: 'Exit'
                }).then(result => {
                    if(!result.isConfirmed) return

                    const copyText = document.createElement('input')
                    copyText.value = shareUrl

                    copyText.select();
                    copyText.setSelectionRange(0, 99999); 
                
                    navigator.clipboard.write(copyText.value);

                })
            }
        })
    }
}

function pageBtnsControl(to, count, links){
    nextPageBtn.style.display = 'block'
    const pagesCount = Math.ceil(count / 20)
    const currentPage = Math.ceil(to / 20)
    nextPageBtn.value = `Show More (${currentPage} / ${pagesCount})`

    if(to === count || !links){
        nextPageBtn.style.opacity = '.3'
        nextPageBtn.onclick = null
    } else {
        const {query, cont} = links.next
        nextPageBtn.style.opacity = '1'
        nextPageBtn.onclick = async () => {
            const recipes = await recipeApiRequest(query, null, cont)
            showRecipes(recipes, false)
        }
    }
}

async function addRemoveFavourite(recipeId){
    const token = localStorage.getItem('token')
    if(!token) {
        showError('please login before adding recipes to favourites')
        return
    }
    dbRequest('/user', 'PATCH', {recipeId}, token).then(response => {
        if(response.error) showError(response.error)
        favouriteRecipes = response.favourites
    })
}

//filters
function showFilters(){
    const filters = [
        ['diet',       ['balanced','high-fiber','high-protein','low-carb','low-fat','low-sodium']],
        ['health',     ['alcohol-cocktail','alcohol-free','celerly-free','crustacean-free','dairy-free','DASH','egg-free','gluten-free','immuno-supportive','keto-friendly','kindey-friendly','kosher','low-fat-abs','low-potassium','low-sugar','lupine-free','Mediterranean','mollusk-free','mustard-free','no-oil-added','paleo','peanut-free','pescatarian','pork-free','red-meat-free','sesame-free','shellfish-free','soy-free','sugar-consicious','tree-nut-free','vegan','vegetarian','wheat-free']],
        ['cuisineType',['American','Asian','British','Caribbean','Central Europe','Chinese','Estearn Europe','French','Indian','Italian','Japanese','Kosher','Mediterranean','Middle Eastern','Nordic','South American','South East Asian']],
        ['mealType',   ['Breakfast','Dinner','Lunch','Snack','Teatime']],
        ['dishType',   ['Biscuits and cookies','Bread','Cereals','Condiments and sauces','Desserts','Drinks','Main Course','Pancake','Preps','Preserve','Salad','Sandwiches','Side dish','Soup','Starter','Sweets']],
    ]

    let content  = ''
    for (const f of filters) {
        const rawFilterName = f[0]
        const filterName = f[0].split(/(?=[A-Z])/).join(' ').toLowerCase()
        const filterContent = f[1]

        content += `<div class="deploy"><h2>${filterName}</h2><div class="deployContent">`
        for (const value of filterContent) {
            content += `
            <div>
                <input type="checkbox" data-filterclass="${rawFilterName}" data-filter="${value}" id="${rawFilterName}${rawFilterName}">
                <label for="${rawFilterName}${rawFilterName}">${value}</label>
            </div>`
        }
        content += '</div></div>'
    }

    filtersContent.innerHTML = content
    showFiltersUtils()
} 

function showFiltersUtils(){
    //open cont
    const openFiltersCont = showFiltersBtn.querySelector('div')
    openFiltersCont.addEventListener('click', () => moveFilterContainer('open'))

    //close cont
    closeFiltersContainer.addEventListener('click', () => moveFilterContainer('close'))

    //all filters
    interactiveDeployeables('filtersContent')

    //applyFiltersBtn
    saveFiltersBtn.addEventListener('click', () => {
        moveFilterContainer('close')
        const lastSearch = localStorage.getItem('lastSearch')
        if(lastSearch) {
            recipeApiRequest(lastSearch).then(response => {
                showRecipes(response, true)
            })
        } else {
            
        }
    })

    //reset filtersBtn
    resetFilters.addEventListener('click', () => {
        const allCheckedFilters = filtersContent.querySelectorAll('input[data-filterclass][data-filter]:checked')
        for (const input of allCheckedFilters) {
            input.checked = false
        }
    })
}

function getFilters(){
    let urlFormatFilters = ''
    const allCheckedFilters = filtersContent.querySelectorAll('input[data-filterclass][data-filter]:checked')
    for (const input of allCheckedFilters) {
        const filterClass = input.getAttribute('data-filterclass')
        const filterValue = input.getAttribute('data-filter')

        urlFormatFilters += `&${filterClass}=${filterValue}`
    }
    console.log(urlFormatFilters)
    return urlFormatFilters
}

function moveFilterContainer(whatOperation){
    if(whatOperation === 'open'){
        filtersContainer.style.left = '0'
    } else if(whatOperation === 'close') {
        filtersContainer.style.left = '100%'
    }
}

//user
function logoutUser(){
    //localstorage
    localStorage.clear()
    
    //fav icons
    const allFavIcons = recipesContainer.querySelectorAll('.iconContainer div[data-operation="favourite"] img')
    for (const img of allFavIcons) {
        img.src = 'imgs/favourite.svg'
    }
    
    //user menu container
    userMenuContainer.innerHTML = `
    <header>
        <div>
            <h1 id="userNameElement"></h1>
        </div>
        <div id="closeUserMenuContainer">
            <img src="imgs/x.svg" class="icon">
        </div>
    </header>
    <main></main>`

    //user menu container btn and avatar img
    const userMenuImg = mainMenu.querySelector('#mainMenu-menu img')

    userMenuImg.classList.remove('loggedIn')
    userMenuImg.src = 'imgs/login.svg'

    //fav recipes
    favouriteRecipes = []
}

function loginUser(){
    Swal.fire({
        title: 'insert your credentials',
        html: `
            <div class="whatOperationLogin">
                <span data-operation="login" data-currentoperation>Login</span>
                <span data-operation="signin">Sign in</span>
            </div>
            <form id="loginInputs">
                <div><input name="name" placeholder="insert your username" type="text"></div>
                <div><input name="password" placeholder="insert your password" type="password"></div>
            </form>`,
        showCancelButton: true,
        confirmButtonText: 'Send',
        showLoaderOnConfirm: true,
        didRender: () => { 
            const elements = Array.from(Swal.getPopup().querySelectorAll('.whatOperationLogin span'))
            for (const input of elements) {
                const otherInput = elements.find(i => i !== input)
        
                input.addEventListener('click', () => {
                    input.setAttribute('data-currentoperation','e')
                    otherInput.removeAttribute('data-currentoperation')
            
                    input.style.borderBottom = 'solid 2px var(--borderColor)'
                    otherInput.style.borderBottom = '0' 
                })
            }
        },
        preConfirm: async () => {
            const {name, password} = Swal.getPopup().querySelector('#loginInputs')
            const op = Swal.getPopup().querySelector('.whatOperationLogin [data-currentoperation]')
            
            const response = op.getAttribute('data-operation') === 'login'
            ? await dbRequest('/login', 'POST', {name: name.value, password: password.value})
            : await dbRequest('/signin', 'POST', {name: name.value, password: password.value})
            
            if(response.error) showError(response.error)
            else setUser(response)
        },
        allowOutsideClick: () => !Swal.isLoading()
    })
}

function setUser(response){
    //localstorage
    localStorage.setItem('token', response.token)

    // fav recipes
    if(favouriteRecipes) favouriteRecipes = response.favourites

    //userMenu
    const userElement = mainMenu.querySelector('#mainMenu-menu')
    const userImgElement = userElement.querySelector('img')

    userImgElement.classList.add('loggedIn')
    
    //(img)
    userImgElement.src = response.avatar 
    ? `upload/imgs/${response.avatar}`
    : 'imgs/notAvatar.svg'
    
    //(user name)
    userNameElement.innerHTML = response.name

    const mainContent = userMenuContainer.querySelector('main')

    mainContent.innerHTML = `
    <div id="userSettings">
        <div class="deploy">
            <h2>Profile</h2>
            <form class="deployContent" id="changeAvatarForm">
                <p class="deployTitle">Change avatar</p> 
                <figure>
                    &rarr; via file
                    <input name="file" type="file" value="change avatar">
                </figure>
                <figure>
                    &rarr; via url
                    <input name="url" type="text" placeholder="http://www.example.com/index.png">
                </figure>
                <figure class="saveDeploy"><input name="update" type="button" value="preview"></figure>
            </form>
        </div>
        <div class="deploy">
            <h2>Settings</h2>
            <div class="deployContent">
                <figure class="saveDeploy">
                    &rarr; Theme
                    <input id="changeThemeBtn" value="white" type="button">
                </figure>
                <figure class="saveDeploy">
                    &rarr; Session
                    <input id="logoutBtn" value="logout">
                </figure>
            </div>
        </div>
        <div class="deploy" id="favRecipesBtn"> 
            <h2>Favourite Recipes</h2>
            <div class="deployContent" id="favRecipesCont"></div>
        </div>
    </div>
    `

    setUserUtils()
}

function setUserUtils(){
    //user menu (close - open)
    userMenuUtils()
    
    //deployeables
    interactiveDeployeables('userSettings')

    //change avatar
    changeAvatarForm.addEventListener('submit', (event) => event.preventDefault())
    changeAvatarForm.update.addEventListener('click', async () => {
        const existsFile = changeAvatarForm.file.files[0]

        if(existsFile) {
            const image = URL.createObjectURL(existsFile)
            showAvatar(image, existsFile)

        } else if(changeAvatarForm.url.value !== ''){
            const image = await downloadImage(changeAvatarForm.url.value)

            if(image.error) showError(image.error)
            else showAvatar(image.src, image.img)

        } else {
            showError('please, insert a valid image')
        }
    })

    //settings (theme btn)

    changeThemeBtn.addEventListener('click', () => {
        const d = document.documentElement.style
        if(changeThemeBtn.value === 'white'){ 
            changeThemeBtn.value = 'black'

            //link to swal black theme
            sweetalert2Black.href = 'https://cdn.jsdelivr.net/npm/@sweetalert2/theme-dark@5/dark.css'
            d.setProperty('--bgcPrimary','rgb(25, 25, 25)')
            d.setProperty('--bgcSecundary','rgb(50, 50, 50)')
            d.setProperty('--borderColor', 'rgb(180, 180, 180)')
            d.setProperty('--sectionBorderColor', 'rgb(50, 50, 50)')
            d.setProperty('--letterColor', 'white')
            d.setProperty('--invertedIconColor', 'invert(0)')
            d.setProperty('--iconColor', 'invert(75%)')
            d.setProperty('--iphoneCheckboxColor', 'rgba(220, 79, 255, .6)')
        } else {
            changeThemeBtn.value = 'white'
            sweetalert2Black.href = ''
            d.setProperty('--bgcPrimary','#fff')
            d.setProperty('--bgcSecundary','rgb(233, 233, 233)')
            d.setProperty('--borderColor', 'rgb(180, 180, 180)')
            d.setProperty('--sectionBorderColor', 'rgb(200, 200, 200)')
            d.setProperty('--letterColor', 'black')
            d.setProperty('--invertedIconColor', 'invert(100%)')
            d.setProperty('--iconColor', 'invert(0)')
            d.setProperty('--iphoneCheckboxColor', 'rgb(0, 255, 0)')
        }
    })

    //settings (logout btn)
    logoutBtn.addEventListener('click', () => {
        moveUserMenu('close')
        logoutUser()
    })

    //fav recipesm menu
    favRecipesCont.addEventListener('click', (e) => {
        if(e.target.tagName === 'IMG'){
            const recipeId = e.target.closest('.favRecipe').getAttribute('data-recipeid')
            showRecipeDetails(recipeId)
        }
    }) 
}

//more details (recipe)
async function showRecipeDetails(recipeId){
    Swal.fire({
        title: 'loading',
        showConfirmButton: false,
        didRender: async () => {
            Swal.showLoading()
            
            const response = await recipeApiRequest(null, recipeId)
            if(response.error){
                showError('something went wrong, try to refresh the browser')
            } else { 
                recipeDetailsShape(response.recipe)
            }
        }
    })
}

function recipeDetailsShape(resp){
    const {image, label, url} = resp
    const allItems = {
        'Meal Type': resp.mealType,
        'Cuisine Type':resp.cuisineType, 
        Cautions: resp.cautions,
        Ingredients: resp.ingredientLines, 
        'Health Labels': resp.healthLabels,
        'Diet Labels': resp.dietLabels,
        'Go to Steps': url
    }

    let content = ''
    for (const i of Object.entries(allItems)) {
        const itemName = i[0]
        const items = i[1]
        content += `<div class="deploy"><h2>${itemName}</h2><div class="deployContent">`

        if(itemName === 'Go to Steps'){
            content += `<input type="button" id="goToStepsBtn" value="Go to steps" onclick="window.open('${items}')"></div></div>`
            continue
        }
        for (const item of items) content += `<p> &rarr; ${item}</p>`
        content += '</div></div>'
    }

    Swal.fire({
        width: '800',
        title: label,
        imageUrl: image,
        html: `<div id="showMoreDetailsCont">${content}</div>`,
        confirmButtonText: 'GO BACK',
        didRender: () => {
            //event listeners
            interactiveDeployeables('showMoreDetailsCont')
        }
    })
}

//requests
async function downloadImage(url){
    try {
        const response = await fetch(url)
        const blob = await response.blob()
        const src = URL.createObjectURL(blob)
        const img = new File([blob], 'image.png')
        return {src, img}

    } catch (err) {
        return {error: 'Failed to dowload, please try another image or try to download it manually'}
    }
}

function showAvatar(imgSrc, img){
    const testImg = new Image()
    testImg.src = imgSrc
    testImg.onload = () => {
    
        Swal.fire({
            title: 'new avatar',
            text: 'confirm new avatar',
            imageUrl: imgSrc,
            confirmButtonText: 'confirm',
            showCancelButton: true,

        }).then(async (result) => {
            if(!result.isConfirmed) return
            
            const response = await uploadAvatarByFile(img)
            console.log(response)
            if(response.error){
                showError('something went wrong, try to refresh the browser')
                return
            }

            const userImgElement = mainMenu.querySelector('#mainMenu-menu img')
            userImgElement.src = imgSrc
            Swal.fire(
                'Avatar changed!',
                '',
                'success'
            )
        })
    }

    testImg.onerror = () => showError('please, insert a valid image')
}

async function getLocalStorage(){
    const userToken = localStorage.getItem('token')
    const lastSearch = localStorage.getItem('lastSearch')    
    

    if(userToken){
        const user = await dbRequest('/login', 'POST', null, userToken)
        if(user.error) {
            showError('session expired, please login again before any operation')
            return
        }
        setUser(user)
    }
    if(lastSearch) showRecipes(await recipeApiRequest(lastSearch), true)
}

async function showFavourites(){
    //if there is no fav recipes
    if(favouriteRecipes.length === 0){
        favRecipesCont.innerHTML = '<div id="noFavRecipes">no recipes</div>'
    } else {
        const noFavElement = favRecipesCont.querySelector('#noFavRecipes')
        if(noFavElement) noFavElement.remove()
    }

    //remove if not in fav
    const favRecipes = favRecipesCont.querySelectorAll('.favRecipe')
    for (const recipe of favRecipes) {
        const recipeId = recipe.getAttribute('data-recipeid')

        if(!favouriteRecipes.includes(recipeId)) recipe.remove()
    }
     
    //put new if exists
    for (const recipeId of favouriteRecipes) {
        const recipeElement = favRecipesCont.querySelector(`.favRecipe[data-recipeid="${recipeId}"]`)
        if(recipeElement) continue

        const recipeData = await recipeApiRequest(null, recipeId)
        if(recipeData.error) showError('Something happened, try refreshing the browser')

        const recipeImg = recipeData.recipe.image
        const favShape = `<div class="favRecipe" data-recipeid="${recipeId}"><img src="${recipeImg}"></div>`
        favRecipesCont.innerHTML += favShape
    }   
}

async function dbRequest(url ,method, body, token){
    const params = {
        headers: {
            Accept: 'aplication.json',
            'Content-Type': 'application/json',
        },
        method
    }

    if(token) params.headers.Authorization = `Bearer ${token}`
    if(body) params.body = JSON.stringify(body)

    try{
        const response = await fetch(url, params)
        const data = await response.json()
        
        console.log('dbRequest:',data)
        return data

    } catch (error) {
        console.log('db request error:',error)
        throw error
    }  
}

async function uploadAvatarByFile(file){
    try {
        const token = localStorage.getItem('token') 
        const formData = new FormData()
        formData.append('file',file)

        const response =  await fetch(`/upload`, {
            method: 'POST',
            body: formData,
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        const data = response.json()
        
        console.log('uploadAvatarFile:', data)        
        return data

    } catch (error) {
        console.log('uploadAvatar error: ',error)
        throw error
    } 
}

async function recipeApiRequest(query, id, next){
    try {
        if(query && !next) {
            localStorage.setItem('lastSearch', query)
            return await dbRequest(`api/query/${query}`, 'POST', {filters: getFilters()})
        }
 
        const fetchUrl = id
        ? `/api/id/${id}`
        : `/api/next/${query}/${next}`

        return await dbRequest(fetchUrl, 'GET')  
        
    } catch (error) {
        throw `recipe api error: ${error}`
    }
}

function showError(message){
    Swal.fire(
        'Somthing went wrong!',
        message,
        'warning'
    )
}


window.addEventListener('load', () => {
    //main menu
    mainMenuBtns()

    //search recipe
    searchContainerUtils()

    //show filters
    showFilters()

    //localstorage (last search & last user if token)
    getLocalStorage()
})
