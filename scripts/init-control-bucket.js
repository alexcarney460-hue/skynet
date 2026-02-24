const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing Supabase env vars');
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const bucket = 'skynet-control';

  const { data, error } = await supabase.storage.getBucket(bucket);
  if (error) {
    console.log('getBucket error', error.message);
    const { error: createErr } = await supabase.storage.createBucket(bucket, {
      public: false,
      fileSizeLimit: 1024 * 1024,
    });
    if (createErr) {
      console.error('createBucket error', createErr.message);
    } else {
      console.log('Created bucket');
    }
  } else {
    console.log('Bucket exists');
  }

  const payload = JSON.stringify({ status: 'initialized', ts: new Date().toISOString() }, null, 2);
  const { error: uploadErr } = await supabase.storage
    .from(bucket)
    .upload('control-state.json', payload, { upsert: true, contentType: 'application/json' });
  if (uploadErr) {
    console.error('Upload error', uploadErr.message);
  } else {
    console.log('Uploaded control-state.json');
  }
}

main();
