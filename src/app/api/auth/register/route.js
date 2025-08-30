import { registerUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }
    
    const user = registerUser(email, password);
    return Response.json({ user }, { status: 201 });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}