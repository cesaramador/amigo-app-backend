const errormiddleware = (err, req, res, next) => {
    try {
        let error = { ...err };
        error.message = err.message;
        console.log(err);

        // mysql duplicate key error
        if(err.code === 'ER_DUP_ENTRY') {
            const message = `Duplicate field value entered: ${err.sqlMessage.match(/'.*?'/)[0]}`;
            error = new Error(message);
            error.statusCode = 400;
        }
        // mysql cast error
        if(err.name === 'RequestError') {
            const message = `Resource not found. Invalid: ${err.path}`;
            error = new Error(message);
            error.statusCode = 400;

        }
        // validation error
        if(err.name === 'ValidationError') {
            const message = Object.values(err.errors).map(val => val.message).join(', ');
            error = new Error(message);
            error.statusCode = 400;
        }
        // wrong JWT error
        if(err.name === 'JsonWebTokenError') {
            const message = 'JSON Web Token is invalid. Try again';
            error = new Error(message);
            error.statusCode = 401;
        }
        // expired JWT error
        if(err.name === 'TokenExpiredError') {
            const message = 'JSON Web Token is expired. Try again';
            error = new Error(message);
            error.statusCode = 401;
        }
        // server error
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Server Error'
        })
        
    } catch (error) {
        next(error);
    }
  };    

  export default errormiddleware;


// 2xx Success codes, e.g., 200 OK or 201 Created
// 3xx Redirection codes, indicating that further action needs to be taken by the client
// 4xx Client error codes, e.g., 404 Not Found or 401 Unauthorized
// 5xx Server error codes, e.g., 500 Internal Server Error

