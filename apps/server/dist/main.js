"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('API de El Pizarrón del DT')
        .setDescription('Documentación de la API para el backend del juego.')
        .setVersion('1.0')
        .build();
    const swaggerDocument = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api', app, swaggerDocument);
    const port = Number(process.env.PORT) || 3001;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 API disponible en http://localhost:${port}`);
    console.log(`📚 Swagger disponible en http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map