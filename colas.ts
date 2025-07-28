import express,{Request, Response} from "express";
const app = express();
const port = 3000;

app.get('/practicas/hola', (req: Request, res: Response) => {
    res.send("Adiós");
})
app.listen(port,() => {
    console.log("escuchando")
})

let hola = "http://localhost:3000/practicas/hola"