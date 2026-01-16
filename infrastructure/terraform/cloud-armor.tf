# NGX GENESIS V3 - Cloud Armor Security Policy (NGX Fortress Layer 1)
# Provides edge protection: WAF, DDoS, rate limiting

resource "google_compute_security_policy" "ngx_fortress" {
  name        = var.security_policy_name
  description = "NGX Fortress - Edge protection for GENESIS services"

  # Default rule: Allow traffic
  rule {
    action   = "allow"
    priority = 2147483647  # Lowest priority (default)
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default rule - allow all traffic"
  }

  # Rule 1: Block known malicious IPs (OWASP top threats)
  rule {
    action   = "deny(403)"
    priority = 1000
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    description = "Block XSS attacks"
  }

  # Rule 2: Block SQL injection attempts
  rule {
    action   = "deny(403)"
    priority = 1001
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      }
    }
    description = "Block SQL injection attacks"
  }

  # Rule 3: Block Local File Inclusion attacks
  rule {
    action   = "deny(403)"
    priority = 1002
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('lfi-v33-stable')"
      }
    }
    description = "Block LFI attacks"
  }

  # Rule 4: Block Remote File Inclusion attacks
  rule {
    action   = "deny(403)"
    priority = 1003
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('rfi-v33-stable')"
      }
    }
    description = "Block RFI attacks"
  }

  # Rule 5: Block protocol attacks
  rule {
    action   = "deny(403)"
    priority = 1004
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('protocolattack-v33-stable')"
      }
    }
    description = "Block protocol attacks"
  }

  # Rule 6: Rate limiting per IP
  rule {
    action   = "rate_based_ban"
    priority = 2000
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = var.rate_limit_threshold
        interval_sec = 60
      }
      ban_duration_sec = 300  # 5 minute ban
    }
    description = "Rate limit: ${var.rate_limit_threshold} req/min per IP"
  }

  # Rule 7: Block suspicious user agents (scanners, bots)
  rule {
    action   = "deny(403)"
    priority = 3000
    match {
      expr {
        expression = <<-EOT
          request.headers['user-agent'].matches('(?i).*(sqlmap|nikto|nmap|masscan|burp|acunetix|nessus).*')
        EOT
      }
    }
    description = "Block known vulnerability scanners"
  }

  # Rule 8: Geo-blocking (optional - enable if needed)
  # Uncomment to restrict to Mexico and US only
  # rule {
  #   action   = "deny(403)"
  #   priority = 4000
  #   match {
  #     expr {
  #       expression = "!('[MX, US]'.contains(origin.region_code))"
  #     }
  #   }
  #   description = "Geo-restriction: Mexico and US only"
  # }

  # Adaptive Protection (ML-based DDoS detection)
  adaptive_protection_config {
    layer_7_ddos_defense_config {
      enable          = true
      rule_visibility = "STANDARD"
    }
  }

  # Advanced options
  advanced_options_config {
    log_level = "VERBOSE"
    json_parsing = "STANDARD"
  }
}
