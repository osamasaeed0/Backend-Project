// Writing two types of async handlers one with try catch and the other with the promises
// const asyncHandler = (fn) =>async (req,res,next)=>{
//     try { await fn(req,res,next)

        
//     } catch (error) {
//         res.status(error.status || 500).json({
//             success:false,
//             message:error.message || "Internal Server Error"
//         })

        
//     }
// }

// Promise based async handler 
const promiseAsyncHandler = (requestHandler) => {
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch(next)
    }
}
export {promiseAsyncHandler}