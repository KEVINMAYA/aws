//Importación de Express
var express = require("express");
//Importación de cors
var cors = require("cors");
//Importacion de cookieParser
var cookieParser = require("cookie-parser");
//Importacion del dotenv
var dotenv = require("dotenv");
//importación de chart
const Chart = require('chart.js');

 
const { send } = require("process");
 
var usuario_actual = 0;
var rolis = null;
var estadoBrigadis = null;
 
//Constructor de Express
var app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use("/resources", express.static("public"));
app.use("/resources", express.static(__dirname + "public"));
app.set("view engine", "ejs");
 
const sesion = require("express-session");
app.use(
  sesion({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
 
//llamamos a la configuración de la DB en la carpeta env
dotenv.config({ path: "./env/.env" });
 
//llamamos a la variable que fue exportada en la carpeta DB para conectar a la Base de Datos.
const conexion = require("./database/db");
const { query } = require("express");
 
//Importamos el JWT
const jwt = require("jsonwebtoken");
//Importamos el bcryptjs
const bcryptjs = require("bcryptjs");
//LLamamamos a la ruta donde esta la clase controller para usar el metodo isAuthenticated
const c = require("./controller/controller");
const { parseFlagList } = require("mysql/lib/ConnectionConfig");
const { parse } = require("querystring");
const { Server } = require("http");
 
//Generamos la rutas para views del login
app.get("/", (req, res) => {
  res.redirect("login");
});
app.get("/login", (req, res) => {
  res.clearCookie("jwt");
  usuario_actual = 0;
  res.render("login");
});
 


// Usuarios Admin
app.get("/gestion", c.isAuthenticated, (req, res) => {
  if (usuario_actual == '0') { res.redirect("login"); }
  else if (rolis != null && rolis != "Administrador" && rolis !="Coordinador"&& estadoBrigadis=='Activo') {

    res.redirect("brigada");
  }
  else { res.render("gestion"); }
});
// Usuarios Admin
app.get("/informe", c.isAuthenticated, (req, res) => {
  if (usuario_actual == '0') { res.redirect("login"); }
  else if (rolis != null && rolis != "Administrador" && rolis !="Coordinador"&& estadoBrigadis=='Activo') {

    res.redirect("brigada");
  }
  else { res.render("informe"); }
});



//Generamos la rutas para views de brigadistas
app.get("/brigada", c.isAuthenticated, (req, res) => {
  if (usuario_actual == '0') { res.redirect("login"); }
  else if (rolis != null && rolis != "Usuario" && estadoBrigadis=='Activo') {
    res.redirect("gestion");
  }
  else { res.render("brigada"); }
});


 

 
 
//------------------------------------------ Gestión de brigadistas de Asobeecol ------------------------------------------
 
  // Función para mostrar brigadista en sesion
  app.get("/api/datos/",(req,res)=>{
    //Consulta a la base de datos usando la sentencia sql que viene por parámetro
    conexion.query("SELECT * FROM vBrigadista where idBrigadista = ?",[usuario_actual],function (error, filas){
      //Si existe un error nos devuelve el error detectado
      if (error) {
        //Excepción con el error detectado
        throw error;
      } else {
        //Si todo está correcto nos arroja todos los brigadistas
        res.send(filas);
      }
    });
    
    });


// Función para mostrar todos los brigadistas de Asobeecol
app.get("/api/brigadistas",(req,res)=>{
  conexion.query("SELECT * FROM vbrigadista ORDER BY vbrigadista.fechaInicio DESC", (error, filas) => {
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todos los brigadistas
      res.send(filas);
    }
  });
  
  });
  // Función para buscar el brigadista por ID
app.get("/api/searchbrigadista/:idBrigadista",(req,res)=>{
  conexion.query("SELECT * FROM vBrigadista where idBrigadista = ?",[req.params.idBrigadista], (error, filas) => {
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todos los brigadistas
      res.send(filas);
    }
  });
  
  });


  // Función para mostrar todos los brigadistas de Asobeecol por rol
app.get("/api/brigadistas/:rol/:empresa",(req,res)=>{
  const rol = req.params.rol;
  const empresa = req.params.empresa;

  let sql = "";
  let sql1 = "SELECT * FROM vbrigadista ORDER BY vbrigadista.fechaInicio DESC";
  let sql2 = "SELECT * FROM vbrigadista WHERE nombreEmpresa =? ORDER BY vbrigadista.fechaInicio DESC ";
  if(rol=='Administrador'){sql=sql1}
  else if(rol=='Coordinador'){sql=sql2}
  conexion.query(sql,[empresa,rol], function  (error, filas)  {
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todos los brigadistas
      res.send(filas);
    }
  });
  
  });

      // Función para mostrar todos los brigadistas de Asobeecol por rol
app.get("/api/estadobrigadistacontador",(req,res)=>{//Variable que almacena la sentencia sql para su posterior consulta
  let sql = "SELECT brigadista.estado, COUNT(brigadista.estado) AS cantidad FROM brigadista  GROUP BY brigadista.estado ORDER BY  brigadista.estado asc";
  //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
  conexion.query(sql, function (err, result) {
    //Si existe un error nos devuelve el error detectado
    if (err) throw err; //Excepción con el error detectado
    else {
      
      res.send(result);
    }
  });
  
  });

    // Función para mostrar todos los brigadistas de Asobeecol por rol
