#!/bin/bash

# NodeJS / PM2
pacman -S nodejs npm --noconfirm
npm install -g n
n stable
hash -r
npm install -g pm2
rm -Rf ~/.pm2
mkdir -p /data/var/pm2
ln -s /data/var/pm2 ~/.pm2

# MPV (RC2)
pacman -Sy mpv --noconfirm
pacman -S freetype2 fribidi fontconfig yasm git autoconf pkg-config libtool \
  lua luajit libvdpau libva libxv libjpeg libxkbcommon libxrandr libv4l libxss libcaca sdl2 \
  base-devel libx264 mesa fbida libbluray alsa-lib alsa-firmware ttf-roboto --noconfirm --needed
pacman -S llvm-libs --noconfirm

# PIGPIO
pikaur -Sy --noconfirm pigpio

# INSTALL
npm install

# AUDIO
cp ./asound.conf /etc/asound.conf

# PM2 START & SAVE
# TODO