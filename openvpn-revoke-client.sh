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
	echo "This tool will let you revoke users vpn access"
	echo ""
	echo "Run this script specifying a client username"
	echo ""
	echo "Eg: openvpn-revoke-client.sh client"
	exit
fi

USER=$1
REASON=$2
cd /etc/openvpn/server/easy-rsa/
./easyrsa --batch revoke $USER $REASON
./easyrsa gen-crl
cp pki/crl.pem ../
echo ""
echo "Revoke $USER access with reason $REASON"
echo ""
