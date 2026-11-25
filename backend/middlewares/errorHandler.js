exports.errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    res.status(status).json({ message: status < 500 && err.expose ? err.message : 'The request could not be completed.' });
};