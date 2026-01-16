# NGX GENESIS V3 - External HTTP(S) Load Balancer
# Routes traffic through Cloud Armor to Cloud Run via Serverless NEGs

# Reserve a global static IP
resource "google_compute_global_address" "default" {
  name        = "ngx-genesis-lb-ip"
  description = "Static IP for NGX GENESIS load balancer"
}

# SSL Certificate (managed by Google)
resource "google_compute_managed_ssl_certificate" "default" {
  count = var.domain != "" ? 1 : 0

  name = "ngx-genesis-ssl-cert"

  managed {
    domains = [var.domain]
  }
}

# URL Map - Routes requests to appropriate backends
resource "google_compute_url_map" "default" {
  name            = "ngx-genesis-url-map"
  default_service = google_compute_backend_service.orchestrator.id
  description     = "URL map for NGX GENESIS services"

  # API routes to orchestrator
  host_rule {
    hosts        = ["*"]
    path_matcher = "api-routes"
  }

  path_matcher {
    name            = "api-routes"
    default_service = google_compute_backend_service.orchestrator.id

    # Voice WebSocket endpoint
    path_rule {
      paths   = ["/api/voice/*", "/ws/voice/*"]
      service = google_compute_backend_service.voice.id
    }

    # Analytics endpoints (internal, but exposed for admin)
    path_rule {
      paths   = ["/api/analytics/*"]
      service = google_compute_backend_service.analytics.id
    }

    # All other API calls go to orchestrator
    path_rule {
      paths   = ["/api/*", "/health", "/"]
      service = google_compute_backend_service.orchestrator.id
    }
  }
}

# HTTPS Proxy
resource "google_compute_target_https_proxy" "default" {
  count = var.domain != "" ? 1 : 0

  name             = "ngx-genesis-https-proxy"
  url_map          = google_compute_url_map.default.id
  ssl_certificates = [google_compute_managed_ssl_certificate.default[0].id]
}

# HTTP Proxy (for redirect to HTTPS or direct access)
resource "google_compute_target_http_proxy" "default" {
  name    = "ngx-genesis-http-proxy"
  url_map = google_compute_url_map.default.id
}

# Global Forwarding Rule - HTTPS
resource "google_compute_global_forwarding_rule" "https" {
  count = var.domain != "" ? 1 : 0

  name       = "ngx-genesis-https-forwarding"
  target     = google_compute_target_https_proxy.default[0].id
  port_range = "443"
  ip_address = google_compute_global_address.default.address

  labels = var.labels
}

# Global Forwarding Rule - HTTP
resource "google_compute_global_forwarding_rule" "http" {
  name       = "ngx-genesis-http-forwarding"
  target     = google_compute_target_http_proxy.default.id
  port_range = "80"
  ip_address = google_compute_global_address.default.address

  labels = var.labels
}

# HTTP to HTTPS redirect URL Map (optional)
resource "google_compute_url_map" "https_redirect" {
  count = var.domain != "" ? 1 : 0

  name = "ngx-genesis-https-redirect"

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}
