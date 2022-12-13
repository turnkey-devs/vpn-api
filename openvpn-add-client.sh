#!/bin/bash

# Fast way for adding lots of users to an openvpn-install setup
# See the main openvpn-install project here: https://github.com/Nyr/openvpn-install
# openvpn-useradd-bulk is NOT supported or maintained and could become obsolete or broken in the future
# Created to satisfy the requirements here: https://github.com/Nyr/openvpn-install/issues/435

if readlink /proc/$$/exe | grep -qs "dash"; then
	echo "This script needs to be run with bash, not sh"
	exit 1
fi

newclient () {
	# Generates the custom client.ovpn
	cp /etc/openvpn/server/client-common.txt /home/bitnami/ovpn/clients/$1.ovpn
	echo "<ca>" >> /home/bitnami/ovpn/clients/$1.ovpn
	cat /etc/openvpn/server/easy-rsa/pki/ca.crt >> /home/bitnami/ovpn/clients/$1.ovpn
	echo "</ca>" >> /home/bitnami/ovpn/clients/$1.ovpn
	echo "<cert>" >> /home/bitnami/ovpn/clients/$1.ovpn
	cat /etc/openvpn/server/easy-rsa/pki/issued/$1.crt >> /home/bitnami/ovpn/clients/$1.ovpn
	echo "</cert>" >> /home/bitnami/ovpn/clients/$1.ovpn
	echo "<key>" >> /home/bitnami/ovpn/clients/$1.ovpn
	cat /etc/openvpn/server/easy-rsa/pki/private/$1.key >> /home/bitnami/ovpn/clients/$1.ovpn
	echo "</key>" >> /home/bitnami/ovpn/clients/$1.ovpn
	echo "<tls-crypt>" >> /home/bitnami/ovpn/clients/$1.ovpn
	cat /etc/openvpn/server/tc.key >> /home/bitnami/ovpn/clients/$1.ovpn
	echo "</tls-crypt>" >> /home/bitnami/ovpn/clients/$1.ovpn
}

if [ "$1" = "" ]; then
	echo "This tool will let you add new user certificates to your openvpn-install"
	echo ""
	echo "Run this script specifying a client username"
	echo ""
	echo "Eg: openvpn-add-client.sh client"
	exit
fi

USER=$1
DAYS=$2
cd /etc/openvpn/server/easy-rsa/
echo yes | ./easyrsa --days=$DAYS build-client-full $USER nopass
newclient $USER
echo ""
echo "Client $USER added, configuration is available at" /home/bitnami/ovpn/clients/"$USER.ovpn"
echo ""
