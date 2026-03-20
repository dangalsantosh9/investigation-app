import 'reflect-metadata';
import { DataSource } from 'typeorm';

const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_NAME'] as const;

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    throw new Error(
      `${varName} is missing. Add it to your .env file.\n` +
        'Required variables: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME\n' +
        'See the Environment_Variables-Setup file on canvas for setup instructions.',
    );
  }
}

export const AppDataSource = new DataSource({
  synchronize: true,
  logging: false,
  entities: ['dist/entities/*.js'],
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME,
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database Connected');
  } catch (error) {
    console.error('Database Connection failed:', error);
  }
};
