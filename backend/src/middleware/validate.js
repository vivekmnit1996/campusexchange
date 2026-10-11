import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['STUDENT', 'BUYER', 'SELLER', 'ADMIN']).optional().default('STUDENT'),
  college: z.string().trim().optional(),
  branch: z.string().trim().optional(),
  year: z.string().trim().optional(),
  hostel: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const productSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().trim().min(5, 'Description must be at least 5 characters'),
  category: z.string().trim().min(2, 'Category is required'),
  price: z.coerce.number().min(0, 'Price must be greater than or equal to 0'),
  quantity: z.coerce.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1').optional().default(1),
  condition: z.enum(['New', 'Like New', 'Good', 'Fair']).optional().default('Good'),
  image: z.string().trim().optional(),
  images: z.array(z.string()).optional(),
  imagePublicId: z.string().trim().optional(),
  pickupLocation: z.string().trim().optional().default('Campus Hostel Gate'),
  reasonForSelling: z.string().trim().optional().default('Graduating'),
});

export const productUpdateSchema = productSchema.partial().extend({
  status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD']).optional(),
  quantity: z.coerce.number().int('Quantity must be an integer').min(0, 'Quantity cannot be negative').optional(),
});

export const purchaseRequestSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
  quantity: z.coerce.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1').optional().default(1),
  notes: z.string().trim().max(300).optional().default(''),
  pickupLocation: z.string().trim().optional().default('Campus Hostel Gate'),
});

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errorMsg = err.errors.map((e) => e.message).join('. ');
        return res.status(400).json({
          success: false,
          message: errorMsg,
          errors: err.errors,
        });
      }
      next(err);
    }
  };
};
