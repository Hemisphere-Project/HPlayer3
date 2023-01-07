
#!/bin/bash

# exit when any command fails
set -e

# keep track of the last executed command
trap 'last_command=$current_command; current_command=$BASH_COMMAND' DEBUG
# echo an error message before exiting
trap 'echo "\"${last_command}\" command filed with exit code $?."' EXIT

rw 
chmod -R 777 /tmp

# Replace wifi profiles to connect to hmsphr
rm /boot/wifi/wlan0*
echo "[connection]
id=wlan0-hmsphr
type=wifi
interface-name=wlan0
autoconnect=true
permissions=

[wifi]
mac-address-blacklist=
mode=infrastructure
ssid=hmsphr

[wifi-security]
key-mgmt=wpa-psk
psk=hemiproject

[ipv4]
dns-search=
method=auto
route-metric=70
" > /boot/wifi/wlan0-hmsphr.nmconnection

echo "H: 01-GadagneA" >> /boot/VERSION
setnet
echo "SUCCESS !" 
 
exit 0
