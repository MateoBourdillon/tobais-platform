/**
 * Ejecutor de funciones administrativas
 */
import { createMatoroInvoices } from './invoice-manager';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    console.log('TOBAIS Admin Manager - Ejecutando comando:', command);
    
    switch (command) {
      case 'create-matoro-invoices':
        console.log('Creando facturas para Matoro Bridge Platform...');
        const result = await createMatoroInvoices();
        console.log('Resultado:', JSON.stringify(result, null, 2));
        break;
        
      default:
        console.log('Comando no reconocido. Comandos disponibles:');
        console.log('- create-matoro-invoices: Crea facturas para el proyecto Matoro Bridge Platform');
    }
  } catch (error) {
    console.error('Error al ejecutar el comando:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
main()
  .then(() => {
    console.log('Comando ejecutado exitosamente.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error al ejecutar el comando:', err);
    process.exit(1);
  });