app.get("/api/listabrigadistacambio/:rol/:empresa",(req,res)=>{
  const rol = req.params.rol;
  const empresa = req.params.empresa;

  let sql = "";
  let sql1 = "SELECT * FROM vBrigadista WHERE cambioContrasenia= 'SI'";
  let sql2 = "SELECT * FROM vBrigadista WHERE nombreEmpresa = ? AND cambioContrasenia= 'SI'";
  if(rol=='Administrador'){sql=sql1}
  else if(rol=='Coordinador'){sql=sql2}
  conexion.query(sql,[empresa,rol], function  (error, filas)  {
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todos los brigadistas
      res.send(filas);
    }
  });
  
  });

  //Función para crear una nuevo brigadista
app.post("/api/addbrigadista/:id_brigadista/:nombre_brigadista/:profesion/:email/:password/:fechaInicio/:rol/:empresa/:pais/:departamento/:ciudad/:direccion/:rh/:celular/:estado", (req, res) => {
  //Variable que almacena la sentencia sql para su posterior consulta
  let sql = "INSERT INTO brigadista (idBrigadista, nombreBrigadista, Profesion, email, password, fechaInicio, rol, empresa , pais , departamento , ciudad , direccion , rh , celular , estado) VALUES(?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?)";
  //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
  conexion.query(sql, [req.params.id_brigadista,req.params.nombre_brigadista,req.params.profesion,req.params.email,req.params.password,req.params.fechaInicio,
    req.params.rol,req.params.empresa,req.params.pais,req.params.departamento, req.params.ciudad,req.params.direccion,req.params.rh,req.params.celular, req.params.estado], function (err, result) {
    //Si existe un error nos devuelve el error detectado
    if (err) throw err; //Excepción con el error detectado
    else {
      
      res.send(result);
    }
  });
});

  //Función para editar un brigadista
  app.post("/api/editbrigadista/:nombre_brigadista/:profesion/:email/:fechaInicio/:rol/:empresa/:pais/:departamento/:ciudad/:direccion/:rh/:celular/:estado/:id_brigadista", (req, res) => {
    //Variable que almacena la sentencia sql para su posterior consulta
    let sql = "UPDATE brigadista SET nombreBrigadista=?,profesion=?,email=?,fechaInicio=?,rol=?, empresa=?,pais=?,departamento=?,ciudad=?,direccion=?,rh=?, celular=?, estado=? WHERE idBrigadista = ?";
    //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
    conexion.query(sql, [req.params.nombre_brigadista,req.params.profesion,req.params.email,req.params.fechaInicio,
      req.params.rol,req.params.empresa,req.params.pais,req.params.departamento, req.params.ciudad,req.params.direccion,req.params.rh,req.params.celular, req.params.estado, req.params.id_brigadista], function (err, result) {
      //Si existe un error nos devuelve el error detectado
      if (err) throw err; //Excepción con el error detectado
      else {
        
        res.send(result);
      }
    });
  });

  //Función para editar un brigadista
  app.post("/api/passwordbrigadistacambio/:nueva/:id", (req, res) => {
    //Variable que almacena la sentencia sql para su posterior consulta
    let sql = "UPDATE brigadista SET password=?, nuevaPassword='', cambioContrasenia='NO' WHERE idBrigadista = ?";
    //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
    conexion.query(sql, [req.params.nueva, req.params.id], function (err, result) {
      //Si existe un error nos devuelve el error detectado
      if (err) throw err; //Excepción con el error detectado
      else {
        
        res.send(result);
      }
    });
  });

  //Función para editar un brigadista
  app.post("/api/passwordbrigadistanocambio/:id", (req, res) => {
    //Variable que almacena la sentencia sql para su posterior consulta
    let sql = "UPDATE brigadista SET  nuevaPassword='', cambioContrasenia='NO' WHERE idBrigadista = ?";
    //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
    conexion.query(sql, [req.params.nueva, req.params.id], function (err, result) {
      //Si existe un error nos devuelve el error detectado
      if (err) throw err; //Excepción con el error detectado
      else {
        
        res.send(result);
      }
    });
  });

  //eliminar Brigadista
app.delete("/api/deletebrigadista/:idBrigadista", (req, res) => {
  conexion.query(
    "DELETE from brigadista WHERE idBrigadista = ?", req.params.idBrigadista, (err, fijos) => {
      //Si existe un error nos devulve el error detectado
      if (err) {
        //Excepcón con el error detectado
        throw err;
      } else {
        
        res.send(fijos);
      }
    });
});

//-----------------------Cursos Brigadistas---------------

// Función para mostrar cursos de los brigadistas 
app.get("/api/cursos",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT * FROM vcursos ",function (error, filas){
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todos los cursos realizados por el brigadista buscado
      res.send(filas);
    }
  });
  
  });


