import { supabase } from "@/lib/supabase/client"

export type ActivityModule = "import_data" | "kelola_data" | "referensi_wilayah" | "model_prediksi"

interface LogActivityParams {
  actorId: string | null
  actorName: string
  actionType: string
  description: string
  module: ActivityModule
}

export async function logActivity({
  actorId,
  actorName,
  actionType,
  description,
  module,
}: LogActivityParams) {
  const { error } = await supabase.from("activity_log").insert({
    actor_id: actorId,
    actor_name: actorName,
    action_type: actionType,
    description,
    module,
  })

  if (error) {
    console.error("Gagal mencatat aktivitas:", error.message)
  }
}