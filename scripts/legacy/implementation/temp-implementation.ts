// Función getInvoicesByPrefix para PostgresStorage
async getInvoicesByPrefix(prefix: string): Promise<Invoice[]> {
  try {
    console.log("PostgresStorage.getInvoicesByPrefix called with prefix:", prefix);
    
    // Direct SQL query to find invoices with number starting with the given prefix
    const sqlQuery = `
      SELECT 
        id, user_id, project_id, number, status, 
        issue_date, due_date, amount, tax, discount, total, notes, payment_method, 
        payment_date, stripe_invoice_id, stripe_payment_intent_id, 
        paypal_order_id, items, metadata, created_at, updated_at
      FROM invoices
      WHERE number LIKE $1
      ORDER BY number DESC
    `;
    
    const params = [`${prefix}%`];
    
    // Execute the query
    const result = await this.pool.query(sqlQuery, params);
    
    // Map the results to the expected format
    const invoices = result.rows.map(row => this.dbRowToInvoice(row));
    
    return invoices;
  } catch (error) {
    console.error("Error in PostgresStorage.getInvoicesByPrefix:", error);
    return [];
  }
}