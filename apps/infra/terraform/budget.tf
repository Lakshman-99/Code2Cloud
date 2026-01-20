resource "oci_budget_budget" "code2cloud_safety_budget" {
  compartment_id = var.tenancy_ocid
  amount         = 1 # $1.00 Limit
  reset_period   = "MONTHLY"
  description    = "Safety budget to prevent accidental spend"
  display_name   = "code2cloud-safety-net"
  target_type    = "COMPARTMENT"
  targets        = [var.tenancy_ocid]
}

resource "oci_budget_alert_rule" "code2cloud_safety_alert" {
  budget_id      = oci_budget_budget.code2cloud_safety_budget.id
  threshold      = 100 # Alert at 100% of the budget ($1.00)
  threshold_type = "PERCENTAGE"
  type           = "ACTUAL"
  display_name   = "code2cloud-spend-alert"
  description    = "Alert me immediately if I spend more than $1"
  recipients     = var.alert_email
  message        = "WARNING: Code2Cloud is accruing charges on Oracle Cloud! Check resources immediately."
}