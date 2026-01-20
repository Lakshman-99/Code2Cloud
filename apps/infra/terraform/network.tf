resource "oci_core_vcn" "code2cloud_vcn" {
  cidr_block     = var.vcn_cidr
  compartment_id = var.compartment_ocid
  display_name   = "code2cloud-vcn"
  dns_label      = "code2cloud"
}

resource "oci_core_internet_gateway" "code2cloud_igw" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.code2cloud_vcn.id
  display_name   = "code2cloud-igw"
}

resource "oci_core_route_table" "code2cloud_rt" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.code2cloud_vcn.id
  display_name   = "code2cloud-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.code2cloud_igw.id
  }
}

resource "oci_core_subnet" "code2cloud_subnet" {
  cidr_block        = var.subnet_cidr
  compartment_id    = var.compartment_ocid
  vcn_id            = oci_core_vcn.code2cloud_vcn.id
  display_name      = "code2cloud-public-subnet"
  route_table_id    = oci_core_route_table.code2cloud_rt.id
  security_list_ids = [oci_core_security_list.code2cloud_sl.id]
}