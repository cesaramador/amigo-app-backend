export const gruposGet = async (req, res, next) => {
    try {
        // Simular una operación asíncrona, como obtener grupos de la base de datos
        await new Promise((resolve) => setTimeout(resolve, 100));    

        // logica para obtener los grupos
        res.send('Listado de grupos');
    } catch (error) {
        return next(error);
    }
}

export const gruposPost = async (req, res, next) => {
    try {
        // Simular una operación asíncrona, como crear un nuevo grupo en la base de datos
        await new Promise((resolve) => setTimeout(resolve, 100));    

        // logica para crear un nuevo grupo
        res.send('Group created');
    } catch (error) {
        return next(error);
    }
}

export const gruposPut = async (req, res, next) => {
    try {
        // Simular una operación asíncrona, como actualizar un grupo en la base de datos
        await new Promise((resolve) => setTimeout(resolve, 100));    

        // logica para actualizar un grupo
        res.send('Group updated');
    } catch (error) {
        return next(error);
    }
}

export const gruposDelete = async (req, res, next) => {
    try {
        // Simular una operación asíncrona, como eliminar un grupo de la base de datos
        await new Promise((resolve) => setTimeout(resolve, 100));    

        // logica para eliminar un grupo
        res.send('Group deleted');
    } catch (error) {
        return next(error);
    }
}

export const gruposPatch = async (req, res, next) => {
    try {
        // Simular una operación asíncrona, como aplicar cambios parciales a un grupo en la base de datos
        await new Promise((resolve) => setTimeout(resolve, 100));    

        // logica para aplicar cambios parciales a un grupo
        res.send('Group patched');
    } catch (error) {
        return next(error);
    }
}

