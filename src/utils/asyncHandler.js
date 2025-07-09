//this is use for promises .then and .catch method
const asyncHandler=(requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((error)=>next(error))
    }
}
    
export {asyncHandler}



//this is use for async try catch method
// const asyncHandler=(fn)=>async(req,res,next)=>{
//     try {
//         await fn (req,res,next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             sucess:false,
//             message:error.message
//         })
//     }
// }
