
class ApiErrors extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message); // Call the parent Error constructor with the message
        this.statusCode = statusCode;
        this.data = null;
        this.message = message; // Ensure message is set, though super(message) already handles it
        this.success = false; // Note: You had 'this.sucess', corrected to 'this.success'
        this.errors = errors;

        // Correct way to capture stack trace
        if (stack) {
            this.stack = stack;
        } else {
            
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiErrors };