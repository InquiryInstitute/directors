#!/usr/bin/env node
/**
 * Apply Wikipedia portrait URLs to directors in Supabase
 * Uses direct SQL execution via Supabase REST API
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://xougqdomkoisrxdnagcj.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvdWdxZG9ta29pc3J4ZG5hZ2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjIwMTIsImV4cCI6MjA4MTUzODAxMn0.eA1vXG6UVI1AjUOXN7q3gTlSyPoDByuVehOcKPjHmvs'
);

const PORTRAIT_URLS = {
  'Alan Turing': 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Alan_Turing_Aged_16.jpg',
  'Katsushika Ōi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Katsushika_%C5%8Ci.jpg/800px-Katsushika_%C5%8Ci.jpg',
  'Leonardo da Vinci': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Leonardo_self.jpg/800px-Leonardo_self.jpg',
  'Confucius': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Kong_Qiu.jpg/800px-Kong_Qiu.jpg',
  'Ibn Sina (Avicenna)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Avicenna_Portrait_on_Silver_Vase_-_Museum_at_BuAli_Sina_%28Avicenna%29_Mausoleum_-_Hamadan_-_Western_Iran_%2813124867165%29.jpg/800px-Avicenna_Portrait_on_Silver_Vase_-_Museum_at_BuAli_Sina_%28Avicenna%29_Mausoleum_-_Hamadan_-_Western_Iran_%2813124867165%29.jpg',
  'Mary Shelley': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Mary_Wollstonecraft_Shelley_Rothwell.jpg/800px-Mary_Wollstonecraft_Shelley_Rothwell.jpg',
  'Al-Khwarizmi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Al-Khwarizmi_portrait.jpg/800px-Al-Khwarizmi_portrait.jpg',
  'Ibn al-Haytham': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Ibn_al-Haytham.png/800px-Ibn_al-Haytham.png',
  'Maria Sibylla Merian': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Maria_Sibylla_Merian_1647-1717.jpg/800px-Maria_Sibylla_Merian_1647-1717.jpg',
  'Zhuangzi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Zhuangzi.jpg/800px-Zhuangzi.jpg',
};

async function applyPortraitUrls() {
  console.log('🎨 Applying Wikipedia portrait URLs to directors...\n');
  
  // First check if column exists by trying to fetch it
  console.log('📋 Checking if portrait_url column exists...');
  const { data: testData, error: testError } = await supabase
    .from('board_of_directors')
    .select('portrait_url')
    .limit(1);
  
  if (testError && testError.message.includes('does not exist')) {
    console.log('  ⚠️  Column does not exist. Please run migration 011_director_portraits.sql first.');
    console.log('  You can apply it via Supabase dashboard SQL editor or use:');
    console.log('  supabase db push (though it may have conflicts)');
    console.log('\n  Or manually run this SQL in Supabase dashboard:');
    console.log('  ALTER TABLE board_of_directors ADD COLUMN IF NOT EXISTS portrait_url TEXT;');
    return;
  }
  
  console.log('  ✅ Column exists, proceeding with updates...\n');
  
  for (const [directorName, portraitUrl] of Object.entries(PORTRAIT_URLS)) {
    console.log(`Updating ${directorName}...`);
    
    const { data, error } = await supabase
      .from('board_of_directors')
      .update({ portrait_url: portraitUrl })
      .eq('director_name', directorName);
    
    if (error) {
      console.error(`  ❌ Error updating ${directorName}:`, error.message);
    } else {
      console.log(`  ✅ Updated ${directorName}`);
    }
  }
  
  console.log('\n✨ Portrait URLs applied!');
  
  // Verify updates
  console.log('\n📋 Verifying updates...');
  const { data: directors, error: fetchError } = await supabase
    .from('board_of_directors')
    .select('director_name, portrait_url')
    .order('director_name');
  
  if (fetchError) {
    console.error('Error fetching directors:', fetchError);
  } else {
    console.log('\nCurrent portrait URLs:');
    directors.forEach(d => {
      console.log(`  ${d.director_name}: ${d.portrait_url ? '✅' : '❌'} ${d.portrait_url || 'No URL'}`);
    });
  }
}

applyPortraitUrls().catch(console.error);
