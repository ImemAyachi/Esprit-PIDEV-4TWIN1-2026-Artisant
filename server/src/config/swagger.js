/**
 * Configuration Swagger / OpenAPI 3.0
 * Documentation interactive accessible sur /api-docs
 */
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BuildMarket API',
      version: '1.0.0',
      description: 'API REST pour la plateforme marketplace BTP — Architectes, Artisans, Fournisseurs',
      contact: {
        name: 'BuildMarket Team',
      },
    },
    servers: [
      { url: 'http://localhost:5000/api', description: 'Serveur local' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Scan tous les fichiers routes pour les annotations JSDoc
  apis: ['./src/routes/*.js', './src/models/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'BuildMarket API Docs',
    customCss: '.swagger-ui .topbar { background-color: #1e293b; }',
  }));

  // Endpoint JSON de la spec (utile pour Postman)
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
