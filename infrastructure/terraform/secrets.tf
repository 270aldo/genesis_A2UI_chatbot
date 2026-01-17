# NGX GENESIS V3 - Secret Manager
# Secure storage for API keys and credentials

# Google API Key (Gemini)
resource "google_secret_manager_secret" "google_api_key" {
  secret_id = "google-api-key"

  labels = var.labels

  replication {
    auto {}
  }
}

# Supabase URL
resource "google_secret_manager_secret" "supabase_url" {
  secret_id = "supabase-url"

  labels = var.labels

  replication {
    auto {}
  }
}

# Supabase Anonymous Key
resource "google_secret_manager_secret" "supabase_key" {
  secret_id = "supabase-anon-key"

  labels = var.labels

  replication {
    auto {}
  }
}

# Supabase Service Role Key (backend only)
resource "google_secret_manager_secret" "supabase_service_key" {
  secret_id = "supabase-service-key"

  labels = var.labels

  replication {
    auto {}
  }
}

# Supabase JWT Secret (backend auth validation)
resource "google_secret_manager_secret" "supabase_jwt_secret" {
  secret_id = "supabase-jwt-secret"

  labels = var.labels

  replication {
    auto {}
  }
}

# Sync API Key (optional fallback for internal jobs)
resource "google_secret_manager_secret" "sync_api_key" {
  secret_id = "sync-api-key"

  labels = var.labels

  replication {
    auto {}
  }
}

# Wearable OAuth Secrets (for Phase 3)

# Garmin OAuth 2.0 Credentials
resource "google_secret_manager_secret" "garmin_client_id" {
  secret_id = "garmin-client-id"

  labels = var.labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "garmin_client_secret" {
  secret_id = "garmin-client-secret"

  labels = var.labels

  replication {
    auto {}
  }
}

# Oura Ring OAuth 2.0 Credentials
resource "google_secret_manager_secret" "oura_client_id" {
  secret_id = "oura-client-id"

  labels = var.labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "oura_client_secret" {
  secret_id = "oura-client-secret"

  labels = var.labels

  replication {
    auto {}
  }
}

# Whoop OAuth 2.0 Credentials
resource "google_secret_manager_secret" "whoop_client_id" {
  secret_id = "whoop-client-id"

  labels = var.labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "whoop_client_secret" {
  secret_id = "whoop-client-secret"

  labels = var.labels

  replication {
    auto {}
  }
}

# Instructions for populating secrets
# Run after terraform apply:
#
# echo -n "YOUR_GOOGLE_API_KEY" | gcloud secrets versions add google-api-key --data-file=-
# echo -n "https://your-project.supabase.co" | gcloud secrets versions add supabase-url --data-file=-
# echo -n "your-supabase-anon-key" | gcloud secrets versions add supabase-anon-key --data-file=-
# echo -n "your-supabase-service-key" | gcloud secrets versions add supabase-service-key --data-file=-
# echo -n "your-supabase-jwt-secret" | gcloud secrets versions add supabase-jwt-secret --data-file=-
# echo -n "your-sync-api-key" | gcloud secrets versions add sync-api-key --data-file=-
