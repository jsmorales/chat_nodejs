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

//--------------------------------------------------------------------
//peticion get del home
app.get('/', function(llamado, respuesta){
	respuesta.sendFile(__dirname + '/cliente.html')

})
//--------------------------------------------------------------------

//--------------------------------------------------------------------
//Peticiones de connexion al socket
io.on('connection', function(socket){

	//emite el evento llenar meme
	io.emit('llenar meme', {imgs: archivos})
	console.log("llenar meme")

	
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
			io.emit('mensaje', {mensaje: '--> Conectado!', usuario: socket.usuario})
		}
	})

	socket.on('nuevo mensaje', function(mensaje){
		io.emit('mensaje', {mensaje: mensaje, usuario: socket.usuario})
	})

	socket.on('meme', function(nombre){
		console.log(nombre)
		io.emit('muestra meme', {meme: nombre, usuario: socket.usuario})
	})

	function actualizarUsuarios(){
		//emite el evento con el array que se esta llenando
		//de usuarios.
		io.emit('actualizarUsuarios', usuarios)
	}

	//evento de desconexion
	socket.on('disconnect', function(data){
		console.log('Desconectado '+socket.usuario)		
		io.emit('mensaje', {mensaje: '--> Desconectado!', usuario: socket.usuario})
		usuarios.splice(usuarios.indexOf(socket.usuario), 1)
		actualizarUsuarios()
	})

})


//--------------------------------------------------------------------