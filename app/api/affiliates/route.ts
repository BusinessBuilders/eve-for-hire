import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'affiliates.json');

interface AffiliateSignup {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

function loadSignups(): AffiliateSignup[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveSignups(signups: AffiliateSignup[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(signups, null, 2), 'utf-8');
}

export async function POST(req: NextRequest) {
  let name: string, email: string, role: string;
  try {
    const body = await req.json();
    name = (body.name ?? '').trim();
    email = (body.email ?? '').trim().toLowerCase();
    role = (body.role ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const signups = loadSignups();

  if (signups.some((s) => s.email === email)) {
    return NextResponse.json({ error: 'This email is already registered' }, { status: 409 });
  }

  const signup: AffiliateSignup = {
    id: crypto.randomUUID(),
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
  };

  signups.push(signup);
  saveSignups(signups);

  console.log(`[affiliates] New signup: ${name} <${email}>`);

  return NextResponse.json({ success: true });
}

export async function GET() {
  const signups = loadSignups();
  return NextResponse.json({ count: signups.length, signups });
}
