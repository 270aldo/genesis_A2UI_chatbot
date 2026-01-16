# NGX GENESIS V3 - Serverless Network Endpoint Groups
# Connects External LB to Cloud Run services

# ============================================================================
# ORCHESTRATOR SERVICE (Public)
# ============================================================================

resource "google_compute_region_network_endpoint_group" "orchestrator" {
  name                  = "neg-orchestrator"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.services["orchestrator"].name
  }
}

resource "google_compute_backend_service" "orchestrator" {
  name        = "backend-orchestrator"
  description = "Backend service for GENESIS orchestrator"

  protocol    = "HTTP"
  port_name   = "http"
  timeout_sec = 30

  backend {
    group = google_compute_region_network_endpoint_group.orchestrator.id
  }

  # Attach Cloud Armor policy
  security_policy = google_compute_security_policy.ngx_fortress.id

  # Health check (optional for serverless)
  # health_checks = [google_compute_health_check.default.id]

  # Logging
  log_config {
    enable      = true
    sample_rate = 1.0
  }

  # CDN disabled (dynamic content)
  enable_cdn = false

  # Connection draining
  connection_draining_timeout_sec = 30
}

# ============================================================================
# VOICE SERVICE (Public - WebSocket)
# ============================================================================

resource "google_compute_region_network_endpoint_group" "voice" {
  name                  = "neg-voice"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.services["voice"].name
  }
}

resource "google_compute_backend_service" "voice" {
  name        = "backend-voice"
  description = "Backend service for GENESIS voice engine"

  protocol    = "HTTP"
  port_name   = "http"
  timeout_sec = 3600  # 1 hour for long WebSocket sessions

  backend {
    group = google_compute_region_network_endpoint_group.voice.id
  }

  # Attach Cloud Armor policy
  security_policy = google_compute_security_policy.ngx_fortress.id

  log_config {
    enable      = true
    sample_rate = 1.0
  }

  enable_cdn = false

  # Extended timeout for streaming
  connection_draining_timeout_sec = 60
}

# ============================================================================
# ANALYTICS SERVICE (Internal)
# ============================================================================

resource "google_compute_region_network_endpoint_group" "analytics" {
  name                  = "neg-analytics"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.services["analytics"].name
  }
}

resource "google_compute_backend_service" "analytics" {
  name        = "backend-analytics"
  description = "Backend service for GENESIS analytics"

  protocol    = "HTTP"
  port_name   = "http"
  timeout_sec = 60

  backend {
    group = google_compute_region_network_endpoint_group.analytics.id
  }

  # Cloud Armor for internal services too
  security_policy = google_compute_security_policy.ngx_fortress.id

  log_config {
    enable      = true
    sample_rate = 0.5  # Sample 50% for internal services
  }

  enable_cdn = false
  connection_draining_timeout_sec = 30
}

# ============================================================================
# RECOVERY SERVICE (Internal)
# ============================================================================

resource "google_compute_region_network_endpoint_group" "recovery" {
  name                  = "neg-recovery"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.services["recovery"].name
  }
}

resource "google_compute_backend_service" "recovery" {
  name        = "backend-recovery"
  description = "Backend service for GENESIS recovery processing"

  protocol    = "HTTP"
  port_name   = "http"
  timeout_sec = 60

  backend {
    group = google_compute_region_network_endpoint_group.recovery.id
  }

  security_policy = google_compute_security_policy.ngx_fortress.id

  log_config {
    enable      = true
    sample_rate = 0.5
  }

  enable_cdn = false
  connection_draining_timeout_sec = 30
}
