#!/usr/bin/env node
/**
 * Generate carved bust portraits for directors using Replicate
 * Upload to Google Cloud Storage and update Supabase
 * 
 * Usage: node scripts/generate-director-portraits.js
 * 
 * Requires:
 * - REPLICATE_API_TOKEN environment variable
 * - Google Cloud credentials (GOOGLE_APPLICATION_CREDENTIALS or gcloud auth)
 * - Supabase credentials in .env
 */

import { Replicate } from 'replicate';
import { Storage } from '@google-cloud/storage';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const DIRECTORS = [
  { name: 'Alan Turing', college: 'AINS', prompt: 'Alan Turing, carved marble bust, classical sculpture, detailed facial features, mathematician and computer scientist' },
  { name: 'Katsushika Ōi', college: 'ARTS', prompt: 'Katsushika Ōi, carved stone bust, Japanese artist, ukiyo-e painter, detailed traditional sculpture' },
  { name: 'Leonardo da Vinci', college: 'CRAF', prompt: 'Leonardo da Vinci, carved marble bust, Renaissance master, inventor and artist, classical Italian sculpture' },
  { name: 'Confucius', college: 'ELAG', prompt: 'Confucius, carved stone bust, ancient Chinese philosopher, traditional sculpture, wise sage' },
  { name: 'Ibn Sina (Avicenna)', college: 'HEAL', prompt: 'Ibn Sina Avicenna, carved marble bust, Persian physician and philosopher, classical Islamic sculpture' },
  { name: 'Mary Shelley', college: 'HUMN', prompt: 'Mary Shelley, carved marble bust, English author, Romantic era writer, classical sculpture' },
  { name: 'Al-Khwarizmi', college: 'MATH', prompt: 'Al-Khwarizmi, carved stone bust, Persian mathematician, algebra founder, classical Islamic sculpture' },
  { name: 'Ibn al-Haytham', college: 'META', prompt: 'Ibn al-Haytham, carved marble bust, Arab scientist, father of optics, classical sculpture' },
  { name: 'Maria Sibylla Merian', college: 'NATP', prompt: 'Maria Sibylla Merian, carved stone bust, German naturalist and scientific illustrator, classical sculpture' },
  { name: 'Zhuangzi', college: 'SOCI', prompt: 'Zhuangzi, carved stone bust, ancient Chinese philosopher, Daoist sage, traditional Chinese sculpture' },
];

async function generatePortrait(replicate, prompt, directorName) {
  console.log(`\n🎨 Generating portrait for ${directorName}...`);
  console.log(`   Prompt: ${prompt}`);
  
  try {
    // Using a sculpture/bust generation model
    // You may need to adjust the model based on what's available
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: `${prompt}, professional sculpture, museum quality, high detail, carved bust`,
          negative_prompt: "photograph, photo, modern, color, painting",
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 50,
        }
      }
    );
    
    return output[0];
  } catch (error) {
    console.error(`Error generating portrait for ${directorName}:`, error);
    throw error;
  }
}

async function uploadToGCS(storage, imageUrl, directorName) {
  console.log(`\n☁️  Uploading ${directorName} portrait to Google Cloud Storage...`);
  
  try {
    const bucket = storage.bucket('faculty');
    const fileName = `portraits/${directorName.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
    const file = bucket.file(fileName);
    
    // Download image from Replicate
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    
    // Upload to GCS
    await file.save(Buffer.from(buffer), {
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      },
      public: true,
    });
    
    // Make file publicly accessible
    await file.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/faculty/${fileName}`;
    console.log(`   ✅ Uploaded to: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error(`Error uploading to GCS for ${directorName}:`, error);
    throw error;
  }
}

async function updateSupabase(supabase, directorName, portraitUrl) {
  console.log(`\n💾 Updating Supabase for ${directorName}...`);
  
  try {
    const { error } = await supabase
      .from('board_of_directors')
      .update({ portrait_url: portraitUrl })
      .eq('director_name', directorName);
    
    if (error) throw error;
    
    console.log(`   ✅ Updated Supabase`);
  } catch (error) {
    console.error(`Error updating Supabase for ${directorName}:`, error);
    throw error;
  }
}

async function main() {
  // Initialize clients
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN environment variable is required');
  }
  
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });
  
  const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'inquiry-institute',
  });
  
  const supabase = createClient(
    process.env.SUPABASE_URL || 'https://xougqdomkoisrxdnagcj.supabase.co',
    process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvdWdxZG9ta29pc3J4ZG5hZ2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjIwMTIsImV4cCI6MjA4MTUzODAxMn0.eA1vXG6UVI1AjUOXN7q3gTlSyPoDByuVehOcKPjHmvs'
  );
  
  console.log('🎭 Starting portrait generation for directors...\n');
  
  for (const director of DIRECTORS) {
    try {
      // Generate portrait
      const imageUrl = await generatePortrait(replicate, director.prompt, director.name);
      
      // Upload to GCS
      const gcsUrl = await uploadToGCS(storage, imageUrl, director.name);
      
      // Update Supabase
      await updateSupabase(supabase, director.name, gcsUrl);
      
      console.log(`\n✅ Completed ${director.name}`);
      
      // Wait a bit between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`\n❌ Failed to process ${director.name}:`, error.message);
      continue;
    }
  }
  
  console.log('\n🎉 Portrait generation complete!');
}

main().catch(console.error);
