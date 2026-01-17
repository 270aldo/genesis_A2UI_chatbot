# NGX GENESIS V3 - Cloud Run Services
# Deploys containerized services with appropriate access controls

resource "google_cloud_run_v2_service" "services" {
  for_each = var.services

  name     = "genesis-${each.key}"
  location = var.region

  template {
    scaling {
      min_instance_count = each.value.min_instances
      max_instance_count = each.value.max_instances
    }

    containers {
      image = replace(each.value.image, "PROJECT_ID", var.project_id)

      ports {
        container_port = each.value.port
      }

      resources {
        limits = {
          cpu    = each.value.cpu
          memory = each.value.memory
        }
        cpu_idle = true  # Scale to zero when idle
      }

      # Environment variables from Secret Manager
      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }

      env {
        name  = "REDIS_HOST"
        value = google_redis_instance.session_cache.host
      }

      env {
        name  = "REDIS_PORT"
        value = tostring(google_redis_instance.session_cache.port)
      }

      # Secret references
      env {
        name = "GOOGLE_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.google_api_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "SUPABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.supabase_url.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "SUPABASE_ANON_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.supabase_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "SUPABASE_SERVICE_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.supabase_service_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "API_BASE_URL"
        value = var.api_base_url
      }

      env {
        name  = "CLOUD_TASKS_PROJECT"
        value = var.project_id
      }

      env {
        name  = "CLOUD_TASKS_LOCATION"
        value = var.cloud_tasks_location
      }

      env {
        name  = "CLOUD_TASKS_QUEUE"
        value = var.cloud_tasks_queue_name
      }

      env {
        name  = "CLOUD_TASKS_SERVICE_ACCOUNT"
        value = var.cloud_tasks_service_account
      }

      # Startup and liveness probes
      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 5
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 15
        timeout_seconds       = 5
        period_seconds        = 30
      }
    }

    # Service account
    service_account = google_service_account.cloud_run[each.key].email

    # VPC connector for Redis access
    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    # Execution environment
    execution_environment = "EXECUTION_ENVIRONMENT_GEN2"

    # Timeout
    timeout = each.key == "voice" ? "3600s" : "300s"
  }

  # Traffic settings
  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  labels = merge(var.labels, {
    service = each.key
  })

  depends_on = [
    google_project_service.apis,
    google_vpc_access_connector.connector,
  ]
}

# IAM: Make public services accessible via load balancer
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  for_each = { for k, v in var.services : k => v if v.public }

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.services[each.key].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# IAM: Internal services only accessible by service accounts
resource "google_cloud_run_v2_service_iam_member" "internal_access" {
  for_each = { for k, v in var.services : k => v if !v.public }

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.services[each.key].name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.cloud_run["orchestrator"].email}"
}

# Service accounts for each service
resource "google_service_account" "cloud_run" {
  for_each = var.services

  account_id   = "genesis-${each.key}-sa"
  display_name = "GENESIS ${title(each.key)} Service Account"
  description  = "Service account for ${each.key} Cloud Run service"
}

# Grant Secret Manager access to service accounts
resource "google_secret_manager_secret_iam_member" "secret_access" {
  for_each = toset(flatten([
    for sa_key, _ in var.services : [
      for secret in [
        google_secret_manager_secret.google_api_key.secret_id,
        google_secret_manager_secret.supabase_url.secret_id,
        google_secret_manager_secret.supabase_key.secret_id,
        google_secret_manager_secret.supabase_service_key.secret_id,
      ] : "${sa_key}:${secret}"
    ]
  ]))

  secret_id = split(":", each.value)[1]
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run[split(":", each.value)[0]].email}"
}
