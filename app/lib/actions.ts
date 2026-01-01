'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const sql = postgres(process.env.DATABASE_URL!, {ssl: 'require'});

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
      invalid_type_error: 'Customer is required',
    }),
    amount: z.coerce.number().gt(0, 'Amount must be greater than 0'),
    status: z.enum(['pending', 'paid'], {
      invalid_type_error: 'Status is required',
    }),
    date: z.string(),  
});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
}


const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
  // Simulate invoice creation logic
  const validatedFields = CreateInvoice.safeParse({ 
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date});`;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  // Simulate invoice update logic
  const { customerId, amount, status } = UpdateInvoice.parse({ 
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId},
          amount = ${amountInCents},
          status = ${status}
      WHERE id = ${id};`;
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  // Simulate invoice deletion logic
  throw new Error('Delete invoice issue');

  try {
    await sql`DELETE FROM invoices WHERE id = ${id};`;
  } catch (error) {
    console.log('Error deleting invoice', error);
    throw error;
  }
  revalidatePath('/dashboard/invoices');
}