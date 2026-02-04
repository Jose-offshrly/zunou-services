resource "aws_ses_domain_identity" "zunou" {
  domain = var.origin_domain
}

resource "aws_ses_domain_dkim" "zunou" {
  domain = aws_ses_domain_identity.zunou.domain
}

resource "aws_ses_email_identity" "auth0" {
  email = var.auth0_email
}

resource "aws_iam_user" "auth0" {
  name = "auth0-${var.environment}"
  tags = var.tags
}

resource "aws_iam_access_key" "auth0" {
  user = aws_iam_user.auth0.name
}

resource "aws_iam_user_policy" "auth0" {
  name = "auth0-${var.environment}"
  user = aws_iam_user.auth0.name

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendRawEmail",
        "ses:SendEmail"
      ],
      "Resource": "${aws_ses_email_identity.auth0.arn}"
    }
  ]
}
EOF
}