// Función para mostrar cursos de los brigadistas 
app.get("/api/cursosbrigadista/:idBrigadistaCursos",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT * FROM vcursos WHERE vcursos.brigadista = ?",[req.params.idBrigadistaCursos],function (error, filas){
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todos los cursos realizados por el brigadista buscado
      res.send(filas);
    }
  });
  
  });

    //eliminar curso
app.delete("/api/deletecursosbrigadista/:idCurso", (req, res) => {
  conexion.query(
    "DELETE from cursos WHERE idcurso = ?", req.params.idCurso, (err, fijos) => {
      //Si existe un error nos devulve el error detectado
      if (err) {
        //Excepcón con el error detectado
        throw err;
      } else {
        
        res.send(fijos);
      }
    });
});

      //Función para crear un nuevo curso del brigadista
      app.post("/api/addcursosbrigadista/:brigadista/:nombre/:fechaIni/:fechaFi/:lugar/:intensidad", (req, res) => {
        //Variable que almacena la sentencia sql para su posterior consulta
        let sql = "INSERT INTO cursos (brigadista,nombreCurso,fechaInicio,fechaFin,lugar,intensidadHoraria) VALUES (?,?,?,?,?,?)";
        //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
        conexion.query(sql, [req.params.brigadista, req.params.nombre, req.params.fechaIni, req.params.fechaFi, req.params.lugar, req.params.intensidad], function (err, result) {
          //Si existe un error nos devuelve el error detectado
          if (err) throw err; //Excepción con el error detectado
          else {
            
            res.send(result);
          }
        });
      });




//-----------------------Eventos Brigadistas---------------

// Función para mostrar cursos de los brigadistas 
app.get("/api/eventos",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT * FROM veventos ",function (error, filas){
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todos los cursos realizados por el brigadista buscado
      res.send(filas);
    }
  });
  
  });


            // Función para mostrar contador de donacion de Asobeecol 
app.get("/api/estadoeventoscontador",(req,res)=>{//Variable que almacena la sentencia sql para su posterior consulta
  let sql = "SELECT  CASE WHEN fechaFin < CURDATE() THEN 'Pasado' WHEN fechaInicio <= CURDATE() AND  fechaFin >= CURDATE() THEN 'En curso'  ELSE 'Próximo' END AS estado, COUNT(*) AS contador FROM eventos GROUP BY  estado ORDER BY estado desc";
  //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
  conexion.query(sql, function (err, result) {
    //Si existe un error nos devuelve el error detectado
    if (err) throw err; //Excepción con el error detectado
    else {
      
      res.send(result);
    }
  });
  
  });

  //Función para crear un nuevo evento
  app.post("/api/addeventos/:nombre/:descripcion/:lugar/:fechaIni/:fechaFi/:horario", (req, res) => {
    //Variable que almacena la sentencia sql para su posterior consulta
    let sql = "INSERT INTO eventos (nombreEvento,detalleEvento,lugarEvento,fechaInicio,fechaFin,horarioEvento) VALUES (?,?,?,?,?,?)";
    //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
    conexion.query(sql, [req.params.nombre, req.params.descripcion, req.params.lugar, req.params.fechaIni, req.params.fechaFi, req.params.horario], function (err, result) {
      //Si existe un error nos devuelve el error detectado
      if (err) throw err; //Excepción con el error detectado
      else {
        
        res.send(result);
      }
    });
  });


      //Función para editar un evento
      app.post("/api/editevento/:nombreEvento/:detalleEvento/:lugarEvento/:fechaInicioEvento/:fechaFinEvento/:horarioEvento/:idEvento", (req, res) => {
        //Variable que almacena la sentencia sql para su posterior consulta
        let sql = "UPDATE eventos SET nombreEvento=?,detalleEvento=?, lugarEvento=?,fechaInicio=?,fechaFin=?, horarioEvento=? WHERE idEvento=?";
        //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
        conexion.query(sql, [req.params.nombreEvento, req.params.detalleEvento, req.params.lugarEvento, req.params.fechaInicioEvento, req.params.fechaFinEvento, req.params.horarioEvento, req.params.idEvento], function (err, result) {
          //Si existe un error nos devuelve el error detectado
          if (err) throw err; //Excepción con el error detectado
          else {
            
            res.send(result);
          }
        });
      });


          //eliminar evento con el id
app.delete("/api/deleteevento/:idEvento", (req, res) => {
  conexion.query(
    "DELETE from eventos WHERE idEvento = ?", req.params.idEvento, (err, fijos) => {
      //Si existe un error nos devulve el error detectado
      if (err) {
        //Excepcón con el error detectado
        throw err;
      } else {
        
        res.send(fijos);
      }
    });
});

//--------------------------------------Contraseña----------------------------------------------------

  //Función para Cambiar la contraseña de un brigadista
