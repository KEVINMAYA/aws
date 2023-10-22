const jwt = require('jsonwebtoken');//importamos el jwt, hacemos uso de este componente para brindar mayor seguridad al login
const conexion = require('../database/db');// importamos la conexion que fue exportada en la clase db para reutilizar codigo
const bcryptjs = require('bcryptjs');
const {promisify}= require('util'); // importamos el promisify con el fin de usar el callback

//Este metodo se encarga de validar las rutas, es decir si no estas logueado no vas a poder acceder a ellas.
//este lo estamos usando en la clase app, para ello usamos exports para que exporte el metodo
exports.isAuthenticated = async (req, res, next)=>{
    if (req.cookies.jwt) {
        try {
            const decodificada = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRETO)
            conexion.query('SELECT id,password FROM brigadistas WHERE id = ?', [decodificada.id_empleado], (error, results)=>{
                if(!results){return next()}
                req.user = results[0]
                return next()
            })
        } catch (error) {
            console.log(error)
            return next()
        }
    }else{
        res.redirect('/')        
    }
}
