// Writing two types of async handlers one with try catch and the other with the promises
// const asyncHandler = (fn) => {
//     return async (req, res, next) => {
//         try {
//             await fn(req, res, next); // tumhara original async function
//         } catch (error) {
//             res.status(error.status || 500).json({
//                 success: false,
//                 message: error.message || "Internal Server Error",
//             });
//         }
//     };
// };

// export { asyncHandler };

// Promise based async handler 
const promiseAsyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
               .catch(next); // agar error aaye to Express error handler me bhej do
    };
};

export { promiseAsyncHandler }