app.post("/api/cambiarcontrasenia/:password/:id_brigadista", (req, res) => {
  //Variable que almacena la sentencia sql para su posterior consulta
  let sql = "UPDATE brigadista SET password = ?  WHERE idBrigadista = ?";
  //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
  conexion.query(sql, [req.params.password,req.params.id_brigadista], function (err, result) {
    //Si existe un error nos devuelve el error detectado
    if (err) throw err; //Excepción con el error detectado
    else {
      
      res.send(result);
    }
  });
});


  //Función para Cambiar la contraseña de un brigadista
  app.post("/api/cambiocontraseniabrigadista/:nueva/:id", (req, res) => {
    //Variable que almacena la sentencia sql para su posterior consulta
    let sql = "UPDATE brigadista SET cambioContrasenia = 'SI', nuevaPassword= ? WHERE idBrigadista = ?";
    //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
    conexion.query(sql, [req.params.nueva, req.params.id], function (err, result) {
      //Si existe un error nos devuelve el error detectado
      if (err) throw err; //Excepción con el error detectado
      else {
        
        res.send(result);
      }
    });
  });

//--------------------------------------Empresas------------------------------------------------------------
// Función para mostrar todas las empresas de Asobeecol
app.get("/api/empresa",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT * FROM asobeecol.empresa", (error, filas) => {
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todas las profesiones de la base de datos 
      res.send(filas);
    }
  });
  
  });

// Función para mostrar una empresa por id
app.get("/api/searchempresa/:idEmpresa",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT * FROM asobeecol.empresa where idEmpresa = ?",[req.params.idEmpresa],function (error, filas){
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todos los brigadistas
      res.send(filas);
    }
  });
  
  });

        //Función para crear una nueva empresa
app.post("/api/addempresa/:nit/:nombre/:tipo/:celular/:pais/:departamento/:ciudad/:direccion", (req, res) => {
  //Variable que almacena la sentencia sql para su posterior consulta
  let sql = "INSERT INTO empresa (idEmpresa,nombreEmpresa,tipo,celular,pais,departamento,ciudad,direccion ) VALUES(?,?,?,?,?,?,?,?)";
  //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
  conexion.query(sql, [req.params.nit, req.params.nombre, req.params.tipo, req.params.celular, req.params.pais, req.params.departamento, req.params.ciudad, req.params.direccion], function (err, result) {
    //Si existe un error nos devuelve el error detectado
    if (err) throw err; //Excepción con el error detectado
    else {
      
      res.send(result);
    }
  });
});

 //Función para editar una empresa
 app.post("/api/editempresa/:nombre/:tipo/:celular/:pais/:departamento/:ciudad/:direccion/:id", (req, res) => {
  //Variable que almacena la sentencia sql para su posterior consulta
  let sql = "UPDATE empresa SET nombreEmpresa=?, tipo=?,celular=?, pais=?, departamento=?,ciudad=?,direccion=? WHERE idEmpresa=?";
  //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
  conexion.query(sql, [req.params.nombre, req.params.tipo, req.params.celular, req.params.pais, req.params.departamento, req.params.ciudad, req.params.direccion, req.params.id], function (err, result) {
    //Si existe un error nos devuelve el error detectado
    if (err) throw err; //Excepción con el error detectado
    else {
      
      res.send(result);
    }
  });
});

  //eliminar Empresa
  app.delete("/api/deleteempresa/:id", (req, res) => {
    conexion.query(
      "DELETE from empresa WHERE idEmpresa = ?", req.params.id, (err, fijos) => {
        //Si existe un error nos devulve el error detectado
        if (err) {
          //Excepcón con el error detectado
          throw err;
        } else {
          
          res.send(fijos);
        }
      });
  });
  

//-----------------------------------Departamentos---------------------------------------------------
// Función para mostrar todas los departamentos
app.get("/api/departamentos",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT * FROM asobeecol.departamentos ORDER BY departamento", (error, filas) => {
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todas las profesiones de la base de datos 
      res.send(filas);
    }
  });
  
  });



  // Función para mostrar una empresa por id
app.get("/api/municipios/:idDepartamento",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT * FROM asobeecol.municipios WHERE departamento_id= ?  ORDER BY municipio",[req.params.idDepartamento],function (error, filas){
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todos los brigadistas
      res.send(filas);
    }
  });
  
  });

//-----------------------------------Profesiones--------------------------------------------------------

// Función para mostrar todas las profesiones de Asobeecol
app.get("/api/profesion",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT * FROM asobeecol.profesion", (error, filas) => {
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todas las profesiones de la base de datos 
      res.send(filas);
    }
  });
  
  });




  //--------------------------------------Roles----------------------------------------------------------------
  // Función para mostrar todos los roles de Asobeecol
app.get("/api/rol",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT * FROM asobeecol.rol", (error, filas) => {
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todas las profesiones de la base de datos 
      res.send(filas);
    }
  });
  
  });

  //--------------------------------------Donaciones----------------------------------------------------------------
  // Función para mostrar todos las donaciones realizadas a Asobeecol
  app.get("/api/donacion",(req,res)=>{
    //Consulta a la base de datos usando la sentencia sql que viene por parámetro
    conexion.query("SELECT * FROM vdonacion", (error, filas) => {
      //Si existe un error nos devuelve el error detectado
      if (error) {
        //Excepción con el error detectado
        throw error;
      } else {
        //Si todo está correcto nos arroja todas las profesiones de la base de datos 
        res.send(filas);
      }
    });
    
    });

          // Función para mostrar contador de donacion de Asobeecol 
