import 'dotenv/config';
import { DataSource } from 'typeorm';

// =================== CONFIGURACIÓN DE DATASOURCE ==================
export const AppDataSource = new DataSource({
  type: 'postgres', 
  host: process.env.DB_HOST,         
  port: parseInt(process.env.DB_PORT!), 
  username: process.env.DB_USER,     
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME,     

  entities: [__dirname + '/**/*.entity{.ts,.js}'], // Rutas de entidades
  synchronize: true, // Sincroniza entidades automáticamente
});
