# NGX GENESIS V3 - Terraform Variables
# Infrastructure configuration for Cloud Run + Cloud Armor + External LB

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region for Cloud Run services"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "domain" {
  description = "Custom domain for the application"
  type        = string
  default     = ""
}

# Cloud Run Services Configuration
variable "services" {
  description = "Map of Cloud Run services to deploy"
  type = map(object({
    image          = string
    min_instances  = number
    max_instances  = number
    cpu            = string
    memory         = string
    port           = number
    public         = bool  # true = public, false = internal only
  }))
  default = {
    orchestrator = {
      image          = "gcr.io/PROJECT_ID/genesis-orchestrator"
      min_instances  = 1
      max_instances  = 10
      cpu            = "1"
      memory         = "512Mi"
      port           = 8000
      public         = true  # Public - receives all traffic
    }
    voice = {
      image          = "gcr.io/PROJECT_ID/genesis-voice"
      min_instances  = 0
      max_instances  = 5
      cpu            = "1"
      memory         = "1Gi"
      port           = 8001
      public         = true  # Public - WebSocket connections
    }
    analytics = {
      image          = "gcr.io/PROJECT_ID/genesis-analytics"
      min_instances  = 0
      max_instances  = 3
      cpu            = "1"
      memory         = "512Mi"
      port           = 8002
      public         = false  # Internal only
    }
    recovery = {
      image          = "gcr.io/PROJECT_ID/genesis-recovery"
      min_instances  = 0
      max_instances  = 3
      cpu            = "1"
      memory         = "512Mi"
      port           = 8003
      public         = false  # Internal only
    }
  }
}

# Cloud Armor Security Policy
variable "security_policy_name" {
  description = "Name for Cloud Armor security policy"
  type        = string
  default     = "ngx-fortress"
}

variable "rate_limit_threshold" {
  description = "Rate limit requests per minute per IP"
  type        = number
  default     = 100
}

# Redis Configuration
variable "redis_tier" {
  description = "Redis Memorystore tier (BASIC or STANDARD_HA)"
  type        = string
  default     = "BASIC"
}

variable "redis_memory_size_gb" {
  description = "Redis memory size in GB"
  type        = number
  default     = 1
}

# Labels for all resources
variable "labels" {
  description = "Labels to apply to all resources"
  type        = map(string)
  default = {
    project     = "ngx-genesis"
    environment = "prod"
    managed-by  = "terraform"
  }
}

# Wearables sync (Cloud Scheduler)
variable "api_base_url" {
  description = "Public base URL for API (e.g., https://api.genesis.mx)"
  type        = string
  default     = ""
}

variable "wearables_sync_enabled" {
  description = "Enable daily wearable sync jobs"
  type        = bool
  default     = false
}


variable "wearables_sync_schedule" {
  description = "Cron schedule for daily wearable sync"
  type        = string
  default     = "0 6 * * *"
}

variable "wearables_sync_time_zone" {
  description = "Time zone for wearable sync schedule"
  type        = string
  default     = "UTC"
}

variable "cloud_tasks_queue_name" {
  description = "Cloud Tasks queue name for wearables sync"
  type        = string
  default     = "genesis-wearables-sync"
}

variable "cloud_tasks_location" {
  description = "Cloud Tasks location"
  type        = string
  default     = "us-central1"
}

variable "cloud_tasks_service_account" {
  description = "Service account email used by Cloud Tasks OIDC"
  type        = string
  default     = ""
}
