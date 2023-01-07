#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "USAGE: $0 <hostname> <script-to-execute>"
    exit 1
fi

function valid_ip()
{
    local  ip=$1
    local  stat=1

    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        OIFS=$IFS
        IFS='.'
        ip=($ip)
        IFS=$OIFS
        [[ ${ip[0]} -le 255 && ${ip[1]} -le 255 \
            && ${ip[2]} -le 255 && ${ip[3]} -le 255 ]]
        stat=$?
    fi
    return $stat
}

if valid_ip $1; 
    then ssh root@$1 "bash -s" < $2 ; 
    else ssh root@$1.local "bash -s" < $2 ; 
fi
