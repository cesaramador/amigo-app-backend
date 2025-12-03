-- ***************************************************************************************************
-- CREAR BASE DE DATOS

CREATE SCHEMA `amigo` DEFAULT CHARACTER SET utf8mb4;

-- ***************************************************************************************************
-- USAR BASE DE DATOS

USE amigo;

-- ***************************************************************************************************
-- CREAR TABLAS DE USUARIOS

-- TABLA # 1
CREATE TABLE Generos
(
	id_genero int AUTO_INCREMENT PRIMARY KEY NOT NULL,
	genero varchar(10) NOT NULL UNIQUE
);

-- TABLA # 2
CREATE TABLE Estados
(
	id_estado int AUTO_INCREMENT PRIMARY KEY NOT NULL,
	estado varchar(100) NOT NULL UNIQUE
);

-- TABLA # 3
CREATE TABLE Municipios
(
	id_municipio int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    id_estado int NOT NULL,
	num_municipio int NOT NULL,
	municipio varchar(100) NOT NULL,
    CONSTRAINT FK_Id_MunicipioEstado FOREIGN KEY (id_estado) 
		REFERENCES Estados (id_estado) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
);

-- TABLA # 4
CREATE TABLE EstatusMaritales
(
	id_estatusmarital int AUTO_INCREMENT PRIMARY KEY NOT NULL,
	estatus_marital varchar(20) NOT NULL UNIQUE -- casada/o, soltera/o, union libre
);

-- TABLA # 5
CREATE TABLE EstatusUsuarios
(
	id_estatususuario int AUTO_INCREMENT PRIMARY KEY NOT NULL,
	estatus_usuario varchar(20) NOT NULL UNIQUE -- vigente, suspendido, cancelado, etc.
);

-- TABLA # 6
CREATE TABLE CategoriasViviendas
(
	id_categoriavivienda int AUTO_INCREMENT PRIMARY KEY NOT NULL,
	categoria_vivienda varchar(20) NOT NULL UNIQUE -- propia, rentada, prestada
);

-- TABLA # 7
CREATE TABLE TiposUsuarios (
    id_tipousuario int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    tipo_usuario varchar(50) NOT NULL UNIQUE -- administrador, asesor, proveedor, usuario
);

