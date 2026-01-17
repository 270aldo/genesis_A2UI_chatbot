# NGX GENESIS V3 - Main Terraform Configuration
# Architecture: Internet → Cloud Armor → External LB → Serverless NEG → Cloud Run

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }

  # Recommended: Configure remote state
  # backend "gcs" {
  #   bucket = "ngx-genesis-terraform-state"
  #   prefix = "terraform/state"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "compute.googleapis.com",
    "secretmanager.googleapis.com",
    "redis.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "aiplatform.googleapis.com",
    "cloudscheduler.googleapis.com",
    "cloudtasks.googleapis.com",
  ])

  service            = each.value
  disable_on_destroy = false
}

# Data source for project
data "google_project" "project" {
  project_id = var.project_id
}

# Outputs
output "load_balancer_ip" {
  description = "External IP of the load balancer"
  value       = google_compute_global_address.default.address
}

output "cloud_run_urls" {
  description = "URLs for each Cloud Run service"
  value = {
    for name, service in google_cloud_run_v2_service.services :
    name => service.uri
  }
}

output "redis_host" {
  description = "Redis Memorystore host"
  value       = google_redis_instance.session_cache.host
  sensitive   = true
}

output "security_policy" {
  description = "Cloud Armor security policy"
  value       = google_compute_security_policy.ngx_fortress.name
}
