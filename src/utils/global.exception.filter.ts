import { Catch, ExceptionFilter, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import * as moment from 'moment';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly loggerService: LoggerService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let responseError: string;
    if (exception.response && typeof exception.response.message === 'string') {
      responseError = exception.response.message;
    } else {
      responseError = 'Internal Server Error';
    }

    const devErrorResponse = {
        statusCode: status,
        timestamp: moment().toISOString(),
        path: request.url,
        method: request.method,
        errorName: exception?.name,
        stack: exception?.response?.message || null,
        message: responseError,
      };
      

    const prodErrorResponse = {
      statusCode: status,
      message: responseError,
    };

   // Log the exception using LoggerService
   this.loggerService.error(responseError, 'GlobalExceptionFilter', {
       method: request.method,
       path: request.url,
       errorName: exception?.name,
       statusCode: status,
       cause: exception?.response?.message || null,
  });
  

    response.status(status).json(process.env.NODE_ENV === 'development' ? devErrorResponse : prodErrorResponse);
  }
}
