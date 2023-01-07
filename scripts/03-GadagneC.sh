
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


# GPIO
pikaur -Sy --noconfirm pigpio

# MPV (RC2)
pacman -Sy mpv --noconfirm
pacman -S freetype2 fribidi fontconfig yasm git autoconf pkg-config libtool \
  lua luajit libvdpau libva libxv libjpeg libxkbcommon libxrandr libv4l libxss libcaca sdl2 \
  base-devel libx264 mesa fbida libbluray alsa-lib alsa-firmware ttf-roboto --noconfirm --needed
pacman -S llvm-libs --noconfirm

# Update HPLAYER3
cd /opt/HPlayer3
git checkout main
git stash
git pull
npm install

# Update Pi-tools
cd /opt/Pi-tools
git checkout main
git stash
git pull

# Boot
sed -i '$ s/$/ vt.global_cursor_default=0/' /boot/cmdline.txt
sed -i '$ s/vt.global_cursor_default=0 vt.global_cursor_default=0/vt.global_cursor_default=0/' /boot/cmdline.txt
plymouth-set-default-theme -R spinner

echo "H: 03-GadagneC" >> /boot/VERSION

echo "SUCCESS !" 
reboot

exit 0



# DISCARDED UPGRADES:

# Full system upgrade
# pacman -Syu --noconfirm --overwrite '/usr/lib/node_modules/npm/*'

# RESOLUTION must be pumped from 720p to 1366x768 (COG bug: https://github.com/Igalia/cog/issues/489)
# sed -i "s/hdmi_mode=85            #/hdmi_mode=86            # 86: 1366x768 \//g" /boot/config.txt
