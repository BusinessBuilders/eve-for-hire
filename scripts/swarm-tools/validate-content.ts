import { SiteContentSchema } from '../../lib/site/content-generator';
import fs from 'fs';

async function main() {
  const [filePath] = process.argv.slice(2);
  if (!filePath) {
    console.error('Usage: tsx validate-content.ts <content.json>');
    process.exit(1);
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const result = SiteContentSchema.safeParse(raw);
    
    if (result.success) {
      console.log('✅ SiteContent is valid');
      process.exit(0);
    } else {
      console.error('❌ Validation failed:');
      console.error(JSON.stringify(result.error.format(), null, 2));
      process.exit(1);
    }
  } catch (err: any) {
    console.error('❌ Error reading or parsing JSON:', err.message);
    process.exit(1);
  }
}

main().catch(console.error);
