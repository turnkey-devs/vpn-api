#!/bin/bash

# Fast way for adding lots of users to an openvpn-install setup
# See the main openvpn-install project here: https://github.com/Nyr/openvpn-install
# openvpn-useradd-bulk is NOT supported or maintained and could become obsolete or broken in the future
# Created to satisfy the requirements here: https://github.com/Nyr/openvpn-install/issues/435

if readlink /proc/$$/exe | grep -qs "dash"; then
	echo "This script needs to be run with bash, not sh"
	exit 1
fi

if [ "$1" = "" ]; then
	echo "This tool will let you renew user certificates"
	echo ""
	echo "Run this script specifying a client username"
	echo ""
	echo "Eg: openvpn-renew-cert.sh client"
	exit
fi

USER=$1
DAYS=$2
cd /etc/openvpn/server/easy-rsa/
./easyrsa --days=$DAYS --batch renew $USER nopass
./easyrsa --batch revoke-renewed $USER
./easyrsa gen-crl
cp pki/crl.pem ../
echo ""
echo "Client $USER certificate renewed"
echo ""