-- TABLA # 8
CREATE TABLE Usuarios 
(
    id_usuario int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    id_tipousuario int NOT NULL,
    nombre varchar(50) NOT NULL,
    ap_paterno varchar(50), -- validar si queda vacío en el proceso de registro del usuario, pasar el apellido materno aquí
    ap_materno varchar(50),
    fecha_nacimiento date,
    telefono_personal varchar(10) NOT NULL UNIQUE,
    telefono_contacto varchar(10),
    email varchar(200) NOT NULL UNIQUE,
    codigo varchar(100) NOT NULL, -- código numérico aleatorio de 6 digitos generado por la app almacenar usando hash
    -- Domicilio
    id_estado int NOT NULL, 
    id_municipio int NOT NULL, -- **** SE SELECCIONA EL ESTADO PARA VISUALIZAR SUS MUNICIPIOS
    colonia varchar(100) NOT NULL,
    calle varchar(100) NOT NULL,
    numero_int varchar(15),
    numero_ext varchar(15),
    codigo_postal varchar(5) NOT NULL,
    -- Datos proveedor (requisito para proveedores)
    razon_social varchar(200),
    rfc varchar(15),
    -- Otros campos
    fecha_registro date NOT NULL,
    id_genero int NOT NULL,
    id_estatus_usuario int NOT NULL,
    id_estatus_marital int NOT NULL,
    id_categoria_vivienda int NOT NULL,
    CONSTRAINT FK_UsuarioTipo FOREIGN KEY (id_tipousuario)
        REFERENCES TiposUsuarios (id_tipousuario) ON UPDATE RESTRICT,
    CONSTRAINT FK_UsuarioEstado FOREIGN KEY (id_estado)
        REFERENCES Estados (id_estado) ON UPDATE CASCADE ON DELETE RESTRICT,
    /*CONSTRAINT FK_UsuarioMunicipio FOREIGN KEY (id_municipio)
        REFERENCES Municipios (id_municipio) ON UPDATE CASCADE ON DELETE RESTRICT,*/
    CONSTRAINT FK_UsuarioGenero FOREIGN KEY (id_genero)
        REFERENCES Generos (id_genero) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_UsuarioEstatus FOREIGN KEY (id_estatus_usuario)
        REFERENCES EstatusUsuarios (id_estatususuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_UsuarioEstatusMarital FOREIGN KEY (id_estatus_marital)
        REFERENCES EstatusMaritales (id_estatusmarital) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_UsuarioCategoriaVivienda FOREIGN KEY (id_categoria_vivienda)
        REFERENCES CategoriasViviendas (id_categoriavivienda) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ***************************************************************************************************
-- CREAR MATRIZ DE ACCESOS

-- TABLA Vistas
CREATE TABLE Vistas
(
	id_vista int AUTO_INCREMENT PRIMARY KEY NOT NULL,
	vista varchar(20) NOT NULL
);

-- Tabla de Matriz de accesos
CREATE TABLE MatrizAccesos
(
	id_matrizacceso int AUTO_INCREMENT PRIMARY KEY NOT NULL,
	id_tipousuario int,
    id_vista int,
    estatus boolean, -- 0 sin acceso, 1 con acceso
	CONSTRAINT FK_Id_tipousuariomatriz FOREIGN KEY (id_tipousuario) 
		REFERENCES TiposUsuarios (id_tipousuario) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT FK_Id_vista FOREIGN KEY (id_vista) 
		REFERENCES Vistas (id_vista) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ***************************************************************************************************
-- CREAR TABLAS DE GRUPOS

-- TABLA # 9
CREATE TABLE TiposGrupos
(
	id_tipogrupo int AUTO_INCREMENT PRIMARY KEY NOT NULL,
	tipo_grupo varchar(30) NOT NULL UNIQUE -- danza, manualidades, etc.
);

-- TABLA # 10
CREATE TABLE Grupos
(
	id_grupo int AUTO_INCREMENT PRIMARY KEY NOT NULL,
	nombre_grupo varchar(100) NOT NULL,
    id_tipogrupo int ,
    CONSTRAINT FK_Id_GrupoTipoGrupo FOREIGN KEY (id_tipogrupo) 
		REFERENCES TiposGrupos (id_tipogrupo) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
);

-- TABLA # 11
CREATE TABLE EstatusGrupos
(
	id_estatusgrupo int AUTO_INCREMENT PRIMARY KEY NOT NULL,
	estatus_grupo varchar(20) NOT NULL UNIQUE-- vigente, suspendido, cancelado, etc.
);

-- TABLA # 12
CREATE TABLE Periodos
(
	id_periodo int AUTO_INCREMENT PRIMARY KEY NOT NULL,
	periodo varchar(100) NOT NULL, -- nombre del período, ej (enero junio 2025)
    fecha_inicio date,
    fecha_fin date
);

-- TABLA # 13
CREATE TABLE PeriodosGrupos
(
	id_periodogrupo int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    id_grupo int ,
    id_periodo int ,
    id_estatus_grupo int NOT  NULL ,
    id_responsable_grupo int NOT NULL ,
    CONSTRAINT FK_Id_PeriodoGrupo FOREIGN KEY (id_grupo) 
		REFERENCES Grupos (id_grupo) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_Id_PeriodoPeriodo FOREIGN KEY (id_periodo) 
		REFERENCES Periodos (id_periodo) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_Id_PeriodoGrupoEstatus FOREIGN KEY (id_estatus_grupo) 
		REFERENCES EstatusGrupos (id_estatusgrupo) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_Id_PeriodoResponsableGrupo FOREIGN KEY (id_responsable_grupo) 
		REFERENCES Usuarios (id_usuario) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
);

-- TABLA # 14
CREATE TABLE InscripcionesGrupos
(
	id_inscripciongrupo int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    id_periodo_grupo int NOT NULL,
    id_usuario_inscrito int NOT NULL,
	CONSTRAINT FK_Id_InscripcionPeriodoGrupo FOREIGN KEY (id_periodo_grupo) 
		REFERENCES PeriodosGrupos (id_periodogrupo) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT FK_Id_IncripcionUsuario FOREIGN KEY (id_usuario_inscrito) 
		REFERENCES Usuarios (id_usuario) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ***************************************************************************************************
-- CREAR TABLAS DE ENCUESTAS

-- TABLA # 15
CREATE TABLE TiposEncuestas
(
	id_tipoencuesta int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    tipo_encuesta varchar(30) NOT NULL -- psicológica, médica, terapeútica, etc
);

-- TABLA # 16
CREATE TABLE EstatusEncuestasPreguntasRespuestas
(
	id_estatusencpregresp int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    estatus_enc_preg_resp varchar(30) NOT NULL -- vigente, suspendida, cancelada, etc.
);

-- TABLA # 17   agregue "activa 1 o 0" para poderla desactivar 
CREATE TABLE Encuestas
(
	id_encuesta int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    nombre_encuesta varchar(500) NOT NULL,
    id_tipo_encuesta int NOT NULL,
    id_estatus_enc_preg_resp int NOT NULL,
    -- activa boolean default 0,
    CONSTRAINT FK_Id_EncuestaTipoEncuesta FOREIGN KEY (id_tipo_encuesta) 
		REFERENCES TiposEncuestas (id_tipoencuesta) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_Id_EstatusEncuestaPreguntaRespuestaEncuesta FOREIGN KEY (id_estatus_enc_preg_resp) 
		REFERENCES EstatusEncuestasPreguntasRespuestas (id_estatusencpregresp) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
);

-- TABLA # 18
CREATE TABLE Preguntas
(
	id_pregunta int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    pregunta varchar(500) NOT NULL,
    id_estatus_enc_preg_resp int NOT NULL,
    CONSTRAINT FK_Id_EstatusEncuestaPreguntaRespuestaPregunta FOREIGN KEY (id_estatus_enc_preg_resp) 
		REFERENCES EstatusEncuestasPreguntasRespuestas (id_estatusencpregresp) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
);

-- TABLA # 19
CREATE TABLE Respuestas
(
	id_respuesta int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    respuesta varchar(500) NOT NULL,
    valor int NOT NULL,
    id_estatus_enc_preg_resp int NOT NULL,
    CONSTRAINT FK_Id_EstatusEncuestaPreguntaRespuesta FOREIGN KEY (id_estatus_enc_preg_resp) 
		REFERENCES EstatusEncuestasPreguntasRespuestas (id_estatusencpregresp) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
);

-- TABLA # 20
CREATE TABLE EncuestasPreguntasRespuestas
(
	id_encuesta_pregunta_respuesta int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    id_encuesta int NOT NULL,
    id_pregunta int NOT NULL,
    id_respuesta int NOT NULL,
    CONSTRAINT FK_Id_EncuestaPreguntaRespuestaEncuesta FOREIGN KEY (id_encuesta) 
		REFERENCES Encuestas (id_encuesta) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT FK_Id_EncuestaPreguntaRespuestaPregunta FOREIGN KEY (id_pregunta) 
		REFERENCES Preguntas (id_pregunta) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_Id_EncuestaPreguntaRespuestaRespuesta FOREIGN KEY (id_respuesta) 
		REFERENCES Respuestas (id_respuesta) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
);

-- TABLA # 21
CREATE TABLE UsuariosEncuestas
(
	-- la elaboración de la encuesta por parte de los usuarios se permite una vez cada seis meses
    -- la encuesta resuelta parcialmente no se almacena en el sistema y no se considera como realizada
    -- la encuesta resuelta en su totalidad y enviada al INAPAM se considera como realizada y no se puede alterar ni eliminar
	id_usuario_encuesta int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    id_usuario int NOT NULL,
    fecha_elaboracion_encuesta date,
    CONSTRAINT FK_Id_UsuariosEncuestasUsuairos FOREIGN KEY (id_usuario) 
		REFERENCES Usuarios (id_usuario) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
);

-- TABLA # 22
CREATE TABLE DetalleUsuariosEncuestas
(
	-- la elaboración de la encuesta por parte de los usuarios se permite una vez cada seis meses
    -- la encuesta resuelta parcialmente no se almacena en el sistema y no se considera como realizada
    -- la encuesta resuelta en su totalidad y enviada al INAPAM se considera como realizada y no se puede alterar ni eliminar
	
    id_detalle_usuario_encuesta int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    id_usuario_encuesta int NOT NULL,
    id_encuesta_pregunta_respuesta int NOT NULL,
    valor_seleccionado int NOT NULL,
    CONSTRAINT FK_Id_UsuariosEncuestasDetalles FOREIGN KEY (id_usuario_encuesta) 
		REFERENCES UsuariosEncuestas (id_usuario_encuesta) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT FK_Id_EncuestasPreguntasRespuestasDetalles FOREIGN KEY (id_encuesta_pregunta_respuesta) 
		REFERENCES EncuestasPreguntasRespuestas (id_encuesta_pregunta_respuesta) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
);

-- TABLA # 23
CREATE TABLE InterpretacionResultados
(
	-- los resultados almacenados en la entidad son:
	-- de la encuesta psicologica los siguientes datos:
    -- puntuacion = 5 (nombre_resultado = LEVE)
    -- puntuacion = 10 (nombre_resultado = MODERADO)
    -- puntuacion = 15 (nombre_resultado = MODERADO-LEVE)
    -- puntuacion = 20 (nombre_resultado = GRAVE)
    -- si la pregunta 9 de esta encuesta fue contestada por el usuario se debe dar Asistencia Inmediata
    
	id_interpreta_resultado int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    id_encuesta int NOT NULL,
    puntuacion int NOT NULL,
    nombre_resultado varchar(500) NOT NULL,
    CONSTRAINT FK_Id_InterpretacionResultadoEncuesta FOREIGN KEY (id_encuesta) 
		REFERENCES Encuestas (id_encuesta) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ***************************************************************************************************
-- CREAR TABLAS DE PROVEEDORES


-- TABLA # 24
CREATE TABLE TiposServiciosProveedores
(
	id_tiposervicioproveedor int AUTO_INCREMENT PRIMARY KEY NOT NULL,
	tipo_servicio_proveedor varchar(500)
);

-- TABLA # 25
CREATE TABLE ServiciosProveedores
(
	id_servicioproveedor int AUTO_INCREMENT PRIMARY KEY NOT NULL,
	servicio_proveedor varchar(500),
    id_tipo_servicio int NOT NULL,
    CONSTRAINT FK_Id_TipoServicio FOREIGN KEY (id_tipo_servicio) 
		REFERENCES TiposServiciosProveedores (id_tiposervicioproveedor) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
);

-- TABLA # 26
CREATE TABLE ProveedoresConServicios
(
	id_proveedorconservicio int AUTO_INCREMENT PRIMARY KEY NOT NULL,
	id_usuario int NOT NULL,
    id_servicio_proveedor int NOT NULL,
    CONSTRAINT FK_Id_ProveedorServicio FOREIGN KEY (id_usuario) 
		REFERENCES Usuarios (id_usuario) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT FK_Id_ServicioProveedor FOREIGN KEY (id_servicio_proveedor) 
		REFERENCES ServiciosProveedores (id_servicioproveedor) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
);

-- TABLA # 27
CREATE TABLE EstatusPublicaciones
(
	id_estatuspublicacion int AUTO_INCREMENT PRIMARY KEY NOT NULL,
	estatus_publicacion varchar(20) -- vigente, suspendida, cancelada, etc.
);

-- TABLA # 28
CREATE TABLE Publicaciones
(
	id_publicacion int AUTO_INCREMENT PRIMARY KEY NOT NULL,
	id_proveedorconservicio int NOT NULL,
    imagen varchar(800) NOT NULL,
    fecha_registro_publicacion date,
    fecha_inicio_publicacion date,
    fecha_fin_publicacion date,
    id_estatus_publicacion int NOT NULL,
    CONSTRAINT FK_Id_ProveedorConServicio FOREIGN KEY (id_proveedorconservicio) 
		REFERENCES ProveedoresConServicios (id_proveedorconservicio) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT FK_Id_EstatusPublicacion FOREIGN KEY (id_estatus_publicacion) 
		REFERENCES EstatusPublicaciones (id_estatuspublicacion) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
);


-- ***************************************************************************************************
-- CREAR INDICES DE PERSONAS

CREATE INDEX Idx_Genero ON Generos (id_genero);
CREATE INDEX Idx_Estado ON Estados (id_estado);
CREATE INDEX Idx_Municipio ON Municipios (id_municipio);
CREATE INDEX Idx_EstatusMarital ON EstatusMaritales (id_estatusmarital);
CREATE INDEX Idx_EstatusUsuario ON EstatusUsuarios (id_estatususuario);
CREATE INDEX Idx_CategoriaVivienda ON CategoriasViviendas (id_categoriavivienda);
CREATE INDEX Idx_TipoUsuario ON TiposUsuarios (id_tipousuario);
CREATE INDEX Idx_Usuario ON Usuarios (id_usuario, id_tipousuario, nombre, ap_paterno, ap_materno, telefono_personal);

-- ***************************************************************************************************
-- CREAR INDICES DE MATRIZ DE ACCESO
CREATE INDEX Idx_Vista ON Vistas (id_vista);
CREATE INDEX Idx_MatrizAcceso ON MatrizAccesos (id_matrizacceso);

-- ***************************************************************************************************
-- CREAR INDICES DE GRUPOS
CREATE INDEX Idx_TipoGrupo ON TiposGrupos (id_tipogrupo);
CREATE INDEX Idx_Grupo ON Grupos (id_grupo);
CREATE INDEX Idx_EstatusGrupo ON EstatusGrupos (id_estatusgrupo);
CREATE INDEX Idx_Periodo ON Periodos (id_periodo);
CREATE INDEX Idx_PeriodoGrupo ON PeriodosGrupos (id_periodogrupo, id_grupo, id_periodo);
CREATE INDEX Idx_InscripcionGrupo ON InscripcionesGrupos (id_inscripciongrupo, id_periodo_grupo, id_usuario_inscrito);

-- ***************************************************************************************************
-- CREAR INDICES DE ENCUESTAS

CREATE INDEX Idx_TipoEncuesta ON TiposEncuestas (id_tipoencuesta);
CREATE INDEX Idx_EstatusEncuestaPreguntaRespuesta ON EstatusEncuestasPreguntasRespuestas (id_estatusencpregresp);
CREATE INDEX Idx_Encuesta ON Encuestas (id_encuesta);
CREATE INDEX Idx_Pregunta ON Preguntas (id_pregunta);
CREATE INDEX Idx_Respuesta ON Respuestas (id_respuesta);
CREATE INDEX Idx_EncuestaPreguntaRespuesta ON EncuestasPreguntasRespuestas (id_encuesta_pregunta_respuesta, id_encuesta, id_pregunta, id_respuesta);
CREATE INDEX Idx_UsuarioEncuesta ON UsuariosEncuestas (id_usuario_encuesta, id_usuario);
CREATE INDEX Idx_DetalleUsuarioEncuesta ON DetalleUsuariosEncuestas (id_detalle_usuario_encuesta, id_usuario_encuesta, id_encuesta_pregunta_respuesta);
CREATE INDEX Idx_InterpretaResultado ON InterpretacionResultados (id_interpreta_resultado, id_encuesta);

-- ***************************************************************************************************
-- CREAR INDICES DE PROVEEDORES

CREATE INDEX Idx_TipoServicioProveedor ON TiposServiciosProveedores (id_tiposervicioproveedor);
CREATE INDEX Idx_ServicioProveedor ON ServiciosProveedores (id_servicioproveedor);
CREATE INDEX Idx_ProveedorConServicio ON ProveedoresConServicios (id_proveedorconservicio);
CREATE INDEX Idx_EstatusPublicacion ON EstatusPublicaciones (id_estatuspublicacion);
CREATE INDEX Idx_Publicacion ON Publicaciones (id_publicacion, id_proveedorconservicio);



-- ***************************************************************************************************
-- INSERTS

USE amigo;
SELECT * FROM generos;
SELECT * FROM tiposusuarios;
SELECT * FROM estatususuarios;
SELECT * FROM categoriasviviendas;
SELECT * FROM estados;
SELECT * FROM municipios;
SELECT * FROM usuarios;
SELECT * FROM Vistas;
SELECT * FROM MatrizAccesos;

-- BORRAR TABLA USUARIOS
USE amigo;
TRUNCATE generos;
TRUNCATE tiposusuarios;
TRUNCATE estatususuarios;
TRUNCATE categoriasviviendas;
TRUNCATE estados;
TRUNCATE municipios;
TRUNCATE usuarios;
TRUNCATE Vistas;
TRUNCATE MatrizAccesos;

-- REINICIAR AUTOINCREMENTABLE
USE amigo;
ALTER TABLE generos AUTO_INCREMENT = 1;
ALTER TABLE tiposusuarios AUTO_INCREMENT = 1;
ALTER TABLE estatususuarios AUTO_INCREMENT = 1;
ALTER TABLE categoriasviviendas AUTO_INCREMENT = 1;
ALTER TABLE estados AUTO_INCREMENT = 1;
ALTER TABLE municipios AUTO_INCREMENT = 1;
ALTER TABLE usuarios AUTO_INCREMENT = 1;
ALTER TABLE vistas AUTO_INCREMENT = 1;
ALTER TABLE matrizaccesos AUTO_INCREMENT = 1;

-- INSERT INTO table_name (column1, column2, column3) VALUES (value1, value2, value3);
-- INSERTAR ESTATUS MARITAL soltero/a, casado/a, viudo/a, divorciado/a, separado/a, 
USE amigo;
insert into estatusmaritales (estatus_marital) values ('soltero/a');
insert into estatusmaritales (estatus_marital) values ('casado/a');
insert into estatusmaritales (estatus_marital) values ('divorciado/a');
insert into estatusmaritales (estatus_marital) values ('separado/a');
insert into estatusmaritales (estatus_marital) values ('viudo/a');


-- INSERTAR GENEROS
USE amigo;
insert into generos (genero) values ('masculino');
insert into generos (genero) values ('femenino');


-- INSERTAR TIPOS USUARIOS
USE amigo;
insert into tiposusuarios (tipo_usuario) values ('administrador/a');
insert into tiposusuarios (tipo_usuario) values ('asesor/a');
insert into tiposusuarios (tipo_usuario) values ('usuario/a');
insert into tiposusuarios (tipo_usuario) values ('proveedor/a');


-- INSERTAR ESTATUS DE USUARIOS
USE amigo;
insert into estatususuarios (estatus_usuario) values ('pendiente');
insert into estatususuarios (estatus_usuario) values ('activo');
insert into estatususuarios (estatus_usuario) values ('inactivo');
insert into estatususuarios (estatus_usuario) values ('suspendido');
insert into estatususuarios (estatus_usuario) values ('eliminado');


-- INSERTAR CATEGORIAS DE VIVIENDAS
USE amigo;
insert into categoriasviviendas (categoria_vivienda) values ('propia');
insert into categoriasviviendas (categoria_vivienda) values ('prestada');
insert into categoriasviviendas (categoria_vivienda) values ('rentada');


-- INSERTAR ESTADOS
-- IMPORTAR DATOS DEL ARCHIVO catalogo_entidades.csv
-- O MANUALMENTE
USE amigo;
insert into estados (estado) values ('aguascalientes');
insert into estados (estado) values ('baja california');
insert into estados (estado) values ('baja california sur');
insert into estados (estado) values ('campeche');
insert into estados (estado) values ('coahuila');
insert into estados (estado) values ('colima');
insert into estados (estado) values ('chiapas');
insert into estados (estado) values ('chihuahua');
insert into estados (estado) values ('ciudad de mexico');
insert into estados (estado) values ('durango');
insert into estados (estado) values ('guanajuato');
insert into estados (estado) values ('guerrero');
insert into estados (estado) values ('hidalgo');
insert into estados (estado) values ('jalisco');
insert into estados (estado) values ('mexico');
insert into estados (estado) values ('michoacan');
insert into estados (estado) values ('morelos');
insert into estados (estado) values ('nayarit');
insert into estados (estado) values ('nuevo leon');
insert into estados (estado) values ('oaxaca');
insert into estados (estado) values ('puebla');
insert into estados (estado) values ('queretaro');
insert into estados (estado) values ('quintana roo');
insert into estados (estado) values ('san luis potosi');
insert into estados (estado) values ('sinaloa');
insert into estados (estado) values ('sonora');
insert into estados (estado) values ('tabasco');
insert into estados (estado) values ('tamaulipas');
insert into estados (estado) values ('tlaxcala');
insert into estados (estado) values ('veracruz');
insert into estados (estado) values ('yucatan');
insert into estados (estado) values ('zacatecas');


-- INSERTAR MUNICIPIOS
-- IMPORTAR DATOS DEL ARCHIVO CAT_ENT_MUN_POB_ENOE 062021.csv


-- SELECT DATE('2003-12-31 01:02:03');
-- INSERTAR USUARIOS
USE amigo;
INSERT INTO usuarios (
	id_tipousuario, nombre, ap_paterno, ap_materno, fecha_nacimiento, telefono_personal, telefono_contacto, email, codigo,
    id_estado, id_municipio, colonia, calle, numero_int, numero_ext, codigo_postal, razon_social, rfc, fecha_registro,
    id_genero, id_estatus_usuario, id_estatus_marital, id_categoria_vivienda
    ) VALUES (1, 'cesar', 'amador', 'sanchez', '1972-04-30', '3123201211', '3123201211', 'cesar.amador@outlook.com', '123456',
				6, 1, 'colonia', 'calle', '38', '1', '28000', 'ninguno', 'rfc_1', '2025-10-13',
                1, 1, 1, 1);
INSERT INTO usuarios (
	id_tipousuario, nombre, ap_paterno, ap_materno, fecha_nacimiento, telefono_personal, telefono_contacto, email, codigo,
    id_estado, id_municipio, colonia, calle, numero_int, numero_ext, codigo_postal, razon_social, rfc, fecha_registro,
    id_genero, id_estatus_usuario, id_estatus_marital, id_categoria_vivienda
    ) VALUES (2, 'maria', 'aguilar', 'perez', '1972-04-30', '3123201212', '3123201211', 'cesar@outlook.com', '123456',
				6, 2, 'colonia', 'calle', '38', '1', '28000', 'ninguno', 'rfc_2', '2025-10-13',
                1, 1, 1, 1);
INSERT INTO usuarios (
	id_tipousuario, nombre, ap_paterno, ap_materno, fecha_nacimiento, telefono_personal, telefono_contacto, email, codigo,
    id_estado, id_municipio, colonia, calle, numero_int, numero_ext, codigo_postal, razon_social, rfc, fecha_registro,
    id_genero, id_estatus_usuario, id_estatus_marital, id_categoria_vivienda
    ) VALUES (3, 'don omar', 'machuca', 'topete', '1972-04-30', '3123201213', '3123201211', 'amador@outlook.com', '123456',
				6, 3, 'colonia', 'calle', '38', '1', '28000', 'ninguno', 'rfc_3', '2025-10-13',
                1, 1, 1, 1);
INSERT INTO usuarios (
	id_tipousuario, nombre, ap_paterno, ap_materno, fecha_nacimiento, telefono_personal, telefono_contacto, email, codigo,
    id_estado, id_municipio, colonia, calle, numero_int, numero_ext, codigo_postal, razon_social, rfc, fecha_registro,
    id_genero, id_estatus_usuario, id_estatus_marital, id_categoria_vivienda
    ) VALUES (4, 'claudia', 'zamora', 'rodriguez', '1972-04-30', '3123201214', '3123201211', 'sanchez@outlook.com', '123456',
				6, 4, 'colonia', 'calle', '38', '1', '28000', 'ninguno', 'rfc_4', '2025-10-13',
                1, 1, 1, 1);

-- INSERTAR VISTAS
USE amigo;
insert into vistas (vista) values ('vista_1');
insert into vistas (vista) values ('vista_2');
insert into vistas (vista) values ('vista_3');

-- INSERTAR MATRIZ DE ACCESOS
USE amigo;
insert into matrizaccesos (id_tipousuario, id_vista, estatus) values (1, 1, 1);
insert into matrizaccesos (id_tipousuario, id_vista, estatus) values (1, 2, 1);
insert into matrizaccesos (id_tipousuario, id_vista, estatus) values (1, 3, 1);