import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { fallbackRecommendationProfiles } from "../src/services/recommendationDataService";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const cropIdMap: Record<string, string> = {
  "Cà chua": "tomato",
  "Lúa": "rice",
  "Ớt": "pepper",
  "Dưa leo": "cucumber",
  "Cam": "orange",
  "Bưởi": "pomelo",
  "Xoài": "mango",
  "Sầu riêng": "durian",
  "Cà phê": "coffee",
  "Thanh long": "dragon-fruit",
};

const rows = fallbackRecommendationProfiles.map((item) => ({
  id: item.id,
  crop_id: cropIdMap[item.cropType] || item.cropType.toLowerCase(),
  name: item.name,
  type: item.type,
  description: item.description,
  symptoms: item.symptoms.split(",").map((part) => part.trim()).filter(Boolean),
  impact_level: item.impactLevel,
  causes: item.causes,
  protocols: item.protocols,
  alternatives: item.alternatives || null,
  usage_notes: item.usageNotes,
  reference_sources: item.references || null,
  quick_action: item.quickAction,
  confidence_base: item.confidenceBase,
  immediate_actions: item.immediateActions,
  stage_plans: item.stagePlans,
  symptom_options: item.symptomOptions,
}));

async function main() {
  const { error } = await supabase.from("disease_assistant_profiles").upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }

  console.log(`Seeded ${rows.length} recommendation profiles to Supabase.`);
}

void main();
