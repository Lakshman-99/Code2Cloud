output "vm_public_ip" {
  value       = oci_core_instance.code2cloud_master.public_ip
  description = "Public IP of the Code2Cloud Master Instance"
}

output "ssh_command" {
  value = "ssh ubuntu@${oci_core_instance.code2cloud_master.public_ip}"
}