// Utilidad para formatear nombres de clientes de manera consistente en la aplicación
// Agrega el correo electrónico para evitar confusiones con nombres duplicados

export const formatClientName = (client: any): string => {
  if (client.firstName && client.lastName) {
    return `${client.firstName} ${client.lastName} – ${client.email || client.username}`;
  } else {
    return `${client.username || ''} – ${client.email || ''}`;
  }
};