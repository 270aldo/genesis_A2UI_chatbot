# NGX GENESIS V3 - Cloud Scheduler jobs for wearables sync

resource "google_cloud_scheduler_job" "wearables_sync" {
  for_each = var.wearables_sync_enabled && var.api_base_url != "" ? toset(var.wearables_sync_providers) : toset([])

  name        = "genesis-wearables-sync-${each.value}"
  description = "Daily wearable sync for ${each.value}"
  schedule    = var.wearables_sync_schedule
  time_zone   = var.wearables_sync_time_zone

  http_target {
    http_method = "POST"
    uri         = format("%s/api/wearables/%s/sync?user_id=%s", trim(var.api_base_url, "/"), each.value, var.wearables_sync_user_id)
    headers = {
      "Content-Type" = "application/json"
    }
  }

  attempt_deadline = "320s"

  depends_on = [
    google_project_service.apis,
  ]
}
