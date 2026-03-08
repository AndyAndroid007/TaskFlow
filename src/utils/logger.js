const winston = require('winston');
require('winston-daily-rotate-file');

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Custom format for development console output
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

// Determine log level based on environment
const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// Daily rotating file transport for combined logs
const combinedRotateTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: level,
});

// Daily rotating file transport for error logs
const errorRotateTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
});

// Console transport — colorized in dev, JSON in production
const consoleTransport = new winston.transports.Console({
    format: process.env.NODE_ENV === 'production'
        ? combine(timestamp(), json())
        : combine(
            colorize(),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            errors({ stack: true }),
            devFormat
        ),
});

const logger = winston.createLogger({
    level: level,
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        json()
    ),
    defaultMeta: { service: 'mern-demo-app' },
    transports: [
        consoleTransport,
        combinedRotateTransport,
        errorRotateTransport,
    ],
});

module.exports = logger;