app.get("/api/estadodonacioncontador",(req,res)=>{//Variable que almacena la sentencia sql para su posterior consulta
  let sql = "SELECT donacion.estado, COUNT(donacion.estado) AS cantidad FROM donacion  GROUP BY donacion.estado ORDER BY  donacion.estado asc";
  //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
  conexion.query(sql, function (err, result) {
    //Si existe un error nos devuelve el error detectado
    if (err) throw err; //Excepción con el error detectado
    else {
      
      res.send(result);
    }
  });
  
  });


      //Función para crear una nueva donacion
app.post("/api/adddonacion/:nombreDonante/:documentoDonante/:celularDonante/:paisDonante/:departamentoDonante/:ciudadDonante/:direccionDonante/:tipo/:prioridad/:cantidad/:observaciones/:fechaEntrega/:brigadista/:estado/:descripcion/:tipoDonante/:edad/:genero", (req, res) => {
  //Variable que almacena la sentencia sql para su posterior consulta
  let sql = "INSERT INTO `donacion` (`nombreDonante`,`documentoDonante`,`celularDonante`,`paisDonante`,`departamentoDonante`,`ciudadDonante`,`direccionDonante`, `tipo`, `prioridad`, `cantidad`, `observaciones`, `fechaEntrega`, `brigadista`, `estado`, `descripcion`,`tipoDonante`,`edad`,`genero`) VALUES(?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?,?,?,?)";
  //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
  conexion.query(sql, [req.params.nombreDonante, req.params.documentoDonante, req.params.celularDonante, req.params.paisDonante, req.params.departamentoDonante, req.params.ciudadDonante, req.params.direccionDonante,req.params.tipo,req.params.prioridad,req.params.cantidad,req.params.observaciones,req.params.fechaEntrega,req.params.brigadista,req.params.estado, req.params.descripcion, req.params.tipoDonante, req.params.edad, req.params.genero], function (err, result) {
    //Si existe un error nos devuelve el error detectado
    if (err) throw err; //Excepción con el error detectado
    else {
      
      res.send(result);
    }
  });
});


      //Función para editar una  donacion
      app.post("/api/editdonacion/:nombreDonante/:documentoDonante/:celularDonante/:paisDonante/:departamentoDonante/:ciudadDonante/:direccionDonante/:tipo/:prioridad/:cantidad/:observaciones/:estado/:descripcion/:tipoDonante/:edad/:genero/:idDonacion", (req, res) => {
        //Variable que almacena la sentencia sql para su posterior consulta
        let sql = "UPDATE donacion SET nombreDonante =?, documentoDonante=?, celularDonante=?, paisDonante=?, departamentoDonante=?, ciudadDonante=?, direccionDonante=?, tipo=?,prioridad=?, cantidad=?, observaciones=?, estado=?, descripcion=?, tipoDonante=?, edad=?, genero=? WHERE idDonacion = ?";
        //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
        conexion.query(sql, [req.params.nombreDonante, req.params.documentoDonante, req.params.celularDonante, req.params.paisDonante, req.params.departamentoDonante, req.params.ciudadDonante, req.params.direccionDonante,req.params.tipo,req.params.prioridad,req.params.cantidad,req.params.observaciones,req.params.estado, req.params.descripcion, req.params.tipoDonante, req.params.edad, req.params.genero, req.params.idDonacion], function (err, result) {
          //Si existe un error nos devuelve el error detectado
          if (err) throw err; //Excepción con el error detectado
          else {
            
            res.send(result);
          }
        });
      });

      //funcion para subir el comprobante de pago
      app.post('/api/comprobantedonacion', (req, res) => {
        const imagen = req.files.imagen;
      
        connection.query('INSERT INTO donacion comprobanteDinero VALUES ? WHERE idDonacion=?', [imagen.data], (error, results) => {
          if (error) {
            console.error(error);
            res.status(500).send('Ha ocurrido un error al subir la imagen');
          } else {
            res.send('La imagen se ha subido correctamente');
          }
        });
      });

// Función para mostrar todos las donaciones realizadas a Asobeecol filtradas por estado
app.get("/api/estadodonacion/:estado",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT * FROM vdonacion WHERE estado = ?",[req.params.estado], function (error, filas) {
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todas las profesiones de la base de datos 
      res.send(filas);
    }
  });
  
  });


        //Función para enviar  una donacion al almacen
