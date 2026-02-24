const { createClient } = require('@supabase/supabase-js');

const defaultState = {
  agents: [
    {
      id: 'catalyst',
      name: 'Catalyst',
      role: 'Concept Generation',
      description: 'Creates raw campaign concepts for Instagram Reels.',
      mode: 'active',
      status: 'idle',
    },
    {
      id: 'playwright',
      name: 'Maven',
      role: 'Script Author',
      description: 'Transforms concepts into structured scripts & shot lists.',
      mode: 'active',
      status: 'idle',
    },
    {
      id: 'tags',
      name: 'Echo',
      role: 'Captions & Tags',
      description: 'Optimizes captions, CTAs, and hashtags.',
      mode: 'active',
      status: 'idle',
    },
    {
      id: 'guardian',
      name: 'Guardian',
      role: 'Compliance',
      description: 'Runs final QC + regulatory enforcement.',
      mode: 'active',
      status: 'idle',
    },
  ],
  templates: [
    {
      id: 'ig-reels',
      name: 'Instagram Reels Launch',
      description: 'Full creative pipeline for a Viking Labs Reels drop.',
      steps: [
        { id: 'step-catalyst', label: 'Concept Brief', agentId: 'catalyst', estimateMinutes: 5 },
        { id: 'step-playwright', label: 'Script + Shot List', agentId: 'playwright', estimateMinutes: 12 },
        { id: 'step-tags', label: 'Caption & CTA', agentId: 'tags', estimateMinutes: 4 },
        { id: 'step-guardian', label: 'Compliance Review', agentId: 'guardian', estimateMinutes: 6 },
      ],
    },
    {
      id: 'email-drip',
      name: 'Email Drip Refresh',
      description: 'Rebuilds research email series with compliance checkpoints.',
      steps: [
        { id: 'step-catalyst-email', label: 'Angle Ideation', agentId: 'catalyst', estimateMinutes: 6 },
        { id: 'step-playwright-email', label: 'Copy Drafts', agentId: 'playwright', estimateMinutes: 15 },
        { id: 'step-guardian-email', label: 'Regulatory QC', agentId: 'guardian', estimateMinutes: 8 },
      ],
    },
  ],
  runs: [],
};

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

  const payload = JSON.stringify(defaultState, null, 2);
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
