resource "oci_core_security_list" "code2cloud_sl" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.code2cloud_vcn.id
  display_name   = "code2cloud-security-list"

  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
    description = "Allow all outbound traffic"
  }

  # SSH (Port 22)
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    description = "SSH"
    tcp_options {
      min = 22
      max = 22
    }
  }

  # HTTP (Port 80)
  ingress_security_rules {
    protocol    = "6"
    source      = "0.0.0.0/0"
    description = "HTTP"
    tcp_options {
      min = 80
      max = 80
    }
  }

  # HTTPS (Port 443)
  ingress_security_rules {
    protocol    = "6"
    source      = "0.0.0.0/0"
    description = "HTTPS"
    tcp_options {
      min = 443
      max = 443
    }
  }

  # K8s API (Port 6443)
  ingress_security_rules {
    protocol    = "6"
    source      = "0.0.0.0/0"
    description = "K3s API"
    tcp_options {
      min = 6443
      max = 6443
    }
  }
}