app.post("/api/enviardonacionalmacen/:almacen/:id", (req, res) => {
  //Variable que almacena la sentencia sql para su posterior consulta
  let sql = "UPDATE donacion SET estado = 'En Almacén', almacen = ? WHERE idDonacion = ?";
  //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
  conexion.query(sql, [req.params.almacen,req.params.id], function (err, result) {
    //Si existe un error nos devuelve el error detectado
    if (err) throw err; //Excepción con el error detectado
    else {
      
      res.send(result);
    }
  });
});

        //Función para entregar una donacion 
        app.post("/api/entregardonacion/:fechaSalida/:donado/:id", (req, res) => {
          //Variable que almacena la sentencia sql para su posterior consulta
          let sql = "UPDATE donacion SET estado ='Entregada',fechaSalida = ?, donado = ? WHERE idDonacion = ?";
          //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
          conexion.query(sql, [req.params.fechaSalida,req.params.donado,req.params.id], function (err, result) {
            //Si existe un error nos devuelve el error detectado
            if (err) throw err; //Excepción con el error detectado
            else {
              
              res.send(result);
            }
          });
        });


        //eliminar Empresa
  app.delete("/api/deletedonacion/:id", (req, res) => {
    conexion.query(
      "DELETE from donacion WHERE idDonacion = ?", req.params.id, (err, fijos) => {
        //Si existe un error nos devulve el error detectado
        if (err) {
          //Excepcón con el error detectado
          throw err;
        } else {
          
          res.send(fijos);
        }
      });
  });


    

//---------------------------------------- Dotaciones ----------------------------------------
// Función para mostrar todos las donaciones realizadas a Asobeecol filtradas por estado
app.get("/api/dotacion",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT * FROM vdotacion", function (error, filas) {
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todas las profesiones de la base de datos 
      res.send(filas);
    }
  });
  
  });

    // Función para mostrar todos los brigadistas de Asobeecol por rol
app.get("/api/dotacion/:rol/:empresa",(req,res)=>{
  const rol = req.params.rol;
  const empresa = req.params.empresa;

  let sql = "";
  let sql1 = "SELECT * FROM vDotacion";
  let sql2 = "SELECT * FROM vDotacion WHERE nombreEmpresa = ?";
  if(rol=='Administrador'){sql=sql1}
  else if(rol=='Coordinador'){sql=sql2}
  conexion.query(sql,[empresa,rol], function  (error, filas)  {
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todos los brigadistas
      res.send(filas);
    }
  });
  
  });

  
      //Función para crear una nueva dotacion de la empresa
      app.post("/api/adddotacion/:empresa/:tipo/:estado/:observacion", (req, res) => {
        //Variable que almacena la sentencia sql para su posterior consulta
        let sql = "INSERT INTO dotacion ( empresa, tipo,estado,observacion) VALUES (?,?,?,?)";
        //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
        conexion.query(sql, [req.params.empresa, req.params.tipo, req.params.estado, req.params.observacion], function (err, result) {
          //Si existe un error nos devuelve el error detectado
          if (err) throw err; //Excepción con el error detectado
          else {
            
            res.send(result);
          }
        });
      });

       //Función para editar una dotacion
  app.post("/api/editdotacion/:nombre/:empresa/:tipo/:estado/:observacion/:id", (req, res) => {
    //Variable que almacena la sentencia sql para su posterior consulta
    let sql = "UPDATE dotacion SET nombreDotacion=?,empresa=?,tipo=?,estado=?,observacion=? WHERE idDotacion=?";
    //Inserción a la base de datos usando la sentencia sql con los atributos que vienen por parámetro
    conexion.query(sql, [req.params.nombre, req.params.empresa, req.params.tipo, req.params.estado, req.params.observacion, req.params.id], function (err, result) {
      //Si existe un error nos devuelve el error detectado
      if (err) throw err; //Excepción con el error detectado
      else {
        
        res.send(result);
      }
    });
  });

    //eliminar Dotacion
app.delete("/api/deletedotacion/:id", (req, res) => {
  conexion.query(
    "DELETE from dotacion WHERE idDotacion = ?", req.params.id, (err, fijos) => {
      //Si existe un error nos devulve el error detectado
      if (err) {
        //Excepcón con el error detectado
        throw err;
      } else {
        
        res.send(fijos);
      }
    });
});

// filtro para contar por estado el inventario
app.get("/api/dotacionfiltro",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT nombreDotacion, nombreEmpresa,tipo, estado,COUNT(*) cantidad FROM vdotacion GROUP BY estado,nombreDotacion,nombreEmpresa,tipo", function (error, filas) {
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todas las profesiones de la base de datos 
      res.send(filas);
    }
  });
  
  });

//---------------------------------------- Gestión de Informes ----------------------------------------
 //--------------------------------------Brigadistas---------------------------------------------------

 //--------------------brigadistas por empresa--------------------

app.get("/api/informeBrigadistaEmpresa",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT nombreEmpresa, COUNT(idEmpresa) AS cantidad FROM vbrigadista GROUP BY nombreEmpresa ORDER BY nombreEmpresa asc", function (error, filas) {
    //Si existe un error nos devuelve el error detectado
    if(error){
      throw error
  }else{
      res.send(filas)
  }
  });
  
  });

//--------------brigadistas por cursos---------------
app.get("/api/informeBrigadistaCursos",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT nombreCurso, COUNT(brigadista) AS cantidad FROM vcursos GROUP BY nombreCurso ORDER BY nombreCurso asc", function (error, filas) {
    //Si existe un error nos devuelve el error detectado
    if(error){
      throw error
  }else{
      res.send(filas)
  }
  });
  
  });

 //------------brigadistas por porfesion--------------  
