
class ApiResponse{
    constructor(statusCode,data,message="Sucess"){
        this.statusCode=statusCode
        this.data=data
        this.message=message
        this.Sucess=this.Sucess < 404 
    }
}

export {ApiResponse}