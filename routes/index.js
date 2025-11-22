var express = require('express');
var router = express.Router();
const axios = require('axios'); 
const AIC_API_URL = 'https://api.artic.edu/api/v1/artworks?page=2&limit=100&fields=id,title,artist_display,place_of_origin,date_start,artwork_type_title,department_title';

/* GET home page. */
router.get('/', async function(req, res, next) {
    try {
        console.log('Fetching data from AIC API...');
        const response = await axios.get(AIC_API_URL);
        const artworks = response.data.data; 
        
        console.log(`Successfully fetched ${artworks.length} records.`);

        res.render('index', { 
            title: 'AIC Artworks Explorer',
            artworks: artworks // This array is accessible as {{artworks}} in index.hbs
        });
        
    } catch (error) {
        // Log the error and render the Express error page
        console.error('API Fetch Error:', error.message);
        res.render('error', { 
            message: 'Failed to load artwork data.',
            error: error 
        });
    }
});

module.exports = router;