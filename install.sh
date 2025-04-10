#!/bin/bash

BASEPATH="$(dirname "$(readlink -f "$0")")"
DISTRO=''

echo "$BASEPATH"
cd "$BASEPATH"


## xBIAN (DEBIAN / RASPBIAN / UBUNTU)
if [[ $(command -v apt) ]]; then
    DISTRO='xbian'
    echo "Distribution: $DISTRO"
    echo "Not supported yet."
    exit 1

## ARCH Linux
elif [[ $(command -v pacman) ]]; then
    DISTRO='arch'
    echo "Distribution: $DISTRO"

    # NodeJS
    # pacman -S nodejs npm --noconfirm

    # MPV (RC2)
    pacman -Sy mpv --noconfirm
    pacman -S freetype2 fribidi fontconfig yasm git autoconf pkg-config libtool \
      lua luajit libvdpau libva libxv libjpeg libxkbcommon libxrandr libv4l libxss libcaca sdl2 \
      base-devel libx264 mesa fbida libbluray alsa-lib alsa-firmware ttf-roboto --noconfirm --needed
    pacman -S llvm-libs --noconfirm

    # PIGPIO
    # yay -S --noconfirm pigpio

## Plateform not detected ...
else
    echo "Distribution not detected:"
    echo "this script needs APT or PACMAN to run."
    echo ""
    echo "Please install manually."
    exit 1
fi

# CONF
mkdir -p /data/conf/
echo "{}" > /data/conf/hplayer3.conf
cp conf/hconnector.js /data/conf/hconnector.js

# NodeJS / PM2
# npm install -g n
# n stable
# hash -r
# npm install -g pm2
rm -Rf ~/.pm2
mkdir -p /data/var/pm2
ln -s /data/var/pm2 ~/.pm2

# INSTALL
npm install

ln -sf "$BASEPATH/hplayer3" /usr/local/bin/
ln -sf "$BASEPATH/hplayer3.service" /etc/systemd/system/
systemctl daemon-reload

FILE=/boot/starter.txt
if test -f "$FILE"; then
echo "## [hplayer3] web player
# hplayer3
" >> /boot/starter.txt
fi