# NGX GENESIS V3 - Cloud Tasks + Scheduler for wearables sync

resource "google_cloud_tasks_queue" "wearables" {
  count    = var.wearables_sync_enabled ? 1 : 0
  name     = var.cloud_tasks_queue_name
  location = var.cloud_tasks_location

  rate_limits {
    max_dispatches_per_second = 5
    max_concurrent_dispatches = 10
  }
}

resource "google_cloud_scheduler_job" "wearables_sync" {
  count = var.wearables_sync_enabled && var.api_base_url != "" ? 1 : 0

  name        = "genesis-wearables-sync"
  description = "Daily wearable sync dispatcher"
  schedule    = var.wearables_sync_schedule
  time_zone   = var.wearables_sync_time_zone

  http_target {
    http_method = "POST"
    uri         = format("%s/api/wearables/sync-all", trim(var.api_base_url, "/"))
    headers = {
      "Content-Type" = "application/json"
    }
  }

  attempt_deadline = "320s"

  depends_on = [
    google_project_service.apis,
    google_cloud_tasks_queue.wearables,
  ]
}