app.get("/api/informeBrigadistaProfesion",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT profesion, COUNT(nombreBrigadista) AS cantidad FROM vbrigadista GROUP BY profesion ORDER BY profesion asc", function (error, filas) {
    //Si existe un error nos devuelve el error detectado
    if(error){
      throw error
  }else{
      res.send(filas)
  }
  });
  
  });


  //----------Brigadistas por ubicacion----------------
app.get("/api/informeBrigadistaUbicacion",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT pais,departamento,municipio, COUNT(nombreBrigadista) AS cantidad FROM vbrigadista GROUP BY pais,departamento,municipio ORDER BY pais,departamento,municipio  asc", function (error, filas) {
    //Si existe un error nos devuelve el error detectado
    if(error){
      throw error
  }else{
      res.send(filas)
  }
  });
  
  });

//----------------------DONACIONES---------------------------------
//-------------Donacion por donante------------------
app.get("/api/informeDonacionDonante",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT nombreDonante, COUNT(idDonacion) AS cantidad FROM vdonacion GROUP BY nombreDonante ORDER BY nombreDonante asc", function (error, filas) {
    //Si existe un error nos devuelve el error detectado
    if(error){
      throw error
  }else{
      res.send(filas)
  }
  });
  
  });

//-----------------Donacion por estado----------------
app.get("/api/informeDonacionEstado",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT estado, COUNT(idDonacion) AS cantidad FROM vdonacion GROUP BY estado ORDER BY estado asc", function (error, filas) {
    //Si existe un error nos devuelve el error detectado
    if(error){
      throw error
  }else{
      res.send(filas)
  }
  });
  
  });

  //-----------------Donacion por prioridad----------------
app.get("/api/informeDonacionPrioridad",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT prioridad, COUNT(idDonacion) AS cantidad FROM vdonacion GROUP BY prioridad ORDER BY prioridad asc", function (error, filas) {
    //Si existe un error nos devuelve el error detectado
    if(error){
      throw error
  }else{
      res.send(filas)
  }
  });
  
  });

    //-----------------Donacion por tipo----------------
app.get("/api/informeDonacionTipo",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT tipo, COUNT(idDonacion) AS cantidad FROM vdonacion GROUP BY tipo ORDER BY tipo asc", function (error, filas) {
    //Si existe un error nos devuelve el error detectado
    if(error){
      throw error
  }else{
      res.send(filas)
  }
  });
  
  });

  //----------------------------DOTACIONES----------------------------------

  //----------------Dotaciones por cantidad----------------
  app.get("/api/informeDotacionCantidad",(req,res)=>{
    //Consulta a la base de datos usando la sentencia sql que viene por parámetro
    conexion.query("SELECT CONCAT(nombreEmpresa, ' - ', tipo) AS tipo, COunt(idDotacion) AS cantidad FROM vdotacion GROUP BY tipo,nombreEmpresa ORDER BY nombreEmpresa,tipo", function (error, filas) {
      //Si existe un error nos devuelve el error detectado
      if(error){
        throw error
    }else{
        res.send(filas)
    }
    });
    
    });
    
       //----------------Dotaciones por empresa----------------
       app.get("/api/informeDotacionEmpresa",(req,res)=>{
        //Consulta a la base de datos usando la sentencia sql que viene por parámetro
        conexion.query("SELECT nombreEmpresa, COUNT(idDotacion) AS cantidad FROM vdotacion GROUP BY nombreEmpresa ORDER BY nombreEmpresa asc", function (error, filas) {
          //Si existe un error nos devuelve el error detectado
          if(error){
            throw error
        }else{
            res.send(filas)
        }
        });
        
        });

    //----------------Dotaciones por estado----------------
    app.get("/api/informeDotacionEstado",(req,res)=>{
      //Consulta a la base de datos usando la sentencia sql que viene por parámetro
      conexion.query("SELECT estado, COUNT(idDotacion) AS cantidad FROM vdotacion GROUP BY estado ORDER BY estado asc", function (error, filas) {
        //Si existe un error nos devuelve el error detectado
        if(error){
          throw error
      }else{
          res.send(filas)
      }
      });
      
      });

      //----------------Dotaciones por Tipo----------------
  app.get("/api/informeDotacionTipo",(req,res)=>{
    //Consulta a la base de datos usando la sentencia sql que viene por parámetro
    conexion.query("SELECT tipo, COUNT(idDotacion) AS cantidad FROM vdotacion GROUP BY tipo ORDER BY tipo asc", function (error, filas) {
      //Si existe un error nos devuelve el error detectado
      if(error){
        throw error
    }else{
        res.send(filas)
    }
    });
    
    });

