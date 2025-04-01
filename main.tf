terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-central-1"
}

variable "project_name" {
  default = "stonks-poc"
}

variable "db_password" {
  type      = string
  sensitive = true
}

# Frontend Infrastructure
resource "aws_s3_bucket" "frontend" {
  bucket        = "${var.project_name}-frontend"
  force_destroy = true
}


resource "aws_s3_bucket_ownership_controls" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.frontend.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

resource "aws_cloudfront_origin_access_identity" "frontend" {}

resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "s3-origin"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
    }
  }

  enabled             = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-origin"

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# Frontend build and deploy
resource "null_resource" "frontend_build" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = <<EOT
      bun install
      cd ./frontend
      export NEXT_PUBLIC_API_URL=${aws_apigatewayv2_stage.default.invoke_url}
      bun run build
      aws s3 sync ./out s3://${aws_s3_bucket.frontend.id} --delete
    EOT
  }

  depends_on = [
    # aws_apigatewayv2_api.main,
    aws_apigatewayv2_stage.default,
    # aws_s3_bucket.frontend,
    aws_cloudfront_distribution.frontend
  ]
}

# Backend build
data "archive_file" "lambda_zip" {
  depends_on  = [null_resource.backend_build]
  type        = "zip"
  source_file = "${path.module}/backend/handler.mjs"
  output_path = "${path.module}/backend/handler.zip"
}

resource "null_resource" "backend_build" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = <<EOT
      bun install
      cd ./backend
      bun run build
    EOT
  }
}


# Backend Infrastructure
resource "aws_sqs_queue" "main" {
  name = "${var.project_name}-queue"
}

resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "lambda" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage"
        ],
        Resource = aws_sqs_queue.main.arn
      },
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "api" {
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  function_name    = "${var.project_name}-api"
  role             = aws_iam_role.lambda.arn
  handler          = "handler.handler"
  runtime          = "nodejs22.x"
  timeout          = 30

  environment {
    variables = {
      DB_HOST     = aws_db_instance.postgres.address
      DB_PORT     = aws_db_instance.postgres.port
      DB_USER     = aws_db_instance.postgres.username
      DB_PASSWORD = aws_db_instance.postgres.password
      DB_NAME     = aws_db_instance.postgres.db_name
      SQS_URL     = aws_sqs_queue.main.url
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda,
    aws_db_instance.postgres,
    aws_sqs_queue.main,
    null_resource.backend_build
  ]
}

resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"

  #   cors_configuration {
  #     allow_origins = ["*"]
  #     allow_methods = ["*"]
  #     allow_headers = ["*"]
  #   }
  # cors_configuration {
  #   allow_origins = ["https://${aws_cloudfront_distribution.frontend.domain_name}"]
  #   allow_methods = ["*"]
  #   allow_headers = ["*"]
  # }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.api.invoke_arn
}

resource "aws_apigatewayv2_route" "main" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Database
resource "aws_db_instance" "postgres" {
  allocated_storage      = 20
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t3.micro"
  db_name                = "stonks"
  username               = "stonks"
  password               = var.db_password
  publicly_accessible    = true
  skip_final_snapshot    = true
  vpc_security_group_ids = [aws_security_group.rds.id]
}

resource "aws_security_group" "rds" {
  name = "${var.project_name}-rds-sg"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

output "frontend_url" {
  value = aws_cloudfront_distribution.frontend.domain_name
}

output "api_url" {
  # value = aws_apigatewayv2_api.main.api_endpoint
  value = aws_apigatewayv2_stage.default.invoke_url
}

output "s3_bucket" {
  value = aws_s3_bucket.frontend.id
}

output "lambda_arn" {
  value = aws_lambda_function.api.arn
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.address
}

output "sqs_url" {
  value = aws_sqs_queue.main.url
}
