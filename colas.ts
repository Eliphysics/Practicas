const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Adiós')
})
app.listen(port,() => {
    console.log('escuchando')
})

let hola = "http://localhost:3000/practicas"