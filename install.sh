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
    pacman -S nodejs npm --noconfirm

    # MPV (RC2)
    pacman -Sy mpv --noconfirm
    pacman -S freetype2 fribidi fontconfig yasm git autoconf pkg-config libtool \
      lua luajit libvdpau libva libxv libjpeg libxkbcommon libxrandr libv4l libxss libcaca sdl2 \
      base-devel libx264 mesa fbida libbluray alsa-lib alsa-firmware ttf-roboto --noconfirm --needed
    pacman -S llvm-libs --noconfirm

    # PIGPIO
    pikaur -Sy --noconfirm pigpio

## Plateform not detected ...
else
    echo "Distribution not detected:"
    echo "this script needs APT or PACMAN to run."
    echo ""
    echo "Please install manually."
    exit 1
fi


# NodeJS / PM2
npm install -g n
n stable
hash -r
npm install -g pm2
rm -Rf ~/.pm2
mkdir -p /data/var/pm2
ln -s /data/var/pm2 ~/.pm2

# INSTALL
npm install

# PM2 START & SAVE
# TODO