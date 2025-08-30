import { updateUserInterests } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, interests } = await request.json();
    
    if (!email || !Array.isArray(interests)) {
      return Response.json({ error: 'Email and interests array required' }, { status: 400 });
    }
    
    if (!interests.every(interest => typeof interest === 'string')) {
      return Response.json({ error: 'All interests must be strings' }, { status: 400 });
    }
    
    const result = updateUserInterests(email, interests);
    return Response.json(result, { status: 200 });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}