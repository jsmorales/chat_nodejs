var express = require('express')

//este modulo se carga ya que socket io lo necesita
var http = require('http')

var socket = require('socket.io')
//--------------------------------------------------------------------
//para leer los archivos de la carpeta memes
var fs = require('fs');

var archivos = fs.readdirSync("memes")

console.log(archivos)
//se inicializa la app express
var app = express();
//se inicializa el server http de la siguiente manera
//dentro de la funcion create se envia el app express
var server = http.createServer(app)
//--------------------------------------------------------------------

var usuarios = []

//--------------------------------------------------------------------
//evento cuando el servidor inicia
server.listen(3000, function(){
	console.log("localhost:3000")
})

//crea variable de evento de los sockets
var io = socket.listen(server)
//--------------------------------------------------------------------

//usando recursos de node_modules, esto me permite usar los archivos
//alojados en esta carpeta y usarlos en la vista
app.use('/node_modules', express.static('node_modules'))

app.use('/memes', express.static('memes'))

app.use('/estilos', express.static('estilos'))

//--------------------------------------------------------------------
//peticion get del home
app.get('/', function(llamado, respuesta){
	respuesta.sendFile(__dirname + '/cliente.html')

})
//--------------------------------------------------------------------
function getFechaT(){
	var date;
	date = new Date();
	date = date.getFullYear() + '-' +
	    ('00' + (date.getMonth()+1)).slice(-2) + '-' +
	    ('00' + date.getDate()).slice(-2) + ' ' +
	    ('00' + (date.getHours())).slice(-2) + ':' + 
	    ('00' + (date.getMinutes())).slice(-2) + ':' +
	    ('00' + (date.getSeconds())).slice(-2);

	return date;
}
//--------------------------------------------------------------------
//Peticiones de connexion al socket
io.on('connection', function(socket){

	//emite el evento llenar meme
	io.emit('llenar meme', {imgs: archivos})
	console.log("llenar meme")
	console.log(getFechaT())
	
	//cuando se conecta se revisa si hay un evento de tipo
	//nuevo usuario que es emitido desde el cliente
	socket.on('nuevo usuario', function(usuario, callback){
		//al emitir este evento se valida si ya existe el usuario
		//en este chat, en el array de usuarios
		if (usuarios.indexOf(usuario) != -1) {
			//ya existe en el array
			callback(false)
		}else{
			//todo salio bien
			callback(true)
			//se agrega el usuario al socket
			socket.usuario = usuario
			//se agrega el usuario al array
			usuarios.push(usuario)
			//actualiza la muestra de los usuarios
			actualizarUsuarios()

			console.log(socket.usuario)

			io.emit('mensaje', {mensaje: '--> Conectado!', usuario: socket.usuario, fechaT: getFechaT()})
		}
	})

	socket.on('nuevo mensaje', function(mensaje){
		io.emit('mensaje', {mensaje: mensaje, usuario: socket.usuario, fechaT: getFechaT()})
	})

	socket.on('escribiendo mensaje', function(){
		io.emit('escribiendo', {usuario: socket.usuario})
	})

	socket.on('meme', function(nombre){
		console.log(nombre)
		io.emit('muestra meme', {meme: nombre, usuario: socket.usuario, fechaT: getFechaT()})
	})
	/*
	socket.on('focus_window', function(){
		io.emit('stop_flasT');
	})*/

	function actualizarUsuarios(){
		//emite el evento con el array que se esta llenando
		//de usuarios.
		io.emit('actualizarUsuarios', usuarios)
	}

	//evento de desconexion que es carga de pagina
	socket.on('disconnect', function(data){
		
		//recorre el array si el nombre de usuario esta dentro
		//del array si elimina el mismo y lo desconecta de lo 
		//contrario no
		
		usuarios.forEach(function(el, index) {
			console.log(index)
			console.log(el)

			if (el == socket.usuario) {
				usuarios.splice(usuarios.indexOf(socket.usuario), 1)
				console.log('Desconectado '+socket.usuario)		
				io.emit('mensaje', {mensaje: '--> Desconectado!', usuario: socket.usuario, fechaT: getFechaT()})
			}	
		});

		actualizarUsuarios()

		//console.log(usuarios)
		//console.log(usuarios.indexOf(socket.usuario))
	})

})


//--------------------------------------------------------------------