// Función para mostrar todos las donaciones realizadas a Asobeecol filtradas por estado
app.get("/api/informeDotacionCantidadTipo/:tipo",(req,res)=>{
  //Consulta a la base de datos usando la sentencia sql que viene por parámetro
  conexion.query("SELECT nombreEmpresa, COUNT(idDotacion) AS cantidad FROM vdotacion WHERE tipo=? GROUP BY nombreEmpresa ORDER BY nombreEmpresa ",[req.params.tipo], function (error, filas) {
    //Si existe un error nos devuelve el error detectado
    if (error) {
      //Excepción con el error detectado
      throw error;
    } else {
      //Si todo está correcto nos arroja todas las profesiones de la base de datos 
      res.send(filas);
    }
  });
  
  });

  
  //---------------------------EVENTOS----------------------------------
       //----------------Eventos por Estado----------------
       app.get("/api/informeEventoEstado",(req,res)=>{
        //Consulta a la base de datos usando la sentencia sql que viene por parámetro
        conexion.query("SELECT  CASE WHEN fechaFin < CURDATE() THEN 'Pasado' WHEN fechaInicio <= CURDATE() AND  fechaFin >= CURDATE() THEN 'En curso'  ELSE 'Próximo' END AS estado, COUNT(*) AS contador FROM eventos GROUP BY  estado ORDER BY estado desc", function (error, filas) {
          //Si existe un error nos devuelve el error detectado
          if(error){
            throw error
        }else{
            res.send(filas)
        }
        });
        
        });

//------------------------------------------ Login---------------------------------------------------

//Función para acceder con las credenciales a login
app.post("/login", async (req, res) => {
  usuario_actual = req.body.user;
  try {
    //Variables que almacenan la información que viene por la petición
    const user = req.body.user;
    const pass = req.body.password;
    //Lanza un condicion en donde pregunta que si los campos estan vacios lanse una advertencia.
    if (!user || !pass) {
      res.render("login", {
        alert: true,
        alertIcon: "info",
        alertTitle: "Advertencia",
        text: "Ingrese un usuario y contraseña",
        showConfirmButton: false,
        timer: 3000,
        ruta: "/",
      });
    } else {
      //Se ejecuta la sentencia sql donde trae los campos id, contrasena y roll del brigadista
      conexion.query(
        "SELECT b.idBrigadista,b.password,v.nombreRol,b.estado FROM brigadista b, vbrigadista v WHERE b.idBrigadista = v.idBrigadista AND b.idBrigadista = ? and b.password = ?",
        [user, pass],
        async (error, results) => {
          
          //Lanza la condicion preguntando que si llega algo por results, sino llega nada lanza un error.
          if (results.length == 0) {
            res.render("login", {
              alert: true,
              alertTitle: "Error",
              text: "Usuario y/o contraseña incorrectos",
              alertIcon: "error",
              showConfirmButton: false,
              timer: 3000,
              ruta: "/",
            });
          } else{
            //inicio de sesión OK, guardamos la informacion en la variable id
            const id = results[0].idBrigadista;
            // Generamos el token con los datos que estan en env
            const token = jwt.sign(
              { idBrigadista: id },
              process.env.JWT_SECRETO,
              {
                expiresIn: process.env.JWT_TIEMPO_EXPIRA,
              }
            );
            //generamos el token SIN fecha de expiracion
            //const token = jwt.sign({id: id}, process.env.JWT_SECRETO)
            console.log("TOKEN: " + token + " para el USUARIO : " + user);
 
            // Controla el tiempo en el que esta disponible el JWT para la sesión
            const cookiesOptions = {
              expires: new Date(
                Date.now() +
                process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
              ),
              httpOnly: true,
            };
            res.cookie("jwt", token, cookiesOptions);
            // Guardamos la información en la variable rol, esta tiene los roles de los brigadistas
            const rol = results[0].nombreRol;
            const estado = results[0].estado;
            rolis = rol;
            estadoBrigadis= estado;
            //Lanza la condicion donde el usser y pass ingresados tienen roll de admin los lleva a areas
            if (rol == "Usuario" && estado=='Activo') {
              res.render("login", {
                alert: true,
                alertTitle: "Conexión exitosa",
                text: "",
                alertIcon: "success",
                showConfirmButton: false,
                timer: 3000,
                ruta: "brigada",
                
              });
            }
            else if (rol == "Administrador"|| rol =="Coordinador"&&estado=='Activo') {
              res.render("login", {
                alert: true,
                alertTitle: "Conexión exitosa",
                text: "",
                alertIcon: "success",
                showConfirmButton: false,
                timer: 3000,
                ruta: "gestion",
              });
            } 
            else{
              res.render("login", {
                alert: true,
                alertTitle: "Brigadista Inactivo",
                text: "",
                alertIcon: "info",
                showConfirmButton: false,
                timer: 3000,
                ruta: "login",
              });
              
            }
            
          }
        }
      );
    }
    //caputura el error
  } catch (error) {
    console.log(error);
  }
});
 
app.get("/logout", (req, res) => {
  usuario_actual = 0;
  rolis = null;
  res.clearCookie("jwt");
  res.redirect('/login');
});
 
//------------------------------------------Conexión del servidor------------------------------------------
//Inicializamos el server, y le decimos que escuche por el port 3000
app.listen(3000, (req, res) => {
  console.log("servidor en linea");
});

