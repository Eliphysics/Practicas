import express,{Request, Response} from "express";
import * as amq from "amqplib";
import * as pg from "pg";

const app = express();
let msg = ['Holaaaa', 'Mensajitooo', 'Más mensajitos', 'Jijijiji', 'El editor se inventa cosas', 'No da risa'];
let longitud_mensajitos: number = msg.length;
let numerototal: number = longitud_mensajitos;
let channel1: amq.Channel;
let channel2: amq.Channel;
let contador:number = 0;
const promise1 = amq.connect('amqp://admin:admin@localhost:5672');
const promise2 = new pg.Client({
                            user: 'admin',
                            host: 'localhost',
                            database: 'database',
                            password: 'admin',
                            port: 5432,
                        })
promise2.connect().then(() => {
    console.log('Estamos en la base de datos');
    promise2.query('CREATE TABLE IF NOT EXISTS datitoss (numero_mensaje INTEGER, mensaje TEXT)').then((result) =>{
        console.log('Datos que hay ahora en la base de datos:', result.rows);
        console.log('Campos de la base de datos:', result.fields);
        
    }).catch(error =>{
        console.log('Hay un error, miralo: ',error);
    });
    promise1.then((connection) =>{
        console.log("Conectado a RabbitMQ");
        let canal1 = connection.createChannel();
        canal1.then(ch => {
            channel1 = ch;
            console.log('Estamosss');
            let cola_msg = channel1.assertQueue('Cola de mensajes', {durable:true});
            console.log('Cola creada');
            let i:number = 0;
            while (longitud_mensajitos > 0){
                channel1.sendToQueue('Cola de mensajes', Buffer.from(msg[i]));
                console.log('Mensaje enviado:', msg[i]);
                i += 1;
                longitud_mensajitos -= 1;
            }
        });
        canal1.catch((error) =>{
            console.log('Error creando el canal:', error);
            throw error;
        })
        let canal2 = connection.createChannel();
        canal2.then(ch => {
            channel2 = ch;
            channel2.consume('Cola de mensajes', (msg) =>{
                if (msg === null) {
                    console.log('No hay mensajes en la cola');
                    channel1.close();
                    channel2.close();
                    connection.close();
                }
                else {
                    console.log('Mensaje de la cola:', msg.content.toString());
                    promise2.query('INSERT INTO datitoss (numero_mensaje, mensaje) VALUES ($1, $2)', [contador+1, msg.content.toString()]).then(()=>{
                        return promise2.query('SELECT numero_mensaje, mensaje FROM datitoss');
                    })
                    .then(result => {
                        channel2.ack(msg);
                        contador += 1;
                        if (contador === numerototal){
                            console.log('Datos que hay ahora en la base de datos:', result.rows);
                            console.log('Campos de la base de datos:', result.fields);
                            console.log('Todos los mensajes han sido procesados');
                            setTimeout(() => {
                                channel1.close();
                                channel2.close();
                                connection.close();
                                process.exit(0); 
                            }, 5000);
                            
                        }
                    })
                    .catch(error => {
                        console.log('Ha habido un error extrayendo datos de la base de datos:', error);
                    })
                    
                }
            });
        });
    });
    promise1.catch((error) =>{
        console.log('Error de conexión:', error);
        });
})

