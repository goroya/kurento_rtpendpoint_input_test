## Description
This Repo is RTPEndpoint test program  of Kurento Media Server.  
This program will record the video received with RTPendpoint.
This program cannot Record RTP stream!!!!!!!!!!!!!

SDP read by rtpendpoint was created by the following command.  
```
ffmpeg -re -i output.mp4 -vcodec copy -an -f rtp rtp://192.168.7.119:55000 
(192.168.7.119 is Kurento IP) 
```
Using SDP is based following SDP made by above ffmpeg command.
```
v=0
o=- 0 0 IN IP4 127.0.0.1
s=No Name
c=IN IP4 192.168.7.119
t=0 0
a=tool:libavformat 57.75.100
m=video 55000 RTP/AVP 96
b=AS:148
a=rtpmap:96 H264/90000
a=fmtp:96 packetization-mode=1; sprop-parameter-sets=Z2QADazZQUH7ARAAAAMAEAAAAwPA8UKZYA==,aOvjyyLA; profile-level-id=64000D
```

Those who can understand why you can not record please teach!!!

## Using Kurento Version
Version: 6.6.2  
Found modules:  
    Module: 'core' version '6.6.3'  
    Module: 'elements' version '6.6.3'  
    Module: 'filters' version '6.6.2'  
