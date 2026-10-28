const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)/);

if (!urlMatch || !keyMatch) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

const memberMap = {
  "hasibul": "Hasibul Pailan",
  "neel": "Neel Dey",
  "sachin": "Sachin Ray",
  "shohini": "Shohini Nayak",
  "susmita": "Susmita Mitra",
  "swagata": "Swagata Banerjee",
};

// Tomorrow's date
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const y = tomorrow.getFullYear();
const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
const d = String(tomorrow.getDate()).padStart(2, '0');
const taskDate = `${y}-${m}-${d}`; // e.g. "2026-10-29"

const rawData = [
  { no: 1, client: "Healthy Buddy", category: "Scope", member: "Hasibul", update: "Get confirnation from client that everthing is DONE for Phase1 and inform Dibyendu on this and add testmonials", remarks: "" },
  { no: 2, client: "Boutique", category: "AEO", member: "Hasibul", update: "Today you have to do and share to Dibyendu what all you did", remarks: "" },
  { no: 3, client: "Pixel", category: "GEO", member: "Hasibul", update: "Today you have to do and share to Dibyendu what all you did", remarks: "" },
  { no: 4, client: "Optimum", category: "Website Creation", member: "Hasibul", update: "Reply in the group. Get confirmation from client that its complete", remarks: "" },
  { no: 5, client: "Coachedbysouvik", category: "Website Creation", member: "Hasibul", update: "need confirmation from Souvik sir that Payment gateway work is done", remarks: "" },
  { no: 6, client: "All projects", category: "Creative", member: "Neel", update: "Help the team for any creative or Reel. Mainly for Durga Gold & Pixel", remarks: "" },
  { no: 7, client: "All projects", category: "Ad Running", member: "Neel", update: "Learn today about Meta Ad and start for Pixel", remarks: "" },
  { no: 8, client: "All projects", category: "Retail", member: "Neel", update: "Make 25 calls and convert ONE", remarks: "" },
  { no: 9, client: "S Light", category: "Ad Running", member: "Neel", update: "Went to S Light today and will bring the credentials. Share the credentials with the team and start the Meta Ad setup for S Light", remarks: "" },
  { no: 10, client: "Healthy Buddy", category: "Reels", member: "Neel", update: "About the product", remarks: "" },
  { no: 11, client: "Boutique", category: "Creative", member: "Neel", update: "Make 1 reel with maams product", remarks: "" },
  { no: 12, client: "Pixel", category: "Reels", member: "Neel", update: "Make one video with Dibyendu's photo", remarks: "" },
  { no: 13, client: "Ananya Wellness", category: "Ad Running", member: "Sachin", update: "Get the location and all relevant details and start Ad", remarks: "" },
  { no: 14, client: "Arohi", category: "Website Creation", member: "Sachin", update: "Complete the work", remarks: "" },
  { no: 15, client: "S Light", category: "GBP", member: "Sachin", update: "Work and share status with baseline", remarks: "" },
  { no: 16, client: "Dropshot", category: "Website Creation", member: "Sachin", update: "Share the complete website with Avijit in thr external group", remarks: "" },
  { no: 17, client: "Durga Gold", category: "Website Creation", member: "Sachin", update: "Make the plan for that. To be delivered by Oct. When can you meet him inform him", remarks: "" },
  { no: 18, client: "Durga Gold", category: "Website Creation", member: "Sachin", update: "Ask if he needs any changes", remarks: "" },
  { no: 19, client: "Right Choice", category: "Ad Running", member: "Sachin", update: "See if any changes are required", remarks: "" },
  { no: 20, client: "Uma Exports", category: "Website Creation", member: "Sachin", update: "Start the work today after today's meeting", remarks: "" },
  { no: 21, client: "Durga Gold", category: "Creative", member: "Shohini", update: "Make 2 videos", remarks: "" },
  { no: 23, client: "Pixel", category: "Reels", member: "Shohini", update: "Make one video", remarks: "" },
  { no: 24, client: "All clients", category: "Other", member: "Susmita", update: "In local and external group, interact with all within 15 minutes", remarks: "" },
  { no: 25, client: "Arohi", category: "GBP", member: "Susmita", update: "Post a new GBP update (offer/photo), reply to any new reviews and check GBP insights", remarks: "" },
  { no: 26, client: "Arohi", category: "Creative", member: "Susmita", update: "Post the next scheduled social media post, share the link in the group and reply to comments", remarks: "" },
  { no: 28, client: "P Edge", category: "Ad Running", member: "Susmita", update: "When can we start Meta Ad. Request for fund fo that", remarks: "" },
  { no: 29, client: "Durga Gold", category: "GBP", member: "Susmita", update: "Add new photos/products to GBP, reply to reviews and Q&A", remarks: "" },
  { no: 30, client: "UVC", category: "Other", member: "Susmita", update: "talk to him", remarks: "" },
  { no: 31, client: "Boutique", category: "GBP", member: "Susmita", update: "Add new product photos/offers on GBP, check and reply to reviews", remarks: "" },
  { no: 32, client: "Boutique", category: "Creative", member: "Susmita", update: "Post the next content on social media (add the new reel once ready)", remarks: "" },
  { no: 33, client: "Boutique", category: "GBP", member: "Susmita", update: "Get this done from today", remarks: "" },
  { no: 34, client: "Pixel", category: "GBP", member: "Susmita", update: "Add new photos/post on GBP and ask happy clients for reviews", remarks: "" },
  { no: 35, client: "Pixel", category: "Creative", member: "Susmita", update: "Post the next content on social media (add Dibyendu's video once ready)", remarks: "" },
  { no: 36, client: "Pixel", category: "GBP", member: "Susmita", update: "Get this done from today", remarks: "" },
  { no: 37, client: "Allan baptist", category: "Other", member: "Susmita", update: "followers need to be increase", remarks: "" },
  { no: 39, client: "BFSL", category: "Creative", member: "Swagata", update: "Talk on about the Video work. Interct with Priya Ma'am and share a plan", remarks: "" },
  { no: 40, client: "Tribal Trim", category: "Creative", member: "Swagata", update: "Get content and make one poster atleast/call ma'am for content", remarks: "" },
  { no: 41, client: "Pixel", category: "Reels", member: "Swagata", update: "Make one video with Dibyendu's photo", remarks: "" },
  { no: 42, client: "Durga Gold", category: "Creative", member: "Swagata", update: "Make the Durga Gold poster, share the draft in the group for approval", remarks: "" },
  { no: 43, client: "Boutique", category: "Reels", member: "Swagata", update: "Make one reel for Boutique and share in the group for approval", remarks: "" },
  { no: 44, client: "Arohi", category: "Creative", member: "Swagata", update: "Make the logo animation and add it to the Arohi website; share the link once live", remarks: "" }
];

async function insertTasks() {
  console.log(`Inserting ${rawData.length} tasks for date: ${taskDate}...`);

  for (const item of rawData) {
    const fullMemberName = memberMap[item.member.toLowerCase()] || item.member;
    const taskId = `task_${taskDate}_${item.no}_${Math.random().toString(36).substr(2, 6)}`;
    
    const taskPayload = {
      id: taskId,
      name: item.client,
      phone: "+91 9876543210",
      category: item.category,
      task_details: item.update,
      task_type: "Regular",
      member: fullMemberName,
      start_date: taskDate,
      end_date: taskDate,
      expected: "0",
      received: "0",
      status: "Pending",
      comments: item.remarks || "",
      reason: "",
    };

    const { error } = await supabase.from('tasks').upsert(taskPayload);
    if (error) {
      console.error(`Error inserting ${item.client} for ${fullMemberName}:`, error);
    } else {
      console.log(`✓ [${item.no}] ${item.client} -> ${fullMemberName}`);
    }
  }

  console.log("All tasks processed successfully!");
}

insertTasks();
