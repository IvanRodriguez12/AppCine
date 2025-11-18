import { RekognitionClient } from '@aws-sdk/client-rekognition';
import { S3Client } from '@aws-sdk/client-s3';

// Configuración de AWS usando variables de entorno
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
};

// Validar que las credenciales estén configuradas
if (!awsConfig.credentials.accessKeyId || !awsConfig.credentials.secretAccessKey) {
  console.warn('⚠️  AWS credentials not configured. Rekognition will not work.');
}

// Cliente de Rekognition
export const rekognitionClient = new RekognitionClient(awsConfig);

// Cliente de S3 (opcional, si quieres usar S3 en lugar de Firebase Storage)
export const s3Client = new S3Client(awsConfig);

console.log('✅ AWS Rekognition Client initialized');
console.log(`📍 Region: ${awsConfig.region}`);

export default rekognitionClient;