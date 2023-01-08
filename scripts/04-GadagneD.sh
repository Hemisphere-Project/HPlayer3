
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

# System upgrade
pacman-key --populate
pacman -Syu --noconfirm --overwrite "*"

# Pikaur update
cd /opt/pikaur
git stash
git pull
sudo -u pi makepkg -fsri --noconfirm
pikaur -R pigpio --noconfirm
pikaur -S pigpio --rebuild --noconfirm
# pikaur -Syu  # ignore PGP

# Node version
npm install -g n
n stable
hash -r

# Update HPLAYER3
cd /opt/HPlayer3
git checkout main
git stash
git pull
rm -rf node_modules
npm cache verify
rm package-lock.json
npm install
npm install pigpio --save

# Update Pi-tools
cd /opt/Pi-tools
git stash
git pull
cd kiosk-chromium
./install.sh

### spinner splash
plymouth-set-default-theme -R spinner

### Pi-tools
systemctl disable starter
systemctl enable extendfs
systemctl enable uplink-fwd@eth0
rm -Rf /boot/wifi
rm -f /boot/starter.txt
rm -f /etc/systemd/system/hostrename@.service
rm -f /usr/local/bin/hostrename
rm -f /etc/systemd/system/setnet.service
rm -f /usr/local/bin/setnet
rm -f /etc/systemd/system/starter.service
rm -f /usr/local/bin/starter

# Add wifi profiles
rm /etc/NetworkManager/system-connections/*

echo "[connection]
id=wlan0-service
type=wifi
interface-name=wlan0
autoconnect=true
autoconnect-retries=0

[wifi]
hidden=false
mode=infrastructure
ssid=hmsphr

[wifi-security]
key-mgmt=wpa-psk
psk=hemiproject

[ipv4]
method=auto
route-metric=70
" > /etc/NetworkManager/system-connections/wlan0-service.nmconnection

echo "[connection]
id=wlan0-hotspot
type=wifi
interface-name=wlan0
autoconnect=false

[wifi]
hidden=false
mode=ap
band=bg
channel=6
ssid=HBerry

[wifi-security]
key-mgmt=wpa-psk
psk=Gadagne69*

[ipv4]
method=manual
address1=10.0.0.1/16,10.0.0.1
" > /etc/NetworkManager/system-connections/wlan0-hotspot.nmconnection

echo "[connection]
id=eth0-dhcp
type=ethernet
interface-name=eth0
permissions=

[ethernet]
mac-address-blacklist=

[ipv4]
dns-search=
method=auto
" > /etc/NetworkManager/system-connections/eth0-dhcp.nmconnection

chmod 600 -R /etc/NetworkManager/system-connections/

### touch fix (iiyama)
sed -i '$ s/$/ usbhid.mousepoll=0/' /boot/cmdline.txt

echo "H: 04-GadagneD" >> /boot/VERSION

echo "SUCCESS !" 
reboot

exit 0




# RESOLUTION must be pumped from 720p to 1366x768 (COG bug: https://github.com/Igalia/cog/issues/489)
# sed -i "s/hdmi_mode=85            #/hdmi_mode=86            # 86: 1366x768 \//g" /boot/config.txt