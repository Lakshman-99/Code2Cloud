resource "oci_core_instance" "code2cloud_master" {
  availability_domain = data.oci_identity_availability_domain.ad.name
  compartment_id      = var.compartment_ocid
  display_name        = "code2cloud-master"
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = 4
    memory_in_gbs = 24
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.code2cloud_subnet.id
    assign_public_ip = true
    display_name     = "code2cloud-vnic"
  }

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ubuntu_images.images[0].id
    boot_volume_size_in_gbs = 190
  }

  metadata = {
    ssh_authorized_keys = file(var.ssh_public_key_path)
  }
}