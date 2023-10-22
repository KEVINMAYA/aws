//Importación de MySQL
const mysql = require('mysql');

//Parametros de la conexión con la base de datos de asobeecol
const conexion = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
})
//Se prueba la conexión con la base de datos asobeecol
conexion.connect((err) => {
    //Si existe un error nos devulve el error detectado
    if (err) {
        //Excepcón con el error detectado
        console.log('error de conexión ' + err);
    }
    else {
        //Si todo esta correcto nos arroja un texto en consola
        console.log('¡La Conexión se realizo con exito!');
    }
});
// Exportamos la variable conexion para reutilizarla.
module.exports = conexion;