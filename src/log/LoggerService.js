import loggerService from 'winston';


class LoggerService {

  constructor(route) {
    this.log_data = null;
    this.route = route;
    this.logger = loggerService.createLogger({
     transports: [
       //new loggerService.transports.Console(),
       new loggerService.transports.File({
         filename: `/home/ubuntu/apilogs/${this.route}.log`
       })
     ],
       format: loggerService.format.printf((info) => {
         let message = new Date(Date.now()).toUTCString() + ` | ${info.level.toUpperCase()} | ${route}.log | ${info.message} | `;
         message = info.obj ? message + `data: ${JSON.stringify(info.obj)} | ` : message;
         //message = this.log_data ? message + `log_data: ${JSON.stringify(this.log_data)} | ` : message;
         return message
       })
      })
    }


    setLogData(log_data) {
      this.log_data = log_data
    }

    async info(message) {
        this.logger.log('info', message);
    }

    info(message, obj) {
        this.logger.log('info', message, {
          obj
        })
    }

    async error(message) {
        this.logger.log('error', message);
    }

    async error(message, obj) {
        this.logger.log('error', message, {
          obj
        })
    }
}

module.exports = LoggerService;

