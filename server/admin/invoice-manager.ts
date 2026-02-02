import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { format } from "date-fns";
import { sendInvoiceEmail } from "../email";

// Schema para validar la creación de facturas
const createInvoiceSchema = z.object({
  userId: z.number(),
  projectId: z.number().optional(),
  number: z.string().min(3),
  status: z.enum(["pending", "paid", "cancelled", "overdue"]).default("pending"),
  issueDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()),
  amount: z.number().min(0),
  tax: z.number().default(0),
  discount: z.number().default(0),
  total: z.number().min(0),
  notes: z.string().optional(),
  paymentMethod: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0),
    amount: z.number().min(0)
  }))
});

// Schema para validar actualizaciones de facturas
const updateInvoiceSchema = createInvoiceSchema.partial();

/**
 * Genera un número de factura único basado en el año actual, mes y un contador
 */
async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Obtener el último número de factura generado para este mes/año
  const invoices = await storage.getInvoicesByPrefix(`INV-${year}${month}`);
  
  // Si no hay facturas para este mes, empezar desde 001
  if (!invoices || invoices.length === 0) {
    return `INV-${year}${month}-001`;
  }
  
  // De lo contrario, encontrar el número más alto y incrementarlo
  let maxNumber = 0;
  
  invoices.forEach(invoice => {
    const parts = invoice.number.split('-');
    if (parts.length === 3) {
      const num = parseInt(parts[2]);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  });
  
  const nextNumber = String(maxNumber + 1).padStart(3, '0');
  return `INV-${year}${month}-${nextNumber}`;
}

/**
 * Obtiene todas las facturas
 */
export async function getAllInvoices(req: Request, res: Response) {
  try {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  } catch (error: any) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ message: 'Error al obtener facturas' });
  }
}

/**
 * Obtiene una factura por ID
 */
export async function getInvoiceById(req: Request, res: Response) {
  try {
    const invoiceId = parseInt(req.params.id);
    
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: 'ID de factura no válido' });
    }
    
    const invoice = await storage.getInvoice(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    
    res.json(invoice);
  } catch (error: any) {
    console.error('Error al obtener factura:', error);
    res.status(500).json({ message: 'Error al obtener factura' });
  }
}

/**
 * Genera un número de factura único
 */
export async function generateInvoiceNumberHandler(_req: Request, res: Response) {
  try {
    const number = await generateInvoiceNumber();
    res.json({ number });
  } catch (error: any) {
    console.error('Error al generar número de factura:', error);
    res.status(500).json({ message: 'Error al generar número de factura' });
  }
}

/**
 * Crea una nueva factura
 */
export async function createInvoice(req: Request, res: Response) {
  try {
    const validatedData = createInvoiceSchema.parse(req.body);
    
    // Si no se proporcionó un número de factura, generarlo automáticamente
    if (!validatedData.number) {
      validatedData.number = await generateInvoiceNumber();
    }
    
    // Asegurarse de que las fechas estén en formato correcto
    const issueDate = new Date(validatedData.issueDate);
    const dueDate = new Date(validatedData.dueDate);
    
    // Crear la factura
    const invoice = await storage.createInvoice({
      ...validatedData,
      issueDate,
      dueDate,
      items: validatedData.items ? JSON.stringify(validatedData.items) : null
    });
    
    res.status(201).json(invoice);
  } catch (error: any) {
    console.error('Error al crear factura:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Datos de factura no válidos', 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: 'Error al crear factura' });
  }
}

/**
 * Actualiza una factura existente
 */
export async function updateInvoice(req: Request, res: Response) {
  try {
    const invoiceId = parseInt(req.params.id);
    
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: 'ID de factura no válido' });
    }
    
    const existingInvoice = await storage.getInvoice(invoiceId);
    
    if (!existingInvoice) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    
    const validatedData = updateInvoiceSchema.parse(req.body);
    
    // Procesar fechas si se proporcionaron
    if (validatedData.issueDate) {
      validatedData.issueDate = new Date(validatedData.issueDate);
    }
    
    if (validatedData.dueDate) {
      validatedData.dueDate = new Date(validatedData.dueDate);
    }
    
    // Procesar items si se proporcionaron
    if (validatedData.items) {
      validatedData.items = JSON.stringify(validatedData.items);
    }
    
    // Actualizar la factura
    const updatedInvoice = await storage.updateInvoice(invoiceId, validatedData);
    
    if (!updatedInvoice) {
      return res.status(500).json({ message: 'Error al actualizar factura' });
    }
    
    res.json(updatedInvoice);
  } catch (error: any) {
    console.error('Error al actualizar factura:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Datos de factura no válidos', 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: 'Error al actualizar factura' });
  }
}

/**
 * Marca una factura como pagada
 */
