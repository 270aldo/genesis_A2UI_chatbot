# NGX GENESIS V3 - Redis Memorystore
# Session clipboard persistence with sub-millisecond latency

# VPC Network for Redis
resource "google_compute_network" "vpc" {
  name                    = "ngx-genesis-vpc"
  auto_create_subnetworks = false
  description             = "VPC network for NGX GENESIS services"
}

resource "google_compute_subnetwork" "subnet" {
  name          = "ngx-genesis-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id

  private_ip_google_access = true
}

# VPC Access Connector for Cloud Run → Redis
resource "google_vpc_access_connector" "connector" {
  name          = "ngx-genesis-connector"
  region        = var.region
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.vpc.name

  min_instances = 2
  max_instances = 10

  depends_on = [google_project_service.apis]
}

# Redis Memorystore Instance
resource "google_redis_instance" "session_cache" {
  name           = "ngx-genesis-session-cache"
  tier           = var.redis_tier
  memory_size_gb = var.redis_memory_size_gb
  region         = var.region

  # Version
  redis_version = "REDIS_7_0"

  # Network
  authorized_network = google_compute_network.vpc.id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"

  # Persistence (for STANDARD_HA tier)
  dynamic "persistence_config" {
    for_each = var.redis_tier == "STANDARD_HA" ? [1] : []
    content {
      persistence_mode    = "RDB"
      rdb_snapshot_period = "TWELVE_HOURS"
    }
  }

  # Maintenance window (Sunday 3 AM)
  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours   = 3
        minutes = 0
      }
    }
  }

  # Redis configuration
  redis_configs = {
    maxmemory-policy = "volatile-lru"  # Evict keys with TTL first
    notify-keyspace-events = "Ex"       # Key expiration notifications
  }

  labels = var.labels

  depends_on = [
    google_project_service.apis,
    google_compute_network.vpc,
  ]
}

# Private Service Connection for Redis
resource "google_compute_global_address" "private_ip_range" {
  name          = "ngx-genesis-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_range.name]

  depends_on = [google_project_service.apis]
}
