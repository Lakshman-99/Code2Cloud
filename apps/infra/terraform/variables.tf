variable "tenancy_ocid" {}
variable "user_ocid" {}
variable "fingerprint" {}
variable "private_key_path" {}
variable "region" {
  default = "us-ashburn-1" # Change to your region
}
variable "compartment_ocid" {}

variable "ssh_public_key_path" {
  description = "Path to your local SSH public key (e.g., ~/.ssh/id_rsa.pub)"
}

variable "vcn_cidr" {
  default = "10.0.0.0/16"
}

variable "subnet_cidr" {
  default = "10.0.1.0/24"
}

variable "alert_email" {
  description = "Email to receive budget alerts"
  default     = "siva.l@northeastern.edu"
}