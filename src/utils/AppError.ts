class AppError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

class PaymentError extends AppError {
    constructor(message: string, statusCode: number = 500) {
        super(message, statusCode);
    }
}

class UserUpdateError extends AppError {
    constructor(message: string, statusCode: number = 500) {
        super(message, statusCode);
    }
}
