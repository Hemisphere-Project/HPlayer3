
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

### wifi 
sed -i '/^mode=ap/a channel=6' /boot/wifi/wlan0-hotspot.nmconnection
sed -i '/^mode=ap/a band=bg' /boot/wifi/wlan0-hotspot.nmconnection

echo "H: 04-GadagneD" >> /boot/VERSION

echo "SUCCESS !" 
reboot

exit 0




# RESOLUTION must be pumped from 720p to 1366x768 (COG bug: https://github.com/Igalia/cog/issues/489)
# sed -i "s/hdmi_mode=85            #/hdmi_mode=86            # 86: 1366x768 \//g" /boot/config.txt