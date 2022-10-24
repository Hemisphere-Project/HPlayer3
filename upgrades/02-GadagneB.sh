
#!/bin/bash

# exit when any command fails
set -e

# keep track of the last executed command
trap 'last_command=$current_command; current_command=$BASH_COMMAND' DEBUG
# echo an error message before exiting
trap 'echo "\"${last_command}\" command filed with exit code $?."' EXIT

rw 
chmod -R 777 /tmp
date -s "$(curl -s --head http://google.com | grep ^Date: | sed 's/Date: //g')"

pacman -Sy

# Update HPLAYER3
cd /opt/HPlayer3
git checkout main
git stash --include-untracked
git pull
npm install

# Update Pi-tools
cd /opt/Pi-tools
git checkout main
git stash --include-untracked
git pull
rm -f /boot/kiosk.conf
systemctl daemon-reload 

# Get current name
NAME=$(cat /etc/hostname)

# Replace wifi profiles
rm /boot/wifi/wlan0*
echo "[connection]
id=wlan0-service
type=wifi
interface-name=wlan0
autoconnect=false
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
" > /boot/wifi/wlan0-service.nmconnection

echo "[connection]
id=wlan0-hotspot
type=wifi
autoconnect=false
interface-name=wlan0
permissions=

[wifi]
hidden=false
mac-address-blacklist=
mode=ap
ssid=$NAME

[wifi-security]
group=
key-mgmt=wpa-psk
pairwise=
proto=
psk=Museo69*

[ipv4]
address1=10.0.0.1/16,10.0.0.1
dns-search=
method=manual
" > /boot/wifi/wlan0-hotspot.nmconnection


echo "H: 02-GadagneB" >> /boot/VERSION

echo "SUCCESS !" 
reboot

exit 0
