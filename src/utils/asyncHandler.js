const asyncHandler = (reqHandler) => {
  return (req, res, next) => {
    Promise.resolve(reqHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// for understanding.
// above code's working but with async, try/catch
// function asyncHandler(func) {
//     return async function (req, res, next  ) {
//         try {
//             await func(req, res,next)
//         } catch (error) {
              // console.log(error.message)
              // res.status(error.code || 500).json({
              //   success: false,
              //   message: error.message
              // })
//         }
//     }
// }