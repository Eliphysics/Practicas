import express,{Request, Response} from "express";
import * as amq from "amqplib";
const app = express();
let msg = ['Holaaaa', 'Mensajitooo', 'Más mensajitos', 'Jijijiji', 'El editor se inventa cosas', 'No da risa'];
let longitud_mensajitos: number = msg.length;
let channel1: amq.Channel;
let channel2: amq.Channel;
const promise1 = amq.connect('amqp://admin:admin@localhost:5672');
//const promise2 = amq.connect('amqp://localhost:3000');
promise1.then((connection) =>{
    console.log("Conectado a RabbitMQ");
    let canal1 = connection.createChannel();
    canal1.then(ch => {
        channel1 = ch;
        console.log('Estamosss');
        channel1.assertQueue('Cola de mensajes', {durable:true});
        console.log('Cola creada');
        let i = 0;
        while (longitud_mensajitos > 0){
            channel1.sendToQueue('Cola de mensajes', Buffer.from(msg[i]));
            console.log('Mensaje enviado:', msg[i]);
            i += 1;
            longitud_mensajitos -= 1;
            console.log('Mensajitos restantes:', longitud_mensajitos);
            console.log('Mensaje nº:', i);
        }
    })
    canal1.catch((error) =>{
        console.log('Error creando el canal:', error);
        throw error;
    })
    let canal2 = connection.createChannel();
    canal2.then(ch => {
        channel2 = ch;
        console.log('Ahora estamos en el canal 2');
        channel2.checkQueue('Cola de mensajes').then((info) =>{
            console.log('Número de mensajes en la cola:', info.messageCount);
            let numero_msg:number = info.messageCount;
        });

        channel2.consume('Cola de mensajes', (msg) =>{
            if (msg === null){
                console.log('No hay mensajes en la cola');
                channel2.close();
                return;
            }
            else {
                console.log('Mensaje recibido en el canal 2');
                console.log('Mensaje de la cola:', msg.content.toString());
                channel2.ack(msg);    
            }
        });
    });
});
promise1.catch((error) =>{
    console.log('Error de conexión:', error);
    throw error;
})
