import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './app.config';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Learning Platform API',
            version: '1.0.0',
            description: 'A comprehensive learning platform API with authentication, courses, and quizzes',
            contact: {
                name: 'API Support',
                email: 'support@example.com',
            },
        },
        servers: [
            {
                url: `http://localhost:${config.PORT}${config.BASE_PATH}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'accessToken',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'User ID',
                        },
                        name: {
                            type: 'string',
                            description: 'User full name',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                        },
                        isEmailVerified: {
                            type: 'boolean',
                            description: 'Email verification status',
                        },
                        userPreferences: {
                            type: 'object',
                            properties: {
                                enable2FA: {
                                    type: 'boolean',
                                    description: '2FA enablement status',
                                },
                            },
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Session: {
                    type: 'object',
                    properties: {
                        userId: {
                            type: 'string',
                            description: 'User ID',
                        },
                        role: {
                            type: 'string',
                            description: 'User role',
                        },
                        name: {
                            type: 'string',
                            description: 'User name',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email',
                        },
                    },
                },
                Quiz: {
                    type: 'object',
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    question: {
                                        type: 'string',
                                        description: 'Quiz question',
                                    },
                                    options: {
                                        type: 'array',
                                        items: {
                                            type: 'string',
                                        },
                                        description: 'Multiple choice options',
                                    },
                                    answer: {
                                        type: 'string',
                                        description: 'Correct answer',
                                    },
                                },
                            },
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'Error message',
                        },
                        errorCode: {
                            type: 'string',
                            description: 'Error code',
                        },
                        statusCode: {
                            type: 'integer',
                            description: 'HTTP status code',
                        },
                    },
                },
                RegisterRequest: {
                    type: 'object',
                    required: ['name', 'email', 'password'],
                    properties: {
                        name: {
                            type: 'string',
                            description: 'User full name',
                            minLength: 2,
                            maxLength: 50,
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                        },
                        password: {
                            type: 'string',
                            description: 'User password',
                            minLength: 8,
                        },
                    },
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                        },
                        password: {
                            type: 'string',
                            description: 'User password',
                        },
                    },
                },
                VerifyEmailRequest: {
                    type: 'object',
                    required: ['code'],
                    properties: {
                        code: {
                            type: 'string',
                            description: 'Email verification code',
                        },
                    },
                },
                ForgotPasswordRequest: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                        },
                    },
                },
                ResetPasswordRequest: {
                    type: 'object',
                    required: ['password', 'verificationCode'],
                    properties: {
                        password: {
                            type: 'string',
                            description: 'New password',
                            minLength: 8,
                        },
                        verificationCode: {
                            type: 'string',
                            description: 'Password reset verification code',
                        },
                    },
                },
            },
        },
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication endpoints',
            },
            {
                name: 'User',
                description: 'User management endpoints',
            },
            {
                name: 'Quiz',
                description: 'Quiz management endpoints',
            },
        ],
    },
    apis: ['./src/modules/**/*.route.ts', './src/modules/**/*.controller.ts'], // Path to the API files
};

export const swaggerSpec = swaggerJsdoc(options);
