
class ApiError extends Error{
   constructor(
    statusCode,
    message="something went wrong",
    errors=[],
    stack=""
   ){
     super(message)
     this.data=null
     this.errors=errors
     this.sucess=false
     this.statusCode=statusCode
     this.message=message

     if (stack) {
        this.stack=stack
     }else{
        this.captureStackTrace(this,this.constructor)
     }
   }
}

export {ApiError}