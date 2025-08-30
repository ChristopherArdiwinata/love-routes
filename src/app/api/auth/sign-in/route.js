import { signInUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }
    
    const user = signInUser(email, password);
    return Response.json({ user }, { status: 200 });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 401 });
  }
}