export async function markInvoiceAsPaid(req: Request, res: Response) {
  try {
    const invoiceId = parseInt(req.params.id);
    
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: 'ID de factura no válido' });
    }
    
    const { paymentMethod } = req.body;
    
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Se requiere método de pago' });
    }
    
    const invoice = await storage.markInvoiceAsPaid(invoiceId, paymentMethod);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    
    res.json(invoice);
  } catch (error: any) {
    console.error('Error al marcar factura como pagada:', error);
    res.status(500).json({ message: 'Error al marcar factura como pagada' });
  }
}

/**
 * Marca una factura como cancelada
 */
export async function markInvoiceAsCancelled(req: Request, res: Response) {
  try {
    const invoiceId = parseInt(req.params.id);
    
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: 'ID de factura no válido' });
    }
    
    const invoice = await storage.markInvoiceAsCancelled(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    
    res.json(invoice);
  } catch (error: any) {
    console.error('Error al cancelar factura:', error);
    res.status(500).json({ message: 'Error al cancelar factura' });
  }
}

/**
 * Marca una factura como vencida
 */
export async function markInvoiceAsOverdue(req: Request, res: Response) {
  try {
    const invoiceId = parseInt(req.params.id);
    
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: 'ID de factura no válido' });
    }
    
    const invoice = await storage.markInvoiceAsOverdue(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    
    res.json(invoice);
  } catch (error: any) {
    console.error('Error al marcar factura como vencida:', error);
    res.status(500).json({ message: 'Error al marcar factura como vencida' });
  }
}

/**
 * Envía una factura por email
 */
export async function sendInvoiceEmailHandler(req: Request, res: Response) {
  try {
    const invoiceId = parseInt(req.params.id);
    
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: 'ID de factura no válido' });
    }
    
    const invoice = await storage.getInvoice(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    
    // Obtener los datos del usuario
    const user = await storage.getUser(invoice.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Datos para el email
    const invoiceData = {
      to: user.email,
      clientName: user.fullName || user.firstName || user.username,
      invoiceNumber: invoice.number,
      amount: invoice.total / 100, // Convertir de centavos a dólares
      dueDate: new Date(invoice.dueDate),
      description: invoice.notes || `Factura #${invoice.number}`,
      paymentLink: `${req.protocol}://${req.get('host')}/dashboard/billing/${invoice.id}`
    };
    
    // Enviar el email
    const emailSent = await sendInvoiceEmail(invoiceData);
    
    if (!emailSent) {
      return res.status(500).json({ message: 'Error al enviar email' });
    }
    
    res.json({ success: true, message: 'Email enviado con éxito' });
  } catch (error: any) {
    console.error('Error al enviar email de factura:', error);
    res.status(500).json({ message: 'Error al enviar email de factura' });
  }
}

/**
 * Obtiene facturas por usuario
 */
export async function getInvoicesByUser(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'ID de usuario no válido' });
    }
    
    const invoices = await storage.getInvoices(userId);
    res.json(invoices);
  } catch (error: any) {
    console.error('Error al obtener facturas del usuario:', error);
    res.status(500).json({ message: 'Error al obtener facturas del usuario' });
  }
}

/**
 * Obtiene todos los usuarios para seleccionar en el formulario de facturas
 */
export async function getUsers(req: Request, res: Response) {
  try {
    const users = await storage.getUsers();
    
    // Filtrar solo los datos necesarios para evitar enviar contraseñas, etc.
    const filteredUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    }));
    
    res.json(filteredUsers);
  } catch (error: any) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
}

/**
 * Obtiene todos los proyectos para seleccionar en el formulario de facturas
 */
export async function getProjects(req: Request, res: Response) {
  try {
    const projects = await storage.getProjects();
    res.json(projects);
  } catch (error: any) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ message: 'Error al obtener proyectos' });
  }
}

/**
 * Registra las rutas relacionadas con la gestión de facturas
 */
export function registerInvoiceManagementRoutes(router: any) {
  // Rutas de gestión de facturas
  router.get('/invoices', getAllInvoices);
  router.post('/invoices', createInvoice);
  router.get('/invoices/generate-number', generateInvoiceNumberHandler);
  router.get('/invoices/:id', getInvoiceById);
  router.put('/invoices/:id', updateInvoice);
  router.put('/invoices/:id/mark-as-paid', markInvoiceAsPaid);
  router.put('/invoices/:id/mark-as-cancelled', markInvoiceAsCancelled);
  router.put('/invoices/:id/mark-as-overdue', markInvoiceAsOverdue);
  router.post('/invoices/:id/send-email', sendInvoiceEmailHandler);
  router.get('/invoices/user/:userId', getInvoicesByUser);
  
  // Rutas auxiliares para el formulario de facturas
  router.get('/users', getUsers);
  router.get('/projects', getProjects);
}