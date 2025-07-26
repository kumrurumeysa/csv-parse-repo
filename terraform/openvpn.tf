resource "aws_instance" "vpn" {
  ami                    = "ami-0dc33c9c954b3f073"
  instance_type          = "t3.micro"
  subnet_id              = module.vpc.public_subnets[0]
  associate_public_ip_address = true
  key_name               = "my-ssh-key"

  vpc_security_group_ids = [aws_security_group.vpn_sg.id]

  tags = {
    Name = "openvpn-server"
  }

  user_data = <<-EOF
    #!/bin/bash
    curl -O https://raw.githubusercontent.com/angristan/openvpn-install/master/openvpn-install.sh
    chmod +x openvpn-install.sh
    AUTO_INSTALL=y ./openvpn-install.sh
  EOF
}

resource "aws_security_group" "vpn_sg" {
  name        = "vpn-sg"
  description = "Allow OpenVPN and SSH"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "Allow OpenVPN"
    from_port   = 1194
    to_port     = 1194
    protocol    = "udp"
    cidr_blocks = ["92.44.29.225/32"]
  }

  ingress {
    description = "Allow SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["92.44.29.225/32"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
